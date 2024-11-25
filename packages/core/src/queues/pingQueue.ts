import Bull from 'bull'

import NodePings from '../models/nodePing'

const pingQueue = new Bull('node-pings', {
	redis: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: parseInt(process.env.REDIS_PORT, 10) || 6379
	},
	defaultJobOptions: {
		removeOnComplete: true,
		attempts: 3,
		backoff: {
			type: 'exponential',
			delay: 5000
		}
	}
})

pingQueue.process(async (job) => {
	const { nodeId, metadata } = job.data
	await NodePings.create({
		nodeId,
		timestamp: new Date(),
		isB7SConnected: metadata?.isB7SConnected ?? false
	})
})

export default pingQueue
