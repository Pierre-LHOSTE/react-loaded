import { cookies } from "next/headers.js";
import type { PersistedSkeletonSnapshot } from "../components/LoadedProvider";
import { SNAPSHOT_COOKIE_NAME } from "../cookie/constants";
import { parseSnapshotCookie } from "../cookie/parseSnapshotCookie";

export interface GetServerSnapshotOptions {
	cookieName?: string;
}

export async function getServerSnapshot(
	options?: GetServerSnapshotOptions,
): Promise<PersistedSkeletonSnapshot> {
	const name = options?.cookieName ?? SNAPSHOT_COOKIE_NAME;
	const cookieStore = await cookies();
	const raw = cookieStore.get(name)?.value;
	return parseSnapshotCookie(raw);
}
