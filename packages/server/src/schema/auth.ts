import { FastifyRequest } from 'fastify'

import { UserWalletRequest, UserWalletType } from '@blockless/gateway-core'

// Schemas

export type AuthChallengePostRequest = FastifyRequest<{
	Body: UserWalletRequest
}>

export const AuthChallengePostSchema = {
	type: 'object',
	properties: {
		ethAddress: {
			type: 'string'
		},
		cosmosAddress: {
			type: 'string'
		},
		aptosAddress: {
			type: 'string'
		}
	},
	anyOf: [
		{ required: ['ethAddress'] },
		{ required: ['cosmosAddress'] },
		{ required: ['aptosAddress'] }
	],
	additionalProperties: false
}

export type AuthSignPostRequest = FastifyRequest<{
	Body: {
		walletType: UserWalletType
		signature: string
		publicAddress: string
		publicKey?: string
	}
}>

export const AuthSignPostSchema = {
	type: 'object',
	required: ['signature', 'publicAddress'],
	properties: {
		walletType: {
			type: 'string',
			enum: ['eth', 'metamask', 'keplr', 'martian'],
			default: 'eth'
		},
		signature: {
			type: ['string', 'object']
		},
		publicAddress: {
			type: 'string'
		},
		publicKey: {
			type: 'string'
		}
	},
	additionalProperties: false
}
