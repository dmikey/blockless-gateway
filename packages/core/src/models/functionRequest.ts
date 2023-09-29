import { Schema, Types, model } from 'mongoose'

/**
 * Function Request Time-Series Schema
 */
export const FunctionRequestSchema = new Schema(
	{
		timestamp: Date,
		metadata: {
			functionId: { type: Types.ObjectId, ref: 'Function' }
		}
	},
	{
		timeseries: {
			timeField: 'timestamp',
			metaField: 'metadata'
		}
	}
)

FunctionRequestSchema.index({ 'metadata.functionId': 1, timestamp: 1 })
const FunctionRequest = model('FunctionRequest', FunctionRequestSchema)
export default FunctionRequest
