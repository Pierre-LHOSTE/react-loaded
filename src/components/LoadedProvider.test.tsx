import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as captureClient from "../capture/client";
import type { Distribution } from "../hooks/storage";
import type { SkeletonRegistry } from "../types";
import {
	LoadedProvider,
	useInitialCountSnapshot,
	useInitialDistributionSnapshot,
	useInitialHeightDistributionSnapshot,
	useInitialHeightSnapshot,
	useInitialWidthSnapshot,
	useRegistry,
} from "./LoadedProvider";

function RegistryConsumer() {
	const registry = useRegistry();
	return <div data-testid="registry-size">{Object.keys(registry).length}</div>;
}

function SnapshotConsumer() {
	const width = useInitialWidthSnapshot("user-card");
	const height = useInitialHeightSnapshot("user-card");
	const count = useInitialCountSnapshot("user-list");
	const wd = useInitialDistributionSnapshot("user-list");
	const hd = useInitialHeightDistributionSnapshot("user-list");

	return (
		<>
			<div data-testid="snapshot-width">{width?.t0 ?? "none"}</div>
			<div data-testid="snapshot-height">{height?.t0 ?? "none"}</div>
			<div data-testid="snapshot-count">{count ?? "none"}</div>
			<div data-testid="snapshot-dist">
				{(wd?.t0 as Distribution | undefined)?.avg ?? "none"}
			</div>
			<div data-testid="snapshot-height-dist">
				{(hd?.t0 as Distribution | undefined)?.avg ?? "none"}
			</div>
		</>
	);
}

describe("LoadedProvider", () => {
	it("exposes an empty registry by default", () => {
		render(<RegistryConsumer />);
		expect(screen.getByTestId("registry-size")).toHaveTextContent("0");
	});

	it("provides the given registry through context", () => {
		const registry: SkeletonRegistry = {
			"user-card": () => <div>User card skeleton</div>,
		};

		render(
			<LoadedProvider registry={registry}>
				<RegistryConsumer />
			</LoadedProvider>,
		);

		expect(screen.getByTestId("registry-size")).toHaveTextContent("1");
	});

	it("auto-configures capture from registry __captureConfig__", () => {
		const spy = vi.spyOn(captureClient, "configureCapture");

		const registry: SkeletonRegistry = {};
		Object.defineProperty(registry, "__captureConfig__", {
			value: { url: "http://127.0.0.1:9000" },
			enumerable: false,
		});

		render(
			<LoadedProvider registry={registry}>
				<div />
			</LoadedProvider>,
		);

		expect(spy).toHaveBeenCalledWith({ url: "http://127.0.0.1:9000" });
		spy.mockRestore();
	});

	it("does not call configureCapture when no __captureConfig__", () => {
		const spy = vi.spyOn(captureClient, "configureCapture");

		render(
			<LoadedProvider registry={{}}>
				<div />
			</LoadedProvider>,
		);

		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});

	it("provides persisted snapshot through context", () => {
		render(
			<LoadedProvider
				registry={{}}
				persistedSnapshot={{
					c: { "user-list": 4 },
					w: { "user-card": { t0: 123.4 } },
					h: { "user-card": { t0: 20.5 } },
					wd: { "user-list": { t0: { avg: 120, dev: 10 } } },
					hd: {
						"user-list": { t0: { avg: 22, dev: 3 } },
					},
				}}
			>
				<SnapshotConsumer />
			</LoadedProvider>,
		);

		expect(screen.getByTestId("snapshot-width")).toHaveTextContent("123.4");
		expect(screen.getByTestId("snapshot-height")).toHaveTextContent("20.5");
		expect(screen.getByTestId("snapshot-count")).toHaveTextContent("4");
		expect(screen.getByTestId("snapshot-dist")).toHaveTextContent("120");
		expect(screen.getByTestId("snapshot-height-dist")).toHaveTextContent("22");
	});
});
