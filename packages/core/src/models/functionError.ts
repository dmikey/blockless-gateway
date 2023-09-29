import { Schema, Types, model } from 'mongoose'

/**
 * Function Request Time-Series Schema
 */
export const FunctionErrorSchema = new Schema(
	{
		timestamp: Date,
		metadata: {
			functionId: { type: Types.ObjectId, ref: 'Function' }
		},
		errorCode: String,
		errorMessage: String
	},
	{
		timeseries: {
			timeField: 'timestamp',
			metaField: 'metadata'
		}
	}
)

FunctionErrorSchema.index({ 'metadata.functionId': 1, timestamp: 1 })
const FunctionError = model('FunctionError', FunctionErrorSchema)
export default FunctionError
