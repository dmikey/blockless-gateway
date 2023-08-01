import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'

import { IFunctionRequestData, lookupAndInvokeFunction } from '@blocklessnetwork/gateway-core'

import { REGEX_HOST_MATCH, REGEX_HOST_NOT_MATCH } from '../constants'

/**
 * Invoke a function for a hostname, directly via a fastify request
 *
 * @param request
 * @param reply
 * @returns
 */
async function invokeHostnameAPI(request: FastifyRequest, reply: FastifyReply) {
	const domain = request.hostname
	const requestData = {
		host: request.hostname,
		path: decodeURIComponent(request.url.split('?')[0]),
		method: request.method,
		params: request.params as IFunctionRequestData['params'],
		query: request.query as IFunctionRequestData['query'],
		headers: request.headers as IFunctionRequestData['headers'],
		body: request.body as unknown
	}

	const response = await lookupAndInvokeFunction('subdomain', domain, requestData, {
		encryptionKey: process.env.ENV_ENCRYPTION_SECRET!,
		headNodeHost: process.env.HEAD_NODE_HOST!
	})

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
	const requestData = { path }

	const response = await lookupAndInvokeFunction('invocationId', id, requestData, {
		encryptionKey: process.env.ENV_ENCRYPTION_SECRET!,
		headNodeHost: process.env.HEAD_NODE_HOST!
	})

	reply.status(response.status).headers(response.headers).type(response.type).send(response.body)
}

export const register = (server: FastifyInstance, opts: FastifyPluginOptions, next) => {
	server.route({
		method: ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/',
		constraints: {
			host: REGEX_HOST_NOT_MATCH
		},
		handler: invokeHostnameAPI
	})

	server.route({
		method: ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		url: '/*',
		constraints: {
			host: REGEX_HOST_NOT_MATCH
		},
		handler: invokeHostnameAPI
	})

	server.post('/invoke/:id', { constraints: { host: REGEX_HOST_MATCH } }, invokePathAPI)

	next()
}
