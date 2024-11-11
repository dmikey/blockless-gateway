import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

declare module 'fastify' {
	interface FastifyInstance {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		authenticate: any
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		authenticateNode: any
	}
}

declare module '@fastify/jwt' {
	interface FastifyJWT {
		user: {
			userId: string
			publicAddress: string
			walletType: string
		}
	}
}

export function authenticateHook(server: FastifyInstance, opts, next) {
	server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
		try {
			await request.jwtVerify()
		} catch (err) {
			reply.send(err)
		}
	})

	next()
}
