import { Web3Storage, type Service } from 'web3.storage'

function makeStorageClient() {
	return new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN } as Service)
}

export const storageClient = makeStorageClient()
