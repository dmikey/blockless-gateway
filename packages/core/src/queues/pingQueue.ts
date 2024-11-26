import NodePings from "../models/nodePing";
import { createQueue } from "./queueUtils";

const pingQueue = createQueue("node-pings");

const batchSize = 100; // Define the batch size

interface Ping {
	nodeId: string;
	timestamp: Date;
	isB7SConnected: boolean;
}

let batch: Ping[] = [];
pingQueue.process(async (job) => {
	const { nodeId, metadata } = job.data;

	batch.push({
		nodeId,
		timestamp: new Date(),
		isB7SConnected: metadata?.isB7SConnected ?? false,
	});

	if (batch.length >= batchSize) {
		await flushBatch();
	}
});

async function flushBatch() {
	if (batch.length > 0) {
		try {
			await NodePings.insertMany(batch);
			batch = [];
		} catch (error) {
			console.error("Failed to insert batch:", error);
		}
	}
}

// Flush remaining batch on process exit
process.on("exit", async () => {
	await flushBatch();
});

export default pingQueue;
