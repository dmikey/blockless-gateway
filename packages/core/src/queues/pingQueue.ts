import Bull from 'bull'

import NodePings from '../models/nodePing'
import { createQueue } from './queueUtils'

const pingQueue = createQueue('node-pings')

pingQueue.process(async (job) => {
	const { nodeId, metadata } = job.data
	await NodePings.create({
		nodeId,
		timestamp: new Date(),
		isB7SConnected: metadata?.isB7SConnected ?? false
	})
})

export default pingQueue
