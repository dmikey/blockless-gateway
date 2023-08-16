import axios from 'axios'

import { HEAD_NODE_HOST } from '../constants'
import { BaseErrors } from '../errors'
import { INameValueArray } from '../interfaces/generic'
import { IHeadNodePayload, IHeadNodeResponse } from '../interfaces/headNode'
import { IFunctionManifestRecord } from '../models/function'
import { fetchCache, storeCache } from './headNodeCache'

/**
 * Request invocation for a function on the head node
 *
 * @param payload
 * @param retries the number of retries
 * @returns
 */
export async function callHeadNodeFunction(
	payload: IHeadNodePayload,
	retries = 0,
	headNodeHost: string = HEAD_NODE_HOST
): Promise<IHeadNodeResponse> {
	let i = 0

	while (i < retries) {
		try {
			const response = await axios.post(`${headNodeHost}/api/v1/functions/execute`, payload)

			if (response.data.code === '200' || response.data.code === 200) {
				return response.data
			}
		} catch {
			i++
		}
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
	count = 1,
	headNodeHost: string = HEAD_NODE_HOST
): Promise<IHeadNodeResponse> {
	const response = await axios.post(`${headNodeHost}/api/v1/functions/install?count=${count}`, {
		cid: functionId
	})

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
	payload: IHeadNodePayload,
	cb: () => Promise<IHeadNodeResponse>
): Promise<IHeadNodeResponse> {
	const cachedData = await fetchCache(payload)
	if (cachedData) return cachedData

	return storeCache(payload, await cb())
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
	envVars: INameValueArray,
	headNodeHost?: string
): Promise<IHeadNodeResponse> {
	const payload = parsePayload(functionId, manifest, envVars)
	return await fetchCachedHeadNodeFunction(payload, () =>
		callHeadNodeFunction(payload, 3, headNodeHost)
	)
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
	envVars: INameValueArray,
	headNodeHost?: string
): Promise<IHeadNodeResponse> {
	const payload = parsePayload(functionId, manifest, envVars)
	return await callHeadNodeFunction(payload, 3, headNodeHost)
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
	const stdin = envVars.find((e) => e.name === 'BLS_REQUEST_STDIN')
	return {
		function_id: functionId,
		method: manifest.entry,
		parameters: null,
		config: {
			permissions: [...manifest.permissions],
			env_vars: [...envVars],
			stdin: stdin ? stdin.value : '',
			number_of_nodes: 1
		}
	}
}
