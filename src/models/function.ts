import mongoose from 'mongoose'
import { FunctionTypes, FunctionType, FunctionStatuses } from '../constants/enum'

const FunctionEnvVars = new mongoose.Schema({
	name: String,
	value: {
		type: String,
		select: false
	},
	iv: {
		type: String,
		select: false
	}
})

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
		domainMappings: [FunctionDomainMapping]
	},
	{
		timestamps: true
	}
)

export const Functions = mongoose.model('Function', FunctionSchema)
