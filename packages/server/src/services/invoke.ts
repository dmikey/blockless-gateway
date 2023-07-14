import { IFunctionRecord, IFunctionRequestData } from '../interfaces/function'
import { Functions } from '../models/function'
import { fetchFunctionManifest, parseFunctionEnvVars, parseFunctionRequestData } from './function'
import { invokeCachedHeadNodeFunction } from './headNode'

/**
 *
 * @param invocationId
 */
export async function invokeViaId(invocationId: string, requestData: IFunctionRequestData) {
	const fn: IFunctionRecord = await Functions.findOne({ invocationId })
		.select('+envVars.value')
		.select('+envVars.iv')

	if (!fn) throw new Error('Function Not Found')
	if (!fn.functionId) throw new Error('Function not deployed')

	return invoke(fn, requestData)
}

/**
 *
 * @param domain
 */
export async function invokeViaHostname(domain: string, requestData: IFunctionRequestData) {
	const fn: IFunctionRecord = await Functions.findOne({ 'domainMappings.domain': domain })
		.select('+envVars.value')
		.select('+envVars.iv')

	if (!fn) throw new Error('Function Not Found')
	if (!fn.functionId) throw new Error('Function not deployed')

	return invoke(fn, requestData)
}

/**
 *
 * @param fn
 */
async function invoke(fn: IFunctionRecord, requestData: IFunctionRequestData) {
	// Fetch a function's manifest
	const manifest = await fetchFunctionManifest(fn.functionId)
	if (!manifest) throw new Error('Manifest not found')

	// Prepare payload
	const envVars = parseFunctionEnvVars(fn.envVars)
	const requestVars = parseFunctionRequestData(requestData)

	// Call head node
	const data = await invokeCachedHeadNodeFunction(fn.functionId, manifest, [
		...envVars,
		...requestVars
	])

	// Parse head node response
}
