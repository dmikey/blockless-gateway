import { BaseError, BaseErrors } from '../errors'
import { Gateway } from '../gateway'
import {
	parseFunctionEnvVars,
	parseFunctionRequestVars,
	parseFunctionResponse
} from '../helpers/functions'
import { FunctionType, IFunctionRecord, IFunctionRequestData } from '../models/function'
import Functions from '../models/function'
import { fetchFunctionManifest } from './functionManifests'
import { addFunctionError, addFunctionRequest } from './functionMetrics'
import { invokeCachedHeadNodeFunction, invokeHeadNodeFunction } from './headNode'

/**
 * Find and invoke a function
 *
 * @param domain
 */
export async function lookupAndInvokeFunction(
	this: Gateway,
	type: 'subdomain' | 'domain' | 'invocationId' | 'functionId',
	value: string,
	requestData: IFunctionRequestData
) {
	let filter: object | null = null

	switch (type) {
		case 'subdomain':
			filter = { $or: [{ subdomain: value.split('.')[0] }, { 'domainMappings.domain': value }] }
			break
		case 'domain':
			filter = { 'domainMappings.domain': value }
			break
		case 'invocationId':
			filter = { invocationId: value }
			break
		case 'functionId':
			filter = { functionId: value }
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

	try {
		addFunctionRequest(fn._id)

		return invoke(fn, requestData, {
			encryptionKey: this._encryptionKey,
			headNodeHost: this._headNodeUri
		})
	} catch (error: unknown) {
		const functionError = error as BaseError
		addFunctionError(fn._id, functionError.statusCode?.toString() || '400', functionError.message)

		throw error
	}
}

/**
 * Invoke a function
 *
 * @param fn
 */
async function invoke(
	fn: IFunctionRecord,
	requestData: IFunctionRequestData,
	options?: { encryptionKey?: string; headNodeHost?: string }
) {
	// Fetch function's manifest file
	let manifest = fn.manifest

	if (!manifest) {
		const cachedManifest = await fetchFunctionManifest(fn.functionId)
		if (!cachedManifest) throw new BaseErrors.ERR_FUNCTION_MANIFEST_NOT_FOUND()

		manifest = cachedManifest
	}

	// Prepare request data and environment variables
	const envVars = parseFunctionEnvVars(fn.envVars, options?.encryptionKey)
	const requestVars = parseFunctionRequestVars(requestData)
	const callFn =
		fn.type === FunctionType.SITE ? invokeCachedHeadNodeFunction : invokeHeadNodeFunction

	// Call the cached or uncached function on the head node
	const data = await callFn(
		fn.functionId,
		manifest!,
		[...envVars, ...requestVars],
		options?.headNodeHost
	)

	// Parse head node response
	return parseFunctionResponse(data)
}
