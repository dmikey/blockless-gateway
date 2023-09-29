import { FastifyInstance } from 'fastify'

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
	FunctionUpdateSchema,
	FunctionUpdateSecretsRequest,
	FunctionUpdateSecretsSchema
} from '../schema/function'
import gatewayClient from '../utils/gatewayClient'

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
			return gatewayClient.functions.list(type, publicAddress, request.query)
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

			return await gatewayClient.functions.create(type, publicAddress, {
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

			return await gatewayClient.functions.get(type, publicAddress, id)
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

			return await gatewayClient.functions.update(type, publicAddress, id, { ...request.body })
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

			return await gatewayClient.functions.updateEnvVars(type, publicAddress, id, { envVars })
		}
	)

	server.patch(
		'/:id/sercrets',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: FunctionUpdateSecretsSchema
		},
		async (request: FunctionUpdateSecretsRequest) => {
			const { id } = request.params
			const { publicAddress } = request.user
			const { secrets, secretManagement } = request.body

			return await gatewayClient.functions.updateSecrets(type, publicAddress, id, {
				secrets: secrets || secretManagement
			})
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

			return await gatewayClient.functions.delete(type, publicAddress, id)
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

			return await gatewayClient.functions.deploy(type, publicAddress, id, { functionId })
		}
	)

	next()
}
