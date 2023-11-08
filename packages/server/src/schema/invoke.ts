import { FastifyRequest } from 'fastify'

export type InvokePathRequest = FastifyRequest<{
	Params: {
		id: string
	}
	Body: {
		method?: string
		path?: string
		params?: {
			[key: string]: string
		}
		query?: {
			[key: string]: string
		}
		headers?: {
			[key: string]: string
		}
		body?: unknown
	}
}>
