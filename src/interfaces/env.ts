import { JSONSchemaType } from 'env-schema'

interface IEnvSchema {
	SERVER_DOMAIN: string
	SERVER_HOST: string
	SERVER_PORT: string
	HEAD_NODE_HOST: string
	MONGO_DB_URI: string
	JWT_SECRET: string
	ENV_ENCRYPTION_SECRET: string
}

export const EnvSchema: JSONSchemaType<IEnvSchema> = {
	type: 'object',
	required: ['HEAD_NODE_HOST', 'MONGO_DB_URI', 'JWT_SECRET', 'ENV_ENCRYPTION_SECRET'],
	properties: {
		SERVER_DOMAIN: { type: 'string' },
		SERVER_HOST: { type: 'string' },
		SERVER_PORT: { type: 'string' },
		HEAD_NODE_HOST: { type: 'string' },
		MONGO_DB_URI: { type: 'string' },
		JWT_SECRET: { type: 'string' },
		ENV_ENCRYPTION_SECRET: { type: 'string' }
	}
}
