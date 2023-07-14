import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { lookupAndInvokeFunction } from '../services/invoke'
import { parseFunctionRequestData } from '../services/function'

/**
 *
 * @param request
 * @param reply
 * @returns
 */
async function invokeHostnameAPI(request: FastifyRequest, reply: FastifyReply) {
	const domain = request.hostname

	const requestData = parseFunctionRequestData(request)
	const response = await lookupAndInvokeFunction('domain', domain, requestData)

	reply.status(response.status).headers(response.headers).type(response.type).send(response.body)
}

/**
 * Invoke the
 *
 * @param request
 * @param reply
 * @returns
 */
async function invokePathAPI(request: FastifyRequest, reply: FastifyReply) {
	const { id } = request.params as any
	const { path } = request.body as any

	const response = await lookupAndInvokeFunction('invocationId', id, {
		path
	})

	reply.status(response.status).headers(response.headers).type(response.type).send(response.body)
}

/**
 *
 * @param server
 * @param _
 * @param next
 */
export const register = (server: FastifyInstance, opts: FastifyPluginOptions, next) => {
	server.route({
		method: ['GET', 'POST'],
		url: '/',
		constraints: { host: new RegExp(`.*\\.${process.env.SERVER_DOMAIN}$`) },
		handler: invokeHostnameAPI
	})

	server.route({
		method: ['GET', 'POST'],
		url: '/*',
		constraints: { host: new RegExp(`.*\\.${process.env.SERVER_DOMAIN}$`) },
		handler: invokeHostnameAPI
	})

	server.post('/invoke/:id', invokePathAPI)

	next()
}
