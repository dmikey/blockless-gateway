import crypto from 'crypto'

/**
 * Encrypt a value with aes-256-abc encoding, using an encryption key
 *
 * @param value
 * @param encryptionKey
 * @returns
 */
export const encryptValue = (
	value: string,
	encryptionKey: string
): { value: string; iv: string } => {
	const iv = crypto.randomBytes(16)

	const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv)

	let encrypted = cipher.update(value, 'utf8', 'hex')
	encrypted += cipher.final('hex')

	return { value: encrypted, iv: iv.toString('hex') }
}

/**
 * Encrypt a value with aes-256-abc encoding, using an encryption key and iv
 *
 * @param encryptedValue
 * @param encryptionKey
 * @param iv
 * @returns
 */
export const decryptValue = (encryptedValue: string, encryptionKey: string, iv: string): string => {
	const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, Buffer.from(iv, 'hex'))

	let decrypted = decipher.update(encryptedValue, 'hex', 'utf8')
	decrypted += decipher.final('utf8')

	return decrypted
}
