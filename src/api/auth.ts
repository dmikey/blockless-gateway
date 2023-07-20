import { FastifyInstance, FastifyReply } from 'fastify'
import { REGEX_HOST_MATCH } from '../constants/regex'

/**
 * API Route to login
 *
 * @param request
 * @param reply
 * @returns
 */
async function authLoginAPI() {
	return 'Redirect / Serve login route'
}

/**
 * API Route to create a new challenge
 *
 * @param request
 * @param reply
 * @returns
 */
async function authChallengeAPI() {
	return 'Create challenge for a new or existing wallet'
}

/**
 *
 * @param request
 * @param reply
 * @returns
 */
async function authSignAPI() {
	return 'Sign a new or existing wallet'
}

/**
 *
 * @param request
 * @param reply
 * @returns
 */
async function authVerifyAPI(request, reply: FastifyReply) {
	return 'Verify'
}

/**
 * Register all fastify routes for Authentication
 *
 * @param server
 * @param _
 * @param next
 */
export const register = (server: FastifyInstance, _, next) => {
	server.get('/login', { constraints: { host: REGEX_HOST_MATCH } }, authLoginAPI)
	server.post('/nonce', { constraints: { host: REGEX_HOST_MATCH } }, authChallengeAPI)
	server.post('/challenge', { constraints: { host: REGEX_HOST_MATCH } }, authChallengeAPI)
	server.post('/sign', { constraints: { host: REGEX_HOST_MATCH } }, authSignAPI)
	server.get('/verify', { constraints: { host: REGEX_HOST_MATCH } }, authVerifyAPI)

	next()
}
