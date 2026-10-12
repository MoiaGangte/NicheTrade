import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: "" },
    password: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    subscriptionPlan: { type: String, enum: ["monthly", "yearly"], default: null },
    subscriptionExpiresAt: { type: Date, default: null },
    productUploadsCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default Seller;
