import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { StoragePayload } from "../types";
import { usePersistedValueRecord } from "./usePersistedValueRecord";

const STORAGE_KEY = "react-loaded";

function makePayload(overrides?: Partial<StoragePayload>): StoragePayload {
	return { v: 2, c: {}, w: {}, h: {}, wd: {}, hd: {}, ...overrides };
}

import { requireValue } from "../utils/require-value";

describe("usePersistedValueRecord", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no data exists", () => {
		const { result } = renderHook(() =>
			usePersistedValueRecord({
				storageField: "w",
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toBeNull();
	});

	it("returns initialValues when provided", () => {
		const initial = { t0: 120, t1: 200 };
		const { result } = renderHook(() =>
			usePersistedValueRecord({
				storageField: "w",
				storageKey: "card",
				loading: true,
				initialValues: initial,
			}),
		);

		expect(result.current).toEqual(initial);
	});

	it("reads from localStorage when no initialValues", () => {
		const payload = makePayload({ w: { card: { t0: 150 } } });
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		const { result } = renderHook(() =>
			usePersistedValueRecord({
				storageField: "w",
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toEqual({ t0: 150 });
	});

	it("persists currentValues when loading becomes false", () => {
		const { result, rerender } = renderHook(
			(props) =>
				usePersistedValueRecord({
					storageField: "w",
					storageKey: "card",
					...props,
				}),
			{
				initialProps: {
					loading: true,
					currentValues: undefined as Record<string, number> | undefined,
				},
			},
		);

		expect(result.current).toBeNull();

		rerender({ loading: false, currentValues: { t0: 180, t1: 250 } });

		expect(result.current).toEqual({ t0: 180, t1: 250 });

		// Verify it's in localStorage
		const raw = localStorage.getItem(STORAGE_KEY);
		const stored = JSON.parse(
			requireValue(raw, "Expected persisted value record payload"),
		);
		expect(stored.w.card).toEqual({ t0: 180, t1: 250 });
	});

	it("returns null for empty storageKey", () => {
		const { result } = renderHook(() =>
			usePersistedValueRecord({
				storageField: "w",
				storageKey: "",
				loading: true,
			}),
		);

		expect(result.current).toBeNull();
	});

	it("works with 'h' field for heights", () => {
		const payload = makePayload({ h: { card: { t0: 24 } } });
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		const { result } = renderHook(() =>
			usePersistedValueRecord({
				storageField: "h",
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toEqual({ t0: 24 });
	});
});
