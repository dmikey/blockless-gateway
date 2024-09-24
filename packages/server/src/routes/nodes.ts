import { FastifyInstance } from 'fastify'

import { REGEX_HOST_MATCH } from '../constants'
import {
	NodeCreateRequest,
	NodeEndSessionRequest,
	NodeLinkRequest,
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
		'/:nodeId',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeCreateRequest) => {
			const { publicAddress } = request.user
			const { nodeId } = request.params
			return gatewayClient.nodes.get(publicAddress, nodeId)
		}
	)

	server.post(
		'/:nodeId/link',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeLinkRequest) => {
			const { publicAddress } = request.user
			const { nodeId } = request.params
			const { signature } = request.body
			return gatewayClient.nodes.link(publicAddress, nodeId, signature)
		}
	)

	server.post(
		'/register',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeRegisterRequest) => {
			return gatewayClient.nodes.register(request.body)
		}
	)

	server.post(
		'/:nodeId/sessions',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeStartSessionRequest) => {
			const { nodeId } = request.params
			const { signature } = request.body
			return gatewayClient.nodes.startSession(nodeId, signature)
		}
	)

	server.delete(
		'/:nodeId/sessions/:sessionId',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: NodeEndSessionRequest) => {
			const { nodeId, sessionId } = request.params
			const { signature } = request.body
			return gatewayClient.nodes.endSession(nodeId, sessionId, signature)
		}
	)
	next()
}
