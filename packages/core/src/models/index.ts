import mongoose from 'mongoose'

import { BaseErrors } from '../errors'

export * from './function'
export * from './functionManifest'
export * from './user'

/**
 * Set a MongoDB Gateway connection with a given URI
 *
 * @param uri
 */
export async function setConnection(uri: string) {
	try {
		await mongoose.connect(uri)
	} catch (error) {
		throw new BaseErrors.ERR_INVALID_DB_CONNECTION()
	}
}
