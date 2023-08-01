import {
	StdSignature,
	decodeSignature as decodeKeplrSignature,
	isSecp256k1Pubkey
} from '@cosmjs/amino'
import { bufferToHex } from '@ethereumjs/util'
import { verifyADR36Amino } from '@keplr-wallet/cosmos'
import { recoverPersonalSignature } from '@metamask/eth-sig-util'
import crypto from 'crypto'
import nacl from 'tweetnacl'

import { BaseErrors } from '../errors'
import {
	default as User,
	UserWallet,
	UserWalletRequest,
	UserWalletType,
	UserWalletTypeKey,
	UserWalletTypeKeys
} from '../models/user'

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

/**
 * Get a user wallet object by type and wallet address
 *
 * @param type
 * @param address
 * @returns
 */
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
	let userLookupQuery: { [key: string]: unknown } = {}
	userLookupQuery[userWallet.walletKey] = { $regex: new RegExp(userWallet.walletAddress, 'i') }

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
 * Verify a user wallet signature for metamask, keplr and martian wallets
 *
 * @param params
 * @returns
 */
export async function verifyUserWalletSignature({
	userWallet,
	signature,
	publicKey
}: {
	userWallet: UserWallet
	signature: string | StdSignature
	publicKey?: string
}): Promise<boolean> {
	const user = await getUser(userWallet)
	let msg = `unique nonce ${user.nonce}`

	switch (userWallet.walletType) {
		case 'keplr':
			if (!isSecp256k1Pubkey((signature as StdSignature).pub_key))
				throw new BaseErrors.ERR_USER_SIGNATURE_MISMATCH()

			const decodedSig = decodeKeplrSignature(signature as StdSignature)

			return verifyADR36Amino(
				'bls',
				userWallet.walletAddress,
				Buffer.from(msg, 'utf8'),
				decodedSig.pubkey,
				decodedSig.signature
			)

		case 'martian':
			if (!publicKey) throw new BaseErrors.ERR_USER_SIGNATURE_MISMATCH()

			msg = `APTOS\nmessage: unique nonce ${user?.nonce}`

			return nacl.sign.detached.verify(
				new TextEncoder().encode(msg),
				Buffer.from((signature as string).slice(2), 'hex'),
				Buffer.from(publicKey.slice(2), 'hex')
			)
		default:
			const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'))
			const address = recoverPersonalSignature({
				data: msgBufferHex,
				signature: signature as string
			})

			return address.toLowerCase() === userWallet.walletAddress.toLowerCase()
	}
}
