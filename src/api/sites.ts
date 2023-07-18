import { FastifyInstance } from 'fastify'

export const register = (server: FastifyInstance, _, next) => {
	server.get('/', async () => {
		return 'List Sites'
	})

	server.post('/', async () => {
		return 'Create Site'
	})

	server.get('/:id', async () => {
		return 'List Single Sites'
	})

	server.patch('/:id', async () => {
		return 'Modify Single Site'
	})

	server.delete('/:id', async () => {
		return 'Delete Single Site'
	})

	next()
}
