import fastifyStatic from '@fastify/static'
import { FastifyPluginAsync, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import path from 'path'

type GatewayUIPages = 'login' | '404'

interface GatewayUIOptions {
	pages?: GatewayUIPages[]
	hostConstraint?: string | RegExp
}

const gatewayUI: FastifyPluginAsync<GatewayUIOptions> = async (fastify, opts) => {
	const constraints = opts.hostConstraint ? { constraints: { host: opts.hostConstraint! } } : {}

	// Setup static directory
	fastify.register(fastifyStatic, {
		root: path.join(__dirname),
		prefix: '/',
		...constraints
	})

	// Route constraints

	// Setup pages routes
	opts.pages?.map((page: GatewayUIPages) => {
		fastify.get(`/${page}`, { ...constraints }, async (_, reply: FastifyReply) => {
			return reply.sendFile(`${page}.html`)
		})
	})

	if (opts.pages?.indexOf('404') !== -1) {
		fastify.setErrorHandler(function (error, request, reply) {
			if (error.statusCode === 404 && error.code === 'ERR_FUNCTION_NOT_FOUND') {
				return reply.sendFile(`404.html`)
			} else {
				reply.send(error)
			}
		})
	}
}

export default fp(gatewayUI, '4.x')
