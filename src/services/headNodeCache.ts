import NodeCache from 'node-cache'
import { IHeadNodePayload } from '../interfaces/headNode'
import { IHeadNodeResponse } from '../interfaces/headNode'
import { jsonToBase64 } from '../utils/buffer'

const nodeCache = new NodeCache()
const mimeTypesForCaching = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'text/css',
	'application/javascript',
	'application/font-woff',
	'application/font-woff2',
	'application/vnd.ms-fontobject',
	'application/x-font-ttf',
	'audio/mpeg',
	'video/mp4',
	'application/pdf',
	'application/json',
	'application/xml',
	'application/octet-stream',
	'text/plain',
	'application/zip',
	'application/x-rar-compressed',
	'application/x-tar',
	'application/x-gzip'
]

/**
 * Store head node response in cache
 *
 * @param payload
 * @param data
 * @returns
 */
export async function storeCache(
	payload: IHeadNodePayload,
	data: IHeadNodeResponse
): Promise<IHeadNodeResponse> {
	const result = data.result
	const resultMimeType = extractMimeType(result || '')

	if (resultMimeType && mimeTypesForCaching.indexOf(resultMimeType) !== -1) {
		const cacheId = jsonToBase64(payload)
		nodeCache.set(cacheId, data)
	}

	return data
}

/**
 * Fetch head node response from cache
 *
 * @param payload
 */
export async function fetchCache(
	payload: IHeadNodePayload
): Promise<IHeadNodeResponse | undefined> {
	const cacheId = jsonToBase64(payload)
	return await nodeCache.get(cacheId)
}

/**
 * Utility function extract mimetype from Head node's response
 *
 * @param dataString
 * @returns
 */
function extractMimeType(dataString: string): string | null {
	const regex = /^data:(.*?);base64,(.*)$/
	const match = dataString.match(regex)

	if (match && match.length === 3) {
		const mimeType = match[1]
		return mimeType
	} else {
		return null
	}
}
