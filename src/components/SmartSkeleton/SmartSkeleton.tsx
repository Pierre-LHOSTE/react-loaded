import {
  cloneElement,
  type ReactElement,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

/**
 * Get the original ref from the element, supporting both React 18 and React 19.
 * React 19: ref is a regular prop on element.props.ref
 * React 18: ref is on element.ref
 */
function getOriginalRef(element: ReactElement): Ref<unknown> | undefined {
  // React 19 style (ref as prop)
  const propsRef = (element.props as { ref?: Ref<unknown> })?.ref;
  if (propsRef) return propsRef;

  // React 18 style
  const legacyRef = (element as ReactElement & { ref?: Ref<unknown> }).ref;
  if (legacyRef) return legacyRef;

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
  const lastElementRef = useRef<ReactElement | null>(null);
  const previousElementTypeRef = useRef<ReactElement["type"] | null>(null);
  const previousElementKeyRef = useRef<ReactElement["key"] | null>(null);
  const [needsWrapper, setNeedsWrapper] = useState(false);

  // Reset flags when loading changes or element changes
  if (!loading || lastElementRef.current !== element) {
    hasAppliedRef.current = false;
    refWasCalledRef.current = false;
    lastElementRef.current = element;
  }

  useEffect(() => {
    const elementType = element.type;
    const elementKey = element.key ?? null;
    const previousType = previousElementTypeRef.current;
    const previousKey = previousElementKeyRef.current;

    if (
      previousType !== null &&
      (previousType !== elementType || previousKey !== elementKey)
    ) {
      setNeedsWrapper(false);
    }

    previousElementTypeRef.current = elementType;
    previousElementKeyRef.current = elementKey;
  }, [element.type, element.key]);

  const originalRef = getOriginalRef(element);

  const refCallback = useCallback(
    (node: unknown) => {
      refWasCalledRef.current = true;

      const target = resolveRefTarget(node);

      // If we received a node but couldn't get a DOM element from it,
      // we need to use a wrapper
      if (node !== null && !target && !needsWrapper) {
        setNeedsWrapper(true);

        // Emit warning (deduplicated by component name)
        if (!suppressRefWarning && process.env.NODE_ENV !== "production") {
          const displayName = getElementDisplayName(element);
          if (!warnedComponents.has(displayName)) {
            console.warn(
              `[SmartSkeleton] ${displayName} does not forward its ref to a DOM element. ` +
                `A wrapper <div> has been added automatically. Use forwardRef to avoid this.`,
            );
            warnedComponents.add(displayName);
          }
        }
        return;
      }

      if (target && loading && !hasAppliedRef.current) {
        applySkeletonClasses(target, { animate, seed });
        hasAppliedRef.current = true;
      }

      // Forward ref to original element
      forwardRef(originalRef, node);
    },
    [
      loading,
      element,
      needsWrapper,
      suppressRefWarning,
      originalRef,
      animate,
      seed,
    ],
  );

  // Detect if ref was never called (component ignores ref entirely)
  // useLayoutEffect runs synchronously after DOM mutations but before paint
  useIsomorphicLayoutEffect(() => {
    if (!loading || needsWrapper) return;

    // At this point, React has already attempted to attach refs
    // If refWasCalledRef is still false, the component ignored the ref
    if (!refWasCalledRef.current) {
      setNeedsWrapper(true);

      // Emit warning
      if (!suppressRefWarning && process.env.NODE_ENV !== "production") {
        const displayName = getElementDisplayName(element);
        if (!warnedComponents.has(displayName)) {
          console.warn(
            `[SmartSkeleton] ${displayName} does not accept a ref. ` +
              `A wrapper <div> has been added automatically. Use forwardRef to avoid this.`,
          );
          warnedComponents.add(displayName);
        }
      }
    }
  }, [loading, needsWrapper, element, suppressRefWarning]);

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
