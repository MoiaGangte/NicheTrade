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
    status: { type: String, enum: ["active", "suspended", "banned"], default: "active" },
    statusReason: { type: String, trim: true, maxlength: 500, default: "" },
    statusChangedAt: { type: Date, default: null },
    suspendedAt: { type: Date, default: null },
    bannedAt: { type: Date, default: null },
    hiddenProductVisibility: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        wasVisible: { type: Boolean, default: true },
    }],
    latestAction: {
        action: { type: String, enum: ["suspend", "ban", "reactivate", "unban", ""], default: "" },
        reason: { type: String, trim: true, maxlength: 500, default: "" },
        adminId: { type: String, default: "" },
        timestamp: { type: Date, default: null },
    },
    // Legacy fields retained for migration compatibility.
    isApproved: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

sellerSchema.index({ userId: 1 }, { unique: true, sparse: true });

const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default Seller;
