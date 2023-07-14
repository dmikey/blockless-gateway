import axios from 'axios'
import { FunctionManifest } from '../models/functionManifest'
import { IFunctionEnvVarRecord, IFunctionRequestData } from '../interfaces/function'
import { INameValueArray } from '../interfaces/generic'
import { decryptValue } from '../utils/encryption'

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
			if (!(!!manifestResponse && !!manifestResponse.data)) throw new Error('Manifest not found.')
			if (!(!!manifestResponse.data.entry && !!manifestResponse.data.contentType))
				throw new Error('Invalid manifest.')

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
 *
 * @param envVars
 * @returns
 */
export function parseFunctionEnvVars(envVars: IFunctionEnvVarRecord[]): INameValueArray {
	let envVarsArray = [] as INameValueArray

	envVarsArray = envVars
		.filter((envVar) => !!envVar.value && !!envVar.iv)
		.map((envVar) => {
			const value = decryptValue(envVar.value, process.env.ENV_ENCRYPTION_SECRET!, envVar.iv)
			return { name: envVar.name, value }
		})

	return envVarsArray
}

/**
 *
 * @param requestData
 * @returns
 */
export function parseFunctionRequestData(requestData: IFunctionRequestData): INameValueArray {
	let requestVars = [] as INameValueArray

	requestVars.push({
		name: 'BLS_REQUEST_METHOD',
		value: requestData.method || 'GET'
	})

	requestVars.push({
		name: 'BLS_REQUEST_PATH',
		value: requestData.path || '/'
	})

	requestVars.push({
		name: 'BLS_REQUEST_PARAMS',
		value: Object.entries(requestData.params || [])
			.map(([key, value]) => `${key}=${value}`)
			.join('&')
	})

	requestVars.push({
		name: 'BLS_REQUEST_QUERY',
		value: Object.entries(requestData.query || [])
			.map(([key, value]) => `${key}=${value}`)
			.join('&')
	})

	requestVars.push({
		name: 'BLS_REQUEST_HEADERS',
		value: Object.entries(requestData.query || [])
			.map(([key, value]) => `${key}=${value}`)
			.join('&')
	})

	if (requestData.body) {
		requestVars.push({
			name: 'BLS_REQUEST_BODY',
			value:
				typeof requestData.body !== 'string'
					? JSON.stringify(requestData.body)
					: (requestData.body as string)
		})
	}

	return requestVars
}
