import { useEffect, useLayoutEffect } from "react";

const canUseDOM =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as { document?: unknown }).document !== "undefined";

export const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;
