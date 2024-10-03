import { FastifyInstance } from 'fastify'

import { REGEX_HOST_MATCH } from '../constants'
import {
	NodeEndSessionRequest,
	NodeGetRequest,
	NodeListRequest,
	NodeRegisterRequest,
	NodeStartSessionRequest
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

	server.post(
		'/:nodePubKey',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeRegisterRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.register(publicAddress, nodePubKey, {})
		}
	)

	server.post(
		'/:nodePubKey/start-session',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeStartSessionRequest) => {
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
		async (request: NodeEndSessionRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			return gatewayClient.nodes.endSession(publicAddress, nodePubKey)
		}
	)

	next()
}
