import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CONTAINER_ID = "loaded-toast-container";
const STYLE_ID = "loaded-toast-styles";

async function loadToastModule() {
	vi.resetModules();
	return import("./toast");
}

function clearToastDom() {
	document.getElementById(CONTAINER_ID)?.remove();
	document.getElementById(STYLE_ID)?.remove();
}

describe("toast", () => {
	beforeEach(() => {
		clearToastDom();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.restoreAllMocks();
		clearToastDom();
	});

	it("creates container and style once", async () => {
		const { showToast } = await loadToastModule();

		showToast({ message: "First", type: "info", duration: 1_000 });
		showToast({ message: "Second", type: "success", duration: 1_000 });

		expect(document.querySelectorAll(`#${CONTAINER_ID}`)).toHaveLength(1);
		expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
		expect(document.querySelectorAll(".loaded-toast")).toHaveLength(2);
	});

	it("deduplicates by key", async () => {
		const { showToast } = await loadToastModule();

		showToast({
			key: "capture-user",
			message: "Before",
			type: "info",
			duration: 1_000,
		});
		showToast({
			key: "capture-user",
			message: "After",
			type: "success",
			duration: 1_000,
		});

		const exiting = document.querySelector(".loaded-toast-out");
		expect(exiting).not.toBeNull();
		exiting?.dispatchEvent(new Event("animationend"));

		const toasts = document.querySelectorAll(".loaded-toast");
		expect(toasts).toHaveLength(1);
		expect(toasts[0]).toHaveTextContent("After");
	});

	it("auto-dismisses toast after duration", async () => {
		const { showToast } = await loadToastModule();

		showToast({
			key: "auto-dismiss",
			message: "Timed",
			type: "success",
			duration: 500,
		});

		const toast = document.querySelector(".loaded-toast");
		if (!toast) throw new Error("Toast should exist");

		vi.advanceTimersByTime(500);
		expect(toast).toHaveClass("loaded-toast-out");

		toast.dispatchEvent(new Event("animationend"));
		expect(document.querySelector(".loaded-toast")).toBeNull();
	});

	it("dismissByKey dismisses and removes toast", async () => {
		const { dismissByKey, showToast } = await loadToastModule();

		showToast({
			key: "manual-dismiss",
			message: "Dismiss me",
			type: "info",
			duration: 10_000,
		});

		const toast = document.querySelector(".loaded-toast");
		if (!toast) throw new Error("Toast should exist");

		dismissByKey("manual-dismiss");
		expect(toast).toHaveClass("loaded-toast-out");

		toast.dispatchEvent(new Event("animationend"));
		expect(document.querySelector(".loaded-toast")).toBeNull();
	});

	it("renders message and sub as text content", async () => {
		const { showToast } = await loadToastModule();

		showToast({
			message: '<img src=x onerror="alert(1)">',
			sub: "<b>subtitle</b>",
			type: "info",
			duration: 1_000,
		});

		const toast = document.querySelector(".loaded-toast");
		expect(toast).not.toBeNull();
		expect(document.querySelector(".loaded-toast-msg img")).toBeNull();
		expect(document.querySelector(".loaded-toast-sub b")).toBeNull();
		expect(toast).toHaveTextContent('<img src=x onerror="alert(1)">');
		expect(toast).toHaveTextContent("<b>subtitle</b>");
	});
});
