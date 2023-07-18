import { IDocument } from './generic'

export interface IFunctionRequestData {
	method?: string
	path?: string
	params?: { [key: string]: string }
	query?: { [key: string]: string }
	headers?: { [key: string]: string }
	body?: unknown
}

export interface IFunctionManifestRecord {
	entry: string
	permissions: string[]
}

export interface IFunctionEnvVarRecord {
	name: string
	value: string
	iv: string
}

export interface IFunctionRecord extends IDocument {
	userId: string
	invocationId: string
	functionId: string
	functionName: string
	status: string
	type: string

	envVars: IFunctionEnvVarRecord[]
	domainMappings: { domain: string }[]
}
