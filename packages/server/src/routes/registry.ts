import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify'
import { File } from 'web3.storage'

import { fetchFunctionManifest, storeFunctionManifest } from '@blocklessnetwork/gateway-core'
import { BaseErrors } from '@blocklessnetwork/gateway-core'
import { IFunctionManifestRecord } from '@blocklessnetwork/gateway-core'

import { REGEX_HOST_MATCH } from '../constants'
import { storageClient } from '../utils/storageClient'

export const register = (server: FastifyInstance, opts: FastifyPluginOptions, next) => {
	server.get(
		'/:id',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: FastifyRequest<{ Params: { id: string } }>) => {
			const { id } = request.params
			return fetchFunctionManifest(id)
		}
	)

	server.post(
		'/',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: FastifyRequest) => {
			const parts = request.files()
			const files = [] as File[]

			let manifest: IFunctionManifestRecord | null = null

			for await (const part of parts) {
				const buf = await part.toBuffer()

				// Detect if a manifest is attached in the module
				if (part.filename === 'manifest.json') {
					try {
						manifest = JSON.parse(buf.toString())
					} catch (error) {
						throw new BaseErrors.ERR_FUNCTION_MANIFEST_INVALID()
					}
				}

				files.push(new File([buf], part.filename))
			}

			if (!manifest) throw new BaseErrors.ERR_FUNCTION_MANIFEST_NOT_FOUND()

			// Store module in web3 storage
			const cid = await storageClient.put(files)

			// Store manifest in db
			await storeFunctionManifest(cid, manifest)

			return { cid, manifest }
		}
	)

	next()
}
