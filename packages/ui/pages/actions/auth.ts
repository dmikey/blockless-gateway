import { callEndpoint } from './base'

export async function fetchAuthChallenge(address: string): Promise<string> {
	const response = await callEndpoint<{ nonce: string }>(`/api/v1/auth/nonce`, 'POST', {
		ethAddress: address
	})
	return response.nonce
}

export async function fetchAuthToken(address: string, signature: string): Promise<string> {
	const response = await callEndpoint<{ token: string }>(`/api/v1/auth/sign`, 'POST', {
		signature,
		publicAddress: address
	})
	return response.token
}
