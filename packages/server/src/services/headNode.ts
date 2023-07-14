import axios from 'axios'
import { IFunctionManifestRecord } from '../interfaces/function'
import { IHeadNodePayload, IHeadNodeResponse } from '../interfaces/headNode'
import { INameValueArray } from '../interfaces/generic'
import { fetchCache } from './headNodeCache'

/**
 * Request invocation for a function on the head node
 *
 * @param payload
 * @param retries the number of retries
 * @returns
 */
export async function invokeHeadNodeFunction(
	payload: IHeadNodePayload,
	retries: number = 0
): Promise<IHeadNodeResponse> {
	let i = 0

	while (i <= retries) {
		const response = await axios.post(
			`${process.env.HEAD_NODE_HOST}/api/v1/functions/execute`,
			payload
		)

		if (response.data.code === '200' || response.data.code === 200) {
			return response.data
		} else {
			i++
		}
	}

	throw new Error('Failed to execute function')
}

/**
 *
 * @param payload
 * @returns
 */
export async function fetchCachedHeadNodeFunction(
	payload: IHeadNodePayload
): Promise<IHeadNodeResponse> {
	const cachedData = await fetchCache(payload)
	if (cachedData) return cachedData

	return await invokeHeadNodeFunction(payload, 3)
}

/**
 * Request invocation for a function via cache or head node
 *
 * @param functionId
 * @param manifest
 * @param envVars
 */
export async function invokeCachedHeadNodeFunction(
	functionId: string,
	manifest: IFunctionManifestRecord,
	envVars: INameValueArray
): Promise<IHeadNodeResponse> {
	// 2. @TODO Identify cache configuration

	const payload = parsePayload(functionId, manifest, envVars)
	return await fetchCachedHeadNodeFunction(payload)
}

/**
 * Utility function to parse payload object
 *
 * @param functionId
 * @param manifest
 * @param envVars
 * @returns
 */
function parsePayload(
	functionId: string,
	manifest: IFunctionManifestRecord,
	envVars: INameValueArray
): IHeadNodePayload {
	return {
		function_id: functionId,
		method: manifest.entry,
		parameters: null,
		config: {
			permissions: [...manifest.permissions],
			env_vars: [...envVars],
			stdin: '/',
			number_of_nodes: 1
		}
	}
}
