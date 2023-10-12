// createName is a helper function that creates an IPNS name using the web3name HTTP API.
// Name and IPNS record are created client-side, so we don't transfer keys over the wire.
export async function createName(key: string, encodedIPNSRecord: string): Promise<string> {
	const w3nameAPI = 'https://name.web3.storage/name'
	const endpoint = w3nameAPI + '/' + key

	const requestOptions: RequestInit = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + process.env.WEB3_STORAGE_TOKEN
		},
		body: encodedIPNSRecord
	}

	const response = await fetch(endpoint, requestOptions)
	if (!response.ok) {
		throw new Error(JSON.stringify(await response.json()))
	}

	const result = await response.json()
	return result.id
}
