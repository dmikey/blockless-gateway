import Gateway from '@blockless/gateway-core'

class GatewayClient {
	gatewayClient: Gateway
	private static instance: GatewayClient

	constructor() {
		this.gatewayClient = new Gateway({
			mongoUri: process.env.MONGO_DB_URI!,
			headNodeUri: process.env.HEAD_NODE_HOST!
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
