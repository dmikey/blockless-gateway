import mongoose from 'mongoose'

import { IDocument } from '../interfaces/generic'

export interface INodeSessionModel extends IDocument {
	startAt: Date
	endAt: Date
	lastPingAt: Date
	pings: {
		timestamp: Date
	}[]
}

const NodeSessionSchema = new mongoose.Schema({
	nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
	startAt: { type: Date, required: true },
	endAt: { type: Date },
	lastPingAt: { type: Date, required: false },
	pings: [
		{
			timestamp: { type: Date, required: true }
		}
	]
})
const NodeSessions = mongoose.model<INodeSessionModel>('NodeSession', NodeSessionSchema)

export default NodeSessions
