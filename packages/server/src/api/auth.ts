import { FastifyInstance } from 'fastify'

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
async function authVerifyAPI() {
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
	server.get('/login', authLoginAPI)
	server.post('/nonce', authChallengeAPI)
	server.post('/challenge', authChallengeAPI)
	server.post('/sign', authSignAPI)
	server.get('/verify', authVerifyAPI)

	next()
}
