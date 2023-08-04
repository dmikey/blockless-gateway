import mongoose from 'mongoose'

import { BaseErrors } from './errors'
import { generateUserChallenge, getUser, verifyUserWalletSignature } from './services/auth'
import {
	createFunction,
	deleteFunction,
	getFunction,
	listFunctions,
	updateFunction,
	updateFunctionEnvVars
} from './services/functions'
import { callHeadNodeFunction, installHeadNodeFunction } from './services/headNode'
import { lookupAndInvokeFunction } from './services/invoke'

interface GatewayOptions {
	mongoUri: string
	headNodeUri: string
}

export class Gateway {
	_mongoUri: string
	_headNodeUri: string

	auth: {
		getUser: typeof getUser
		getChallenge: typeof generateUserChallenge
		verifySignature: typeof verifyUserWalletSignature
	}

	functions: {
		list: typeof listFunctions
		create: typeof createFunction
		get: typeof getFunction
		update: typeof updateFunction
		updateEnvVars: typeof updateFunctionEnvVars
		delete: typeof deleteFunction
		invoke: typeof lookupAndInvokeFunction
	}

	headNode: {
		callFunction: typeof callHeadNodeFunction
		installFunction: typeof installHeadNodeFunction
	}

	constructor(options: GatewayOptions) {
		this._headNodeUri = options.mongoUri

		if (options.mongoUri) {
			this.setConnection(options.mongoUri)
		}

		this.functions = {
			list: listFunctions.bind(this),
			create: createFunction.bind(this),
			get: getFunction.bind(this),
			update: updateFunction.bind(this),
			updateEnvVars: updateFunctionEnvVars.bind(this),
			delete: deleteFunction.bind(this),
			invoke: lookupAndInvokeFunction.bind(this)
		}

		this.auth = {
			getUser: getUser.bind(this),
			getChallenge: generateUserChallenge.bind(this),
			verifySignature: verifyUserWalletSignature.bind(this)
		}

		this.headNode = {
			callFunction: callHeadNodeFunction.bind(this),
			installFunction: installHeadNodeFunction.bind(this)
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
