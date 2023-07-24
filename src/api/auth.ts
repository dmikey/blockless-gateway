import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { REGEX_HOST_MATCH } from '../constants/regex'
import { generateUserChallenge, getUserWallet } from '../services/auth'
import { AuthChallengePostRequest, UserWalletRequestSchema } from '../interfaces/auth'

/**
 * API Route to login
 *
 * @todo allow extending the target login route
 *
 * @param request
 * @param reply
 * @returns
 */
async function authLoginAPI(_, reply: FastifyReply) {
	return reply.redirect('/login')
}

/**
 * API Route to create a new challenge
 *
 * @param request
 * @param reply
 * @returns
 */
async function authChallengeAPI(request: AuthChallengePostRequest) {
	const userWallet = await getUserWallet(request.body)
	const nonce = await generateUserChallenge(userWallet)

	return { nonce }
}

/**
 *
 * @param request
 * @param reply
 * @returns
 */
async function authSignAPI(request: FastifyRequest, reply: FastifyReply) {
	const token = (this as FastifyInstance).jwt.sign(
		{ publicAddress: '', walletType: '' },
		{ expiresIn: '24h' }
	)
	// const token = request.jwt.sign({ publicAddress, walletType }, { expiresIn: '24h' })

	return { token }
}

/**
 *
 * @param request
 * @param reply
 * @returns
 */
async function authVerifyAPI(request: FastifyRequest, reply: FastifyReply) {
	try {
		await request.jwtVerify()
		reply.status(200)
	} catch (err) {
		reply.status(401)
	}
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

	server.post(
		'/nonce',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: { body: UserWalletRequestSchema }
		},
		authChallengeAPI
	)

	server.post(
		'/challenge',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: { body: UserWalletRequestSchema }
		},
		authChallengeAPI.bind(server)
	)

	server.post('/sign', { constraints: { host: REGEX_HOST_MATCH } }, authSignAPI)
	server.get('/verify', { constraints: { host: REGEX_HOST_MATCH } }, authVerifyAPI)

	next()
}
