import mongoose from 'mongoose'

export type UserWalletType = 'eth' | 'metamask' | 'keplr' | 'martian'
export type UserWalletTypeKey = 'ethAddress' | 'cosmosAddress' | 'aptosAddress'
export type UserWalletRequest = { [key in UserWalletTypeKey]?: string }

export interface UserWallet {
	walletKey: UserWalletTypeKey
	walletType: UserWalletType
	walletAddress: string
}

export const UserWalletTypeKeys: { [key in UserWalletType]: UserWalletTypeKey } = {
	eth: 'ethAddress',
	metamask: 'ethAddress',
	keplr: 'cosmosAddress',
	martian: 'aptosAddress'
}

const UserSchema = new mongoose.Schema({
	nonce: {
		type: String,
		required: true
	},

	ethAddress: String,
	cosmosAddress: String,
	aptosAddress: String,

	refCode: {
		type: String,
		default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
	},
	refBy: String,

	metadata: {
		type: mongoose.Schema.Types.Mixed,
		default: {}
	}
})

const User = mongoose.model('User', UserSchema)
export default User
