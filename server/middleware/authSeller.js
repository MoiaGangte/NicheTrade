import jwt from "jsonwebtoken";
import { authUser } from "./authMiddleware.js";
import Seller from "../models/Seller.js";
import User from "../models/User.js";

const requireSeller = async (req, res, next) => {
    try {
        const configuredAdminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        if (req.user.role !== "seller" && !(req.user.email && req.user.email.toLowerCase() === configuredAdminEmail)) {
            return res.status(403).json({ success: false, message: "Seller access required" });
        }

        const seller = await Seller.findOne({ userId: req.userId })
            .select("_id userId name email phone department storeName address gstNumber storeDescription freeUploads isVip isApproved isActive status statusReason statusChangedAt hiddenProductVisibility");
        if (!seller && req.user.email.toLowerCase() === configuredAdminEmail) {
            seller = await Seller.create({
                userId: req.user._id,
                name: req.user.name,
                email: req.user.email,
                phone: req.user.mobileNumber || "",
                department: req.user.department || "",
                storeName: req.user.name,
                status: "active",
                isApproved: true,
                isActive: true,
            });
        }
        if (!seller) {
            return res.status(403).json({ success: false, message: "Seller profile not found" });
        }
        if (seller.status === "suspended") {
            return res.status(403).json({
                success: false,
                code: "SELLER_SUSPENDED",
                message: "Your seller account is suspended. You cannot add, edit, or manage listings while suspended.",
            });
        }
        if (seller.status === "banned") {
            return res.status(403).json({
                success: false,
                code: "SELLER_BANNED",
                message: "Your seller account is banned. Seller features are disabled.",
            });
        }

        req.sellerId = seller._id;
        req.seller = seller;
        req.isSeller = true;
        next();
    } catch (error) {
        console.error("Seller auth middleware error:", error);
        res.status(500).json({ success: false, message: "Unable to verify seller access" });
    }
};

const authSeller = async (req, res, next) => {
    const headerAuth = req.headers.authorization || req.headers.Authorization;
    const bearerToken = headerAuth && headerAuth.startsWith("Bearer ") ? headerAuth.substring(7) : null;
    if (bearerToken) {
        try {
            const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
            if (decoded.role === "admin") {
                const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
                const user = adminEmail ? await User.findOne({ email: adminEmail.toLowerCase() }) : null;
                if (!user) {
                    return res.status(403).json({ success: false, message: "Admin seller account has not been linked to a user account" });
                }
                req.userId = user._id;
                req.user = user;
                return requireSeller(req, res, next);
            }
        } catch {
            // Use the normal user-token authentication path.
        }
    }
    return authUser(req, res, (error) => {
    if (error) return next(error);
    return requireSeller(req, res, next);
    });
};

export default authSeller;
