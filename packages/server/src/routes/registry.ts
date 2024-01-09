import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify'

import { BaseErrors, IFunctionManifestRecord } from '@blockless/gateway-core'

import { REGEX_HOST_MATCH } from '../constants'
import gatewayClient from '../utils/gatewayClient'
import { File } from '../utils/helpers'
import { makeStorageClient } from '../utils/storageClient'

export const register = (server: FastifyInstance, opts: FastifyPluginOptions, next) => {
	server.get(
		'/:id',
		{
			constraints: { host: REGEX_HOST_MATCH }
		},
		async (request: FastifyRequest<{ Params: { id: string } }>) => {
			const { id } = request.params
			return gatewayClient.functionManifests.fetch(id)
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

			const storageClient = await makeStorageClient()

			if (!manifest) throw new BaseErrors.ERR_FUNCTION_MANIFEST_NOT_FOUND()
			if (!storageClient) throw new BaseErrors.ERR_FUNCTION_DEPLOY_FAILED()

			// Store module in web3 storage
			const cid = await storageClient.uploadDirectory(files)

			// Store manifest in db
			await gatewayClient.functionManifests.store(cid.toString(), manifest)

			return { cid: cid.toString(), name: manifest.name, manifest }
		}
	)

	next()
}
