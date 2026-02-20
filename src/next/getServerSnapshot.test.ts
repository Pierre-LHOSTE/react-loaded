import { afterEach, describe, expect, it, vi } from "vitest";
import { SNAPSHOT_COOKIE_NAME } from "../cookie/constants";
import { getServerSnapshot } from "./getServerSnapshot";

const { cookiesMock } = vi.hoisted(() => ({
	cookiesMock: vi.fn(),
}));

vi.mock("next/headers.js", () => ({
	cookies: cookiesMock,
}));

describe("getServerSnapshot", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns parsed snapshot when cookie exists", async () => {
		const get = vi.fn().mockReturnValue({
			value: encodeURIComponent(JSON.stringify({ c: { feed: 4 } })),
		});
		cookiesMock.mockResolvedValue({ get });

		const result = await getServerSnapshot();

		expect(get).toHaveBeenCalledWith(SNAPSHOT_COOKIE_NAME);
		expect(result.c).toEqual({ feed: 4 });
	});

	it("returns empty snapshot when cookie is missing", async () => {
		const get = vi.fn().mockReturnValue(undefined);
		cookiesMock.mockResolvedValue({ get });

		const result = await getServerSnapshot({ cookieName: "custom-cookie" });

		expect(get).toHaveBeenCalledWith("custom-cookie");
		expect(result).toEqual({});
	});

	it("returns empty snapshot when cookie is invalid", async () => {
		const get = vi.fn().mockReturnValue({ value: "not-json{{{" });
		cookiesMock.mockResolvedValue({ get });

		const result = await getServerSnapshot();

		expect(result).toEqual({});
	});
});
