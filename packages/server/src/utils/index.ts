/**
 * Test whether the input is a valid UUID
 *
 * @param inputStr
 * @returns
 */
export function isUUID(inputStr: string): boolean {
	const uuidPattern =
		/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

	// Use the RegExp test method to check if the input string matches the UUID pattern
	return uuidPattern.test(inputStr)
}
