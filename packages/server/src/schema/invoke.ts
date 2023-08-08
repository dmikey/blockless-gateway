import { FastifyRequest } from 'fastify'

export type InvokePathRequest = FastifyRequest<{
	Params: {
		id: string
	}
	Body: { path: string }
}>
