import mongoose from 'mongoose'

import Nodes, { INodeModel } from '../models/node'
import nodeQueue from '../queues/nodeQueue'
import pingQueue from '../queues/pingQueue'

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

export async function pingNodeSession(
	userId: string,
	nodePubKey: string,
	metadata?: {
		isB7SConnected?: boolean
	}
): Promise<INodePingModel | null> {
	try {
		const node = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: new mongoose.Types.ObjectId(userId)
		})

		if (!node) {
			throw new Error('Node not found')
		}

		await pingQueue.add({ nodeId: node._id, metadata })

		return null
	} catch (error) {
		console.error('Failed to ping node session:', error)
		throw new Error('Failed to ping node session')
	}
}
