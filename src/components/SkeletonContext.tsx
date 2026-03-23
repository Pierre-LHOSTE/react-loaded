import { createContext, useContext } from "react";

export const SkeletonContext = createContext<boolean>(false);

export function useIsSkeletonMode() {
	return useContext(SkeletonContext);
}
