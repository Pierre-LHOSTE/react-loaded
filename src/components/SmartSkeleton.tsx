import type { ReactElement } from "react";
import { SkeletonContext } from "./SkeletonContext";

const SKELETON_STYLES = `
  .loaded-skeleton-mode {
    pointer-events: none !important;
    user-select: none !important;
  }

  .loaded-skeleton-mode * {
    color: transparent !important;
    background-image: none !important;
    border-color: transparent !important;
  }

  .loaded-skeleton-mode img,
  .loaded-skeleton-mode svg,
  .loaded-skeleton-mode video,
  .loaded-skeleton-mode canvas {
    opacity: 0 !important;
  }

  .loaded-skeleton-mode *:not(script):not(style) {
    background-color: var(--loaded-skeleton-color, #e5e7eb) !important;
    border-radius: var(--loaded-skeleton-radius, 4px);
  }

  .loaded-skeleton-mode [data-skeleton-ignore] {
    background-color: transparent !important;
  }

  @keyframes loaded-shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }

  .loaded-skeleton-mode.loaded-animate {
    animation: loaded-shimmer 1.5s ease-in-out infinite;
  }
`;

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected || typeof document === "undefined") return;

  const style = document.createElement("style");
  style.setAttribute("data-loaded-skeleton", "");
  style.textContent = SKELETON_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

export interface SmartSkeletonProps {
  loading: boolean;
  children: ReactElement;
  animate?: boolean;
  className?: string;
}

export function SmartSkeleton({
  loading,
  children,
  animate = true,
  className = "",
}: SmartSkeletonProps): ReactElement {
  if (loading) {
    injectStyles();
  }

  if (!loading) {
    return children;
  }

  const skeletonClassName = [
    "loaded-skeleton-mode",
    animate && "loaded-animate",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SkeletonContext.Provider value={true}>
      <div className={skeletonClassName} aria-hidden="true">
        {children}
      </div>
    </SkeletonContext.Provider>
  );
}
