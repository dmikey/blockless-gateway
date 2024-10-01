import { FastifyInstance } from 'fastify'

import { REGEX_HOST_MATCH } from '../constants'
import {
	NodeEndSessionRequest,
	NodeGetRequest,
	NodeLinkRequest,
	NodeListRequest,
	NodePublicRequest,
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
		'/:nodePubKey/link',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeLinkRequest) => {
			const { publicAddress } = request.user
			const { nodePubKey } = request.params
			const { signature } = request.body

			return gatewayClient.nodes.link(publicAddress, nodePubKey, signature)
		}
	)

	next()
}

export const registerPublicNodes = (server: FastifyInstance, opts, next) => {
	server.post(
		'/:nodePubKey',
		{
			constraints: { host: REGEX_HOST_MATCH },
			onRequest: [server.authenticateNode]
		},
		async (request: NodeRegisterRequest) => {
			const { nodePubKey } = request.params
			return gatewayClient.publicNodes.register(nodePubKey, {})
		}
	)

	server.get(
		'/:nodePubKey',
		{
			constraints: { host: REGEX_HOST_MATCH },
			onRequest: [server.authenticateNode]
		},
		async (request: NodePublicRequest) => {
			const { nodePubKey } = request.params
			return gatewayClient.publicNodes.get(nodePubKey)
		}
	)

	server.post(
		'/:nodePubKey/start-session',
		{
			constraints: { host: REGEX_HOST_MATCH },
			onRequest: [server.authenticateNode]
		},
		async (request: NodeStartSessionRequest) => {
			const { nodePubKey } = request.params
			return gatewayClient.publicNodes.startSession(nodePubKey)
		}
	)

	server.post(
		'/:nodePubKey/stop-session',
		{
			constraints: { host: REGEX_HOST_MATCH },
			onRequest: [server.authenticateNode]
		},
		async (request: NodeEndSessionRequest) => {
			const { nodePubKey } = request.params
			return gatewayClient.publicNodes.endSession(nodePubKey)
		}
	)

	server.get(
		'/:nodePubKey/auth-nonce',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodePublicRequest) => {
			const { nodePubKey } = request.params

			const nonce = await gatewayClient.publicNodes.getNonce(process.env.JWT_SECRET!, nodePubKey)

			return { nonce }
		}
	)

	next()
}
