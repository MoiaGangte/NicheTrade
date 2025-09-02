import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true },
    email: {type: String, required: true, unique: true},
    password: {type: String, required: false }, // Made optional for Google OAuth users
    googleId: {type: String, required: false, unique: true, sparse: true}, // Added for Google OAuth
    cartItems: {type: Object, default: {} },    
    favorites: {type: Object, default: {} }
}, {minimize: false})

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;