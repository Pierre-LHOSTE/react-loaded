import { createContext, useContext } from "react";

export const SkeletonContext = createContext(false);

export function useIsSkeletonMode(): boolean {
	return useContext(SkeletonContext);
}
