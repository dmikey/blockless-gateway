import { registerNodeInDatabase } from '../services/nodeService'
import { createQueue } from './queueUtils'

const nodeQueue = createQueue('node-registrations')

nodeQueue.process(async (job) => {
	const { nodeData } = job.data
	await registerNodeInDatabase(nodeData)
})

export default nodeQueue
