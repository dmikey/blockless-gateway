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
			return gatewayClient.user.getEarnings(publicAddress, 'daily')
		}
	)

	server.get(
		'/referrals',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request) => {
			const { publicAddress } = request.user
			return gatewayClient.user.getReferrals(publicAddress)
		}
	)

	server.get(
		'/leaderboard',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request) => {
			const { publicAddress } = request.user
			return gatewayClient.user.getLeaderboard(publicAddress)
		}
	)

	server.get(
		'/overview',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request) => {
			const { publicAddress } = request.user
			return gatewayClient.user.getOverview(publicAddress)
		}
	)

	next()
}
