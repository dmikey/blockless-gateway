import { personalSign } from '@metamask/eth-sig-util'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

import { BaseErrors } from '../src/errors'
import { UserWalletType } from '../src/models/user'
import {
	generateUserChallenge,
	getUser,
	getUserWallet,
	getUserWalletByType,
	verifyUserWalletSignature
} from '../src/services/auth'

// Constants
let ETH_USER_ADDRESS = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
let ETH_USER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

// Test Database
let mongoServer: MongoMemoryServer

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.8' } })
	await mongoose.connect(mongoServer.getUri(), { dbName: 'test' })
}, 10000)

describe('User Challenge & Signature', () => {
	let nonce = ''

	it('should generate a user challenge for a given user wallet', async () => {
		const userChallenge = await generateUserChallenge(getUserWalletByType('eth', ETH_USER_ADDRESS))
		expect(typeof userChallenge).toBe('string')
		expect(userChallenge.length).toBeGreaterThan(0)
		nonce = userChallenge
	})

	it('should verify the signature for a given user wallet', async () => {
		const signature = personalSign({
			privateKey: Buffer.from(ETH_USER_PK.slice(2), 'hex'),
			data: `unique nonce ${nonce}`
		})

		const isValid = await verifyUserWalletSignature({
			userWallet: getUserWalletByType('eth', ETH_USER_ADDRESS),
			signature
		})

		expect(isValid).toBe(true)
	})

	it('should get user object', async () => {
		const user = await getUser(getUserWalletByType('eth', ETH_USER_ADDRESS))
		expect(user.ethAddress).toBe(ETH_USER_ADDRESS)
	})
})

describe('User Wallet Helpers', () => {
	describe('getUserWallet', () => {
		it('should return user wallet with ethAddress', async () => {
			const userWalletRequest = { ethAddress: ETH_USER_ADDRESS }
			const userWallet = getUserWallet(userWalletRequest)
			expect(userWallet).toEqual({
				walletKey: 'ethAddress',
				walletType: 'metamask',
				walletAddress: ETH_USER_ADDRESS
			})
		})

		it('should return user wallet with cosmosAddress', async () => {
			const userWalletRequest = { cosmosAddress: 'cosmos-address' }
			const userWallet = getUserWallet(userWalletRequest)
			expect(userWallet).toEqual({
				walletKey: 'cosmosAddress',
				walletType: 'keplr',
				walletAddress: 'cosmos-address'
			})
		})

		it('should return user wallet with aptosAddress', async () => {
			const userWalletRequest = { aptosAddress: 'aptos-address' }
			const userWallet = getUserWallet(userWalletRequest)
			expect(userWallet).toEqual({
				walletKey: 'aptosAddress',
				walletType: 'martian',
				walletAddress: 'aptos-address'
			})
		})

		it('should throw ERR_USER_WALLET_NOT_FOUND when no address is provided', async () => {
			const userWalletRequest = {}
			expect(() => getUserWallet(userWalletRequest)).toThrow(BaseErrors.ERR_USER_WALLET_NOT_FOUND)
		})
	})

	describe('getUserWalletByType', () => {
		it('should return user wallet for metamask type', async () => {
			const walletType = 'metamask'
			const walletAddress = ETH_USER_ADDRESS
			const userWallet = getUserWalletByType(walletType, walletAddress)
			expect(userWallet).toEqual({
				walletKey: 'ethAddress',
				walletType: 'metamask',
				walletAddress: ETH_USER_ADDRESS
			})
		})

		it('should return user wallet for keplr type', async () => {
			const walletType = 'keplr'
			const walletAddress = 'cosmos-address'
			const userWallet = getUserWalletByType(walletType, walletAddress)
			expect(userWallet).toEqual({
				walletKey: 'cosmosAddress',
				walletType: 'keplr',
				walletAddress: 'cosmos-address'
			})
		})

		it('should return user wallet for martian type', async () => {
			const walletType = 'martian'
			const walletAddress = 'aptos-address'
			const userWallet = getUserWalletByType(walletType, walletAddress)
			expect(userWallet).toEqual({
				walletKey: 'aptosAddress',
				walletType: 'martian',
				walletAddress: 'aptos-address'
			})
		})

		it('should throw an error for an invalid wallet type', async () => {
			const walletType = 'invalid-type' as UserWalletType
			const walletAddress = 'address'
			expect(() => getUserWalletByType(walletType, walletAddress)).toThrow()
		})
	})
})

afterAll(async () => {
	await mongoose.disconnect()
	mongoServer.stop()
})
