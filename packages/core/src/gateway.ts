import mongoose from 'mongoose'

import { BaseErrors } from './errors'
import { generateUserChallenge, getUser, verifyUserWalletSignature } from './services/auth'
import { fetchFunctionManifest, storeFunctionManifest } from './services/functionManifests'
import {
	createFunction,
	deleteFunction,
	deployFunction,
	getFunction,
	listFunctions,
	updateFunction,
	updateFunctionEnvVars,
	updateFunctionSecrets
} from './services/functions'
import { lookupAndInvokeFunction } from './services/invoke'
import {
	endNodeSession,
	getNode,
	getNodeEarnings,
	listNodes,
	pingNodeSession,
	processNodeRewards,
	registerNode,
	startNodeSession
} from './services/node'
import { getUserNodeEarnings, getUserOverview, getUserReferrals } from './services/nodeUser'

interface GatewayOptions {
	mongoUri: string
	headNodeUri: string
	encryptionKey?: string
}

export class Gateway {
	_mongoUri: string
	_headNodeUri: string
	_encryptionKey?: string | undefined

	auth: {
		getUser: OmitThisParameter<typeof getUser>
		getChallenge: OmitThisParameter<typeof generateUserChallenge>
		verifySignature: OmitThisParameter<typeof verifyUserWalletSignature>
	}

	user: {
		getOverview: OmitThisParameter<typeof getUserOverview>
		getEarnings: OmitThisParameter<typeof getUserNodeEarnings>
		getReferrals: OmitThisParameter<typeof getUserReferrals>
	}

	functions: {
		list: OmitThisParameter<typeof listFunctions>
		create: OmitThisParameter<typeof createFunction>
		get: OmitThisParameter<typeof getFunction>
		update: OmitThisParameter<typeof updateFunction>
		updateEnvVars: OmitThisParameter<typeof updateFunctionEnvVars>
		updateSecrets: OmitThisParameter<typeof updateFunctionSecrets>
		delete: OmitThisParameter<typeof deleteFunction>
		deploy: OmitThisParameter<typeof deployFunction>
		invoke: OmitThisParameter<typeof lookupAndInvokeFunction>
	}

	functionManifests: {
		fetch: OmitThisParameter<typeof fetchFunctionManifest>
		store: OmitThisParameter<typeof storeFunctionManifest>
	}

	nodes: {
		list: OmitThisParameter<typeof listNodes>
		get: OmitThisParameter<typeof getNode>
		getEarnings: OmitThisParameter<typeof getNodeEarnings>
		register: OmitThisParameter<typeof registerNode>
		startSession: OmitThisParameter<typeof startNodeSession>
		endSession: OmitThisParameter<typeof endNodeSession>
		pingSession: OmitThisParameter<typeof pingNodeSession>
	}

	nodesAdmin: {
		processNodeRewards: OmitThisParameter<typeof processNodeRewards>
	}

	constructor(options: GatewayOptions) {
		this._mongoUri = options.mongoUri
		this._headNodeUri = options.headNodeUri

		if (options.encryptionKey) {
			this._encryptionKey = options.encryptionKey
		}

		if (options.mongoUri) {
			this.setConnection(options.mongoUri)
		}

		this.functions = {
			list: listFunctions.bind(this),
			create: createFunction.bind(this),
			get: getFunction.bind(this),
			update: updateFunction.bind(this),
			updateEnvVars: updateFunctionEnvVars.bind(this),
			updateSecrets: updateFunctionSecrets.bind(this),
			delete: deleteFunction.bind(this),
			deploy: deployFunction.bind(this),
			invoke: lookupAndInvokeFunction.bind(this)
		}

		this.functionManifests = {
			fetch: fetchFunctionManifest.bind(this),
			store: storeFunctionManifest.bind(this)
		}

		this.auth = {
			getUser: getUser.bind(this),
			getChallenge: generateUserChallenge.bind(this),
			verifySignature: verifyUserWalletSignature.bind(this)
		}

		this.user = {
			getOverview: getUserOverview.bind(this),
			getEarnings: getUserNodeEarnings.bind(this),
			getReferrals: getUserReferrals.bind(this)
		}

		this.nodes = {
			list: listNodes.bind(this),
			get: getNode.bind(this),
			getEarnings: getNodeEarnings.bind(this),
			register: registerNode.bind(this),
			startSession: startNodeSession.bind(this),
			endSession: endNodeSession.bind(this),
			pingSession: pingNodeSession.bind(this)
		}

		this.nodesAdmin = {
			processNodeRewards: processNodeRewards.bind(this)
		}
	}

	async setConnection(mongoUri: string) {
		try {
			await mongoose.connect(mongoUri)
			this._mongoUri = mongoUri
		} catch (error) {
			throw new BaseErrors.ERR_INVALID_DB_CONNECTION()
		}
	}
}
