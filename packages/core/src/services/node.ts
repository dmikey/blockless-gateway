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
		const isValid = await verifySignature(nodeId, signature)

		if (!isValid) {
			throw new Error('Invalid signature')
		}

		// Link a node with a user id
		const node = await Nodes.findByIdAndUpdate(nodeId, { userId }, { new: true })

		if (!node) {
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
export async function registerPublicNode(data: Partial<INodeModel>): Promise<INodeModel> {
	try {
		// Create a node with a pubkey and data, without user id
		const { pubKey, ...nodeData } = data

		if (!pubKey) {
			throw new Error('Public key is required to register a node')
		}

		const node = await Nodes.create({ pubKey, ...nodeData })

		return node
	} catch (error) {
		throw new Error('Failed to register node')
	}
}

/**
 * Start a public node session
 *
 * @param nodeId
 * @param signature
 * @returns
 */
export async function startPublicNodeSession(
	nodeId: string,
	signature: string
): Promise<INodeSessionModel> {
	try {
		const isValid = await verifySignature(nodeId, signature)

		if (!isValid) {
			throw new Error('Invalid signature')
		}

		const node = await Nodes.findById(nodeId)

		if (!node) {
			throw new Error('Node not found')
		}

		const session = await NodeSessions.create({ nodeId })

		return session
	} catch (error) {
		throw new Error('Failed to start node session')
	}
}

/**
 * End a public node session
 *
 * @param nodeId
 * @param sessionId
 * @param signature
 * @returns
 */
export async function endPublicNodeSession(
	nodeId: string,
	sessionId: string,
	signature: string
): Promise<INodeSessionModel | null> {
	try {
		const isValid = await verifySignature(nodeId, signature)

		if (!isValid) {
			throw new Error('Invalid signature')
		}

		const session = await NodeSessions.findByIdAndUpdate(
			{
				_id: sessionId,
				nodeId
			},
			{ endAt: new Date() },
			{ new: true }
		)

		return session
	} catch (error) {
		throw new Error('Failed to end node session')
	}
}

// Helper functions

/**
 * Verify a signature
 *
 * @param pubKey
 * @param signature
 * @returns
 */
export async function verifySignature(pubKey: string, signature: string): Promise<boolean> {
	try {
		const isValid = pubKey !== signature
		return isValid
	} catch (error) {
		return false
	}
}
