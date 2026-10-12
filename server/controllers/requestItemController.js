import { v2 as cloudinary } from "cloudinary";
import RequestItem from "../models/RequestItem.js";

export const listRequestItems = async (_req, res) => {
    try {
        const requests = await RequestItem.find({})
            .populate("requesterId", "name email mobileNumber department")
            .sort({ createdAt: -1 })
            .lean();
        return res.json({ success: true, requests });
    } catch (error) {
        console.error("Request item list error:", error);
        return res.status(500).json({ success: false, message: "Unable to load item requests" });
    }
};

export const getRequestItem = async (req, res) => {
    try {
        const request = await RequestItem.findById(req.params.id)
            .populate("requesterId", "name email mobileNumber department")
            .populate("confirmations.userId", "name email mobileNumber department")
            .lean();

        if (!request) {
            return res.status(404).json({ success: false, message: "Item request not found" });
        }

        return res.json({ success: true, request });
    } catch (error) {
        console.error("Request item details error:", error);
        return res.status(500).json({ success: false, message: "Unable to load item request" });
    }
};

export const confirmRequestItem = async (req, res) => {
    try {
        const request = await RequestItem.findById(req.params.id).select("requesterId");
        if (!request) {
            return res.status(404).json({ success: false, message: "Item request not found" });
        }
        if (request.requesterId.toString() === req.userId.toString()) {
            return res.status(403).json({ success: false, message: "You cannot confirm your own item request" });
        }

        const updatedRequest = await RequestItem.findOneAndUpdate(
            {
                _id: req.params.id,
                "confirmations.userId": { $ne: req.userId },
            },
            { $push: { confirmations: { userId: req.userId } } },
            { new: true },
        ).select("_id");

        if (!updatedRequest) {
            return res.status(409).json({ success: false, message: "You have already confirmed this request" });
        }

        return res.json({ success: true, message: "Your offer to provide this item has been confirmed" });
    } catch (error) {
        console.error("Request item confirmation error:", error);
        return res.status(500).json({ success: false, message: "Unable to confirm this item request" });
    }
};

export const createRequestItem = async (req, res) => {
    try {
        const itemName = typeof req.body.itemName === "string" ? req.body.itemName.trim() : "";
        const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
        const promiseAmount = Number(req.body.promiseAmount);

        if (!itemName || !description || !req.file || !req.body.promiseAmount) {
            return res.status(400).json({ success: false, message: "Item name, image, description, and extra payment amount are required" });
        }
        if (itemName.length > 100 || description.length > 2000) {
            return res.status(400).json({ success: false, message: "One or more fields exceed the allowed length" });
        }
        if (!Number.isFinite(promiseAmount) || promiseAmount <= 0 || promiseAmount > 10000000) {
            return res.status(400).json({ success: false, message: "Enter a valid extra payment amount greater than zero" });
        }
        if (!req.file.mimetype?.startsWith("image/")) {
            return res.status(400).json({ success: false, message: "Upload a valid image file" });
        }

        const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "image",
            folder: "nichetrade/request-items",
        });
        const requestItem = await RequestItem.create({
            itemName,
            description,
            image: uploadedImage.secure_url,
            promiseAmount,
            requesterId: req.userId,
        });
        await requestItem.populate("requesterId", "name email mobileNumber department");

        return res.status(201).json({
            success: true,
            message: "Item request posted",
            request: requestItem,
        });
    } catch (error) {
        console.error("Request item creation error:", error);
        return res.status(500).json({ success: false, message: "Unable to post item request" });
    }
};
