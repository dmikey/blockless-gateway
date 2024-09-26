import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { NodePublicRequest } from '../schema/node'
import gatewayClient from '../utils/gatewayClient'

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

export function authenticateNodeHook(server: FastifyInstance, opts, next) {
	server.decorate(
		'authenticateNode',
		async function (request: NodePublicRequest, reply: FastifyReply) {
			// Check if the x-node-signature header exists
			const nodePubKey = request.params.nodePubKey
			const nodeSignature = request.headers['x-node-signature']

			const nonce = await gatewayClient.nodes.getNonce(process.env.JWT_SECRET!, nodePubKey)

			// TODO: verify signature with the public key

			if (!nodeSignature || !nonce) {
				// If the header doesn't exist, send an authentication error
				reply.status(401).send({ error: 'Authentication failed: Missing node signature' })
				return
			}
		}
	)

	next()
}
