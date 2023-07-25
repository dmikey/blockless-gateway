import 'dotenv/config'
import mongoose from 'mongoose'
import fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import fastifyJwt from '@fastify/jwt'
import fastifyPlugin from 'fastify-plugin'

import { register as registerAuth } from './api/auth'
import { register as registerFunctions } from './api/functions'
import { register as registerInvoke } from './api/invoke'

import { authenticateHook } from './hooks/authenticate'

import { API_PATH } from './constants/constants'
import { EnvSchema } from './interfaces/env'

// Create the server
const server = fastify({
	logger: true
})

// Default route
server.get('/', async () => {
	return 'Blockless Gateway'
})

// Health API route
server.get('/health', async () => {
	return { status: 'ok' }
})

// Register configuration
server.register(fastifyEnv, { schema: EnvSchema })
server.register(fastifyJwt, { secret: process.env.JWT_SECRET! })

// Hooks
server.register(fastifyPlugin(authenticateHook))

// Register API Routes
server.register(registerInvoke)
server.register(registerAuth, { prefix: `${API_PATH}/auth` })
server.register(registerFunctions, { prefix: `${API_PATH}/functions`, type: 'function' })
server.register(registerFunctions, { prefix: `${API_PATH}/sites`, type: 'site' })

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
