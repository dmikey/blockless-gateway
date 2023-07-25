import { createErrorClasses } from '../utils/baseError'

// Define the error codes configuration
const errorCodesConfig = {
	ERR_FUNCTION_NOT_FOUND: { statusCode: 404, message: 'Function not found.' },
	ERR_FUNCTION_NOT_DEPLOYED: { statusCode: 404, message: 'Function not deployed.' },
	ERR_FUNCTION_MANIFEST_NOT_FOUND: { statusCode: 404, message: 'Function manifest not found.' },
	ERR_FUNCTION_MANIFEST_INVALID: { statusCode: 400, message: 'Function manifest invalid.' },
	ERR_FUNCTION_NAME_EXISTS: { statusCode: 400, message: 'Function name already exists.' },
	ERR_FUNCTION_DEPLOY_FAILED: { statusCode: 400, message: 'Function failed to deploy.' },
	ERR_FUNCTION_UPDATE_FAILED: { statusCode: 400, message: 'Function failed to update.' },
	ERR_FUNCTION_DELETE_FAILED: { statusCode: 400, message: 'Function failed to delete.' },
	ERR_HEAD_FAILED_TO_EXECUTE: { statusCode: 400, message: 'Function failed to execute.' },
	ERR_HEAD_FAILED_TO_INSTALL: { statusCode: 400, message: 'Function failed to install.' },
	ERR_USER_NONCE_NOT_GENERATED: {
		statusCode: 401,
		message: 'User auth challenge failed to generate.'
	},
	ERR_USER_NOT_FOUND: {
		statusCode: 404,
		message: 'User not found.'
	},
	ERR_USER_WALLET_NOT_FOUND: {
		statusCode: 404,
		message: 'User wallet not found.'
	},
	ERR_USER_SIGNATURE_MISMATCH: {
		statusCode: 401,
		message: 'User signature does not match.'
	}
}

export const BaseErrors = createErrorClasses(errorCodesConfig)
