import crypto from 'crypto'
import User from '../models/user'
import { BaseErrors } from '../constants/errors'
import { UserWallet, UserWalletRequest } from '../interfaces/auth'

/**
 * Get a user wallet object from a request body containing a wallet address
 *
 * @todo Verify each wallet types address
 *
 * @param userWalletRequest
 * @returns
 */
export async function getUserWallet(userWalletRequest: UserWalletRequest): Promise<UserWallet> {
	let key: string | null = null
	let type: string | null = null
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

	if (!key || !type || !address) throw BaseErrors.ERR_USER_WALLET_NOT_FOUND

	return { walletKey: key, walletType: type, walletAddress: address }
}

/**
 * Generate a unique user challenge for authentication
 *
 * @param walletType
 * @param walletAddress
 * @returns
 */
export async function generateUserChallenge({
	walletKey,
	walletAddress
}: UserWallet): Promise<string> {
	let nonce = crypto.randomBytes(16).toString('base64')

	let userLookupQuery: { [key: string]: string } = {}
	userLookupQuery[walletKey] = walletAddress

	const user = await User.findOneAndUpdate(userLookupQuery, { nonce }, { upsert: true, new: true })
	if (!user) throw BaseErrors.ERR_USER_NONCE_NOT_GENERATED

	return user.nonce
}
