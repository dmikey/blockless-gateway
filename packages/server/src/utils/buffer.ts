/**
 * Convert a JSON object to base64 string
 *
 * @param json
 * @returns
 */
export function jsonToBase64(json: object): string {
	const jsonString = JSON.stringify(json)
	const base64String = Buffer.from(jsonString).toString('base64')
	return base64String
}
