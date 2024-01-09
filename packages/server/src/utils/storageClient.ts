import { CarReader } from '@ipld/car'
import * as Delegation from '@ucanto/core/delegation'
import * as Signer from '@ucanto/principal/ed25519'
import * as Client from '@web3-storage/w3up-client'

let storageClient: Client.Client | null = null

async function parseProof(data: string) {
	const blocks: unknown[] = []
	const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'))

	for await (const block of reader.blocks()) {
		blocks.push(block)
	}

	return Delegation.importDAG(blocks as Signer.Signer.Transport.Block[])
}

async function makeStorageClient() {
	if (!storageClient) {
		// Load storage client with specific private key
		const principal = Signer.parse(process.env.WEB3_STORAGE_DID_KEY!)
		storageClient = await Client.create({ principal })

		const proof = await parseProof(process.env.WEB3_STORAGE_DID_PROOF!)
		const space = await storageClient.addSpace(proof)
		await storageClient.setCurrentSpace(space.did())

		return storageClient
	}

	return storageClient
}

makeStorageClient()

export { makeStorageClient }
