export type UserWalletType = 'eth' | 'metamask' | 'keplr' | 'martian'
export type UserWalletTypeKey = 'ethAddress' | 'cosmosAddress' | 'aptosAddress'
export type UserWalletRequest = { [key in UserWalletTypeKey]: string }

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
