import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String
  }
},{timestamps: true});

const auth_user = mongoose.model('auth_user', userSchema);
export default auth_user;