import mongoose from 'mongoose'

import { IDocument } from '../interfaces/generic'

export interface INodeModel extends IDocument {
	pubKey: string
	userId: string
	ipAddress?: string
	hardwareId?: string
}

const NodeSchema = new mongoose.Schema(
	{
		pubKey: { type: String, required: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		ipAddress: { type: String, required: false },
		hardwareId: { type: String, required: false }
	},
	{
		timestamps: true
	}
)

const Nodes = mongoose.model<INodeModel>('Node', NodeSchema)

export default Nodes
