import crypto from 'crypto'
import { bufferToHex } from '@ethereumjs/util'
import { recoverPersonalSignature } from '@metamask/eth-sig-util'

import User from '../models/user'
import { BaseErrors } from '../constants/errors'
import {
	UserWallet,
	UserWalletRequest,
	UserWalletType,
	UserWalletTypeKey,
	UserWalletTypeKeys
} from '../interfaces/auth'

/**
 * Get a user wallet object from a request body containing a wallet address
 *
 * @todo Verify each wallet types address
 *
 * @param userWalletRequest
 * @returns
 */
export async function getUserWallet(userWalletRequest: UserWalletRequest): Promise<UserWallet> {
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

export async function getUserWalletByType(
	type: UserWalletType,
	address: string
): Promise<UserWallet> {
	return { walletKey: UserWalletTypeKeys[type], walletType: type, walletAddress: address }
}

/**
 * Fetch a user document with a gien user wallet object
 *
 * @param userWallet
 * @returns
 */
export async function getUser(userWallet: UserWallet) {
	let userLookupQuery: { [key: string]: string } = {}
	userLookupQuery[userWallet.walletKey] = userWallet.walletAddress

	const user = await User.findOne(userLookupQuery)
	if (!user) throw new BaseErrors.ERR_USER_NOT_FOUND()

	return user
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
	if (!user) throw new BaseErrors.ERR_USER_NONCE_NOT_GENERATED()

	return user.nonce
}

/**
 *
 * @param param0
 * @returns
 */
export async function verifyUserWalletSignature({
	userWallet,
	signature
}: {
	userWallet: UserWallet
	signature: string
}): Promise<boolean> {
	const user = await getUser(userWallet)
	let msg = `unique nonce ${user.nonce}`

	switch (userWallet.walletType) {
		case 'metamask':
			const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'))
			const address = recoverPersonalSignature({
				data: msgBufferHex,
				signature
			})

			return address.toLowerCase() === userWallet.walletAddress.toLowerCase()
	}

	return false
}
