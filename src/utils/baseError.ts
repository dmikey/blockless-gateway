// Base error class
export interface BaseError extends Error {
	code: string
	name: string
	statusCode?: number
}

/**
 * Define the BaseError constructor
 */
export interface BaseErrorConstructor<
	E extends { code: string; statusCode?: number } = { code: string; statusCode?: number },
	T extends unknown[] = [any?, any?, any?]
> {
	new (...args: T): BaseError & E
	(...args: T): BaseError & E
	readonly prototype: BaseError & E
}

/**
 * Factory function to create error classes and errorCodes object
 *
 * @param errorCodesConfig
 * @returns
 */
export function createErrorClasses<T extends Record<string, { statusCode?: number }>>(
	errorCodesConfig: T
): { [K in keyof T]: BaseErrorConstructor<any> } {
	const errorCodes: any = {}

	for (const code in errorCodesConfig) {
		const { statusCode, ...errorProps } = errorCodesConfig[code]
		class CustomError extends Error implements BaseError {
			public code: string
			public name: string
			public statusCode?: number

			constructor(message: string) {
				super(message || code)
				this.code = code
				this.statusCode = statusCode
			}
		}

		// Store the error constructor with the corresponding code in errorCodes
		errorCodes[code] = CustomError
	}

	return errorCodes as { [K in keyof T]: BaseErrorConstructor<any> }
}
