import mongoose from "mongoose";

const sellerActionAuditSchema = new mongoose.Schema({
    adminId: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    action: { type: String, enum: ["suspend", "ban", "reactivate", "unban"], required: true },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    messageSent: { type: Boolean, required: true, default: true },
    timestamp: { type: Date, required: true, default: Date.now },
}, { timestamps: false });

sellerActionAuditSchema.index({ sellerId: 1, timestamp: -1 });

export default mongoose.models.SellerActionAudit || mongoose.model("SellerActionAudit", sellerActionAuditSchema);
