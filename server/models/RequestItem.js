import mongoose from "mongoose";

const requestItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    image: { type: String, required: true },
    promiseAmount: { type: Number, required: true, min: 0.01 },
    requesterId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
    confirmations: [{
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
        confirmedAt: { type: Date, default: Date.now },
    }],
}, { timestamps: true });

const RequestItem = mongoose.models.RequestItem || mongoose.model("RequestItem", requestItemSchema);

export default RequestItem;
