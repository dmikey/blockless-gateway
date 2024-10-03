import fastifyCors from '@fastify/cors'
import fastifyEnv from '@fastify/env'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import 'dotenv/config'
import fastify from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import gatewayUI from '@blockless/gateway-ui'

import { API_PATH, REGEX_HOST_MATCH } from './constants'
import { authenticateHook, authenticateNodeHook } from './hooks/authenticate'
import { register as registerAttributes } from './routes/attributes'
import { register as registerAuth } from './routes/auth'
import { register as registerFunctions } from './routes/functions'
import { register as registerInvoke } from './routes/invoke'
import { register as registerNodes } from './routes/nodes'
import { register as registerRegistry } from './routes/registry'
import { EnvSchema } from './schema/env'

// Create the server
const server = fastify({
	logger: true
})

// Default route
server.get('/', async () => {
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
server.register(fastifyCors, {
	origin: '*'
})

// UI
server.register(gatewayUI, { hostConstraint: REGEX_HOST_MATCH, pages: ['login', '404'] })

// Hooks
server.register(fastifyPlugin(authenticateHook))
server.register(fastifyPlugin(authenticateNodeHook))

// Register API Routes
server.register(registerInvoke)
server.register(registerAuth, { prefix: `${API_PATH}/auth` })
server.register(registerFunctions, { prefix: `${API_PATH}/functions`, type: 'function' })
server.register(registerFunctions, { prefix: `${API_PATH}/sites`, type: 'site' })
server.register(registerAttributes, { prefix: `${API_PATH}/attributes` })
server.register(registerRegistry, { prefix: `${API_PATH}/registry` })
server.register(registerNodes, { prefix: `${API_PATH}/nodes` })

// Run the server
server.listen(
	{ port: Number(process.env.SERVER_PORT), host: process.env.SERVER_HOST },
	(err, address) => {
		if (err) throw err
		server.log.info('Server started: ', address)
	}
)
