import { FastifyInstance } from 'fastify'
import {
	createFunction,
	deleteFunction,
	deployFunction,
	getFunction,
	listFunctions,
	updateFunction
} from '@blocklessnetwork/gateway-core'
import {
	FunctionCreateRequest,
	FunctionCreateSchema,
	FunctionListRequest,
	FunctionUpdateRequest,
	FunctionFetchRequest,
	FunctionDeleteRequest,
	FunctionDeployRequest,
	FunctionUpdateEnvVarsRequest,
	FunctionGetSchema,
	FunctionUpdateSchema,
	FunctionUpdateEnvVarsSchema,
	FunctionDeleteSchema,
	FunctionDeploySchema
} from '../schema/function'
import { REGEX_HOST_MATCH } from '../constants'

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

			return await getFunction(type, publicAddress, { _id: id })
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

			return await updateFunction(type, publicAddress, { _id: id, ...request.body })
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

			return await updateFunction(type, publicAddress, { _id: id, envVars })
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

			return await deleteFunction('function', publicAddress, { _id: id })
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

			return await deployFunction(type, publicAddress, { _id: id, cid: functionId })
		}
	)

	next()
}
