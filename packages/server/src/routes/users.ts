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
			const { userId } = request.user
			return gatewayClient.user.getEarnings(userId, 'daily')
		}
	)

	server.get(
		'/referrals',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request) => {
			const { userId } = request.user
			return gatewayClient.user.getReferrals(userId)
		}
	)

	server.get(
		'/leaderboard',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request) => {
			const { userId } = request.user
			return gatewayClient.user.getLeaderboard(userId)
		}
	)

	server.get(
		'/overview',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request) => {
			const { userId } = request.user
			return gatewayClient.user.getOverview(userId)
		}
	)

	next()
}
