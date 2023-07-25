import { FastifyRequest } from 'fastify'
import { UserWalletRequest, UserWalletType } from './user'

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
	required: ['walletType', 'signature', 'publicAddress'],
	properties: {
		walletType: {
			type: 'string',
			enum: ['metamask', 'keplr', 'martian']
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
	allOf: [
		{
			if: { properties: { walletType: { enum: ['martian'] } } },
			then: {
				required: ['walletType', 'signature', 'publicAddress', 'publicKey']
			},
			else: {
				required: ['walletType', 'signature', 'publicAddress']
			}
		}
	],
	additionalProperties: false
}
