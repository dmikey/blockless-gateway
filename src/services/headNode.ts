import axios from 'axios'
import { IFunctionManifestRecord } from '../interfaces/function'
import { IHeadNodePayload, IHeadNodeResponse } from '../interfaces/headNode'
import { INameValueArray } from '../interfaces/generic'
import { fetchCache, storeCache } from './headNodeCache'
import { BaseErrors } from '../constants/errors'

/**
 * Request invocation for a function on the head node
 *
 * @param payload
 * @param retries the number of retries
 * @returns
 */
export async function callHeadNodeFunction(
	payload: IHeadNodePayload,
	retries: number = 0
): Promise<IHeadNodeResponse> {
	let i = 0

	while (i < retries) {
		try {
			const response = await axios.post(
				`${process.env.HEAD_NODE_HOST}/api/v1/functions/execute`,
				payload
			)

			if (response.data.code === '200' || response.data.code === 200) {
				return response.data
			}
		} catch (error) {}

		i++
	}

	throw new BaseErrors.ERR_HEAD_FAILED_TO_EXECUTE()
}

/**
 * Request installation for a function on the head node
 *
 * @param payload
 * @param count the number of retries
 * @returns
 */
export async function installHeadNodeFunction(
	functionId: string,
	count: number = 1
): Promise<IHeadNodeResponse> {
	const response = await axios.post(
		`${process.env.HEAD_NODE_HOST}/api/v1/functions/install?count=${count}`,
		{
			cid: functionId
		}
	)

	if (!(response.data.code === '200' || response.data.code === 200)) {
		throw new BaseErrors.ERR_HEAD_FAILED_TO_INSTALL()
	}

	return response.data
}

/**
 * Fetch a cached response for a payload, call head node if cache is not available
 *
 * @param payload
 * @returns
 */
export async function fetchCachedHeadNodeFunction(
	payload: IHeadNodePayload
): Promise<IHeadNodeResponse> {
	const cachedData = await fetchCache(payload)
	if (cachedData) return cachedData

	const data = await callHeadNodeFunction(payload, 3)
	return storeCache(payload, data)
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
	const payload = parsePayload(functionId, manifest, envVars)
	return await fetchCachedHeadNodeFunction(payload)
}

/**
 * Request invocation for a function via head node
 *
 * @param functionId
 * @param manifest
 * @param envVars
 */
export async function invokeHeadNodeFunction(
	functionId: string,
	manifest: IFunctionManifestRecord,
	envVars: INameValueArray
): Promise<IHeadNodeResponse> {
	const payload = parsePayload(functionId, manifest, envVars)
	return await callHeadNodeFunction(payload, 3)
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
	const pathObj = envVars.find((e) => e.name === 'BLS_REQUEST_PATH')
	return {
		function_id: functionId,
		method: manifest.entry,
		parameters: null,
		config: {
			permissions: [...manifest.permissions],
			env_vars: [...envVars],
			stdin: pathObj ? pathObj.value : '/',
			number_of_nodes: 1
		}
	}
}
