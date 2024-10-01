import mongoose from 'mongoose'

import { IDocument } from '../interfaces/generic'

export interface INodeSessionModel extends IDocument {
	startAt: Date
	endAt: Date
}

const NodeSessionSchema = new mongoose.Schema(
	{
		nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
		startAt: { type: Date, required: true },
		endAt: { type: Date }
	},
	{
		timestamps: true
	}
)
const NodeSessions = mongoose.model<INodeSessionModel>('NodeSession', NodeSessionSchema)

export default NodeSessions
