import axios from 'axios'
import crypto from 'crypto'
import { FastifyRequest } from 'fastify'
import { FunctionManifest } from '../models/functionManifest'
import {
	IFunctionEnvVarRecord,
	IFunctionManifestRecord,
	IFunctionRecord,
	IFunctionRequestData
} from '../interfaces/function'
import { INameValueArray } from '../interfaces/generic'
import { decryptValue } from '../utils/encryption'
import { IHeadNodeResponse } from '../interfaces/headNode'
import { BaseErrors } from '../constants/errors'
import { Functions, IFunctionModel } from '../models/function'
import { generateCRC32Checksum } from '../utils/checksum'
import { normalize } from '../utils/strings'
import { get24HoursInterval } from '../utils/time'
import { installHeadNodeFunction } from './headNode'

/**
 * List all functions
 *
 * @param type
 * @param userId
 * @param data
 * @returns
 */
export async function listFunctions(
	type: 'function' | 'site',
	userId: string,
	data: { page?: number; limit?: number }
): Promise<IFunctionModel[]> {
	const { startTime, endTime } = get24HoursInterval()

	const page = data.page ? data.page : 1
	const limit = data.limit ? data.limit : 10

	let typeLookup = [{ type: 'function' }, { type: null }]

	switch (type) {
		case 'site':
			typeLookup = [{ type: 'site' }]
			break
	}

	const functions = await Functions.aggregate([
		{ $match: { userId: { $regex: userId, $options: 'i' }, $or: typeLookup } },
		{
			$lookup: {
				from: 'functionrequests',
				let: { functionId: '$_id' },
				pipeline: [
					{
						$match: {
							$and: [
								{ $expr: { $eq: ['$metadata.functionId', '$$functionId'] } },
								{
									timestamp: {
										$gt: startTime,
										$lt: endTime
									}
								}
							]
						}
					},
					{
						$project: {
							timestampAt: {
								$dateTrunc: {
									date: '$timestamp',
									unit: 'hour'
								}
							}
						}
					},
					{
						$group: {
							_id: '$timestampAt',
							count: { $sum: 1 }
						}
					},
					{
						$densify: {
							field: '_id',
							range: {
								step: 1,
								unit: 'hour',
								bounds: [startTime, endTime]
							}
						}
					},
					{
						$sort: { _id: -1 }
					}
				],
				as: 'requests'
			}
		},
		{ $sort: { updatedAt: -1 } },
		{
			$project: {
				_id: 1,
				userId: 1,
				functionId: 1,
				functionName: 1,
				type: 1,
				status: 1,
				createdAt: 1,
				updatedAt: 1,
				requests: 1,
				subdomain: 1,
				domainMappings: 1
			}
		},
		// Pagination
		{
			$facet: {
				metadata: [{ $count: 'totalDocs' }],
				docs: [{ $skip: (page - 1) * limit }, { $limit: limit }]
			}
		},
		{ $unwind: '$metadata' },
		{
			$project: {
				docs: '$docs',
				totalDocs: '$metadata.totalDocs',
				limit: limit,
				totalPages: { $ceil: { $divide: ['$metadata.totalDocs', limit] } },
				page: page,
				pagingCounter: (page - 1) * limit + 1,
				hasPrevPage: { $cond: { if: { $eq: [page, 1] }, then: false, else: true } },
				hasNextPage: {
					$cond: {
						if: { $lt: [page * limit, '$metadata.totalDocs'] },
						then: true,
						else: false
					}
				},
				prevPage: { $cond: { if: { $eq: [page, 1] }, then: null, else: page - 1 } },
				nextPage: {
					$cond: {
						if: { $lt: [page * limit, '$metadata.totalDocs'] },
						then: page + 1,
						else: null
					}
				}
			}
		}
	])

	return (functions && functions.length) > 0 ? functions[0] : []
}

/**
 * Get a function by its id
 *
 * @param type
 * @param userId
 * @param data
 * @returns
 */
export async function getFunction(
	type: 'function' | 'site',
	userId: string,
	data: { _id: string }
): Promise<IFunctionModel> {
	const fn = await Functions.findOne({
		_id: data._id,
		userId: { $regex: userId, $options: 'i' },
		$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
	})
	if (!fn) throw new BaseErrors.ERR_FUNCTION_NOT_FOUND()

	return fn
}

/**
 * Create a new function
 *
 * @param type
 * @param userId
 * @param data
 * @returns
 */
export async function createFunction(
	type: 'function' | 'site',
	userId: string,
	data: { functionName: string; functionId: string }
): Promise<IFunctionModel> {
	// Validate function name
	const functionName = validateFunctionName(data.functionName)

	// Match existing function name
	const matchExistingName = await Functions.count({
		functionName,
		userId: { $regex: userId, $options: 'i' }
	})
	if (matchExistingName > 0) throw new BaseErrors.ERR_FUNCTION_NAME_EXISTS()

	// Generate a subdomain for the function
	const subdomain = generateSubdomain(functionName, userId)

	// Build a new function object
	let newFunction = new Functions({
		userId,
		type,
		functionName,
		functionId: data.functionId,
		status: 'deploying',
		invocationId: crypto.randomUUID(),
		subdomain
	})

	// Save function
	return await newFunction.save()
}

/**
 * Update function data
 *
 * @param type
 * @param data
 */
export async function updateFunction(
	type: 'function' | 'site',
	userId: string,
	data: Partial<IFunctionRecord>
): Promise<IFunctionModel> {
	const updateObj = {} as Partial<IFunctionRecord>

	if (!!data.functionName) {
		// Validate function name
		const functionName = validateFunctionName(data.functionName!)

		// Match existing function
		const matchExistingName = await Functions.count({
			_id: { $ne: data._id },
			functionName,
			userId: { $regex: userId, $options: 'i' }
		})
		if (matchExistingName > 0) throw new BaseErrors.ERR_FUNCTION_NAME_EXISTS()

		// Set the updated function name
		updateObj.functionName = functionName
		updateObj.subdomain = generateSubdomain(functionName, userId)
	}

	// TODO: Validate function status here
	if (!!data.status) {
		updateObj.status = data.status
	}

	// Update deployment function ID, used by the CLI deployment command
	if (!!data.functionId) {
		updateObj.functionId = data.functionId
	}

	// Perform the update
	const fn = await Functions.findOneAndUpdate(
		{
			_id: data._id,
			userId: { $regex: userId, $options: 'i' },
			$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
		},
		updateObj,
		{ new: true }
	)
	if (!fn) throw new BaseErrors.ERR_FUNCTION_UPDATE_FAILED()

	return fn
}

/**
 * Delete a function by its id
 *
 * @param type
 * @param userId
 * @param data
 * @returns
 */
export async function deleteFunction(
	type: 'function' | 'site',
	userId: string,
	data: { _id: string }
): Promise<IFunctionModel> {
	const fn = await Functions.findOneAndDelete({
		_id: data._id,
		userId: { $regex: userId, $options: 'i' },
		$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
	})
	if (!fn) throw new BaseErrors.ERR_FUNCTION_DELETE_FAILED()

	return fn
}

/**
 * Deploy a function by requesting a function install on head node,
 * and updating the status when successful
 *
 * @param type
 * @param data
 * @returns
 */
export async function deployFunction(
	type: 'function' | 'site',
	userId: string,
	data: { _id: string; cid: string }
): Promise<IFunctionModel> {
	// Request a deployment for the function
	await installHeadNodeFunction(data.cid)

	// Cache Manifest
	await fetchFunctionManifest(data.cid)

	// Update deploy status
	const fn = await Functions.findOneAndUpdate(
		{
			_id: data._id,
			userId: { $regex: userId, $options: 'i' },
			$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
		},
		{ status: 'deployed' },
		{ new: true }
	)
	if (!fn) throw new BaseErrors.ERR_FUNCTION_DEPLOY_FAILED()

	return fn
}

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

/**
 * Generate a predictable user hash for a function
 *
 * @param zone
 * @param functionName
 * @param userAddress
 * @returns generated subdomain url as a string
 */
export function generateSubdomain(functionName: string, userAddress: string) {
	const userHash = (generateCRC32Checksum(('bls-' + userAddress) as string) >>> 0).toString(16)
	return `${functionName}-${userHash}`
}

/**
 * A utility function to validate function name,
 * and return with the normalized name
 *
 * @param name
 * @returns normalized name after validation
 */
function validateFunctionName(name: string): string {
	const functionName = normalize(name)
	const matchFormat = /^(?!-)[a-z0-9-]{3,32}(?<!-)$/.test(functionName)

	if (!matchFormat)
		throw new Error('Names must be between 3 and 32 characters, only contain a-z, 0-9 and -')

	return functionName
}
