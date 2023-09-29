import axios, { AxiosResponse } from 'axios'

export async function getHCPAuthToken(
	hcpClientId: string,
	hcpClientSecret: string
): Promise<string | null> {
	const requestBody = {
		audience: 'https://api.hashicorp.cloud',
		grant_type: 'client_credentials',
		client_id: hcpClientId,
		client_secret: hcpClientSecret
	}

	const headers = {
		'Content-Type': 'application/json'
	}

	try {
		const response: AxiosResponse = await axios.post(
			'https://auth.hashicorp.com/oauth/token',
			requestBody,
			{ headers }
		)
		return response.data.access_token
	} catch {
		/* empty */
	}

	return null
}
