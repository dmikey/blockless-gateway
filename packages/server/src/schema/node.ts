import { FastifyRequest } from 'fastify'

export type NodeListRequest = FastifyRequest<{
	Querystring: {
		page: number
		limit: number
	}
}>

export type NodeCreateRequest = FastifyRequest<{
	Params: {
		nodeId: string
	}
}>

export type NodeLinkRequest = FastifyRequest<{
	Params: {
		nodeId: string
	}
	Body: {
		signature: string
	}
}>

export type NodeRegisterRequest = FastifyRequest<{
	Body: {
		pubKey: string
	}
}>

export type NodeStartSessionRequest = FastifyRequest<{
	Params: {
		nodeId: string
	}
	Body: {
		signature: string
	}
}>

export type NodeEndSessionRequest = FastifyRequest<{
	Params: {
		nodeId: string
		sessionId: string
	}
	Body: {
		signature: string
	}
}>
