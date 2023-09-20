import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

import Gateway, {
	generateSubdomain,
	parseFunctionEnvVars,
	parseFunctionRequestVars,
	validateFunctionName
} from '../src'
import { BaseErrors } from '../src/errors'
import Functions from '../src/models/function'

// Constants
const USER_ADDRESS = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
const FN_TYPE = 'function'
const FN_NAME = 'test-function-1'
const FN_NAME_UPDATED = 'test-function-2'
const FN_CID = 'bafybeiald42yx3lkemmyrfzcjlav3iyobvvfq4dneqnkofbfdix6qjxypi'
const FN_SUBDOMAIN = 'test-function-1-d41db603'
const ENCRYPTION_KEY = '8a156354cc87f9b44f1c434d1e049178'

// Variables
let fnId = ''

// Test Database
let blsGateway: Gateway
let mongoServer: MongoMemoryServer

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.8' } })

	blsGateway = new Gateway({
		mongoUri: mongoServer.getUri('test'),
		headNodeUri: 'https://head.bls.dev',
		encryptionKey: ENCRYPTION_KEY
	})
}, 10000)

describe('Functions Controller', () => {
	it('should create a function', async () => {
		const fn = await blsGateway.functions.create(FN_TYPE, USER_ADDRESS, {
			functionName: FN_NAME,
			functionId: FN_CID
		})

		expect(fn.userId).toBe(USER_ADDRESS)
		expect(fn.functionName).toBe(FN_NAME)
		expect(fn.functionId).toBe(FN_CID)

		fnId = fn._id
	})

	it('should not create a function with a duplicate name', async () => {
		await expect(
			blsGateway.functions.create(FN_TYPE, USER_ADDRESS, {
				functionName: FN_NAME,
				functionId: FN_CID
			})
		).rejects.toThrow(BaseErrors.ERR_FUNCTION_NAME_EXISTS)
	})

	it('should fetch a single function by id', async () => {
		const fn = await blsGateway.functions.get(FN_TYPE, USER_ADDRESS, fnId)
		expect(fn._id).toStrictEqual(fnId)
	})

	it('should list all created functions', async () => {
		const fns = await blsGateway.functions.list(FN_TYPE, USER_ADDRESS, {})
		expect(fns).toHaveProperty('docs')
		expect(fns.docs.length).toBe(1)
		expect(fns.totalDocs).toBe(1)
		expect(fns.totalPages).toBe(1)
		expect(fns.docs[0]._id).toStrictEqual(fnId)
	})

	it('should update a function data', async () => {
		const fn = await blsGateway.functions.update(FN_TYPE, USER_ADDRESS, fnId, {
			functionName: FN_NAME_UPDATED
		})

		expect(fn.functionName).toBe(FN_NAME_UPDATED)
	})

	it('should add environment variables', async () => {
		const envVars = {
			ENV1: 'value1',
			ENV2: 'value2'
		}

		const fn = await blsGateway.functions.updateEnvVars(FN_TYPE, USER_ADDRESS, fnId, { envVars })

		expect(fn).toHaveProperty('envVars')
		expect(fn.envVars.length).toBe(2)
		expect(fn.envVars[0].name).toBe('ENV1')
		expect(fn.envVars[1].name).toBe('ENV2')
	})

	it('should modify environment variables', async () => {
		const envVars = {
			ENV1: null,
			ENV2: 'value2'
		}

		const fn = await blsGateway.functions.updateEnvVars(FN_TYPE, USER_ADDRESS, fnId, { envVars })

		expect(fn).toHaveProperty('envVars')
		expect(fn.envVars.length).toBe(1)
		expect(fn.envVars[0].name).toBe('ENV2')
	})
})

describe('Functions Encryption', () => {
	it('should parse env vars correctly with encryption', async () => {
		const fn = await Functions.findById(fnId).select('+envVars.value').select('+envVars.iv')
		expect(fn).not.toBeNull()

		const result = parseFunctionEnvVars(fn!.envVars, ENCRYPTION_KEY)
		expect(result.length).toBe(1)
		expect(result[0].name).toBe('ENV2')
		expect(result[0].value).toBe('value2')
	})

	it('should fail to parse env vars without encryption', async () => {
		const fn = await Functions.findById(fnId).select('+envVars.value').select('+envVars.iv')
		expect(fn).not.toBeNull()

		const result = parseFunctionEnvVars(fn!.envVars)
		expect(result.length).toBe(1)
		expect(result[0].name).toBe('ENV2')
		expect(result[0].value).toBe(fn!.envVars[0].value)
	})
})

describe('Functions Request Parser', () => {
	it('should parse request data correctly', () => {
		const requestData = {
			method: 'GET',
			path: '/test',
			params: { param1: 'value1', param2: 'value2' },
			query: { query1: 'value1', query2: 'value2' },
			headers: { header1: 'value1', header2: 'value2' },
			body: { key: 'value' }
		}

		const result = parseFunctionRequestVars(requestData)
		expect(result.length).toBe(7)
		expect(result).toStrictEqual([
			{ name: 'BLS_REQUEST_STDIN', value: '/test' },
			{ name: 'BLS_REQUEST_METHOD', value: 'GET' },
			{ name: 'BLS_REQUEST_PATH', value: '/test' },
			{ name: 'BLS_REQUEST_PARAMS', value: 'param1=value1&param2=value2' },
			{ name: 'BLS_REQUEST_QUERY', value: 'query1=value1&query2=value2' },
			{ name: 'BLS_REQUEST_HEADERS', value: 'header1=value1&header2=value2' },
			{ name: 'BLS_REQUEST_BODY', value: encodeURIComponent('{"key":"value"}') }
		])
	})
})

describe('Functions Helpers', () => {
	it('should generate a predictive subdomain', () => {
		const subdomain = generateSubdomain(FN_NAME, USER_ADDRESS)
		expect(subdomain).toBe(FN_SUBDOMAIN)
	})

	it('should normalize and validate a function name', () => {
		const name = validateFunctionName(FN_NAME)
		expect(name).toBe(FN_NAME)
	})

	it('should fail to normalize and validate a function name', () => {
		expect(() => validateFunctionName('inValid_Function_N@ME')).toThrow()
	})
})

describe('Functions Cleanup', () => {
	it('should delete a function', async () => {
		await blsGateway.functions.delete(FN_TYPE, USER_ADDRESS, fnId)

		const fns = await blsGateway.functions.list(FN_TYPE, USER_ADDRESS, {})
		expect(fns).toHaveProperty('docs')
		expect(fns.docs.length).toBe(0)
	})
})

afterAll(async () => {
	await mongoose.disconnect()
	mongoServer.stop()
})
