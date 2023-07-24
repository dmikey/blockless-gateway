import { createErrorClasses } from '../utils/baseError'

// Define the error codes configuration
const errorCodesConfig = {
	ERR_FUNCTION_NOT_FOUND: { statusCode: 404, message: 'Function not found.' },
	ERR_FUNCTION_NOT_DEPLOYED: { statusCode: 404, message: 'Function not deployed.' },
	ERR_FUNCTION_MANIFEST_NOT_FOUND: { statusCode: 404, message: 'Function manifest not found.' },
	ERR_FUNCTION_MANIFEST_INVALID: { statusCode: 400, message: 'Function manifest invalid.' },
	ERR_HEAD_FAILED_TO_EXECUTE: { statusCode: 400, message: 'Function failed to execute.' },
	ERR_USER_NONCE_NOT_GENERATED: {
		statusCode: 401,
		message: 'User auth challenge failed to generate.'
	},
	ERR_USER_WALLET_NOT_FOUND: {
		statusCode: 404,
		message: 'User wallet not found.'
	}
}

export const BaseErrors = createErrorClasses(errorCodesConfig)
