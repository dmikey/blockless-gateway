import Bull from 'bull'
import mongoose from 'mongoose'

import Nodes, { INodeModel } from '../models/node'

const nodeQueue = new Bull('node-updates', {
	redis: {
		host: '127.0.0.1',
		port: 6379
	}
})

const batchSize = 100 // Define the batch size
interface JobData {
	nodeId: string
	updateData: Partial<INodeModel>
}

let batch: JobData[] = []

nodeQueue.process(async (job) => {
	batch.push(job.data)

	if (batch.length >= batchSize) {
		await flushBatch()
	}
})

async function flushBatch() {
	if (batch.length > 0) {
		try {
			const bulkOps = batch.map((data) => ({
				updateOne: {
					filter: { _id: new mongoose.Types.ObjectId(data.nodeId).toString() },
					update: { $set: data.updateData }
				}
			}))

			await Nodes.bulkWrite(bulkOps)
			batch = []
		} catch (error) {
			console.error('Failed to update batch:', error)
		}
	}
}

// Flush remaining batch on process exit
process.on('exit', async () => {
	await flushBatch()
})

export default nodeQueue
