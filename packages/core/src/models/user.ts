import mongoose from 'mongoose'

export type UserWalletType = 'eth' | 'metamask' | 'keplr' | 'martian' | 'solana'
export type UserWalletTypeKey = 'ethAddress' | 'cosmosAddress' | 'aptosAddress' | 'solanaAddress'
export type UserWalletRequest = { [key in UserWalletTypeKey]?: string }

export interface UserWallet {
	walletKey: UserWalletTypeKey
	walletType: UserWalletType
	walletAddress: string
}

export const UserWalletTypeKeys: {
	[key in UserWalletType]: UserWalletTypeKey
} = {
	eth: 'ethAddress',
	metamask: 'ethAddress',
	keplr: 'cosmosAddress',
	martian: 'aptosAddress',
	solana: 'solanaAddress'
}

const UserSchema = new mongoose.Schema(
	{
		nonce: {
			type: String,
			required: true
		},

		ethAddress: String,
		cosmosAddress: String,
		aptosAddress: String,
		solanaAddress: String,

		socialConnections: {
			discordId: String,
			discordUsername: String,
			discordConnected: {
				type: Boolean,
				default: false
			},
			xId: String,
			xUsername: String,
			xConnected: {
				type: Boolean,
				default: false
			}
		},

		refCode: {
			type: String,
			default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
		},
		refBy: String,

		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {}
		}
	},
	{
		timestamps: true
	}
)

const User = mongoose.model('User', UserSchema)
export default User
