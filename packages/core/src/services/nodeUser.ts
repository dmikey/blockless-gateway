import Nodes from '../models/node'
import NodeRewards from '../models/nodeReward'
import { fillMissingDates } from './node'

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
			startDate.setDate(startDate.getDate() - 29)
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
