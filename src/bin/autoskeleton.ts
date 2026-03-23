import { main } from "../cli/main";

main().catch((error) => {
	console.error(
		`\n  autoskeleton: ${error instanceof Error ? error.message : String(error)}\n`,
	);
	process.exit(1);
});
