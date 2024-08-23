export interface IHeadNodePayload {
	function_id: string
	method: string
	parameters: unknown
	config: {
		permissions: string[]
		env_vars: {
			name: string
			value: string
		}[]
		stdin: string
		number_of_nodes: number
	}
}

export interface IHeadNodeResponse {
	result: string
	results: {
		result: {
			stdout: string
			stderr: string
			exit_code: number
		}
		peerds: string[]
		frequency: number
	}[]
}
