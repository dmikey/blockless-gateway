import FunctionError from '../models/functionError'
import FunctionRequest from '../models/functionRequest'

/**
 * Record function request
 *
 * @param functionId ObjectId for function reference
 */
export async function addFunctionRequest(functionId: string) {
	await FunctionRequest.create({
		timestamp: new Date(),
		metadata: { functionId }
	})
}

/**
 * Record function error
 *
 * @param functionId
 * @param errorCode eg. AUTH-001
 * @param errorMessage eg. Unauthorized
 */
export async function addFunctionError(
	functionId: string,
	errorCode: string,
	errorMessage: string
) {
	await FunctionError.create({
		timestamp: new Date(),
		metadata: { functionId },
		errorCode,
		errorMessage
	})
}
