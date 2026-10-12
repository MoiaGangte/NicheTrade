import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true },
    email: {type: String, required: true, unique: true},
    password: {type: String, required: false }, // Made optional for Google OAuth users
    googleId: {type: String, required: false, unique: true, sparse: true}, // Added for Google OAuth
    department: {type: String, default: ''},
    registerNumber: {type: String},
    mobileNumber: {type: String, default: ''},
    studentType: {type: String, enum: ['Hosteller', 'Day Scholar']},
    dateOfBirth: {type: Date},
    cartItems: {type: Object, default: {} },    
    favorites: {type: Object, default: {} }
}, {minimize: false})

userSchema.index(
    { registerNumber: 1 },
    {
        unique: true,
        partialFilterExpression: { registerNumber: { $type: 'string', $gt: '' } },
    }
);

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;