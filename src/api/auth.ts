import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { REGEX_HOST_MATCH } from '../constants/regex'
import {
	generateUserChallenge,
	getUserWallet,
	getUserWalletByType,
	verifyUserWalletSignature
} from '../services/auth'
import {
	AuthChallengePostRequest,
	AuthSignPostRequest,
	AuthSignPostSchema,
	UserWalletRequestSchema
} from '../interfaces/auth'
import { BaseErrors } from '../constants/errors'

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
 * API route to verify user signature with a pre-defined nonce
 *
 * @param request
 * @param reply
 * @returns
 */
async function authSignAPI(request: AuthSignPostRequest) {
	const { walletType, signature, publicAddress, publicKey } = request.body
	const userWallet = await getUserWalletByType(walletType, publicAddress)

	// Signature check
	const isSignatureValid = await verifyUserWalletSignature({
		userWallet,
		signature,
		publicKey
	})

	if (!isSignatureValid) throw new BaseErrors.ERR_USER_SIGNATURE_MISMATCH()

	// Generate a JWT if signature is valid
	const token = (this as FastifyInstance).jwt.sign(
		{ publicAddress, walletType },
		{ expiresIn: '24h' }
	)

	return { token }
}

/**
 * API route to check whether an issued JWT token is valid
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
		authChallengeAPI
	)

	server.post(
		'/sign',
		{
			constraints: { host: REGEX_HOST_MATCH },
			schema: { body: AuthSignPostSchema }
		},
		authSignAPI
	)

	server.get('/verify', { constraints: { host: REGEX_HOST_MATCH } }, authVerifyAPI)

	next()
}
