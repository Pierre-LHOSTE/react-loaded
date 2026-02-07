import {
  cloneElement,
  type ReactElement,
  type Ref,
  version as reactVersion,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { isDevEnv } from "../../utils/isDevEnv";
import { useIsomorphicLayoutEffect } from "../../utils/useIsomorphicLayoutEffect";
import { SkeletonContext } from "../SkeletonContext/SkeletonContext";
import "./SmartSkeleton.css";

// Text width configuration (in ch units)
const TEXT_WIDTH_MIN_CH = 6;
const TEXT_WIDTH_MAX_CH = 40;

function isElement(value: unknown): value is Element {
  if (!value || typeof value !== "object") return false;
  const maybeElement = value as Element;
  // Must have nodeType 1 (Element) and a working querySelectorAll
  if (maybeElement.nodeType !== 1) return false;
  if (typeof maybeElement.tagName !== "string") return false;
  if (typeof maybeElement.querySelectorAll !== "function") return false;
  // Additional check: instanceof Element if available
  if (typeof Element !== "undefined" && !(value instanceof Element)) {
    return false;
  }
  return true;
}

const warnedComponents = new Set<string>();

function isUsableElement(value: unknown): value is Element {
  if (!isElement(value)) return false;
  // Test that querySelectorAll actually works
  try {
    (value as Element).querySelectorAll("*");
    return true;
  } catch {
    return false;
  }
}

function resolveRefTarget(node: unknown): Element | null {
  if (isUsableElement(node)) return node;
  if (node && typeof node === "object" && "nativeElement" in node) {
    const nativeElement = (node as { nativeElement?: unknown }).nativeElement;
    if (isUsableElement(nativeElement)) return nativeElement;
  }
  return null;
}

function getElementDisplayName(element: ReactElement): string {
  const type = element.type;
  if (typeof type === "string") {
    return `<${type}>`;
  }
  if (typeof type === "function") {
    const fn = type as { displayName?: string; name?: string };
    return `<${fn.displayName || fn.name || "Unknown"}>`;
  }
  if (typeof type === "object" && type !== null) {
    const obj = type as { displayName?: string; name?: string };
    return `<${obj.displayName || obj.name || "Unknown"}>`;
  }
  return "<Unknown>";
}

const REACT_MAJOR_VERSION = Number.parseInt(reactVersion, 10);
const IS_REACT_19_OR_NEWER =
  Number.isFinite(REACT_MAJOR_VERSION) && REACT_MAJOR_VERSION >= 19;

/**
 * Get the original ref from the element, supporting both React 18 and React 19.
 * React 19: ref is a regular prop on element.props.ref
 * React 18: ref is on element.ref
 */
function getOriginalRef(element: ReactElement): Ref<unknown> | undefined {
  // React 19 style (ref as prop)
  const elementProps = element.props as { ref?: Ref<unknown> } | undefined;
  const propsRef = elementProps?.ref;
  if (propsRef !== undefined) return propsRef;

  // React 19+ warns on element.ref access; skip legacy fallback entirely.
  if (IS_REACT_19_OR_NEWER) return undefined;

  // React 18 style
  const legacyRef = (element as ReactElement & { ref?: Ref<unknown> }).ref;
  if (legacyRef !== undefined) return legacyRef;

  return undefined;
}

/**
 * Forward a ref value to the original ref (callback or object style).
 */
function forwardRef(originalRef: Ref<unknown> | undefined, node: unknown) {
  if (!originalRef) return;
  if (typeof originalRef === "function") {
    originalRef(node);
  } else {
    (originalRef as React.MutableRefObject<unknown>).current = node;
  }
}

const MEDIA_ELEMENTS = new Set(["IMG", "VIDEO", "CANVAS"]);
const SVG_ELEMENTS = new Set(["SVG"]);

const INTERACTIVE_ELEMENTS = new Set([
  "BUTTON",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "A",
]);

const BUTTON_LIKE_SELECTOR = "button,input,textarea,select,a,[role='button']";
const SKIPPED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "LINK",
  "META",
  "NOSCRIPT",
  "TEMPLATE",
]);

function getTagName(el: Element): string {
  return el.tagName.toUpperCase();
}

function isButtonLikeElement(el: Element, tagName = getTagName(el)): boolean {
  if (INTERACTIVE_ELEMENTS.has(tagName)) return true;
  const role = el.getAttribute("role");
  return role === "button";
}

function isButtonLikeDescendant(el: Element, tagName: string): boolean {
  const closestButton = el.closest(BUTTON_LIKE_SELECTOR);
  return Boolean(closestButton && !isButtonLikeElement(el, tagName));
}

function isContentElement(el: Element, tagName = getTagName(el)): boolean {
  if (MEDIA_ELEMENTS.has(tagName)) return true;
  if (SVG_ELEMENTS.has(tagName)) return true;
  if (isButtonLikeElement(el, tagName)) return true;

  const isLeafNode = el.childElementCount === 0;

  // Text elements that are leaf nodes (no child elements, only text)
  if (isLeafNode && el.textContent?.trim()) return true;

  return false;
}

/**
 * Calculate text skeleton width in ch units based on text content.
 * Uses a deterministic jitter: widthCh = clamp(6, 40, len + 2 + jitter)
 */
function calculateTextWidthCh(text: string, seedKey: string): number {
  const textLength = text.length;
  const jitterRange = Math.max(4, 0.8 * textLength);
  const jitter = deterministicJitter(seedKey) * jitterRange;
  const width = textLength + 2 + jitter;
  return Math.max(TEXT_WIDTH_MIN_CH, Math.min(TEXT_WIDTH_MAX_CH, width));
}

function deterministicJitter(seedKey: string): number {
  if (!seedKey) return 0;
  let hash = 2166136261;
  for (let index = 0; index < seedKey.length; index += 1) {
    hash ^= seedKey.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = (hash >>> 0) / 0xffffffff;
  return normalized * 2 - 1;
}

function resolveTextAlign(el: HTMLElement): "left" | "center" | "right" {
  const align = globalThis.getComputedStyle(el).textAlign;
  if (align === "center") return "center";
  if (align === "right" || align === "end") return "right";
  return "left";
}

export function applySkeletonClasses(
  rootElement: Element,
  options: { animate?: boolean; seed?: string | number } = {},
): void {
  const { animate = true, seed } = options;
  const baseSeed =
    seed === undefined || seed === null ? "loaded" : String(seed);

  if (!isElement(rootElement)) {
    return;
  }

  const htmlRoot = rootElement as HTMLElement;

  // Apply skeleton mode to the root element
  htmlRoot.classList.add("loaded-skeleton-mode");

  if (animate) {
    htmlRoot.classList.add("loaded-animate");
  }

  // Apply background class for standalone usage (when not used via SmartSkeleton JSX)
  // If element has loaded-skeleton-wrapper, CSS handles bg via > :first-child rule
  // If element already has loaded-skeleton-bg (from JSX), this is a no-op
  const isWrapper = htmlRoot.classList.contains("loaded-skeleton-wrapper");
  if (!isWrapper) {
    htmlRoot.classList.add("loaded-skeleton-bg");
  }

  // Only add specific classes where needed (text, media, content)
  const descendants = rootElement.getElementsByTagName("*");

  let textIndex = 0;

  const processElement = (el: Element) => {
    const tagName = getTagName(el);
    if (SKIPPED_TAGS.has(tagName)) return;
    if (!isContentElement(el, tagName)) return;
    if (isButtonLikeDescendant(el, tagName)) return;

    const htmlEl = el as HTMLElement;
    const textContent = el.textContent?.trim();
    const isLeafWithText = el.childElementCount === 0 && textContent;

    if (
      isLeafWithText &&
      !MEDIA_ELEMENTS.has(tagName) &&
      !SVG_ELEMENTS.has(tagName) &&
      !isButtonLikeElement(el, tagName)
    ) {
      // Text elements: overlay bar with ch-based width
      htmlEl.classList.add("loaded-text-skeleton");
      htmlEl.dataset.skeletonAlign = resolveTextAlign(htmlEl);
      const seedKey = `${baseSeed}|${textIndex}|${textContent ?? ""}`;
      textIndex += 1;
      const widthCh = calculateTextWidthCh(textContent ?? "", seedKey);
      htmlEl.style.setProperty("--skeleton-text-width", `${widthCh}ch`);
    } else if (MEDIA_ELEMENTS.has(tagName)) {
      // Media elements
      htmlEl.classList.add("loaded-skeleton-media");
    } else if (SVG_ELEMENTS.has(tagName)) {
      // SVG elements rendered as rounded content blocks
      htmlEl.classList.add("loaded-skeleton-content");
      htmlEl.classList.add("loaded-skeleton-svg");
    } else {
      // Interactive elements (buttons, inputs, etc.)
      htmlEl.classList.add("loaded-skeleton-content");
      // Prevent keyboard focus / interaction while in skeleton mode.
      // aria-hidden does not remove elements from the tab order.
      htmlEl.setAttribute("tabindex", "-1");
    }
  };

  processElement(rootElement);
  for (const el of descendants) {
    processElement(el);
  }
}

export interface SmartSkeletonProps {
  /** The skeleton element with mock data, rendered when loading */
  element: ReactElement;
  /** The real content to render when not loading. If omitted, returns null when loading=false. */
  children?: ReactElement;
  /** Whether the skeleton is currently loading. Default: false */
  loading?: boolean;
  /** Enable shimmer animation. Default: true */
  animate?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Optional seed to stabilize skeleton text widths */
  seed?: string | number;
  /** Suppress warning when auto-wrapper is applied. Default: false */
  suppressRefWarning?: boolean;
}

export function SmartSkeleton({
  element,
  children,
  loading = false,
  animate = true,
  className = "",
  seed,
  suppressRefWarning = false,
}: SmartSkeletonProps): ReactElement | null {
  const hasAppliedRef = useRef(false);
  const refWasCalledRef = useRef(false);
  const lastRefNodeRef = useRef<unknown>(null);
  const deferredWrapperCheckTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const needsWrapperRef = useRef(false);
  const previousElementTypeRef = useRef<ReactElement["type"] | null>(null);
  const previousElementKeyRef = useRef<ReactElement["key"] | null>(null);
  const [needsWrapper, setNeedsWrapper] = useState(false);
  needsWrapperRef.current = needsWrapper;

  const currentElementType = element.type;
  const currentElementKey = element.key ?? null;
  const hasElementIdentityChanged =
    previousElementTypeRef.current !== null &&
    (previousElementTypeRef.current !== currentElementType ||
      previousElementKeyRef.current !== currentElementKey);

  // Reset tracking only when leaving loading mode or when element identity changes.
  // Do not reset on every render: JSX creates a fresh ReactElement object each time.
  if (!loading || hasElementIdentityChanged) {
    hasAppliedRef.current = false;
    refWasCalledRef.current = false;
    lastRefNodeRef.current = null;
    if (deferredWrapperCheckTimeoutRef.current !== null) {
      clearTimeout(deferredWrapperCheckTimeoutRef.current);
      deferredWrapperCheckTimeoutRef.current = null;
    }
  }

  previousElementTypeRef.current = currentElementType;
  previousElementKeyRef.current = currentElementKey;

  useEffect(() => {
    if (hasElementIdentityChanged && needsWrapper) {
      setNeedsWrapper(false);
    }
  }, [hasElementIdentityChanged, needsWrapper]);

  // Wrapper decision should be scoped to each loading cycle.
  // Without this reset, a false positive can persist across loading=false -> true.
  useEffect(() => {
    if (!loading && needsWrapper) {
      setNeedsWrapper(false);
    }
  }, [loading, needsWrapper]);

  useEffect(() => {
    return () => {
      if (deferredWrapperCheckTimeoutRef.current !== null) {
        clearTimeout(deferredWrapperCheckTimeoutRef.current);
      }
    };
  }, []);

  const originalRef = getOriginalRef(element);

  const enableWrapperWithWarning = useCallback(
    (reason: "non-dom-ref" | "no-ref-call") => {
      if (needsWrapperRef.current) return;
      setNeedsWrapper(true);

      if (!suppressRefWarning && isDevEnv()) {
        const displayName = getElementDisplayName(element);
        if (!warnedComponents.has(displayName)) {
          if (reason === "non-dom-ref") {
            console.warn(
              `[SmartSkeleton] ${displayName} does not forward its ref to a DOM element. ` +
                `A wrapper <div> has been added automatically. Use forwardRef to avoid this.`,
            );
          } else {
            console.warn(
              `[SmartSkeleton] ${displayName} does not accept a ref. ` +
                `A wrapper <div> has been added automatically. Use forwardRef to avoid this.`,
            );
          }
          warnedComponents.add(displayName);
        }
      }
    },
    [element, suppressRefWarning],
  );

  const refCallback = useCallback(
    (node: unknown) => {
      refWasCalledRef.current = true;
      lastRefNodeRef.current = node;

      const target = resolveRefTarget(node);

      if (target && loading && !hasAppliedRef.current) {
        applySkeletonClasses(target, { animate, seed });
        hasAppliedRef.current = true;
      }

      // Forward ref to original element
      forwardRef(originalRef, node);
    },
    [loading, originalRef, animate, seed],
  );

  // Decide wrapper fallback after commit to avoid eager false positives:
  // some environments attach refs slightly later in the same tick.
  useIsomorphicLayoutEffect(() => {
    if (!loading || needsWrapper) return;

    if (deferredWrapperCheckTimeoutRef.current !== null) {
      clearTimeout(deferredWrapperCheckTimeoutRef.current);
      deferredWrapperCheckTimeoutRef.current = null;
    }

    const node = lastRefNodeRef.current;
    const target = resolveRefTarget(node);

    if (target && !hasAppliedRef.current) {
      applySkeletonClasses(target, { animate, seed });
      hasAppliedRef.current = true;
    }

    if (refWasCalledRef.current) {
      if (node !== null && !target) {
        enableWrapperWithWarning("non-dom-ref");
      }
      return;
    }

    deferredWrapperCheckTimeoutRef.current = setTimeout(() => {
      deferredWrapperCheckTimeoutRef.current = null;

      if (!loading || needsWrapperRef.current) return;

      const delayedNode = lastRefNodeRef.current;
      const delayedTarget = resolveRefTarget(delayedNode);

      if (delayedTarget && !hasAppliedRef.current) {
        applySkeletonClasses(delayedTarget, { animate, seed });
        hasAppliedRef.current = true;
      }

      if (refWasCalledRef.current) {
        if (delayedNode !== null && !delayedTarget) {
          enableWrapperWithWarning("non-dom-ref");
        }
        return;
      }

      enableWrapperWithWarning("no-ref-call");
    }, 0);

    return () => {
      if (deferredWrapperCheckTimeoutRef.current !== null) {
        clearTimeout(deferredWrapperCheckTimeoutRef.current);
        deferredWrapperCheckTimeoutRef.current = null;
      }
    };
  }, [loading, needsWrapper, animate, seed, enableWrapperWithWarning]);

  // Not loading: return children or null
  if (!loading) {
    return children ?? null;
  }

  // Build merged className for skeleton mode
  const elementProps = element.props as { className?: string };
  const existingClassName = elementProps.className ?? "";

  // Base classes for skeleton mode
  const baseClasses = ["loaded-skeleton-mode", animate && "loaded-animate"]
    .filter(Boolean)
    .join(" ");

  // When wrapping: wrapper gets mode + wrapper marker (no bg - it goes on child via ref)
  const wrapperClassName = [baseClasses, "loaded-skeleton-wrapper", className]
    .filter(Boolean)
    .join(" ");

  // When not wrapping: element gets mode + bg directly (for SSR)
  const mergedClassName = [
    existingClassName,
    baseClasses,
    "loaded-skeleton-bg",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SkeletonContext.Provider value={true}>
      {needsWrapper ? (
        <div ref={refCallback} className={wrapperClassName} aria-hidden="true">
          {element}
        </div>
      ) : (
        cloneElement(element as ReactElement<Record<string, unknown>>, {
          ref: refCallback,
          className: mergedClassName,
          "aria-hidden": true,
        })
      )}
    </SkeletonContext.Provider>
  );
}
