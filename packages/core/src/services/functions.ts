import crypto from 'crypto'

import { BaseErrors } from '../errors'
import { Gateway } from '../gateway'
import { generateSubdomain, validateFunctionName } from '../helpers/functions'
import { KeyValueObject, Pagination, SecretManagementKVObject } from '../interfaces/generic'
import { IFunctionRecord } from '../models/function'
import Functions, { IFunctionModel } from '../models/function'
import { encryptValue } from '../utils/encryption'
import { get24HoursInterval } from '../utils/time'
import { fetchFunctionManifest } from './functionManifests'
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
): Promise<Pagination<IFunctionModel>> {
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

	return (functions && functions.length) > 0
		? functions[0]
		: {
				docs: [],
				totalDocs: 0,
				limit,
				totalPages: 0,
				page,
				pagingCounter: 0,
				hasPrevPage: false,
				hasNextPage: false,
				prevPage: null,
				nextPage: null
		  }
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
	id: string
): Promise<IFunctionModel> {
	const fn = await Functions.findOne({
		_id: id,
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
	const newFunction = new Functions({
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
	id: string,
	data: Partial<IFunctionRecord>
): Promise<IFunctionModel> {
	const updateObj = {} as Partial<IFunctionRecord>

	if (data.functionName) {
		// Validate function name
		const functionName = validateFunctionName(data.functionName!)

		// Match existing function
		const matchExistingName = await Functions.count({
			_id: { $ne: id },
			functionName,
			userId: { $regex: userId, $options: 'i' }
		})
		if (matchExistingName > 0) throw new BaseErrors.ERR_FUNCTION_NAME_EXISTS()

		// Set the updated function name
		updateObj.functionName = functionName
		updateObj.subdomain = generateSubdomain(functionName, userId)
	}

	// TODO: Validate function status here
	if (data.status) {
		updateObj.status = data.status
	}

	// Update deployment function ID, used by the CLI deployment command
	if (data.functionId) {
		updateObj.functionId = data.functionId
	}

	// Perform the update
	const fn = await Functions.findOneAndUpdate(
		{
			_id: id,
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
 * Update function envVar data
 *
 * @param type
 * @param userId
 * @param data
 * @returns
 */
export async function updateFunctionEnvVars(
	this: Gateway,
	type: 'function' | 'site',
	userId: string,
	id: string,
	data: { envVars: KeyValueObject }
) {
	const envVars = data.envVars
	if (!envVars) throw new BaseErrors.ERR_FUNCTION_ENVVARS_NOT_FOUND()

	const fn = await Functions.findOne({
		_id: id,
		userId: { $regex: userId, $options: 'i' },
		$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
	})
	if (!fn) throw new BaseErrors.ERR_FUNCTION_NOT_FOUND()

	// Format EnvVars
	if (envVars && typeof envVars === 'object' && Object.keys(envVars).length >= 1) {
		for (const key of Object.keys(envVars)) {
			const foundIndex = fn.envVars.findIndex((e) => e.name === key)

			if (envVars[key] === null) {
				if (foundIndex !== -1) {
					fn.envVars.splice(foundIndex, 1)
				}
			} else if (envVars[key]) {
				if (this._encryptionKey) {
					const { value, iv } = encryptValue(envVars[key]!, this._encryptionKey)

					if (foundIndex !== -1) {
						fn.envVars[foundIndex].name = key
						fn.envVars[foundIndex].value = value
						fn.envVars[foundIndex].iv = iv
					} else {
						fn.envVars.push({ name: key, value, iv })
					}
				} else {
					if (foundIndex !== -1) {
						fn.envVars[foundIndex].name = key
						fn.envVars[foundIndex].value = envVars[key]!
					} else {
						fn.envVars.push({ name: key, value: envVars[key]! })
					}
				}
			}
		}
	}

	// Perform the update
	await fn.save()

	const updatedFn = await Functions.findById(fn._id)
	if (!updatedFn) throw new BaseErrors.ERR_FUNCTION_UPDATE_FAILED()

	return updatedFn
}

/**
 * Update function secret data
 */
export async function updateFunctionSecrets(
	this: Gateway,
	type: 'function' | 'site',
	userId: string,
	id: string,
	data: { secrets: SecretManagementKVObject }
) {
	const secrets = data.secrets
	if (!secrets) throw new BaseErrors.ERR_FUNCTION_SECRETS_NOT_FOUND()

	// @TODO: Standardize secrets config
	if (!secrets.hashicorp) throw new BaseErrors.ERR_FUNCTION_SECRETS_NOT_FOUND()

	const fn = await Functions.findOne({
		_id: id,
		userId: { $regex: userId, $options: 'i' },
		$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
	})
	if (!fn) throw new BaseErrors.ERR_FUNCTION_NOT_FOUND()

	// Format Secrets
	// @TODO: Standardize secrets config
	if (secrets.hashicorp.clientId && secrets.hashicorp.clientSecret && this._encryptionKey) {
		const { value, iv } = encryptValue(secrets.hashicorp.clientSecret, this._encryptionKey)

		secrets.hashicorp.clientSecret = value
		secrets.hashicorp.iv = iv
		fn.secretManagement = {
			hashicorp: {
				clientId: secrets.hashicorp.clientId,
				clientSecret: value,
				iv
			}
		}
	}

	// Perform the update
	await fn.save()

	const updatedFn = await Functions.findById(fn._id)
	if (!updatedFn) throw new BaseErrors.ERR_FUNCTION_UPDATE_FAILED()

	return updatedFn
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
	id: string
): Promise<void> {
	const fn = await Functions.findOneAndDelete({
		_id: id,
		userId: { $regex: userId, $options: 'i' },
		$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
	})
	if (!fn) throw new BaseErrors.ERR_FUNCTION_DELETE_FAILED()
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
	this: Gateway,
	type: 'function' | 'site',
	userId: string,
	id: string,
	data: { functionId: string }
): Promise<IFunctionModel> {
	// Request a deployment for the function
	await installHeadNodeFunction(data.functionId, 1, this._headNodeUri)

	// Cache Manifest
	await fetchFunctionManifest(data.functionId)

	// Update deploy status
	const fn = await Functions.findOneAndUpdate(
		{
			_id: id,
			userId: { $regex: userId, $options: 'i' },
			$or: type === 'site' ? [{ type: 'site' }] : [{ type: 'function' }, { type: null }]
		},
		{ status: 'deployed' },
		{ new: true }
	)
	if (!fn) throw new BaseErrors.ERR_FUNCTION_DEPLOY_FAILED()

	return fn
}
