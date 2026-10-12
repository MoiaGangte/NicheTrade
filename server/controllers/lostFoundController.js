import { v2 as cloudinary } from "cloudinary";
import LostFoundPost from "../models/LostFoundPost.js";

const mobilePattern = /^\+?[\d\s().-]{7,30}$/;
const publicPostFields = "itemName placeFound postType foundDate foundAt description image createdAt";

export const listLostFoundPosts = async (_req, res) => {
    try {
        const posts = await LostFoundPost.find({ resolved: { $ne: true } })
            .select(publicPostFields)
            .sort({ foundAt: -1, foundDate: -1, createdAt: -1 })
            .lean();
        return res.json({ success: true, posts });
    } catch (error) {
        console.error("Lost and found list error:", error);
        return res.status(500).json({ success: false, message: "Unable to load lost and found posts" });
    }
};

export const getLostFoundPost = async (req, res) => {
    try {
        const post = await LostFoundPost.findOne({
            _id: req.params.id,
            resolved: { $ne: true },
        }).select(publicPostFields).lean();

        if (!post) {
            return res.status(404).json({ success: false, message: "Lost and found item not found" });
        }
        return res.json({ success: true, post });
    } catch (error) {
        console.error("Lost and found detail error:", error);
        return res.status(400).json({ success: false, message: "Unable to load this lost and found item" });
    }
};

export const getLostFoundFounder = async (req, res) => {
    try {
        const post = await LostFoundPost.findOne({
            _id: req.params.id,
            resolved: { $ne: true },
        }).select("founderName founderMobile founderDepartment").lean();

        if (!post) {
            return res.status(404).json({ success: false, message: "Lost and found item not found" });
        }
        return res.json({
            success: true,
            founder: {
                name: post.founderName || "",
                mobile: post.founderMobile || "",
                department: post.founderDepartment || "",
            },
        });
    } catch (error) {
        console.error("Lost and found claim detail error:", error);
        return res.status(400).json({ success: false, message: "Unable to load founder details" });
    }
};

export const createLostFoundPost = async (req, res) => {
    try {
        const itemName = typeof req.body.itemName === "string" ? req.body.itemName.trim() : "";
        const placeFound = typeof req.body.placeFound === "string" ? req.body.placeFound.trim() : "";
        const postType = req.body.postType === "lost" ? "lost" : req.body.postType === "found" ? "found" : "";
        const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
        const foundAtText = typeof req.body.foundAt === "string" ? req.body.foundAt : "";
        const founderName = typeof req.body.founderName === "string" ? req.body.founderName.trim() : "";
        const founderMobile = typeof req.body.founderMobile === "string" ? req.body.founderMobile.trim() : "";
        const founderDepartment = typeof req.body.founderDepartment === "string" ? req.body.founderDepartment.trim() : "";

        if (!postType || !itemName || (postType === "found" && !placeFound) || !description || !foundAtText || !founderName || !founderMobile || !founderDepartment || !req.file) {
            return res.status(400).json({ success: false, message: "Complete all product and founder details and add a product image" });
        }
        if (itemName.length > 100 || placeFound.length > 200 || description.length > 2000
            || founderName.length > 100 || founderMobile.length > 30 || founderDepartment.length > 120) {
            return res.status(400).json({ success: false, message: "One or more fields exceed the allowed length" });
        }
        if (!mobilePattern.test(founderMobile) || (founderMobile.match(/\d/g) || []).length < 7) {
            return res.status(400).json({ success: false, message: "Enter a valid mobile number" });
        }
        if (!req.file.mimetype?.startsWith("image/")) {
            return res.status(400).json({ success: false, message: "Upload a valid image file" });
        }

        const foundAt = new Date(foundAtText);
        if (Number.isNaN(foundAt.getTime()) || foundAt > new Date()) {
            return res.status(400).json({ success: false, message: "Enter a valid date and time that is not in the future" });
        }

        const imageUpload = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "image",
            folder: "nichetrade/lost-and-found",
        });
        const post = await LostFoundPost.create({
            itemName,
            ...(postType === "found" ? { placeFound } : {}),
            postType,
            foundDate: foundAt,
            foundAt,
            description,
            image: imageUpload.secure_url,
            founderName,
            founderMobile,
            founderDepartment,
        });

        return res.status(201).json({
            success: true,
            message: "Lost and found post added",
            post: {
                _id: post._id,
                itemName: post.itemName,
                placeFound: post.placeFound,
                postType: post.postType,
                foundAt: post.foundAt,
                foundDate: post.foundDate,
                description: post.description,
                image: post.image,
                createdAt: post.createdAt,
            },
        });
    } catch (error) {
        console.error("Lost and found post creation error:", error);
        return res.status(500).json({ success: false, message: "Unable to create lost and found post" });
    }
};

export const confirmLostFoundClaim = async (req, res) => {
    try {
        const post = await LostFoundPost.findOneAndUpdate(
            { _id: req.params.id, resolved: { $ne: true } },
            { $set: { resolved: true, resolvedAt: new Date() } },
            { new: true },
        ).select("_id");

        if (!post) {
            return res.status(404).json({ success: false, message: "This item is no longer available" });
        }
        return res.json({ success: true, message: "Item removed from Lost & Found" });
    } catch (error) {
        console.error("Lost and found claim confirmation error:", error);
        return res.status(400).json({ success: false, message: "Unable to confirm this claim" });
    }
};
