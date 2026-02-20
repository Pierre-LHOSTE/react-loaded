import type { SyncSnapshotToCookieOptions } from "../cookie/syncSnapshotToCookie";
import { useSkeletonCookieSync } from "../cookie/useSkeletonCookieSync";

export function SkeletonCookieSync(props: {
	options?: SyncSnapshotToCookieOptions;
}) {
	useSkeletonCookieSync(props.options);
	return null;
}
