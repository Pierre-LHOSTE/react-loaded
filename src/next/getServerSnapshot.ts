import { SNAPSHOT_COOKIE_NAME } from "../cookie/constants";
import { parseSnapshotCookie } from "../cookie/parseSnapshotCookie";
import type { PersistedSkeletonSnapshot } from "../types";

export interface GetServerSnapshotOptions {
	cookieName?: string;
}

export async function getServerSnapshot(
	options?: GetServerSnapshotOptions,
): Promise<PersistedSkeletonSnapshot> {
	const { cookies } = await import("next/headers.js");
	const name = options?.cookieName ?? SNAPSHOT_COOKIE_NAME;
	const cookieStore = await cookies();
	const raw = cookieStore.get(name)?.value;
	return parseSnapshotCookie(raw);
}
