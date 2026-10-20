import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: "" },
    storeName: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    gstNumber: { type: String, trim: true, uppercase: true, default: "" },
    storeDescription: { type: String, trim: true, default: "" },
    password: { type: String, required: false },
    freeUploads: { type: Number, min: 0, default: 0 },
    isVip: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

sellerSchema.index({ userId: 1 }, { unique: true, sparse: true });

const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default Seller;
