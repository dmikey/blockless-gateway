import fastifyStatic from '@fastify/static'
import { FastifyPluginAsync, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import path from 'path'

type GatewayUIPages = 'login'

interface GatewayUIOptions {
	pages?: GatewayUIPages[]
	hostConstraint?: string | RegExp
}

const gatewayUI: FastifyPluginAsync<GatewayUIOptions> = async (fastify, opts) => {
	// Setup static directory
	fastify.register(fastifyStatic, {
		root: path.join(__dirname),
		prefix: '/'
	})

	// Route constraints
	const constraints = opts.hostConstraint ? { constraints: { host: opts.hostConstraint! } } : {}

	// Setup pages routes
	opts.pages?.map((page: GatewayUIPages) => {
		fastify.get(`/${page}`, { ...constraints }, async (_, reply: FastifyReply) => {
			return reply.sendFile(`${page}.html`)
		})
	})
}

export default fp(gatewayUI, '4.x')
