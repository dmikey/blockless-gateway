import { JSONSchemaType } from 'env-schema'

interface IEnvSchema {
	MONGO_DB_URI: string
	ENV_ENCRYPTION_SECRET: string
}

export const EnvSchema: JSONSchemaType<IEnvSchema> = {
	type: 'object',
	required: ['MONGO_DB_URI', 'ENV_ENCRYPTION_SECRET'],
	properties: {
		MONGO_DB_URI: { type: 'string' },
		ENV_ENCRYPTION_SECRET: { type: 'string' }
	}
}
