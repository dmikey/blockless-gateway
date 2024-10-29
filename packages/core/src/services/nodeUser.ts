import Nodes from '../models/node'
import NodeRewards from '../models/nodeReward'
import User from '../models/user'
import { fillMissingDates } from './node'

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
		// Calculate start of today without using a library
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		// Get the user's nodes
		const userNodes = await Nodes.find({ userId: { $regex: userId, $options: 'i' } })
		const nodeIds = userNodes.map((node) => node._id)

		// Get the rewards for today and all-time
		const rewardsAggregate = await NodeRewards.aggregate([
			{
				$match: {
					nodeId: { $in: nodeIds }
				}
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
		])

		const {
			todayBaseReward = 0,
			todayTotalReward = 0,
			allTimeBaseReward = 0,
			allTimeTotalReward = 0
		} = rewardsAggregate[0] || {}

		// TODO: Implement referral reward calculation
		const todayReferralsReward = 0
		const allTimeReferralsReward = 0

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
	referrals: unknown[]
	todayReferralTime: number
	totalReferralTime: number
}> {
	try {
		const user = await User.findOne({
			ethAddress: { $regex: userId, $options: 'i' }
		})

		const referrals = await User.find({
			refBy: { $regex: userId, $options: 'i' }
		})

		// Get all nodes belonging to referred users
		const referralUserIds = referrals.map((referral) => referral.ethAddress)
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

		return {
			isReferred: !!user?.refBy,
			refCode: user?.refCode || '',
			referrals,
			todayReferralTime,
			totalReferralTime
		}
	} catch (error) {
		console.error('Failed to get user referrals:', error)
		throw new Error('Failed to get user referrals')
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
): Promise<{ date: string; baseReward: number; totalReward: number }[]> {
	try {
		const startDate = new Date()
		const dateFormat = period === 'daily' ? '%Y-%m-%d' : '%Y-%m'

		if (period === 'daily') {
			startDate.setDate(startDate.getDate() - 14)
		} else {
			startDate.setMonth(startDate.getMonth() - 11)
		}

		const userNodes = await Nodes.find({ userId: { $regex: userId, $options: 'i' } })
		const nodeIds = userNodes.map((node) => node._id)

		const earnings = await NodeRewards.aggregate([
			{ $match: { nodeId: { $in: nodeIds }, timestamp: { $gte: startDate } } },
			{
				$group: {
					_id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
					baseReward: { $sum: '$baseReward' },
					totalReward: { $sum: '$totalReward' }
				}
			},
			{ $sort: { _id: 1 } },
			{ $project: { _id: 0, date: '$_id', baseReward: 1, totalReward: 1 } }
		])

		// Fill in missing dates with zero earnings
		const filledEarnings = fillMissingDates(earnings, period)

		return filledEarnings
	} catch (error) {
		console.error('Failed to get all user nodes earnings:', error)
		throw new Error('Failed to get all user nodes earnings')
	}
}
