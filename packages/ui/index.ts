import fastifyStatic from '@fastify/static'
import { FastifyPluginCallback, FastifyReply } from 'fastify'
import path from 'path'

const gatewayUi: FastifyPluginCallback = (fastify, _, next) => {
	fastify.register(fastifyStatic, {
		root: path.join(__dirname),
		prefix: '/'
	})

	fastify.get('/login', async (_, reply: FastifyReply) => {
		return reply.sendFile('login.html')
	})

	next()
}

export default gatewayUi
