import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
	nonce: String,

	ethAddress: String,
	cosmosAddress: String,
	aptosAddress: String
})

const User = mongoose.model('User', UserSchema)
export default User
