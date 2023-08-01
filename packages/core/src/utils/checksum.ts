/**
 * Generate a CRC-32 checksum based on a given string
 *
 * @param str
 * @returns
 */
export function generateCRC32Checksum(str: string): number {
	const crcTable: number[] = makeCRCTable()
	let crc: number = 0 ^ -1

	for (let i = 0; i < str.length; i++) {
		crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff]
	}

	return (crc ^ -1) >>> 0
}

/**
 * Utility function to generate a CRC table
 *
 * @returns
 */
function makeCRCTable(): number[] {
	let c: number
	const crcTable: number[] = []

	for (let n = 0; n < 256; n++) {
		c = n
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
		}
		crcTable[n] = c
	}

	return crcTable
}
