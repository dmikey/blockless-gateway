import { FastifyRequest } from 'fastify'

export type UserWalletType = 'metamask' | 'keplr' | 'martian'
export type UserWalletTypeKey = 'ethAddress' | 'cosmosAddress' | 'aptosAddress'
export type UserWalletRequest = { [key in UserWalletTypeKey]: string }

export interface UserWallet {
	walletKey: UserWalletTypeKey
	walletType: UserWalletType
	walletAddress: string
}

export const UserWalletTypeKeys: { [key in UserWalletType]: UserWalletTypeKey } = {
	metamask: 'ethAddress',
	keplr: 'cosmosAddress',
	martian: 'aptosAddress'
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

export type AuthSignPostRequest = FastifyRequest<{
	Body: {
		walletType: UserWalletType
		signature: string
		publicAddress: string
		publicKey?: string
	}
}>

export type AuthChallengePostRequest = FastifyRequest<{
	Body: UserWalletRequest
}>
