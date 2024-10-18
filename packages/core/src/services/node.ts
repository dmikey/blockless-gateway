import { createHash } from 'crypto'

import Nodes, { INodeModel } from '../models/node'
import NodeRewards from '../models/nodeReward'
import NodeSessions, { INodeSessionModel } from '../models/nodeSession'

/**
 * List all nodes for a user
 *
 * @param userId
 * @param data
 * @returns
 */
export async function listNodes(
	userId: string,
	data: { page?: number; limit?: number }
): Promise<
	(INodeModel & {
		totalReward: number
		sessions: INodeSessionModel[]
		totalSessionTime: number
		connected: boolean
	})[]
> {
	try {
		const page = data.page || 1
		const limit = data.limit || 10
		const skip = (page - 1) * limit

		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		const nodes = await Nodes.aggregate([
			{ $match: { userId: { $regex: userId, $options: 'i' } } },
			{
				$lookup: {
					from: 'noderewards',
					let: { nodeId: '$_id' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
						{
							$group: {
								_id: null,
								totalReward: { $sum: '$totalReward' },
								todayReward: {
									$sum: {
										$cond: [{ $gte: ['$timestamp', today] }, '$totalReward', 0]
									}
								}
							}
						}
					],
					as: 'rewards'
				}
			},
			{
				$lookup: {
					from: 'nodesessions',
					let: { nodeId: '$_id' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
						{ $sort: { startAt: -1 } },
						{ $limit: 1 }
					],
					as: 'sessions'
				}
			},
			{
				$addFields: {
					totalReward: { $ifNull: [{ $arrayElemAt: ['$rewards.totalReward', 0] }, 0] },
					todayReward: { $ifNull: [{ $arrayElemAt: ['$rewards.todayReward', 0] }, 0] }
				}
			},
			{ $project: { rewards: 0 } },
			{ $sort: { updatedAt: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		])

		// Add connected check and convert to regular objects
		const formattedNodes = await Promise.all(
			nodes.map(async (node) => {
				const latestSession = node.sessions[0]
				const nodeObject = Object.assign({}, node.toObject ? node.toObject() : node)

				return {
					...nodeObject,
					isConnected: latestSession?.endAt ? false : true
				}
			})
		)

		return formattedNodes
	} catch (error) {
		console.error('Failed to list user nodes:', error)
		return []
	}
}

/**
 * Get a node for a user
 *
 * @param userId
 * @param nodePubKey
 * @returns
 */
export async function getNode(
	userId: string,
	nodePubKey: string
): Promise<
	INodeModel & {
		totalReward: number
		todayReward: number
		sessions: INodeSessionModel[]
		isConnected: boolean
	}
> {
	try {
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		const nodes = await Nodes.aggregate([
			{ $match: { pubKey: nodePubKey, userId: { $regex: userId, $options: 'i' } } },
			{
				$lookup: {
					from: 'noderewards',
					let: { nodeId: '$_id' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
						{
							$group: {
								_id: null,
								totalReward: { $sum: '$totalReward' },
								todayReward: {
									$sum: {
										$cond: [{ $gte: ['$timestamp', today] }, '$totalReward', 0]
									}
								}
							}
						}
					],
					as: 'rewards'
				}
			},
			{
				$lookup: {
					from: 'nodesessions',
					let: { nodeId: '$_id' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
						{ $sort: { startAt: -1 } },
						{ $limit: 1 }
					],
					as: 'sessions'
				}
			},
			{
				$addFields: {
					totalReward: { $ifNull: [{ $arrayElemAt: ['$rewards.totalReward', 0] }, 0] },
					todayReward: { $ifNull: [{ $arrayElemAt: ['$rewards.todayReward', 0] }, 0] }
				}
			},
			{ $project: { rewards: 0 } }
		])

		if (!nodes || nodes.length === 0) {
			throw new Error('Node not found')
		}

		const formattedNodes = await Promise.all(
			nodes.map(async (node) => {
				const latestSession = node.sessions[0]
				const nodeObject = Object.assign({}, node.toObject ? node.toObject() : node)

				return {
					...nodeObject,
					isConnected: latestSession?.endAt ? false : true
				}
			})
		)

		return formattedNodes[0]
	} catch (error) {
		console.error('Failed to get node:', error)
		throw new Error('Failed to get node')
	}
}

/**
 * Get user node earnings for daily (last 30 days) or monthly (last 12 months)
 *
 * @param userId
 * @param nodePubKey
 * @param period - 'daily' or 'monthly'
 * @returns
 */
export async function getNodeEarnings(
	userId: string,
	nodePubKey: string,
	period: 'daily' | 'monthly' = 'daily'
): Promise<{ date: string; baseReward: number; totalReward: number }[]> {
	try {
		const node = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: { $regex: userId, $options: 'i' }
		})

		if (!node) {
			throw new Error('Node not found')
		}

		const startDate = new Date()
		const dateFormat = period === 'daily' ? '%Y-%m-%d' : '%Y-%m'

		if (period === 'daily') {
			startDate.setDate(startDate.getDate() - 29) // Last 30 days
		} else {
			startDate.setMonth(startDate.getMonth() - 11) // Last 12 months
		}

		const earnings = await NodeRewards.aggregate([
			{ $match: { nodeId: node._id, createdAt: { $gte: startDate } } },
			{
				$group: {
					_id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
					earnings: { $sum: '$totalReward' }
				}
			},
			{ $sort: { _id: 1 } },
			{ $project: { _id: 0, date: '$_id', earnings: 1 } }
		])

		// Fill in missing dates with zero earnings
		const filledEarnings = fillMissingDates(earnings, period)

		return filledEarnings
	} catch (error) {
		console.error('Failed to get user node earnings:', error)
		throw new Error('Failed to get user node earnings')
	}
}

/**
 * Register a node
 *
 * @param data
 * @returns
 */
export async function registerNode(
	userId: string,
	nodePubKey: string,
	data: Partial<INodeModel>
): Promise<INodeModel> {
	try {
		if (!nodePubKey) {
			throw new Error('Public key is required to register a node')
		}

		const node = await Nodes.findOneAndUpdate(
			{ pubKey: nodePubKey, userId: { $regex: userId, $options: 'i' } },
			{ ...data, userId },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)

		return node
	} catch (error) {
		throw new Error('Failed to register node')
	}
}

/**
 * Start a node session
 *
 * @param userId
 * @param nodePubKey
 * @returns
 */
export async function startNodeSession(
	userId: string,
	nodePubKey: string
): Promise<INodeSessionModel> {
	try {
		const node = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: { $regex: userId, $options: 'i' }
		})

		if (!node) {
			throw new Error('Node not found')
		}

		// End all previous sessions for this node
		await NodeSessions.updateMany(
			{ nodeId: node._id, endAt: { $exists: false } },
			{ endAt: new Date() }
		)

		// Create a new session
		const session = await NodeSessions.create({ nodeId: node._id, startAt: new Date() })

		return session
	} catch (error) {
		console.error(error)
		throw new Error('Failed to start node session')
	}
}

/**
 * End a node session
 *
 * @param userId
 * @param nodePubKey
 * @returns
 */
export async function endNodeSession(
	userId: string,
	nodePubKey: string
): Promise<INodeSessionModel | null> {
	try {
		const node = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: { $regex: userId, $options: 'i' }
		})

		if (!node) {
			throw new Error('Node not found')
		}

		const session = await NodeSessions.findOneAndUpdate(
			{
				nodeId: node._id,
				endAt: { $exists: false }
			},
			{ endAt: new Date() },
			{ new: true }
		)

		return session
	} catch (error) {
		console.error(error)
		throw new Error('Failed to end node session')
	}
}

/**
 *
 * @param userId
 * @param nodePubKey
 * @returns
 */
export async function pingNodeSession(
	userId: string,
	nodePubKey: string
): Promise<INodeSessionModel | null> {
	try {
		const node = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: { $regex: userId, $options: 'i' }
		})

		if (!node) {
			throw new Error('Node not found')
		}

		const now = new Date()

		// Find the active session for the node and update lastPingAt and pings
		const updatedSession = await NodeSessions.findOneAndUpdate(
			{
				nodeId: node._id,
				endAt: { $exists: false }
			},
			{
				$set: { lastPingAt: now },
				$push: { pings: { timestamp: now } }
			},
			{ new: true }
		)

		if (!updatedSession) {
			throw new Error('No active session found for this node')
		}

		return updatedSession
	} catch (error) {
		console.error('Failed to ping node session:', error)
		throw new Error('Failed to ping node session')
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

/**
 * Helper function to fill in missing dates with zero earnings
 */
export function fillMissingDates(
	rewards: { date: string; baseReward: number; totalReward: number }[],
	period: 'daily' | 'monthly'
): { date: string; baseReward: number; totalReward: number }[] {
	const filledEarnings: { date: string; baseReward: number; totalReward: number }[] = []
	const endDate = new Date()
	const startDate = new Date(endDate)

	if (period === 'daily') {
		startDate.setDate(startDate.getDate() - 14)
	} else {
		startDate.setMonth(startDate.getMonth() - 11)
	}

	for (
		let d = new Date(startDate);
		d <= endDate;
		period === 'daily' ? d.setDate(d.getDate() + 1) : d.setMonth(d.getMonth() + 1)
	) {
		const dateString =
			period === 'daily'
				? d.toISOString().split('T')[0]
				: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
		const existingEarning = rewards.find((e) => e.date === dateString)
		filledEarnings.push({
			date: dateString,
			baseReward: existingEarning ? existingEarning.baseReward : 0,
			totalReward: existingEarning ? existingEarning.totalReward : 0
		})
	}

	return filledEarnings
}

/**
 * Get active nodes for the last 10 minutes and add rewards
 *
 * @returns Array of active node IDs
 */
export async function processNodeRewards(): Promise<string[]> {
	try {
		const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

		// End sessions without pings in the last 10 minutes
		await NodeSessions.updateMany(
			{
				endAt: { $exists: false },
				$or: [
					{ lastPingAt: { $lt: tenMinutesAgo } },
					{ lastPingAt: { $exists: false }, startAt: { $lt: tenMinutesAgo } }
				]
			},
			{ $set: { endAt: new Date() } }
		)

		// Get active sessions
		const activeSessions = await NodeSessions.aggregate([
			{
				$match: {
					endAt: { $exists: false },
					$or: [
						{ lastPingAt: { $gte: tenMinutesAgo } },
						{ lastPingAt: { $exists: false }, startAt: { $gte: tenMinutesAgo } }
					]
				}
			},
			{
				$group: {
					_id: '$nodeId'
				}
			}
		])

		const activeNodeIds = activeSessions.map((session) => session._id)

		// Prepare rewards data for active nodes
		const rewardsData = activeNodeIds.map((nodeId) => ({
			nodeId,
			boost: 1,
			baseReward: 10,
			totalReward: 10,
			timestamp: new Date()
		}))

		// Insert rewards for all active nodes in a single operation
		await NodeRewards.insertMany(rewardsData)

		return activeNodeIds.map((id) => id.toString())
	} catch (error) {
		console.error('Failed to get active nodes and add rewards:', error)
		throw new Error('Failed to get active nodes and add rewards')
	}
}
