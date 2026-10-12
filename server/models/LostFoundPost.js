import mongoose from "mongoose";

const lostFoundPostSchema = new mongoose.Schema({
    itemName: { type: String, required: true, trim: true, maxlength: 100 },
    placeFound: { type: String, trim: true, maxlength: 200 },
    postType: { type: String, enum: ["found", "lost"], default: "found", required: true },
    foundDate: { type: Date, required: true },
    foundAt: { type: Date },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    founderName: { type: String, trim: true, maxlength: 100 },
    founderMobile: { type: String, trim: true, maxlength: 30 },
    founderDepartment: { type: String, trim: true, maxlength: 120 },
    image: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
}, { timestamps: true });

const LostFoundPost = mongoose.models.LostFoundPost || mongoose.model("LostFoundPost", lostFoundPostSchema);

export default LostFoundPost;
