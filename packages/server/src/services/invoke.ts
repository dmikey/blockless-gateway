import { FunctionType } from '../constants/enum'
import { IFunctionRecord, IFunctionRequestData } from '../interfaces/function'
import { Functions } from '../models/function'
import {
	fetchFunctionManifest,
	parseFunctionEnvVars,
	parseFunctionRequestVars,
	parseFunctionResponse
} from './function'
import { invokeCachedHeadNodeFunction, invokeHeadNodeFunction } from './headNode'

/**
 * Find and invoke a function
 *
 * @param domain
 */
export async function lookupAndInvokeFunction(
	type: 'domain' | 'invocationId',
	value: string,
	requestData: IFunctionRequestData
) {
	let filter: object | null = null

	switch (type) {
		case 'domain':
			filter = { 'domainMappings.domain': value }
			break
		case 'invocationId':
			filter = { invocationId: value }
			break
	}

	if (!filter) throw new Error('Function not found')

	const fn: IFunctionRecord = await Functions.findOne(filter)
		.select('+envVars.value')
		.select('+envVars.iv')

	if (!fn) throw new Error('Function Not Found')
	if (!fn.functionId) throw new Error('Function not deployed')

	return invoke(fn, requestData)
}

/**
 * Invoke a function
 *
 * @param fn
 */
async function invoke(fn: IFunctionRecord, requestData: IFunctionRequestData) {
	// Fetch function's manifest file
	const manifest = await fetchFunctionManifest(fn.functionId)
	if (!manifest) throw new Error('Manifest not found')

	// Prepare request data and environment variables
	const envVars = parseFunctionEnvVars(fn.envVars)
	const requestVars = parseFunctionRequestVars(requestData)
	const callFn =
		fn.type === FunctionType.SITE ? invokeCachedHeadNodeFunction : invokeHeadNodeFunction

	// Call the cached or uncached function on the head node
	const data = await callFn(fn.functionId, manifest, [...envVars, ...requestVars])

	// Parse head node response
	return parseFunctionResponse(data)
}
