export interface GenerateRegistryOptions {
	captureUrl?: string;
}

function toExportName(id: string): string {
	const cleaned = id.replace(/[^a-zA-Z0-9]+/g, " ").trim();
	if (cleaned.length === 0) {
		return "Skeleton";
	}
	const words = cleaned.split(/\s+/);
	return `${words
		.map((word) => word[0]?.toUpperCase() + word.slice(1))
		.join("")}Skeleton`;
}

export function generateRegistry(
	ids: string[],
	options: GenerateRegistryOptions = {},
): string {
	const sortedIds = [...ids].sort();
	const isEmpty = sortedIds.length === 0;
	const importLines = sortedIds.map((id) => {
		const exportName = toExportName(id);
		return `import { ${exportName} } from "./${id}";`;
	});

	const entries = sortedIds.map((id) => {
		const exportName = toExportName(id);
		return `\t"${id}": ${exportName},`;
	});

	const captureMeta = options.captureUrl
		? `\n\nObject.defineProperty(registry, "__captureConfig__", {\n\tvalue: { url: "${options.captureUrl}" },\n\tenumerable: false,\n});\n`
		: "\n";

	const importsBlock =
		importLines.length > 0 ? `${importLines.join("\n")}\n\n` : "";
	const registryLine = isEmpty
		? "// biome-ignore lint/suspicious/noExplicitAny: dynamic registry lookup\nexport const registry: Record<string, ComponentType<any>> = {};"
		: "// biome-ignore lint/suspicious/noExplicitAny: dynamic registry lookup\nexport const registry: Record<string, ComponentType<any>> = {";

	return [
		'import type { ComponentType } from "react";',
		importsBlock,
		registryLine,
		entries.length > 0 ? entries.join("\n") : "",
		isEmpty ? "" : "};",
		captureMeta,
	].join("\n");
}
