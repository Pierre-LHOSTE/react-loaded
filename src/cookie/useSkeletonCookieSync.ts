import { useEffect } from "react";
import { STORAGE_UPDATE_EVENT } from "../hooks/storage";
import {
	type SyncSnapshotToCookieOptions,
	syncSnapshotToCookie,
} from "./syncSnapshotToCookie";

export function useSkeletonCookieSync(
	options?: SyncSnapshotToCookieOptions,
): void {
	const cookieName = options?.cookieName;
	const path = options?.path;
	const maxAge = options?.maxAge;
	const hasCompact = options?.compact != null;
	const maxSkeletons = options?.compact?.maxSkeletons;
	const maxTextKeysPerSkeleton = options?.compact?.maxTextKeysPerSkeleton;
	const decimals = options?.compact?.decimals;

	useEffect(() => {
		const compact = hasCompact
			? { maxSkeletons, maxTextKeysPerSkeleton, decimals }
			: undefined;
		const opts: SyncSnapshotToCookieOptions = {
			cookieName,
			path,
			maxAge,
			compact,
		};

		syncSnapshotToCookie(opts);

		const handler = () => syncSnapshotToCookie(opts);
		window.addEventListener(STORAGE_UPDATE_EVENT, handler);
		return () => window.removeEventListener(STORAGE_UPDATE_EVENT, handler);
	}, [
		cookieName,
		path,
		maxAge,
		hasCompact,
		maxSkeletons,
		maxTextKeysPerSkeleton,
		decimals,
	]);
}
