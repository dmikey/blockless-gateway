import { INameValueArray } from '../interfaces/generic'
import { IHeadNodeResponse } from '../interfaces/headNode'
import { IFunctionEnvVarRecord, IFunctionRequestData, IFunctionSecretsRecord } from '../models'
import { generateCRC32Checksum } from '../utils/checksum'
import { decryptValue } from '../utils/encryption'
import { getHCPAuthToken } from '../utils/hashicorp'
import { convertRequestBodyToString, normalize } from '../utils/strings'

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

	if (envVars) {
		envVarsArray = envVars
			.filter((envVar) => (encryptionKey ? !!envVar.value && !!envVar.iv : !!envVar.value))
			.map((envVar) => {
				const value =
					!!encryptionKey && !!envVar.iv
						? decryptValue(envVar.value, encryptionKey, envVar.iv)
						: envVar.value
				return { name: envVar.name, value }
			})
	}

	return envVarsArray
}

/**
 * A utility function to parse secrets key value
 *
 * @param secrets
 * @returns
 */
export async function parseFunctionSecrets(
	secrets: IFunctionSecretsRecord,
	encryptionKey: string
): Promise<INameValueArray> {
	const secretVars = [] as INameValueArray

	if (
		secrets &&
		secrets.hashicorp &&
		secrets.hashicorp.clientId &&
		secrets.hashicorp.clientId.length > 0 &&
		secrets.hashicorp.clientSecret &&
		secrets.hashicorp.clientSecret.length > 0 &&
		secrets.hashicorp.iv &&
		secrets.hashicorp.iv.length > 0
	) {
		const clientId = secrets.hashicorp.clientId
		const clientSecret = secrets.hashicorp.clientSecret

		const hcpToken = await getHCPAuthToken(
			clientId,
			decryptValue(clientSecret, encryptionKey, secrets.hashicorp.iv)
		)

		secretVars.push({
			name: 'BLS_HCP_TOKEN',
			value: hcpToken || ''
		})
	}

	return secretVars
}

/**
 * A utility function to parse env vars key-value array from a function's request data
 *
 * @param requestData
 * @returns
 */
export function parseFunctionRequestVars(requestData: IFunctionRequestData): INameValueArray {
	const requestVars = [] as INameValueArray

	// Look for stdin over request vars
	let stdin = requestData.path || '/'
	if (requestData.method === 'GET') {
		// Look in query
		if (requestData.query?.stdin) {
			stdin = requestData.query.stdin
		}
	} else if (requestData.body) {
		// Look in body
		if (typeof requestData.body === 'object' && 'stdin' in requestData.body) {
			stdin = String(requestData.body.stdin)
		} else if (typeof requestData.body === 'string') {
			stdin = requestData.body
		} else if (requestData.query?.stdin) {
			stdin = requestData.query.stdin
		}
	}

	if (stdin) {
		requestVars.push({
			name: 'BLS_REQUEST_STDIN',
			value: stdin
		})
	}

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
			value: encodeURIComponent(convertRequestBodyToString(requestData.body))
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
		try {
			JSON.parse(data.result)
			type = 'application/json'
		} catch {
			/* empty */
		}

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
