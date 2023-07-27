import { BaseErrors } from '../constants/errors'
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
	type: 'subdomain' | 'domain' | 'invocationId',
	value: string,
	requestData: IFunctionRequestData
) {
	let filter: object | null = null

	switch (type) {
		case 'subdomain':
			const subdomainValue = value.replace(`.${process.env.SERVER_DOMAIN!}`, '')
			filter = { $or: [{ subdomain: subdomainValue }, { 'domainMappings.domain': value }] }
			break
		case 'domain':
			filter = { 'domainMappings.domain': value }
			break
		case 'invocationId':
			filter = { invocationId: value }
			break
	}

	if (!filter) throw new BaseErrors.ERR_FUNCTION_NOT_FOUND()

	const result = await Functions.aggregate([
		{ $match: filter },
		{
			$lookup: {
				from: 'functionmanifests',
				localField: 'functionId',
				foreignField: 'functionId',
				as: 'manifests'
			}
		},
		{ $unwind: { path: '$manifests', preserveNullAndEmptyArrays: true } },
		{
			$project: {
				_id: 1,
				functionId: 1,
				type: 1,
				envVars: 1,
				manifest: '$manifests.manifest'
			}
		},
		{
			$limit: 1
		}
	])

	const fn = result.length > 0 ? result[0] : null

	if (!fn) throw new BaseErrors.ERR_FUNCTION_NOT_FOUND()
	if (!fn.functionId) throw new BaseErrors.ERR_FUNCTION_NOT_DEPLOYED()

	return invoke(fn, requestData)
}

/**
 * Invoke a function
 *
 * @param fn
 */
async function invoke(fn: IFunctionRecord, requestData: IFunctionRequestData) {
	// Fetch function's manifest file
	let manifest = fn.manifest

	if (!manifest) {
		const cachedManifest = await fetchFunctionManifest(fn.functionId)
		if (!cachedManifest) throw new BaseErrors.ERR_FUNCTION_MANIFEST_NOT_FOUND()

		manifest = cachedManifest
	}

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
