import { bench, describe } from "vitest";
import { AutoSkeleton } from "../components/AutoSkeleton";
import { LoadedProvider } from "../components/LoadedProvider";
import { renderWithProfiler } from "./renderWithProfiler";

function GeneratedSkeleton() {
	return (
		<div className="as-skeleton as-animate">
			<div className="as-text">{"•••••••• ••••"}</div>
			<div className="as-text">{"••••••••••"}</div>
			<div className="as-interactive" style={{ width: 120, height: 40 }}>
				{"\u00A0"}
			</div>
		</div>
	);
}

const registry = { "bench-card": GeneratedSkeleton };

const heavyRowCount = 200;
const heavyRows = Array.from({ length: heavyRowCount }, (_, i) => (
	<div key={i} className="as-text">
		{"•••••••• ••••"}
	</div>
));

function HeavyGeneratedSkeleton() {
	return (
		<div className="as-skeleton as-animate">
			<div className="as-text">{"•••••••• ••••"}</div>
			{heavyRows}
		</div>
	);
}

const heavyRegistry = { "bench-heavy": HeavyGeneratedSkeleton };

const contentElement = (
	<div className="content-card">
		<div className="content-title">Loaded title</div>
		<div className="content-meta">Loaded meta</div>
		<button type="button">Action</button>
	</div>
);

describe("AutoSkeleton", () => {
	bench("mount pre-generated skeleton (light)", () => {
		renderWithProfiler({
			id: "AutoSkeleton:mount",
			element: (
				<LoadedProvider registry={registry}>
					<AutoSkeleton id="bench-card">{contentElement}</AutoSkeleton>
				</LoadedProvider>
			),
		});
	});

	bench("transition loading to content", () => {
		renderWithProfiler({
			id: "AutoSkeleton:transition",
			element: (
				<LoadedProvider registry={registry}>
					<AutoSkeleton id="bench-card" loading={true}>
						{contentElement}
					</AutoSkeleton>
				</LoadedProvider>
			),
			update: (
				<LoadedProvider registry={registry}>
					<AutoSkeleton id="bench-card" loading={false}>
						{contentElement}
					</AutoSkeleton>
				</LoadedProvider>
			),
		});
	});

	bench("mount pre-generated skeleton (heavy, 200 rows)", () => {
		renderWithProfiler({
			id: "AutoSkeleton:mount:heavy",
			element: (
				<LoadedProvider registry={heavyRegistry}>
					<AutoSkeleton id="bench-heavy">{contentElement}</AutoSkeleton>
				</LoadedProvider>
			),
		});
	});
});
