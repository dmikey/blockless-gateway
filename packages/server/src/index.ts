import 'dotenv/config'
import fastify from 'fastify'

import { register as registerAuth } from './api/auth'
import { register as registerSites } from './api/sites'
import { register as registerFunctions } from './api/functions'
import { register as registerInvoke } from './api/invoke'

// Create the server
const server = fastify({
	logger: true
})

// Default route
server.get('/', async () => {
	return server.printRoutes()
})

// Health API route
server.get('/health', async () => {
	return { status: 'ok' }
})

// Register API Routes
server.register(registerInvoke)
server.register(registerAuth, { prefix: 'api/v1/auth' })
server.register(registerFunctions, { prefix: 'api/v1/functions' })
server.register(registerSites, { prefix: 'api/v1/sites' })

// Run the server
server.listen(
	{ port: Number(process.env.SERVER_PORT), host: process.env.SERVER_HOST },
	(err, address) => {
		if (err) throw err
		console.log('Server started: ', address)
	}
)
