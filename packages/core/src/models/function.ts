import mongoose from 'mongoose'

import { IDocument } from '../interfaces/generic'

export enum FunctionType {
	FUNCTION = 'function',
	SITE = 'site'
}

export enum FunctionStatus {
	PENDING = 'pending',
	BUILDING = 'building',
	PREPARING = 'preparing',
	DEPLOYING = 'deploying',
	FAILED = 'failed',
	DEPLOYED = 'deployed',
	STOPPED = 'stopped'
}

export const FunctionTypes = [FunctionType.FUNCTION, FunctionType.SITE]
export const FunctionStatuses = [
	FunctionStatus.PENDING,
	FunctionStatus.BUILDING,
	FunctionStatus.PREPARING,
	FunctionStatus.DEPLOYING,
	FunctionStatus.FAILED,
	FunctionStatus.DEPLOYED,
	FunctionStatus.STOPPED
]

export interface IFunctionRequestData {
	host?: string
	method?: string
	path?: string
	params?: { [key: string]: string }
	query?: { [key: string]: string }
	headers?: { [key: string]: string }
	body?: unknown
}

export interface IFunctionManifestRecord {
	name: string
	entry: string
	contentType: string
	permissions: string[]
}

export interface IFunctionEnvVarRecord {
	name: string
	value: string
	iv?: string
}

export interface IFunctionRecord extends IDocument {
	userId: string
	invocationId: string
	functionId: string
	functionName: string
	status: string
	type: string

	envVars: IFunctionEnvVarRecord[]
	secretManagement: {
		hashicorp: {
			clientId: string
			clientSecret: string
			iv: string
		}
	}

	subdomain: string
	domainMappings: { domain: string }[]

	manifest?: IFunctionManifestRecord
}

const FunctionEnvVars = new mongoose.Schema(
	{
		name: String,
		value: {
			type: String,
			select: false
		},
		iv: {
			type: String,
			select: false
		}
	},
	{
		timestamps: true
	}
)

const FunctionDomainMapping = new mongoose.Schema(
	{
		domain: {
			type: String,
			required: true
		}
	},
	{
		timestamps: true
	}
)

const FunctionSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true },
		invocationId: { type: String, required: true },
		functionName: { type: String, required: true },
		functionId: { type: String, required: false },

		status: {
			type: String,
			enum: FunctionStatuses
		},
		type: {
			type: String,
			enum: FunctionTypes,
			default: FunctionType.FUNCTION
		},

		envVars: [FunctionEnvVars],
		secretManagement: {
			hashicorp: {
				clientId: String,
				clientSecret: String,
				iv: String
			}
		},

		subdomain: { type: String, required: true },
		domainMappings: [FunctionDomainMapping]
	},
	{
		timestamps: true
	}
)

export type IFunctionModel = IFunctionRecord & mongoose.Document

const Functions = mongoose.model<IFunctionModel>('Function', FunctionSchema)
export default Functions
