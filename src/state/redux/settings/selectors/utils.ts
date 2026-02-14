export function normalizeFontFamily(input: string): string {
	const trimmed = input.trim();

	if (trimmed === '') {
		return '';
	}

	// Remove surrounding quotes if user added them
	const unquoted =
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
			? trimmed.slice(1, -1)
			: trimmed;

	// Escape only what matters inside a CSS string
	const escaped = unquoted
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n|\r|\f/g, ' ');

	return `"${escaped}"`;
}
