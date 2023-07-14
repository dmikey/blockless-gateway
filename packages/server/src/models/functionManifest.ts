import mongoose, { Schema } from 'mongoose'

const FunctionManifestSchema = new mongoose.Schema(
	{
		functionId: String,
		manifest: Schema.Types.Mixed
	},
	{
		timestamps: true
	}
)

export const FunctionManifest = mongoose.model('FunctionManifest', FunctionManifestSchema)
