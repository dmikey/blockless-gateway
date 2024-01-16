import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'

import { IFunctionRequestData } from '@blockless/gateway-core'

import { REGEX_HOST_MATCH, REGEX_HOST_NOT_MATCH } from '../constants'
import { InvokePathRequest } from '../schema/invoke'
import { isUUID } from '../utils'
import gatewayClient from '../utils/gatewayClient'

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
		params: request.params as IFunctionRequestData['params'],
		method: request.method,
		query: request.query as IFunctionRequestData['query'],
		headers: request.headers as IFunctionRequestData['headers'],
		body: request.body as unknown
	}

	const response = await gatewayClient.functions.invoke('subdomain', domain, requestData)

	reply
		.status(response.status)
		// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		.headers(response.headers as { [key: string]: any })
		.type(response.type)
		.send(response.body)
}

/**
 * Invoke a function with a given invocation id and request as payload
 *
 * @param request
 * @param reply
 * @returns
 */
async function invokePathAPI(request: InvokePathRequest, reply: FastifyReply) {
	const { id } = request.params
	const { method, path, params, query, headers, body } = request.body
	const requestData = { method, path, params, query, headers, body }

	// Detect type of ID and trigger the relevant invocation
	const response = await gatewayClient.functions.invoke(
		isUUID(id) ? 'invocationId' : 'functionId',
		id,
		requestData
	)

	reply
		.status(response.status)
		// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		.headers(response.headers as { [key: string]: any })
		.type(response.type)
		.send(response.body)
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
