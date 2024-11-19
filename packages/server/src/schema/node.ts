import { FastifyRequest } from 'fastify'

export type NodeListRequest = FastifyRequest<{
	Querystring: {
		page: number
		limit: number
	}
}>

export type NodeGetRequest = FastifyRequest<{
	Params: {
		nodePubKey: string
	}
}>

export type NodeRegisterRequest = FastifyRequest<{
	Params: {
		nodePubKey: string
	}
	Body: {
		ipAddress: string
		hardwareId: string
	}
}>

export type NodeSessionRequest = FastifyRequest<{
	Params: {
		nodePubKey: string
	}
	Body: {
		isB7SConnected: boolean
	}
}>
