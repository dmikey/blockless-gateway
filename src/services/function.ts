import axios from 'axios'
import { FunctionManifest } from '../models/functionManifest'
import { IFunctionEnvVarRecord, IFunctionRequestData } from '../interfaces/function'
import { INameValueArray } from '../interfaces/generic'
import { decryptValue } from '../utils/encryption'
import { IHeadNodeResponse } from '../interfaces/headNode'
import { FastifyRequest } from 'fastify'
import { BaseErrors } from '../constants/errors'

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
 * A utility function to parse request data from a fastify request object
 *
 * @param request
 * @returns
 */
export function parseFunctionRequestData(request: FastifyRequest): any {
	return {
		host: request.hostname,
		path: decodeURIComponent(request.url.split('?')[0]),
		method: request.method,
		params: request.params,
		query: request.query,
		headers: request.headers,
		body: request.body
	}
}

/**
 * A utility function to parse env vars key-value array from a function's env var records
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
 * A utility function to parse env vars key-value array from a function's request data
 *
 * @param requestData
 * @returns
 */
export function parseFunctionRequestVars(requestData: IFunctionRequestData): INameValueArray {
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

/**
 * A utility function to parse the raw response from the head node
 *
 * @param data
 * @returns
 */
export function parseFunctionResponse(data: IHeadNodeResponse) {
	let body = null as any
	let type = 'text/html'

	if (data.result.startsWith('data:')) {
		const bufferData = data.result.split(',')[1]
		const contentType = data.result.split(',')[0].split(':')[1].split(';')[0]
		const base64data = Buffer.from(bufferData, 'base64')

		type = contentType
		body = base64data
	} else {
		body = data.result
	}

	return {
		status: 200,
		headers: [],
		type,
		body
	}
}
