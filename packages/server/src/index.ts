import fastify from 'fastify'
import 'dotenv/config'

// Create the server
const server = fastify({
	logger: true
})

// Default route
server.get('/', async () => {
	return 'Blockless Gateway'
})

// Default subdomain route
server.route({
	method: 'GET',
	url: '/',
	constraints: { host: /.*\.bls\.local/ },
	handler: (request, reply) => {
		reply.send(`Invoke function ${request.hostname}`)
	}
})

// Run the server
server.listen(
	{ port: Number(process.env.SERVER_PORT), host: process.env.SERVER_HOST },
	(err, address) => {
		if (err) throw err
		console.log('Server started: ', address)
	}
)
