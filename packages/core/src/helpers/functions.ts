import { INameValueArray } from '../interfaces/generic'
import { IHeadNodeResponse } from '../interfaces/headNode'
import { IFunctionEnvVarRecord, IFunctionRequestData } from '../models'
import { generateCRC32Checksum } from '../utils/checksum'
import { decryptValue } from '../utils/encryption'
import { normalize } from '../utils/strings'

/**
 * A utility function to parse env vars key-value array from a function's env var records
 *
 * @param envVars
 * @returns
 */
export function parseFunctionEnvVars(
	envVars: IFunctionEnvVarRecord[],
	encryptionKey?: string
): INameValueArray {
	let envVarsArray = [] as INameValueArray

	envVarsArray = envVars
		.filter((envVar) => !!envVar.value && !!envVar.iv)
		.map((envVar) => {
			const value =
				!!encryptionKey && envVar.iv
					? decryptValue(envVar.value, encryptionKey, envVar.iv)
					: envVar.value
			return { name: envVar.name, value }
		})

	return envVarsArray
}

/**
 * A utility function to parse env vars key-value array from a function's request data
 *
 * @param requestData
 * @returns
 */
export function parseFunctionRequestVars(requestData: IFunctionRequestData): INameValueArray {
	const requestVars = [] as INameValueArray

	requestVars.push({
		name: 'BLS_REQUEST_METHOD',
		value: requestData.method || 'GET'
	})

	requestVars.push({
		name: 'BLS_REQUEST_PATH',
		value: requestData.path || '/'
	})

	requestVars.push({
		name: 'BLS_REQUEST_PARAMS',
		value: Object.entries(requestData.params || [])
			.map(([key, value]) => `${key}=${value}`)
			.join('&')
	})

	requestVars.push({
		name: 'BLS_REQUEST_QUERY',
		value: Object.entries(requestData.query || [])
			.map(([key, value]) => `${key}=${value}`)
			.join('&')
	})

	requestVars.push({
		name: 'BLS_REQUEST_HEADERS',
		value: Object.entries(requestData.headers || [])
			.map(([key, value]) => `${key}=${value}`)
			.join('&')
	})

	if (requestData.body) {
		requestVars.push({
			name: 'BLS_REQUEST_BODY',
			value:
				typeof requestData.body !== 'string'
					? JSON.stringify(requestData.body)
					: (requestData.body as string)
		})
	}

	return requestVars
}

/**
 * A utility function to parse the raw response from the head node
 *
 * @param data
 * @returns
 */
export function parseFunctionResponse(data: IHeadNodeResponse) {
	let body = null as unknown
	let type = 'text/html'

	if (data.result.startsWith('data:')) {
		const bufferData = data.result.split(',')[1]
		const contentType = data.result.split(',')[0].split(':')[1].split(';')[0]
		const base64data = Buffer.from(bufferData, 'base64')

		type = contentType
		body = base64data
	} else {
		body = data.result
	}

	return {
		status: 200,
		headers: [],
		type,
		body
	}
}

/**
 * Generate a predictable user hash for a function
 *
 * @param zone
 * @param functionName
 * @param userAddress
 * @returns generated subdomain url as a string
 */
export function generateSubdomain(functionName: string, userAddress: string) {
	const userHash = (generateCRC32Checksum(('bls-' + userAddress) as string) >>> 0).toString(16)
	return `${functionName}-${userHash}`
}

/**
 * A utility function to validate function name,
 * and return with the normalized name
 *
 * @param name
 * @returns normalized name after validation
 */
export function validateFunctionName(name: string): string {
	const functionName = normalize(name)
	const matchFormat = /^(?!-)[a-z0-9-]{3,32}(?<!-)$/.test(functionName)

	if (!matchFormat)
		throw new Error('Names must be between 3 and 32 characters, only contain a-z, 0-9 and -')

	return functionName
}
