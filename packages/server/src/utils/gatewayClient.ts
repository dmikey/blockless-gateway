import { Gateway } from '@blockless/gateway-core/dist/gateway'
import type { Socials } from '@blockless/gateway-core/dist/services/nodeUserTypes'

class GatewayClient {
	gatewayClient: Gateway
	private static instance: GatewayClient

	constructor() {
		this.gatewayClient = new Gateway({
			mongoUri: process.env.MONGO_DB_URI!,
			headNodeUri: process.env.HEAD_NODE_HOST!,
			encryptionKey: process.env.ENV_ENCRYPTION_SECRET!
		})
	}

	static getInstance() {
		if (!GatewayClient.instance) {
			GatewayClient.instance = new GatewayClient()
		}
		return GatewayClient.instance.gatewayClient
	}
}

const gatewayClient = GatewayClient.getInstance()
export default gatewayClient

// export types
export type { Socials as nodeUserSocials }
