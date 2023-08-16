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

export function convertRequestBodyToString(input: unknown): string {
	if (typeof input === 'string') {
		return input // Already a string, no conversion needed
	} else if (typeof input === 'number' || typeof input === 'boolean') {
		return String(input) // Convert numbers and booleans to string
	} else if (input instanceof Date) {
		return input.toISOString() // Convert Date objects to ISO string
	} else if (input instanceof Object) {
		return JSON.stringify(input) // Convert objects to JSON string
	} else {
		return String(input) // Fallback for other types
	}
}
