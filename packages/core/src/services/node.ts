import { createHash } from 'crypto'

import Nodes, { INodeModel } from '../models/node'
import NodeSessions, { INodeSessionModel } from '../models/nodeSession'

/**
 * List all nodes for a user
 *
 * @param userId
 * @param data
 * @returns
 */
export async function listUserNodes(
	userId: string,
	data: { page?: number; limit?: number }
): Promise<INodeModel[]> {
	try {
		const page = data.page || 1
		const limit = data.limit || 10
		const skip = (page - 1) * limit

		const nodes = await Nodes.aggregate([
			{ $match: { userId: { $regex: userId, $options: 'i' } } },
			{
				$lookup: {
					from: 'nodesessions',
					let: { nodeId: '$_id' },
					pipeline: [{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } }],
					as: 'sessions'
				}
			},
			{ $sort: { updatedAt: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		])

		return nodes
	} catch (error) {
		return []
	}
}

/**
 * Get a node for a user
 *
 * @param userId
 * @param nodeId
 * @returns
 */
export async function getUserNode(userId: string, nodeId: string): Promise<INodeModel | null> {
	try {
		const node = await Nodes.findById({
			_id: nodeId,
			userId: { $regex: userId, $options: 'i' }
		}).populate('sessions')

		if (!node) {
			throw new Error('Node not found')
		}

		return node
	} catch (error) {
		throw new Error('Failed to get node')
	}
}

/**
 * Link a node with a user id
 *
 * @param userId
 * @param nodeId
 * @param signature
 * @returns
 */
export async function linkUserNode(
	userId: string,
	nodeId: string,
	signature: string
): Promise<INodeModel | null> {
	try {
		// Link a node with a user id
		const node = await Nodes.findByIdAndUpdate(nodeId, { userId }, { new: true })

		// TODO: verify signature with the user wallet address
		if (!node || !signature) {
			throw new Error('Failed to link node')
		}

		return node
	} catch (error) {
		throw new Error('Failed to link node')
	}
}

/**
 * Register a public node
 *
 * @param data
 * @returns
 */
export async function registerPublicNode(
	nodePubKey: string,
	data: Partial<INodeModel>
): Promise<INodeModel> {
	try {
		if (!nodePubKey) {
			throw new Error('Public key is required to register a node')
		}

		const node = await Nodes.findOneAndUpdate(
			{ pubKey: nodePubKey },
			{ ...data },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)

		return node
	} catch (error) {
		throw new Error('Failed to register node')
	}
}

/**
 * Start a public node session
 *
 * @param nodePubKey
 * @returns
 */
export async function startPublicNodeSession(nodePubKey: string): Promise<INodeSessionModel> {
	try {
		const node = await Nodes.findOne({ pubKey: nodePubKey })

		if (!node) {
			throw new Error('Node not found')
		}

		// End all previous sessions for this node
		await NodeSessions.updateMany(
			{ pubKey: nodePubKey, endAt: { $exists: false } },
			{ endAt: new Date() }
		)

		// Create a new session
		const session = await NodeSessions.create({ pubKey: node.pubKey, startAt: new Date() })

		return session
	} catch (error) {
		throw new Error('Failed to start node session')
	}
}

/**
 * End a public node session
 *
 * @param nodePubKey
 * @returns
 */
export async function endPublicNodeSession(nodePubKey: string): Promise<INodeSessionModel | null> {
	try {
		const session = await NodeSessions.findOneAndUpdate(
			{
				pubKey: nodePubKey,
				endAt: { $exists: false }
			},
			{ endAt: new Date() },
			{ new: true }
		)

		return session
	} catch (error) {
		throw new Error('Failed to end node session')
	}
}

/**
 * Get a node nonce
 *
 * @param nodePubKey
 * @returns
 */
export async function getPublicNodeNonce(nodePubKey: string, secret: string): Promise<string> {
	try {
		const currentMinute = Math.floor(Date.now() / 60000)

		const nonce = createHash('sha256')
			.update(secret + nodePubKey + currentMinute.toString())
			.digest('hex')

		return nonce
	} catch (error) {
		throw new Error('Failed to get node nonce')
	}
}
