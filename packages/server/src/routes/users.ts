import { FastifyInstance } from 'fastify'

import { REGEX_HOST_MATCH } from '../constants'
import gatewayClient from '../utils/gatewayClient'

export const register = (server: FastifyInstance, opts, next) => {
	server.addHook('onRequest', server.authenticate)

	server.get(
		'/earnings',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request) => {
			const { publicAddress } = request.user
			return gatewayClient.user.getNodeEarnings(publicAddress, 'daily')
		}
	)

	next()
}
