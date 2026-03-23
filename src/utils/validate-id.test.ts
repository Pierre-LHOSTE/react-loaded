import { describe, expect, it } from "vitest";
import { isValidId } from "./validate-id";

describe("isValidId", () => {
	it("accepts valid IDs", () => {
		expect(isValidId("user-card")).toBe(true);
		expect(isValidId("profile_header")).toBe(true);
		expect(isValidId("A")).toBe(true);
		expect(isValidId("myComponent123")).toBe(true);
	});

	it("rejects empty string", () => {
		expect(isValidId("")).toBe(false);
	});

	it("rejects IDs starting with a digit", () => {
		expect(isValidId("1card")).toBe(false);
	});

	it("rejects path traversal attempts", () => {
		expect(isValidId("../bad")).toBe(false);
		expect(isValidId("../../etc/passwd")).toBe(false);
	});

	it("rejects IDs longer than 128 characters", () => {
		expect(isValidId("a".repeat(128))).toBe(true);
		expect(isValidId("a".repeat(129))).toBe(false);
	});

	it("rejects IDs with special characters", () => {
		expect(isValidId("user card")).toBe(false);
		expect(isValidId("user.card")).toBe(false);
		expect(isValidId("user/card")).toBe(false);
	});
});
