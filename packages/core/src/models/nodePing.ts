import mongoose from 'mongoose'

import { IDocument } from '../interfaces/generic'

export interface INodePingModel extends IDocument {
	timestamp: Date
	nodeId: mongoose.Types.ObjectId
}

const NodePingSchema = new mongoose.Schema(
	{
		timestamp: { type: Date, required: true },
		nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true }
	},
	{
		timeseries: {
			timeField: 'timestamp',
			metaField: 'nodeId',
			granularity: 'minutes'
		}
	}
)

const NodePings = mongoose.model<INodePingModel>('NodePing', NodePingSchema)

export default NodePings
