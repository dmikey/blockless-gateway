import axios from 'axios'

import { BaseErrors } from '../errors'
import { IFunctionManifestRecord } from '../models'
import FunctionManifest from '../models/functionManifest'

/**
 * A utility method to fetch and cache function manifest
 *
 * @param functionId the IPFS CID for this function
 */
export async function fetchFunctionManifest(functionId: string) {
	try {
		let manifest = null

		// Fetch cached manifest record
		const functionManifest = await FunctionManifest.findOne({ functionId }).lean()

		// If not found or not valid
		if (!(!!functionManifest && !!functionManifest.manifest)) {
			const manifestResponse = await axios.get(`https://${functionId}.ipfs.w3s.link/manifest.json`)
			if (!(!!manifestResponse && !!manifestResponse.data))
				throw new BaseErrors.ERR_FUNCTION_MANIFEST_NOT_FOUND()
			if (!(!!manifestResponse.data.entry && !!manifestResponse.data.contentType))
				throw new BaseErrors.ERR_FUNCTION_MANIFEST_INVALID()

			// Set manifest to respond
			manifest = manifestResponse.data

			// Update cache
			await FunctionManifest.findOneAndUpdate({ functionId }, { manifest }, { upsert: true })
		} else {
			manifest = functionManifest.manifest
		}

		return manifest
	} catch (error) {
		return null
	}
}

/**
 * A utility method to validate and store a function manifest
 *
 * @param functionId
 * @param manifest
 * @returns
 */
export async function storeFunctionManifest(functionId: string, manifest: IFunctionManifestRecord) {
	if (!manifest) throw new BaseErrors.ERR_FUNCTION_MANIFEST_NOT_FOUND()
	if (!(!!manifest.entry && !!manifest.contentType))
		throw new BaseErrors.ERR_FUNCTION_MANIFEST_INVALID()

	return await FunctionManifest.findOneAndUpdate({ functionId }, { manifest }, { upsert: true })
}
