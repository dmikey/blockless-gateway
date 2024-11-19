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
export async function generateUserChallenge(
	{ walletKey, walletAddress }: UserWallet,
	data: { refBy?: string; metadata?: Record<string, unknown> }
): Promise<string> {
	const nonce = crypto.randomBytes(16).toString('base64')

	const userLookupQuery: { [key: string]: unknown } = {}
	const userData: { [key: string]: string } = {}
	const userRefData: { [key: string]: unknown } = {}
	userLookupQuery[walletKey] = { $regex: new RegExp(walletAddress, 'i') }
	userData[walletKey] = walletAddress

	// Lookup user by metadata email
	if (data && data.metadata && data.metadata.email && data.metadata.typeOfLogin) {
		const usersByEmail = await User.find({
			'metadata.email': data.metadata.email
		})

		if (
			usersByEmail.length === 1 &&
			usersByEmail[0].metadata &&
			usersByEmail[0].metadata.typeOfLogin !== data.metadata?.typeOfLogin
		) {
			console.log('user already exists with different type of login', data.metadata)
			throw new Error('User already exists with different type of login.')
		}
	}

	const userExists = await User.findOne(userLookupQuery)
	if (!userExists) {
		if (data && data.refBy) {
			userRefData.refBy = data.refBy
		}

		if (data && data.metadata) {
			userRefData.metadata = data.metadata
		}
	}

	const user = await User.findOneAndUpdate(
		userLookupQuery,
		{ ...userData, nonce, ...userRefData },
		{ upsert: true, new: true }
	)
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
}): Promise<{ userId: string; isSignatureValid: boolean }> {
	const user = await getUser(userWallet)
	let msg = `unique nonce ${user.nonce}`

	switch (userWallet.walletType) {
		case 'keplr':
			if (!isSecp256k1Pubkey((signature as StdSignature).pub_key))
				throw new BaseErrors.ERR_USER_SIGNATURE_MISMATCH()

			const decodedSig = decodeKeplrSignature(signature as StdSignature)

			return {
				userId: user._id.toString(),
				isSignatureValid: verifyADR36Amino(
					'bls',
					userWallet.walletAddress,
					Buffer.from(msg, 'utf8'),
					decodedSig.pubkey,
					decodedSig.signature
				)
			}

		case 'martian':
			if (!publicKey) throw new BaseErrors.ERR_USER_SIGNATURE_MISMATCH()

			msg = `APTOS\nmessage: unique nonce ${user?.nonce}`

			return {
				userId: user._id.toString(),
				isSignatureValid: nacl.sign.detached.verify(
					new TextEncoder().encode(msg),
					Buffer.from((signature as string).slice(2), 'hex'),
					Buffer.from(publicKey.slice(2), 'hex')
				)
			}

		case 'solana':
			if (!publicKey) throw new BaseErrors.ERR_USER_SIGNATURE_MISMATCH()

			let isSignatureValid = true
			msg = `unique nonce ${user?.nonce}`

			try {
				isSignatureValid = nacl.sign.detached.verify(
					new TextEncoder().encode(msg),
					Buffer.from((signature as string).slice(2), 'hex'),
					Buffer.from(publicKey.slice(2), 'hex')
				)
			} catch (error) {
				isSignatureValid = false
			}

			return {
				userId: user._id.toString(),
				isSignatureValid
			}

		default:
			const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'))
			const address = recoverPersonalSignature({
				data: msgBufferHex,
				signature: signature as string
			})

			return {
				userId: user._id.toString(),
				isSignatureValid: address.toLowerCase() === userWallet.walletAddress.toLowerCase()
			}
	}
}
