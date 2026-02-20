const VALID_ID = /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/;

export function isValidId(id: string): boolean {
	return VALID_ID.test(id);
}
