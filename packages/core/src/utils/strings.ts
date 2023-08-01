/**
 * Normalize string
 *
 * @param v
 * @returns
 */
export const normalize = (v: string) => {
	let formatted = v

	if (formatted) {
		formatted = formatted.trim()
		formatted = formatted.replace(/_/g, '-')
	}

	return formatted
}
