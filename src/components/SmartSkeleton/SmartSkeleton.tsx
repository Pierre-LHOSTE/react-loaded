import {
  cloneElement,
  type ReactElement,
  type Ref,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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

function isDevEnv(): boolean {
  if (typeof globalThis === "undefined") return false;
  const maybeProcess = (
    globalThis as { process?: { env?: { NODE_ENV?: string } } }
  ).process;
  return maybeProcess?.env?.NODE_ENV !== "production";
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
 * React 18: ref is on element.ref
 * React 19: ref can also be on element.props.ref
 */
function getOriginalRef(element: ReactElement): Ref<unknown> | undefined {
  // React 18 style
  const legacyRef = (element as ReactElement & { ref?: Ref<unknown> }).ref;
  if (legacyRef) return legacyRef;

  // React 19 style (ref as prop)
  const propsRef = (element.props as { ref?: Ref<unknown> })?.ref;
  if (propsRef) return propsRef;

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
 * Calculate text skeleton width in ch units based on text length.
 * Uses the formula: widthCh = clamp(6, 40, len + 2 + jitter)
 * where jitter = rand(-0.2 * len, 0.2 * len)
 */
function calculateTextWidthCh(textLength: number): number {
  const jitterRange = 0.2 * textLength;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  const width = textLength + 2 + jitter;
  return Math.max(TEXT_WIDTH_MIN_CH, Math.min(TEXT_WIDTH_MAX_CH, width));
}

function resolveTextAlign(el: HTMLElement): "left" | "center" | "right" {
  const align = globalThis.getComputedStyle(el).textAlign;
  if (align === "center") return "center";
  if (align === "right" || align === "end") return "right";
  return "left";
}

export function applySkeletonClasses(
  rootElement: Element,
  options: { animate?: boolean } = {},
): void {
  const { animate = true } = options;

  if (!isElement(rootElement)) {
    return;
  }

  // Apply skeleton mode and wrapper class to the root element
  // CSS handles base styles for all descendants via .loaded-skeleton-mode *
  (rootElement as HTMLElement).classList.add(
    "loaded-skeleton-mode",
    "loaded-skeleton-wrapper",
  );

  if (animate) {
    (rootElement as HTMLElement).classList.add("loaded-animate");
  }

  // Only add specific classes where needed (text, media, content)
  const descendants = rootElement.getElementsByTagName("*");

  const processElement = (el: Element) => {
    const tagName = getTagName(el);
    if (SKIPPED_TAGS.has(tagName)) return;
    if (!isContentElement(el, tagName)) return;
    if (!SVG_ELEMENTS.has(tagName) && isButtonLikeDescendant(el, tagName))
      return;

    const htmlEl = el as HTMLElement;
    const textContent = el.textContent?.trim();
    const isLeafWithText = el.childElementCount === 0 && textContent;

    if (
      isLeafWithText &&
      !MEDIA_ELEMENTS.has(tagName) &&
      !SVG_ELEMENTS.has(tagName) &&
      !isButtonLikeElement(el, tagName)
    ) {
      // Text elements: pseudo-element with ch-based width
      htmlEl.classList.add("loaded-text-skeleton");
      htmlEl.dataset.skeletonAlign = resolveTextAlign(htmlEl);
      const textLength = textContent?.length ?? 0;
      const widthCh = calculateTextWidthCh(textLength);
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
  /** Suppress warning when auto-wrapper is applied. Default: false */
  suppressRefWarning?: boolean;
}

export function SmartSkeleton({
  element,
  children,
  loading = false,
  animate = true,
  className = "",
  suppressRefWarning = false,
}: SmartSkeletonProps): ReactElement | null {
  const hasAppliedRef = useRef(false);
  const refWasCalledRef = useRef(false);
  const lastElementRef = useRef<ReactElement | null>(null);
  const [needsWrapper, setNeedsWrapper] = useState(false);

  // Reset flags when loading changes or element changes
  if (!loading || lastElementRef.current !== element) {
    hasAppliedRef.current = false;
    refWasCalledRef.current = false;
    lastElementRef.current = element;
  }

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
        if (!suppressRefWarning && isDevEnv()) {
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
        applySkeletonClasses(target, { animate });
        hasAppliedRef.current = true;
      }

      // Forward ref to original element
      forwardRef(originalRef, node);
    },
    [loading, element, needsWrapper, suppressRefWarning, originalRef, animate],
  );

  // Detect if ref was never called (component ignores ref entirely)
  // useLayoutEffect runs synchronously after DOM mutations but before paint
  useLayoutEffect(() => {
    if (!loading || needsWrapper) return;

    // At this point, React has already attempted to attach refs
    // If refWasCalledRef is still false, the component ignored the ref
    if (!refWasCalledRef.current) {
      setNeedsWrapper(true);

      // Emit warning
      if (!suppressRefWarning && isDevEnv()) {
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

  const skeletonClasses = ["loaded-skeleton-mode", animate && "loaded-animate"]
    .filter(Boolean)
    .join(" ");

  // When wrapping, the wrapper gets the skeleton classes
  // When not wrapping, merge with element's existing classes
  const wrapperClassName = [skeletonClasses, className]
    .filter(Boolean)
    .join(" ");
  const mergedClassName = [existingClassName, skeletonClasses, className]
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
