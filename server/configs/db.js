import mongoose from "mongoose";
import { migrateSellerStatuses } from "../utils/sellerMigration.js";

const connectDB = async () => {
    try {
        mongoose.set('bufferCommands', false); // CRITICAL: fail fast, don't hang

        if (!process.env.MONGODB_URI) {
            console.warn('[AI Studio] MONGODB_URI not set — database offline/mock mode active');
            return;
        }

        const options = {
            serverSelectionTimeoutMS: 2000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(`${process.env.MONGODB_URI}/NicheTrade`, options);
        await migrateSellerStatuses();

        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
    } catch (error) {
        console.warn('MongoDB connection failed — some features may not work:', error.message);
    }
};

export default connectDB;