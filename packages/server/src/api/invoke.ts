import { FastifyInstance } from 'fastify'

/**
 *
 * @param request
 * @param reply
 * @returns
 */
async function invokePathAPI() {
	return 'Invoke Path API'
}

/**
 *
 * @param request
 * @param reply
 * @returns
 */
async function invokeHostnameAPI() {
	return 'Invoke Subdomain'
}

/**
 *
 * @param server
 * @param _
 * @param next
 */
export const register = (server: FastifyInstance, _, next) => {
	server.get('/invoke/:path', invokePathAPI)
	server.route({
		method: 'GET',
		url: '/',
		constraints: { host: /.*\.bls\.local/ },
		handler: invokeHostnameAPI
	})

	next()
}
