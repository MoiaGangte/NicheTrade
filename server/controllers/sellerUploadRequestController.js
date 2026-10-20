import Seller from "../models/Seller.js";
import SellerUploadRequest from "../models/SellerUploadRequest.js";

export const getSellerUploadStatus = async (req, res) => {
    try {
        const [seller, latestRequest] = await Promise.all([
            Seller.findById(req.sellerId).select("freeUploads isVip"),
            SellerUploadRequest.findOne({ sellerId: req.sellerId }).sort({ createdAt: -1 }),
        ]);
        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller account not found" });
        }
        return res.json({
            success: true,
            freeUploads: seller.freeUploads || 0,
            isVip: seller.isVip === true,
            latestRequest,
        });
    } catch (error) {
        console.error("Seller upload status error:", error);
        return res.status(500).json({ success: false, message: "Unable to load seller upload status" });
    }
};

export const createSellerUploadRequest = async (req, res) => {
    try {
        const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
        const wordCount = description ? description.split(/\s+/).length : 0;
        if (!description || wordCount > 50) {
            return res.status(400).json({ success: false, message: "Describe your request in 50 words or fewer" });
        }

        const pendingRequest = await SellerUploadRequest.findOne({ sellerId: req.sellerId, status: "pending" });
        if (pendingRequest) {
            return res.status(409).json({ success: false, message: "You already have a request awaiting review" });
        }

        const request = await SellerUploadRequest.create({ sellerId: req.sellerId, description });
        return res.status(201).json({ success: true, request, message: "Your free upload request was sent to the admin" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "You already have a request awaiting review" });
        }
        console.error("Seller upload request error:", error);
        return res.status(500).json({ success: false, message: "Unable to submit free upload request" });
    }
};
