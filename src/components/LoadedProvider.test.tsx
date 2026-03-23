import { render, screen } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SkeletonRegistry } from "../types";

vi.mock("../capture/client", () => ({
	configureCapture: vi.fn(),
}));

import {
	LoadedContext,
	LoadedProvider,
	RegistryContext,
	useInitialCountSnapshot,
	useInitialDistributionSnapshot,
	useInitialHeightDistributionSnapshot,
	useInitialHeightSnapshot,
	useInitialWidthSnapshot,
	useRegistry,
} from "./LoadedProvider";

function RegistryProbe() {
	const registry = useRegistry();
	return <div data-testid="registry">{JSON.stringify(registry)}</div>;
}

function SnapshotProbe() {
	const snapshot = useContext(LoadedContext);
	return <div data-testid="snapshot">{JSON.stringify(snapshot)}</div>;
}

describe("LoadedProvider", () => {
	it("renders children", () => {
		render(
			<LoadedProvider>
				<div data-testid="child">Hello</div>
			</LoadedProvider>,
		);

		expect(screen.getByTestId("child").textContent).toBe("Hello");
	});

	it("provides an empty registry by default", () => {
		render(
			<LoadedProvider>
				<RegistryProbe />
			</LoadedProvider>,
		);

		expect(screen.getByTestId("registry").textContent).toBe("{}");
	});

	it("provides the given registry", () => {
		function MySkeleton() {
			return <div>skeleton</div>;
		}

		function RegistryKeysProbe() {
			const registry = useRegistry();
			return (
				<div data-testid="registry-keys">{Object.keys(registry).join(",")}</div>
			);
		}

		render(
			<LoadedProvider registry={{ card: MySkeleton }}>
				<RegistryKeysProbe />
			</LoadedProvider>,
		);

		expect(screen.getByTestId("registry-keys").textContent).toBe("card");
	});

	it("provides null snapshot by default", () => {
		render(
			<LoadedProvider>
				<SnapshotProbe />
			</LoadedProvider>,
		);

		expect(screen.getByTestId("snapshot").textContent).toBe("null");
	});

	it("provides the given snapshot", () => {
		const snapshot = {
			v: 1,
		};

		render(
			<LoadedProvider snapshot={snapshot}>
				<SnapshotProbe />
			</LoadedProvider>,
		);

		const parsed = JSON.parse(screen.getByTestId("snapshot").textContent ?? "");
		expect(parsed).toEqual(snapshot);
	});
});

describe("useRegistry (without provider)", () => {
	it("returns an empty registry when used outside LoadedProvider", () => {
		render(<RegistryProbe />);

		expect(screen.getByTestId("registry").textContent).toBe("{}");
	});
});

describe("RegistryContext / LoadedContext", () => {
	it("exposes RegistryContext for direct consumption", () => {
		function DirectConsumer() {
			const registry = useContext(RegistryContext);
			return <div data-testid="direct">{Object.keys(registry).length}</div>;
		}

		function Skeleton() {
			return <div />;
		}

		render(
			<LoadedProvider registry={{ a: Skeleton, b: Skeleton }}>
				<DirectConsumer />
			</LoadedProvider>,
		);

		expect(screen.getByTestId("direct").textContent).toBe("2");
	});
});

describe("LoadedProvider (capture config)", () => {
	it("calls configureCapture when registry has __captureConfig__", async () => {
		const { configureCapture } = await import("../capture/client");
		vi.mocked(configureCapture).mockClear();

		const registry = {
			__captureConfig__: { url: "http://localhost:9000" },
		} as unknown as SkeletonRegistry;

		render(
			<LoadedProvider registry={registry}>
				<div />
			</LoadedProvider>,
		);

		await vi.waitFor(() => {
			expect(configureCapture).toHaveBeenCalledWith({
				url: "http://localhost:9000",
			});
		});
	});

	it("does not call configureCapture without __captureConfig__", async () => {
		const { configureCapture } = await import("../capture/client");
		vi.mocked(configureCapture).mockClear();

		render(
			<LoadedProvider registry={{}}>
				<div />
			</LoadedProvider>,
		);

		await new Promise((r) => setTimeout(r, 50));
		expect(configureCapture).not.toHaveBeenCalled();
	});
});

describe("snapshot context hooks", () => {
	function WidthProbe({ id }: { id: string }) {
		const widths = useInitialWidthSnapshot(id);
		return <div data-testid="widths">{JSON.stringify(widths)}</div>;
	}

	function HeightProbe({ id }: { id: string }) {
		const heights = useInitialHeightSnapshot(id);
		return <div data-testid="heights">{JSON.stringify(heights)}</div>;
	}

	function CountProbe({ storageKey }: { storageKey?: string }) {
		const count = useInitialCountSnapshot(storageKey);
		return <div data-testid="count">{JSON.stringify(count)}</div>;
	}

	function DistProbe({ storageKey }: { storageKey?: string }) {
		const dist = useInitialDistributionSnapshot(storageKey);
		return <div data-testid="dist">{JSON.stringify(dist)}</div>;
	}

	function HeightDistProbe({ storageKey }: { storageKey?: string }) {
		const dist = useInitialHeightDistributionSnapshot(storageKey);
		return <div data-testid="hdist">{JSON.stringify(dist)}</div>;
	}

	it("useInitialWidthSnapshot returns null when no snapshot", () => {
		render(
			<LoadedProvider>
				<WidthProbe id="card" />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("widths").textContent).toBe("null");
	});

	it("useInitialWidthSnapshot returns widths from snapshot", () => {
		render(
			<LoadedProvider snapshot={{ w: { card: { t0: 120 } } }}>
				<WidthProbe id="card" />
			</LoadedProvider>,
		);
		expect(JSON.parse(screen.getByTestId("widths").textContent ?? "")).toEqual({
			t0: 120,
		});
	});

	it("useInitialHeightSnapshot returns null when no snapshot", () => {
		render(
			<LoadedProvider>
				<HeightProbe id="card" />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("heights").textContent).toBe("null");
	});

	it("useInitialHeightSnapshot returns heights from snapshot", () => {
		render(
			<LoadedProvider snapshot={{ h: { card: { t0: 24 } } }}>
				<HeightProbe id="card" />
			</LoadedProvider>,
		);
		expect(JSON.parse(screen.getByTestId("heights").textContent ?? "")).toEqual(
			{
				t0: 24,
			},
		);
	});

	it("useInitialCountSnapshot returns null without storageKey", () => {
		render(
			<LoadedProvider>
				<CountProbe />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("count").textContent).toBe("null");
	});

	it("useInitialCountSnapshot returns count from snapshot", () => {
		render(
			<LoadedProvider snapshot={{ c: { feed: 5 } }}>
				<CountProbe storageKey="feed" />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("count").textContent).toBe("5");
	});

	it("useInitialDistributionSnapshot returns null without storageKey", () => {
		render(
			<LoadedProvider>
				<DistProbe />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("dist").textContent).toBe("null");
	});

	it("useInitialDistributionSnapshot returns distributions from snapshot", () => {
		render(
			<LoadedProvider
				snapshot={{ wd: { feed: { t0: { avg: 150, dev: 20 } } } }}
			>
				<DistProbe storageKey="feed" />
			</LoadedProvider>,
		);
		expect(JSON.parse(screen.getByTestId("dist").textContent ?? "")).toEqual({
			t0: { avg: 150, dev: 20 },
		});
	});

	it("useInitialHeightDistributionSnapshot returns from snapshot", () => {
		render(
			<LoadedProvider snapshot={{ hd: { feed: { t0: { avg: 24, dev: 4 } } } }}>
				<HeightDistProbe storageKey="feed" />
			</LoadedProvider>,
		);
		expect(JSON.parse(screen.getByTestId("hdist").textContent ?? "")).toEqual({
			t0: { avg: 24, dev: 4 },
		});
	});

	it("useInitialWidthSnapshot returns null for empty width record", () => {
		render(
			<LoadedProvider snapshot={{ w: { card: {} } }}>
				<WidthProbe id="card" />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("widths").textContent).toBe("null");
	});

	it("useInitialHeightSnapshot returns null for empty height record", () => {
		render(
			<LoadedProvider snapshot={{ h: { card: {} } }}>
				<HeightProbe id="card" />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("heights").textContent).toBe("null");
	});

	it("useInitialDistributionSnapshot returns null for empty distribution record", () => {
		render(
			<LoadedProvider snapshot={{ wd: { feed: {} } }}>
				<DistProbe storageKey="feed" />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("dist").textContent).toBe("null");
	});

	it("useInitialHeightDistributionSnapshot returns null for empty height distribution record", () => {
		render(
			<LoadedProvider snapshot={{ hd: { feed: {} } }}>
				<HeightDistProbe storageKey="feed" />
			</LoadedProvider>,
		);
		expect(screen.getByTestId("hdist").textContent).toBe("null");
	});
});

describe("LoadedProvider (capture config deduplication)", () => {
	it("does not call configureCapture again when registry changes but URL is the same", async () => {
		const { configureCapture } = await import("../capture/client");
		vi.mocked(configureCapture).mockClear();

		const registry1 = {
			__captureConfig__: { url: "http://localhost:9000" },
		} as unknown as SkeletonRegistry;

		const registry2 = {
			__captureConfig__: { url: "http://localhost:9000" },
		} as unknown as SkeletonRegistry;

		const { rerender } = render(
			<LoadedProvider registry={registry1}>
				<div />
			</LoadedProvider>,
		);

		await vi.waitFor(() => {
			expect(configureCapture).toHaveBeenCalledTimes(1);
		});

		vi.mocked(configureCapture).mockClear();

		rerender(
			<LoadedProvider registry={registry2}>
				<div />
			</LoadedProvider>,
		);

		await new Promise((r) => setTimeout(r, 50));
		expect(configureCapture).not.toHaveBeenCalled();
	});
});
