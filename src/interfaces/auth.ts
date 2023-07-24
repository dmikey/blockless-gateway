import { FastifyRequest } from 'fastify'

export interface UserWalletRequest {
	ethAddress?: string
	cosmosAddress?: string
	aptosAddress?: string
}

export interface UserWallet {
	walletKey: string
	walletType: string
	walletAddress: string
}

export const UserWalletRequestSchema = {
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

export type AuthChallengePostRequest = FastifyRequest<{
	Body: UserWalletRequest
}>
