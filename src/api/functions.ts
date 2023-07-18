import { FastifyInstance } from 'fastify'

export const register = (server: FastifyInstance, _, next) => {
	server.get('/', async () => {
		return 'List Functions'
	})

	server.post('/', async () => {
		return 'Create Function'
	})

	server.get('/:id', async () => {
		return 'List Single Functions'
	})

	server.patch('/:id', async () => {
		return 'Modify Single Function'
	})

	server.delete('/:id', async () => {
		return 'Delete Single Function'
	})

	next()
}
