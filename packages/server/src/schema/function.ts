import { FastifyRequest } from 'fastify'
import {
	FunctionStatuses,
	IFunctionEnvVarRecord,
	IFunctionRecord
} from '@blocklessnetwork/gateway-core'

export type FunctionCreateRequest = FastifyRequest<{
	Body: {
		functionId: string
		functionName: string
	}
}>

export type FunctionUpdateRequest = FastifyRequest<{
	Params: {
		id: string
	}
	Body: Partial<IFunctionRecord>
}>

export type FunctionUpdateEnvVarsRequest = FastifyRequest<{
	Params: {
		id: string
	}
	Body: {
		envVars: IFunctionEnvVarRecord[]
	}
}>

export type FunctionListRequest = FastifyRequest<{
	Querystring: {
		page: number
		limit: number
	}
}>

export type FunctionFetchRequest = FastifyRequest<{
	Params: {
		id: string
	}
}>

export type FunctionDeleteRequest = FastifyRequest<{
	Params: {
		id: string
	}
}>

export type FunctionDeployRequest = FastifyRequest<{
	Params: {
		id: string
	}
	Body: {
		functionId: string
	}
}>

export const FunctionCreateSchema = {
	body: {
		type: 'object',
		required: ['functionId', 'functionName'],
		properties: {
			functionId: {
				type: 'string'
			},
			functionName: {
				type: 'string'
			}
		},
		additionalProperties: false
	}
}

export const FunctionUpdateSchema = {
	params: { id: { type: 'string', minLength: 1 } },
	body: {
		type: 'object',
		properties: {
			functionId: {
				type: 'string'
			},
			functionName: {
				type: 'string'
			},
			status: {
				type: 'string',
				enum: FunctionStatuses
			}
		},
		additionalProperties: false
	}
}

export const FunctionUpdateEnvVarsSchema = {
	params: { id: { type: 'string', minLength: 1 } },
	body: {
		type: 'object',
		required: ['envVars'],
		properties: {
			envVars: {
				type: 'object'
			}
		},
		additionalProperties: false
	}
}

export const FunctionGetSchema = {
	params: { id: { type: 'string', minLength: 1 } }
}

export const FunctionDeleteSchema = {
	params: { id: { type: 'string', minLength: 1 } }
}

export const FunctionDeploySchema = {
	params: { id: { type: 'string', minLength: 1 } },
	body: {
		type: 'object',
		required: ['functionId'],
		properties: {
			functionId: { type: 'string' }
		},
		additionalProperties: false
	}
}
