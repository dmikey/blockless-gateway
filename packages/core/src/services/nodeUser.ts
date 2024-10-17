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
export async function getUserOverview(
	userId: string
): Promise<{ todayBaseReward: number; todayTotalReward: number; todayReferralsReward: number }> {
	try {
		// Calculate start of today without using a library
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		// Get the user's nodes
		const userNodes = await Nodes.find({ userId: { $regex: userId, $options: 'i' } })
		const nodeIds = userNodes.map((node) => node._id)

		// Get the rewards for today
		const rewardsAggregate = await NodeRewards.aggregate([
			{
				$match: {
					nodeId: { $in: nodeIds },
					timestamp: { $gte: today }
				}
			},
			{
				$group: {
					_id: null,
					todayBaseReward: { $sum: '$baseReward' },
					todayTotalReward: { $sum: '$totalReward' }
				}
			}
		])

		const { todayBaseReward = 0, todayTotalReward = 0 } = rewardsAggregate[0] || {}

		return {
			todayBaseReward,
			todayTotalReward,
			todayReferralsReward: 0
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
export async function getUserReferrals(
	userId: string
): Promise<{ referrals: unknown[]; totalReferralReward: number }> {
	try {
		const referrals = await User.find({
			refBy: { $regex: userId, $options: 'i' }
		})

		return {
			referrals,
			totalReferralReward: 0
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
