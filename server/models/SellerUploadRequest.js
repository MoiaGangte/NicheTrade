import mongoose from "mongoose";

const sellerUploadRequestSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["pending", "processing", "approved", "rejected"], default: "pending", index: true },
    decisionType: { type: String, enum: ["credits", "vip"] },
    grantedUploads: { type: Number, min: 0, default: 0 },
    decidedAt: { type: Date },
}, { timestamps: true });

sellerUploadRequestSchema.index(
    { sellerId: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } },
);

const SellerUploadRequest = mongoose.models.SellerUploadRequest
    || mongoose.model("SellerUploadRequest", sellerUploadRequestSchema);

export default SellerUploadRequest;
