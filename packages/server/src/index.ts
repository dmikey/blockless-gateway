import fastifyEnv from '@fastify/env'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import 'dotenv/config'
import fastify, { FastifyReply } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import mongoose from 'mongoose'

import gatewayUI from '@blocklessnetwork/gateway-ui'

import { API_PATH } from './constants'
import { authenticateHook } from './hooks/authenticate'
import { register as registerAuth } from './routes/auth'
import { register as registerFunctions } from './routes/functions'
import { register as registerInvoke } from './routes/invoke'
import { register as registerRegistry } from './routes/registry'
import { EnvSchema } from './schema/env'

// Create the server
const server = fastify({
	logger: true
})

// Default route
server.get('/', async (request, reply: FastifyReply) => {
	return 'Blockless Gateway'
})

// API version
server.get('/version', async () => ({
	apiVersion: 1
}))

// Health API route
server.get('/health', async () => {
	return { status: 'ok' }
})

// Register configuration
server.register(fastifyEnv, { schema: EnvSchema })
server.register(fastifyJwt, { secret: process.env.JWT_SECRET! })
server.register(fastifyMultipart)

// UI
server.register(gatewayUI)

// Hooks
server.register(fastifyPlugin(authenticateHook))

// Register API Routes
server.register(registerInvoke)
server.register(registerAuth, { prefix: `${API_PATH}/auth` })
server.register(registerFunctions, { prefix: `${API_PATH}/functions`, type: 'function' })
server.register(registerFunctions, { prefix: `${API_PATH}/sites`, type: 'site' })
server.register(registerRegistry, { prefix: `${API_PATH}/registry` })

// Run the server
server.listen(
	{ port: Number(process.env.SERVER_PORT), host: process.env.SERVER_HOST },
	(err, address) => {
		if (err) throw err
		server.log.info('Server started: ', address)

		// Connect database
		mongoose
			.connect(process.env.MONGO_DB_URI as string)
			.then(() => server.log.info('Database connected'))
			.catch(() => {
				server.log.info('Database connection failed')
				return server.close()
			})
	}
)
