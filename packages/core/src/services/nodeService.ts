import mongoose from 'mongoose'

import Nodes, { INodeModel } from '../models/node'
import nodeQueue from '../queues/nodeQueue'

export async function registerNode(nodeData: {
	userId: string
	nodePubKey: string
	data: Partial<INodeModel>
}) {
	try {
		await nodeQueue.add({ nodeData })
	} catch (error) {
		console.error('Failed to add job to queue, falling back to direct database write:', error)
		await registerNodeInDatabase(nodeData)
	}
}

export async function registerNodeInDatabase(nodeData: {
	userId: string
	nodePubKey: string
	data: Partial<INodeModel>
}): Promise<INodeModel> {
	const { userId, nodePubKey, data } = nodeData

	const node = await Nodes.findOneAndUpdate(
		{ pubKey: nodePubKey, userId: new mongoose.Types.ObjectId(userId) },
		{ ...data, userId: new mongoose.Types.ObjectId(userId) },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	)

	return node
}
