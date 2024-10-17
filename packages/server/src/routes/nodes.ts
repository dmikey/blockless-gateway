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
			const { publicAddress } = request.user
			return gatewayClient.nodes.list(publicAddress, request.query)
		}
	)

	server.get(
		'/:nodePubKey',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeGetRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.get(publicAddress, nodePubKey)
		}
	)

	server.get(
		'/:nodePubKey/earnings',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeGetRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.getEarnings(publicAddress, nodePubKey)
		}
	)

	server.post(
		'/:nodePubKey',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeRegisterRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			const { ipAddress } = request.body
			return gatewayClient.nodes.register(publicAddress, nodePubKey, { ipAddress })
		}
	)

	server.post(
		'/:nodePubKey/start-session',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeSessionRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.startSession(publicAddress, nodePubKey)
		}
	)

	server.post(
		'/:nodePubKey/stop-session',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeSessionRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.endSession(publicAddress, nodePubKey)
		}
	)

	server.post('/:nodePubKey/ping', async (request: NodeSessionRequest) => {
		const { publicAddress } = request.user
		const { nodePubKey } = request.params
		return gatewayClient.nodes.pingSession(publicAddress, nodePubKey)
	})

	next()
}
