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
	}
}>

export type NodeStartSessionRequest = FastifyRequest<{
	Params: {
		nodePubKey: string
	}
}>

export type NodeEndSessionRequest = FastifyRequest<{
	Params: {
		nodePubKey: string
		sessionId: string
	}
}>
