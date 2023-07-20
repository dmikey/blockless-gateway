import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { lookupAndInvokeFunction } from '../services/invoke'
import { parseFunctionRequestData } from '../services/function'
import { REGEX_HOST_NOT_MATCH } from '../constants/regex'

/**
 * Invoke a function for a hostname, directly via a fastify request
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
 * Invoke a function with a given invocation id and request as payload
 *
 * @param request
 * @param reply
 * @returns
 */
async function invokePathAPI(request: FastifyRequest, reply: FastifyReply) {
	const { id } = request.params as any
	const { path } = request.body as any

	const response = await lookupAndInvokeFunction('invocationId', id, { path })
	reply.status(response.status).headers(response.headers).type(response.type).send(response.body)
}

export const register = (server: FastifyInstance, opts: FastifyPluginOptions, next) => {
	server.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/',
		constraints: {
			host: REGEX_HOST_NOT_MATCH
		},
		handler: invokeHostnameAPI
	})

	server.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/*',
		constraints: {
			host: REGEX_HOST_NOT_MATCH
		},
		handler: invokeHostnameAPI
	})

	server.post('/invoke/:id', invokePathAPI)

	next()
}
