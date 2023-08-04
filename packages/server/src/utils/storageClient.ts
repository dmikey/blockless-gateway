import { type Service, Web3Storage } from 'web3.storage'

function makeStorageClient() {
	return new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN } as Service)
}

const storageClient = makeStorageClient()
export default storageClient
