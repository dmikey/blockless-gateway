import { FastifyInstance } from 'fastify'

import {
	createFunction,
	deleteFunction,
	deployFunction,
	getFunction,
	listFunctions,
	updateFunction,
	updateFunctionEnvVars
} from '@blocklessnetwork/gateway-core'

import { REGEX_HOST_MATCH } from '../constants'
import {
	FunctionCreateRequest,
	FunctionCreateSchema,
	FunctionDeleteRequest,
	FunctionDeleteSchema,
	FunctionDeployRequest,
	FunctionDeploySchema,
	FunctionFetchRequest,
	FunctionGetSchema,
	FunctionListRequest,
	FunctionUpdateEnvVarsRequest,
	FunctionUpdateEnvVarsSchema,
	FunctionUpdateRequest,
	FunctionUpdateSchema
} from '../schema/function'

export const register = (server: FastifyInstance, opts, next) => {
	const type = opts.type || 'function'

	// Require authentication for all routes
	server.addHook('onRequest', server.authenticate)

	server.get(
		'/',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: FunctionListRequest) => {
			const { publicAddress } = request.user
			return listFunctions(type, publicAddress, request.query)
		}
	)

	server.post(
		'/',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: FunctionCreateSchema
		},
		async (request: FunctionCreateRequest) => {
			const { publicAddress } = request.user
			const { functionName, functionId } = request.body

			return await createFunction(type, publicAddress, {
				functionName,
				functionId
			})
		}
	)

	server.get(
		'/:id',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: FunctionGetSchema
		},
		async (request: FunctionFetchRequest) => {
			const { id } = request.params
			const { publicAddress } = request.user

			return await getFunction(type, publicAddress, id)
		}
	)

	server.patch(
		'/:id',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: FunctionUpdateSchema
		},
		async (request: FunctionUpdateRequest) => {
			const { id } = request.params
			const { publicAddress } = request.user

			return await updateFunction(type, publicAddress, id, { ...request.body })
		}
	)

	server.patch(
		'/:id/env-vars',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: FunctionUpdateEnvVarsSchema
		},
		async (request: FunctionUpdateEnvVarsRequest) => {
			const { id } = request.params
			const { publicAddress } = request.user
			const { envVars } = request.body

			return await updateFunctionEnvVars(
				type,
				publicAddress,
				id,
				{ envVars },
				process.env.ENV_ENCRYPTION_SECRET!
			)
		}
	)

	server.delete(
		'/:id',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: FunctionDeleteSchema
		},
		async (request: FunctionDeleteRequest) => {
			const { id } = request.params
			const { publicAddress } = request.user

			return await deleteFunction('function', publicAddress, id)
		}
	)

	server.put(
		'/:id/deploy',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: FunctionDeploySchema
		},
		async (request: FunctionDeployRequest) => {
			const { id } = request.params
			const { publicAddress } = request.user
			const { functionId } = request.body

			return await deployFunction(
				type,
				publicAddress,
				id,
				{ functionId },
				{ headNodeHost: process.env.HEAD_NODE_HOST! }
			)
		}
	)

	next()
}
