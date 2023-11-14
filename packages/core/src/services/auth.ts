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
import User, { UserWallet } from '../models/user'

/**
 * Fetch a user document with a gien user wallet object
 *
 * @param userWallet
 * @returns
 */
export async function getUser(userWallet: UserWallet) {
	const userLookupQuery: { [key: string]: unknown } = {}
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
	const nonce = crypto.randomBytes(16).toString('base64')

	const userLookupQuery: { [key: string]: unknown } = {}
	userLookupQuery[walletKey] = { $regex: new RegExp(walletAddress, 'i') }

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
