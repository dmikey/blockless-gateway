import { FastifyInstance } from 'fastify'

import { REGEX_HOST_MATCH } from '../constants'
import {
	NodeGetRequest,
	NodeListRequest,
	NodeRegisterRequest,
	NodeSessionRequest
} from '../schema/node'
import gatewayClient from '../utils/gatewayClient'

export const register = (server: FastifyInstance, opts, next) => {
	server.addHook('onRequest', server.authenticate)

	server.get(
		'/',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeListRequest) => {
			const { userId } = request.user

			return gatewayClient.nodes.list(userId, request.query)
		}
	)

	server.get(
		'/:nodePubKey',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeGetRequest) => {
			const { userId } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.get(userId, nodePubKey)
		}
	)

	server.get(
		'/:nodePubKey/earnings',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeGetRequest) => {
			const { userId } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.getEarnings(userId, nodePubKey)
		}
	)

	server.post(
		'/:nodePubKey',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeRegisterRequest) => {
			const { userId } = request.user
			const { nodePubKey } = request.params
			const { ipAddress, hardwareId } = request.body
			return gatewayClient.nodes.register(userId, nodePubKey, {
				ipAddress,
				hardwareId
			})
		}
	)

	server.post(
		'/:nodePubKey/start-session',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeSessionRequest) => {
			const { userId } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.startSession(userId, nodePubKey)
		}
	)

	server.post(
		'/:nodePubKey/stop-session',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeSessionRequest) => {
			const { userId } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.endSession(userId, nodePubKey)
		}
	)

	server.post('/:nodePubKey/ping', async (request: NodeSessionRequest) => {
		const { userId } = request.user
		const { nodePubKey } = request.params

		return gatewayClient.nodes.pingSession(userId, nodePubKey)
	})

	next()
}
