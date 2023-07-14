import NodeCache from 'node-cache'
import { IHeadNodePayload } from '../interfaces/headNode'
import { IHeadNodeResponse } from '../interfaces/headNode'
import { jsonToBase64 } from '../utils/buffer'

const nodeCache = new NodeCache()

/**
 *
 * @param payload
 * @param data
 * @returns
 */
export async function storeCache(
	payload: IHeadNodePayload,
	data: IHeadNodeResponse
): Promise<IHeadNodeResponse> {
	const cacheId = jsonToBase64(payload)
	nodeCache.set(cacheId, data)

	return data
}

/**
 *
 * @param payload
 */
export async function fetchCache(
	payload: IHeadNodePayload
): Promise<IHeadNodeResponse | undefined> {
	const cacheId = jsonToBase64(payload)
	return await nodeCache.get(cacheId)
}
