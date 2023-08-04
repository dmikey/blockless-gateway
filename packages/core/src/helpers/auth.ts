import { BaseErrors } from '../errors'
import {
	UserWallet,
	UserWalletRequest,
	UserWalletType,
	UserWalletTypeKey,
	UserWalletTypeKeys
} from '../models'

/**
 * Get a user wallet object from a request body containing a wallet address
 *
 * @todo Verify each wallet types address
 *
 * @param userWalletRequest
 * @returns
 */
export function getUserWallet(userWalletRequest: UserWalletRequest): UserWallet {
	let key: UserWalletTypeKey | null = null
	let type: UserWalletType | null = null
	let address: string | null = null

	if (userWalletRequest.ethAddress) {
		key = 'ethAddress'
		type = 'metamask'
		address = userWalletRequest.ethAddress
	} else if (userWalletRequest.cosmosAddress) {
		key = 'cosmosAddress'
		type = 'keplr'
		address = userWalletRequest.cosmosAddress
	} else if (userWalletRequest.aptosAddress) {
		key = 'aptosAddress'
		type = 'martian'
		address = userWalletRequest.aptosAddress
	}

	if (!key || !type || !address) throw new BaseErrors.ERR_USER_WALLET_NOT_FOUND()

	return { walletKey: key, walletType: type, walletAddress: address }
}

/**
 * Get a user wallet object by type and wallet address
 *
 * @param type
 * @param address
 * @returns
 */
export function getUserWalletByType(type: UserWalletType, address: string): UserWallet {
	if (!UserWalletTypeKeys[type]) throw new BaseErrors.ERR_USER_WALLET_NOT_FOUND()

	return { walletKey: UserWalletTypeKeys[type], walletType: type, walletAddress: address }
}
