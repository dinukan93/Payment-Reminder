import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  avatar: { type: String }, // base64 string
  // Add other fields as needed
});

const User = mongoose.model('User', userSchema);

export default User;
