import mongoose from 'mongoose'

import { IDocument } from '../interfaces/generic'

export interface INodeRewardModel extends IDocument {
	nodeId: mongoose.Types.ObjectId
	timestamp: Date
	boost: number
	baseReward: number
	totalReward: number
}

const NodeRewardSchema = new mongoose.Schema(
	{
		timestamp: { type: Date, default: Date.now },

		nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
		boost: { type: Number, required: true },
		baseReward: { type: Number, required: true },
		totalReward: { type: Number, required: true }
	},
	{
		timeseries: {
			timeField: 'timestamp',
			metaField: 'nodeId',
			granularity: 'minutes'
		}
	}
)

const NodeRewards = mongoose.model<INodeRewardModel>('NodeReward', NodeRewardSchema)

export default NodeRewards
