const ENDPOINT = ''

export async function callEndpoint<T>(url: string, method: string, body?: unknown): Promise<T> {
	const requestOptions: RequestInit = {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined
	}

	const response = await fetch(`${ENDPOINT}${url}`, requestOptions)
	if (!response.ok) {
		throw new Error(JSON.stringify(await response.json()))
	}

	return await response.json()
}
