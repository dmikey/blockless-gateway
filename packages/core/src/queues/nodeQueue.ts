import Bull from 'bull'

import { registerNodeInDatabase } from '../services/nodeService'

const nodeQueue = new Bull('node-registrations', {
	redis: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: parseInt(process.env.REDIS_PORT, 10) || 6379
	},
	defaultJobOptions: {
		removeOnComplete: true, // Automatically remove completed jobs
		attempts: 3, // Retry failed jobs up to 3 times
		backoff: {
			type: 'exponential',
			delay: 5000 // Initial delay of 5 seconds between retries
		}
	}
})

nodeQueue.process(async (job) => {
	const { nodeData } = job.data
	await registerNodeInDatabase(nodeData)
})

export default nodeQueue
