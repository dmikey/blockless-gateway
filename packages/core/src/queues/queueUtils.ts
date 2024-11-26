import Bull from 'bull'

export function createQueue(queueName: string) {
	return new Bull(queueName, {
		redis: {
			host: process.env.REDIS_HOST || '127.0.0.1',
			port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
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
}
