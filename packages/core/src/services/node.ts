import { createHash } from 'crypto'
import mongoose from 'mongoose'

import Nodes, { INodeModel } from '../models/node'
import NodeRewards from '../models/nodeReward'
import NodeSessions, { INodeSessionModel } from '../models/nodeSession'
import User from '../models/user'
import nodeQueue from '../queues/nodeQueue'
import pingQueue from '../queues/pingQueue'
import redis from './redisClient'

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
			{ $match: { userId: new mongoose.Types.ObjectId(userId) } },
			{
				$lookup: {
					from: 'noderewards',
					let: { nodeId: '$_id' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
						{
							$group: {
								_id: null,
								totalReward: { $sum: '$baseReward' },
								todayReward: {
									$sum: {
										$cond: [{ $gte: ['$timestamp', today] }, '$baseReward', 0]
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
					totalReward: {
						$ifNull: [{ $arrayElemAt: ['$rewards.totalReward', 0] }, 0]
					},
					todayReward: {
						$ifNull: [{ $arrayElemAt: ['$rewards.todayReward', 0] }, 0]
					}
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
					isConnected: latestSession && !latestSession.endAt ? true : false
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
			{
				$match: {
					pubKey: nodePubKey,
					userId: new mongoose.Types.ObjectId(userId)
				}
			},
			{
				$lookup: {
					from: 'noderewards',
					let: { nodeId: '$_id' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
						{
							$group: {
								_id: null,
								totalReward: { $sum: '$baseReward' },
								todayReward: {
									$sum: {
										$cond: [{ $gte: ['$timestamp', today] }, '$baseReward', 0]
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
					totalReward: {
						$ifNull: [{ $arrayElemAt: ['$rewards.totalReward', 0] }, 0]
					},
					todayReward: {
						$ifNull: [{ $arrayElemAt: ['$rewards.todayReward', 0] }, 0]
					}
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
					isConnected: latestSession && !latestSession.endAt ? true : false
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
			userId: new mongoose.Types.ObjectId(userId)
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
 * @param userId
 * @param nodePubKey
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

		// Check if the user exists
		const user = await User.findById(userId)
		if (!user) {
			throw new Error('User not found')
		}

		// Count existing nodes for the user
		const nodeCount = await Nodes.countDocuments({
			userId: new mongoose.Types.ObjectId(userId)
		})

		// Check if the node already exists
		const existingNode = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: new mongoose.Types.ObjectId(userId)
		})

		// If the node doesn't exist and the user has 5 or more nodes, throw an error
		if (!existingNode && nodeCount >= 5) {
			throw new Error('Maximum number of nodes (5) reached for this account')
		}

		// Add node registration job to the queue
		await nodeQueue.add({ nodeData: { userId, nodePubKey, data } })

		return (
			existingNode ||
			new Nodes({
				pubKey: nodePubKey,
				userId: new mongoose.Types.ObjectId(userId),
				...data
			})
		)
	} catch (error) {
		console.log('register node error', error)
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
			userId: new mongoose.Types.ObjectId(userId)
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
		const session = await NodeSessions.create({
			nodeId: node._id,
			startAt: new Date()
		})

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
			userId: new mongoose.Types.ObjectId(userId)
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
	nodePubKey: string,
	metadata?: {
		isB7SConnected?: boolean
	}
): Promise<INodeModel | null> {
	try {
		const cacheKey = `node:${userId}:${nodePubKey}`
		const cachedNode = await redis.get(cacheKey)

		if (cachedNode) {
			return JSON.parse(cachedNode)
		}

		const node = await Nodes.findOne({
			pubKey: nodePubKey,
			userId: new mongoose.Types.ObjectId(userId)
		})

		if (!node) {
			throw new Error('Node not found')
		}

		// Cache for 1 hour
		await redis.set(cacheKey, JSON.stringify(node), 'EX', 3600)

		await pingQueue.add({ nodeId: node._id, metadata })

		return null
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
	rewards: {
		date: string
		baseReward: number
		totalReward: number
		referralReward?: number
	}[],
	period: 'daily' | 'monthly'
): {
	date: string
	baseReward: number
	totalReward: number
	referralReward: number
}[] {
	const filledEarnings: {
		date: string
		baseReward: number
		totalReward: number
		referralReward: number
	}[] = []
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
			totalReward: existingEarning ? existingEarning.totalReward : 0,
			referralReward: existingEarning ? existingEarning.referralReward || 0 : 0
		})
	}

	return filledEarnings
}

/**
 * Process removal of dangling nodes
 */
export async function processRemovalDanglingNodes(): Promise<void> {
	try {
		const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)

		// End sessions without pings in the last 2 minutes
		await NodeSessions.updateMany(
			{
				endAt: { $exists: false },
				$or: [
					{ lastPingAt: { $lt: twoMinutesAgo } },
					{ lastPingAt: { $exists: false }, startAt: { $lt: twoMinutesAgo } }
				]
			},
			{ $set: { endAt: new Date() } }
		)
	} catch (error) {
		console.error('Failed to process removal of dangling nodes:', error)
		throw new Error('Failed to process removal of dangling nodes')
	}
}

/**
 * Get active nodes for the last 10 minutes and add rewards
 *
 * @returns Array of active node IDs
 */
export async function processNodeRewards(): Promise<string[]> {
	try {
		const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

		await processRemovalDanglingNodes()

		// Get active sessions
		const activeSessions = await NodeSessions.aggregate([
			{
				$match: {
					endAt: { $exists: false },
					$or: [
						{ lastPingAt: { $gte: tenMinutesAgo } },
						{
							lastPingAt: { $exists: false },
							startAt: { $gte: tenMinutesAgo }
						}
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

		// Get nodes with their user information to check for referrals
		const nodesWithUsers = await Nodes.aggregate([
			{
				$match: {
					_id: { $in: activeNodeIds }
				}
			},
			{
				$lookup: {
					from: 'users',
					let: { userId: '$userId' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
						{
							$project: {
								refBy: 1,
								isTwitterConnected: 1,
								isDiscordConnected: 1
							}
						}
					],
					as: 'user'
				}
			}
		])

		// Prepare rewards data with referral boost
		const rewardsData = nodesWithUsers.map((node) => {
			const hasBeenReferred = node.user?.[0]?.refBy
			const hasConnectedTwitter = node.user?.[0]?.isTwitterConnected
			const hasConnectedDiscord = node.user?.[0]?.isDiscordConnected

			// Calculate total boost:
			const referralBoost = hasBeenReferred ? 0.1 : 0 // 10% boost if referred
			const twitterBoost = hasConnectedTwitter ? 0.05 : 0 // 5% boost if connected to Twitter
			const discordBoost = hasConnectedDiscord ? 0.05 : 0 // 5% boost if connected to Discord
			const totalBoost = 1 + (referralBoost + twitterBoost + discordBoost)

			const baseReward = 10

			return {
				nodeId: node._id,
				boost: totalBoost,
				baseReward,
				totalReward: baseReward * totalBoost,
				timestamp: new Date()
			}
		})

		// Insert rewards for all active nodes in a single operation
		await NodeRewards.insertMany(rewardsData)

		return activeNodeIds.map((id) => id.toString())
	} catch (error) {
		console.error('Failed to get active nodes and add rewards:', error)
		throw new Error('Failed to get active nodes and add rewards')
	}
}
