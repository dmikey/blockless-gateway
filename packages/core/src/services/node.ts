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
	(INodeModel & { totalReward: number; sessions: INodeSessionModel[]; totalSessionTime: number })[]
> {
	try {
		const page = data.page || 1
		const limit = data.limit || 10
		const skip = (page - 1) * limit

		const nodes = await Nodes.aggregate([
			{ $match: { userId: { $regex: userId, $options: 'i' } } },
			{
				$lookup: {
					from: 'noderewards',
					let: { nodeId: '$_id' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
						{ $group: { _id: null, totalReward: { $sum: '$totalReward' } } }
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
						{ $limit: 10 }
					],
					as: 'sessions'
				}
			},
			{
				$addFields: {
					totalReward: { $ifNull: [{ $arrayElemAt: ['$rewards.totalReward', 0] }, 0] },
					totalSessionTime: {
						$reduce: {
							input: '$sessions',
							initialValue: 0,
							in: {
								$add: [
									'$$value',
									{
										$subtract: [{ $ifNull: ['$$this.endAt', new Date()] }, '$$this.startAt']
									}
								]
							}
						}
					}
				}
			},
			{ $project: { rewards: 0 } },
			{ $sort: { updatedAt: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		])

		return nodes
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
	INodeModel & { totalReward: number; sessions: INodeSessionModel[]; totalSessionTime: number }
> {
	try {
		const node = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: { $regex: userId, $options: 'i' }
		}).lean()

		if (!node) {
			throw new Error('Node not found')
		}

		// Calculate total reward for the node
		const totalReward = await NodeRewards.aggregate([
			{ $match: { nodeId: node._id } },
			{ $group: { _id: null, total: { $sum: '$totalReward' } } }
		]).then((result) => result[0]?.total || 0)

		// Get all sessions for the node
		const sessions = await NodeSessions.find({ nodeId: node._id }).lean()

		// Calculate total session time
		const totalSessionTime = sessions.reduce((total, session) => {
			const endTime = session.endAt || new Date()
			const sessionDuration = endTime.getTime() - session.startAt.getTime()
			return total + sessionDuration
		}, 0)

		// Get the last 10 sessions for the node
		const recentSessions = sessions
			.sort((a, b) => b.startAt.getTime() - a.startAt.getTime())
			.slice(0, 10)

		return { ...node, totalReward, sessions: recentSessions, totalSessionTime }
	} catch (error) {
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
): Promise<{ date: string; earnings: number }[]> {
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
	earnings: { date: string; earnings: number }[],
	period: 'daily' | 'monthly'
): { date: string; earnings: number }[] {
	const filledEarnings: { date: string; earnings: number }[] = []
	const endDate = new Date()
	const startDate = new Date(endDate)

	if (period === 'daily') {
		startDate.setDate(startDate.getDate() - 29) // Last 30 days
	} else {
		startDate.setMonth(startDate.getMonth() - 11) // Last 12 months
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
		const existingEarning = earnings.find((e) => e.date === dateString)
		filledEarnings.push({
			date: dateString,
			earnings: existingEarning ? existingEarning.earnings : 0
		})
	}

	return filledEarnings
}
