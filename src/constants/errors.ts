import { createErrorClasses } from '../utils/baseError'

// Define the error codes configuration
const errorCodesConfig = {
	ERR_FUNCTION_NOT_FOUND: { statusCode: 404 },
	ERR_INVALID_INPUT: { statusCode: 400 }
}

export const BaseErrors = createErrorClasses(errorCodesConfig)
