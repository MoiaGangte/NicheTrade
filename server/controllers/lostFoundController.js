import { v2 as cloudinary } from "cloudinary";
import LostFoundPost from "../models/LostFoundPost.js";
import { isDBConnected, mockLostFoundPosts } from "../configs/mockStore.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import SellerNotification from "../models/SellerNotification.js";

const mobilePattern = /^\+?[\d\s().-]{7,30}$/;
const publicPostFields = "itemName placeFound postType foundDate foundAt description image createdAt userId";

export const listLostFoundPosts = async (_req, res) => {
    if (!isDBConnected()) {
        return res.json({ success: true, posts: mockLostFoundPosts });
    }
    try {
        const posts = await LostFoundPost.find({ resolved: { $ne: true } })
            .select(publicPostFields)
            .sort({ foundAt: -1, foundDate: -1, createdAt: -1 })
            .lean();
        return res.json({ success: true, posts });
    } catch (error) {
        console.warn("Lost and found list fallback:", error.message);
        return res.json({ success: true, posts: mockLostFoundPosts });
    }
};

export const getLostFoundPost = async (req, res) => {
    if (!isDBConnected()) {
        const post = mockLostFoundPosts.find((p) => p._id === req.params.id) || mockLostFoundPosts[0];
        if (!post) return res.status(404).json({ success: false, message: "Lost and found item not found" });
        return res.json({ success: true, post });
    }
    try {
        const post = await LostFoundPost.findOne({
            _id: req.params.id,
            resolved: { $ne: true },
        }).select(publicPostFields).lean();

        if (!post) {
            const fallback = mockLostFoundPosts.find((p) => p._id === req.params.id);
            if (fallback) return res.json({ success: true, post: fallback });
            return res.status(404).json({ success: false, message: "Lost and found item not found" });
        }
        return res.json({ success: true, post });
    } catch (error) {
        const fallback = mockLostFoundPosts.find((p) => p._id === req.params.id);
        if (fallback) return res.json({ success: true, post: fallback });
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
            userId: req.userId,
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
        const { pickupLocation, pickupTime } = req.body;
        if (!pickupLocation?.trim()) {
            return res.status(400).json({ success: false, message: "Choose a campus pickup location" });
        }
        const post = await LostFoundPost.findOneAndUpdate(
            { _id: req.params.id, resolved: { $ne: true } },
            { $set: { resolved: true, resolvedAt: new Date() } },
            { new: true },
        );

        if (!post) {
            return res.status(404).json({ success: false, message: "This item is no longer available" });
        }
        if (!post.userId || post.userId.toString() === req.userId.toString()) {
            return res.json({ success: true, message: "Item removed from Lost & Found" });
        }

        let conversationId = null;
        try {
            const filter = { buyerId: req.userId, sellerId: post.userId, lostFoundId: post._id };
            let conversation = await Conversation.findOneAndUpdate(
                filter,
                { $setOnInsert: { ...filter, lastMessageAt: new Date() } },
                { new: true, upsert: true, setDefaultsOnInsert: true },
            );
            const text = `Hi, I'd like to claim "${post.itemName}". Pickup location: ${pickupLocation.trim()}.${pickupTime ? ` Preferred pickup time: ${pickupTime.trim()}.` : ""}`;
            const firstMessage = await Message.findOne({ conversationId: conversation._id, type: "lost-found-claim" });
            if (!firstMessage) {
                await Message.create({ conversationId: conversation._id, senderId: req.userId, type: "lost-found-claim", content: text });
                await Conversation.updateOne({ _id: conversation._id }, {
                    $set: { lastMessageText: text, lastMessageType: "text", lastMessageAt: new Date() },
                    $inc: { sellerUnreadCount: 1 },
                });
            }
            conversationId = conversation._id;
            await SellerNotification.create({
                userId: post.userId,
                subject: "Lost & Found claim",
                body: `${req.user?.name || "A student"} claimed "${post.itemName}". Pickup: ${pickupLocation.trim()}${pickupTime ? ` at ${pickupTime.trim()}` : ""}.`,
                type: "lost_found_claim",
            });
        } catch (chatError) {
            console.warn("Lost & Found claim chat setup failed:", chatError.message);
        }
        return res.json({ success: true, message: "Claim sent and item removed from Lost & Found", conversationId });
    } catch (error) {
        console.error("Lost and found claim confirmation error:", error);
        return res.status(400).json({ success: false, message: "Unable to confirm this claim" });
    }
};

export const deleteLostFoundPost = async (req, res) => {
    try {
        const post = await LostFoundPost.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!post) return res.status(404).json({ success: false, message: "You can only delete your own post" });
        return res.json({ success: true, message: "Lost & Found post deleted" });
    } catch (error) {
        console.error("Lost and found delete error:", error);
        return res.status(400).json({ success: false, message: "Unable to delete this post" });
    }
};
