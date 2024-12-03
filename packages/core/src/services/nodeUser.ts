import mongoose from 'mongoose'

import Nodes from '../models/node'
import NodeRewards from '../models/nodeReward'
import User from '../models/user'
import { fillMissingDates } from './node'
import type { Socials } from './nodeUserTypes'

/**
 * Get user overview
 *
 * @param userId
 * @returns
 */
export async function getUserOverview(userId: string): Promise<{
	todayBaseReward: number
	todayTotalReward: number
	todayReferralsReward: number
	allTimeBaseReward: number
	allTimeTotalReward: number
	allTimeReferralsReward: number
}> {
	try {
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		// Get user's referral code
		const user = await User.findById(userId)

		// Get referred users and their nodes
		const referredUsers = await User.find({
			refBy: user?.refCode
		})
		const referredUserIds = referredUsers.map((user) => user._id)
		const [userNodes, referralNodes] = await Promise.all([
			Nodes.find({ userId: new mongoose.Types.ObjectId(userId) }),
			Nodes.find({ userId: { $in: referredUserIds } })
		])

		const nodeIds = userNodes.map((node) => node._id)
		const referralNodeIds = referralNodes.map((node) => node._id)

		// Get direct rewards and referral rewards in parallel
		const [directRewards, referralRewards] = await Promise.all([
			NodeRewards.aggregate([
				{
					$match: { nodeId: { $in: nodeIds } }
				},
				{
					$group: {
						_id: null,
						todayBaseReward: {
							$sum: {
								$cond: [{ $gte: ['$timestamp', today] }, '$baseReward', 0]
							}
						},
						todayTotalReward: {
							$sum: {
								$cond: [{ $gte: ['$timestamp', today] }, '$totalReward', 0]
							}
						},
						allTimeBaseReward: { $sum: '$baseReward' },
						allTimeTotalReward: { $sum: '$totalReward' }
					}
				}
			]),
			NodeRewards.aggregate([
				{
					$match: { nodeId: { $in: referralNodeIds } }
				},
				{
					$group: {
						_id: null,
						todayReferralsReward: {
							$sum: {
								$cond: [{ $gte: ['$timestamp', today] }, { $multiply: ['$baseReward', 0.1] }, 0]
							}
						},
						allTimeReferralsReward: {
							$sum: { $multiply: ['$baseReward', 0.1] }
						}
					}
				}
			])
		])

		const {
			todayBaseReward = 0,
			todayTotalReward = 0,
			allTimeBaseReward = 0,
			allTimeTotalReward = 0
		} = directRewards[0] || {}

		const { todayReferralsReward = 0, allTimeReferralsReward = 0 } = referralRewards[0] || {}

		return {
			todayBaseReward,
			todayTotalReward,
			todayReferralsReward,
			allTimeBaseReward,
			allTimeTotalReward,
			allTimeReferralsReward
		}
	} catch (error) {
		console.error('Failed to get user overview:', error)
		throw new Error('Failed to get user overview')
	}
}

/**
 * Get user referrals and their rewards
 * @param userId
 * @returns Object containing referrals and total referral rewards
 */
export async function getUserReferrals(userId: string): Promise<{
	isReferred: boolean
	refCode: string
	referrals: Array<{ user: unknown; totalTime: number }>
	todayReferralTime: number
	totalReferralTime: number
}> {
	try {
		const user = await User.findById(userId)

		if (!user) {
			throw new Error('User not found')
		}

		const referrals = await User.find({
			refBy: user?.refCode || ''
		})

		// Get all nodes belonging to referred users
		const referralUserIds = referrals.map((referral) => referral._id.toString())
		const referralNodes = await Nodes.find({
			userId: { $in: referralUserIds }
		})
		const referralNodeIds = referralNodes.map((node) => node._id)

		// Calculate start of today
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		// Get rewards for referred nodes
		const rewardsAggregate = await NodeRewards.aggregate([
			{
				$match: {
					nodeId: { $in: referralNodeIds }
				}
			},
			{
				$group: {
					_id: null,
					todayTime: {
						$sum: {
							$cond: [{ $gte: ['$timestamp', today] }, '$baseReward', 0]
						}
					},
					totalTime: {
						$sum: '$baseReward'
					}
				}
			}
		])

		const { todayTime = 0, totalTime = 0 } = rewardsAggregate[0] || {}

		// Calculate 10% of the time (in minutes)
		const todayReferralTime = Math.floor(todayTime * 0.1)
		const totalReferralTime = Math.floor(totalTime * 0.1)

		// Get all nodes and rewards for each referred user
		const referralStats = await Promise.all(
			referrals.map(async (referral) => {
				const userNodes = await Nodes.find({
					userId: { $eq: referral._id }
				})
				const userNodeIds = userNodes.map((node) => node._id)

				const userRewards = await NodeRewards.aggregate([
					{
						$match: {
							nodeId: { $in: userNodeIds }
						}
					},
					{
						$group: {
							_id: null,
							totalTime: { $sum: '$baseReward' }
						}
					}
				])

				return {
					user: referral,
					totalTime: userRewards[0]?.totalTime || 0
				}
			})
		)

		return {
			isReferred: !!user?.refBy,
			refCode: user?.refCode || '',
			referrals: referralStats,
			todayReferralTime,
			totalReferralTime
		}
	} catch (error) {
		console.error('Failed to get user referrals:', error)
		throw new Error('Failed to get user referrals')
	}
}

/**
 * Update user referral code
 *
 * @param userId
 * @param refCode
 * @returns
 */
export async function updateUserReferral(
	userId: string,
	refCode: string
): Promise<{ updated: boolean }> {
	try {
		const [user, referrer] = await Promise.all([User.findById(userId), User.findOne({ refCode })])

		if (!user) {
			throw new Error('User not found')
		}

		if (!referrer) {
			throw new Error('Invalid referral code')
		}

		// Prevent self-referral
		if (user._id.toString() === referrer._id.toString()) {
			throw new Error('Cannot refer yourself')
		}

		// Only update if user doesn't already have a referral code
		if (user.refBy) {
			throw new Error('User already has a referral code')
		}

		await User.findByIdAndUpdate(userId, { refBy: refCode })
		return { updated: true }
	} catch (error) {
		console.error('Failed to update user referral:', error)
		throw new Error('Failed to update user referral')
	}
}

/**
 * Get user socials
 *
 * @param userId
 * @returns Object containing user social connections
 */
export async function getUserSocials(userId: string): Promise<{
	socials: Socials | undefined
}> {
	try {
		const user = await User.findById(userId)

		if (!user) {
			throw new Error('User not found')
		}

		return {
			socials: user.socialConnections
		}
	} catch (error) {
		console.error('Failed to get user socials:', error)
		throw new Error('Failed to get user socials')
	}
}

/**
 * Update user social connections
 *
 * @param userId
 * @param socials
 * @returns Object { updated: true }
 */
export async function updateUserSocials(
	userId: string,
	socials: Socials
): Promise<{ updated: boolean }> {
	try {
		const user = await User.findById(userId)

		if (!user) {
			throw new Error('User not found')
		}

		const updatedSocials = {
			'socialConnections.discordId': socials.discordId,
			'socialConnections.discordUsername': socials.discordUsername,
			'socialConnections.discordConnected': socials.discordConnected,
			'socialConnections.xId': socials.xId,
			'socialConnections.xUsername': socials.xUsername,
			'socialConnections.xConnected': socials.xConnected
		}

		await User.findByIdAndUpdate(userId, { $set: updatedSocials })
		return { updated: true }
	} catch (error) {
		console.error('Failed to update user socials:', error)
		throw new Error('Failed to update user socials')
	}
}

/**
 * Get earnings for a user's nodes for a given period
 *
 * @param userId
 * @param period - 'daily' or 'monthly'
 * @returns
 */
export async function getUserNodeEarnings(
	userId: string,
	period: 'daily' | 'monthly' = 'daily'
): Promise<
	{
		date: string
		baseReward: number
		totalReward: number
		referralReward: number
	}[]
> {
	try {
		const startDate = new Date()
		const dateFormat = period === 'daily' ? '%Y-%m-%d' : '%Y-%m'

		if (period === 'daily') {
			startDate.setDate(startDate.getDate() - 14)
		} else {
			startDate.setMonth(startDate.getMonth() - 11)
		}

		// Get user's referral code
		const user = await User.findById(userId)

		// Get referred users
		const referredUsers = await User.find({
			refBy: user?.refCode
		})
		const referredUserIds = referredUsers.map((user) => user._id)

		// Get nodes for both direct user and referrals
		const [userNodes, referralNodes] = await Promise.all([
			Nodes.find({ userId: new mongoose.Types.ObjectId(userId) }),
			Nodes.find({ userId: { $in: referredUserIds } })
		])

		const nodeIds = userNodes.map((node) => node._id)
		const referralNodeIds = referralNodes.map((node) => node._id)

		// Get earnings for both direct and referral nodes
		const [directEarnings, referralEarnings] = await Promise.all([
			NodeRewards.aggregate([
				{
					$match: { nodeId: { $in: nodeIds }, timestamp: { $gte: startDate } }
				},
				{
					$group: {
						_id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
						baseReward: { $sum: '$baseReward' },
						totalReward: { $sum: '$totalReward' }
					}
				},
				{ $sort: { _id: 1 } },
				{ $project: { _id: 0, date: '$_id', baseReward: 1, totalReward: 1 } }
			]),
			NodeRewards.aggregate([
				{
					$match: {
						nodeId: { $in: referralNodeIds },
						timestamp: { $gte: startDate }
					}
				},
				{
					$group: {
						_id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
						referralReward: { $sum: { $multiply: ['$baseReward', 0.1] } }
					}
				},
				{ $sort: { _id: 1 } },
				{ $project: { _id: 0, date: '$_id', referralReward: 1 } }
			])
		])

		// Merge direct and referral earnings
		const mergedEarnings = directEarnings.map((earning) => ({
			...earning,
			referralReward: referralEarnings.find((ref) => ref.date === earning.date)?.referralReward || 0
		}))

		// Fill in missing dates with zero earnings
		const filledEarnings = fillMissingDates(mergedEarnings, period)

		return filledEarnings
	} catch (error) {
		console.error('Failed to get all user nodes earnings:', error)
		throw new Error('Failed to get all user nodes earnings')
	}
}

export async function getUserLeaderboard(userId: string): Promise<{
	rank: number
	totalUsers: number
	leaderboard: Array<{
		address: string
		totalTime: number
		todayTime: number
		rank: number
		isCurrentUser: boolean
	}>
}> {
	try {
		// Calculate start of today
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		// Get all nodes and their user IDs
		const nodes = await Nodes.find({})
		const nodesByUser = nodes.reduce(
			(acc, node) => {
				if (!acc[node.userId]) acc[node.userId] = []
				acc[node.userId].push(node._id)
				return acc
			},
			{} as { [key: string]: string[] }
		)

		// Aggregate rewards for each user, including today's rewards
		const userRewards = await NodeRewards.aggregate([
			{
				$group: {
					_id: { $toString: '$nodeId' },
					totalReward: { $sum: '$totalReward' },
					todayReward: {
						$sum: {
							$cond: [{ $gte: ['$timestamp', today] }, '$totalReward', 0]
						}
					}
				}
			}
		])

		// Calculate total and today's rewards per user
		const userTotalRewards = Object.entries(nodesByUser).map(([userId, nodeIds]) => {
			const totalReward = nodeIds.reduce((sum, nodeId) => {
				const nodeReward = userRewards.find((reward) => reward._id === nodeId.toString())
				return sum + (nodeReward?.totalReward || 0)
			}, 0)
			const todayReward = nodeIds.reduce((sum, nodeId) => {
				const nodeReward = userRewards.find((reward) => reward._id === nodeId.toString())
				return sum + (nodeReward?.todayReward || 0)
			}, 0)
			return { userId, totalReward, todayReward }
		})

		// Sort users by total rewards and add ranks
		const rankedUsers = userTotalRewards
			.sort((a, b) => b.totalReward - a.totalReward)
			.map((user, index) => ({
				address: user.userId,
				totalTime: user.totalReward,
				todayTime: user.todayReward,
				rank: index + 1,
				isCurrentUser: user.userId.toLowerCase() === userId.toLowerCase()
			}))

		// Get top 100 users and ensure current user is included
		const leaderboard = rankedUsers.slice(0, 100)
		const currentUser = rankedUsers.find((user) => user.isCurrentUser)

		// If current user is not in top 100, add them at the end
		if (currentUser && !leaderboard.find((user) => user.isCurrentUser)) {
			leaderboard.push(currentUser)
		}

		return {
			rank: currentUser?.rank || 0,
			totalUsers: userTotalRewards.length,
			leaderboard
		}
	} catch (error) {
		console.error('Failed to get user leaderboard:', error)
		throw new Error('Failed to get user leaderboard')
	}
}
