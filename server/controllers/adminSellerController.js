import mongoose from "mongoose";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import SellerActionAudit from "../models/SellerActionAudit.js";
import SellerNotification from "../models/SellerNotification.js";
import { sellerActionMessages } from "../utils/sellerMessages.js";

const isReasonValid = (reason) => typeof reason === "string"
    && reason.trim().length >= 10
    && reason.trim().length <= 500;

const actionSnapshot = (products) => products.map((product) => ({
    productId: product._id,
    wasVisible: product.isVisible !== false,
}));

const hideSellerProducts = async (seller) => {
    if (!seller.hiddenProductVisibility?.length) {
        const products = await Product.find({ sellerId: seller._id }).select("_id isVisible");
        if (products.length) {
            seller.hiddenProductVisibility = actionSnapshot(products);
            await Product.updateMany({ sellerId: seller._id }, { $set: { isVisible: false } });
            return;
        }
    }
    await Product.updateMany({ sellerId: seller._id }, { $set: { isVisible: false } });
};

const restoreSellerProducts = async (seller) => {
    const snapshots = seller.hiddenProductVisibility || [];
    for (const snapshot of snapshots) {
        await Product.updateOne(
            { _id: snapshot.productId },
            { $set: { isVisible: snapshot.wasVisible } },
        );
    }
    seller.hiddenProductVisibility = [];
};

const adminId = (req) => req.adminId || req.adminEmail || "admin";

export const listManagedSellers = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
        const search = String(req.query.search || "").trim();
        const status = String(req.query.status || "all");
        const filter = {};
        if (["active", "suspended", "banned"].includes(status)) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { storeName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const [sellers, total] = await Promise.all([
            Seller.find(filter).sort({ createdAt: -1 }).lean(),
            Seller.countDocuments(filter),
        ]);
        const start = (page - 1) * limit;
        const pageSellers = sellers.slice(start, start + limit);
        const ids = pageSellers.map((seller) => seller._id);
        const counts = await Product.aggregate([
            { $match: { sellerId: { $in: ids } } },
            { $group: { _id: "$sellerId", count: { $sum: 1 } } },
        ]);
        const countBySeller = new Map(counts.map((item) => [item._id.toString(), item.count]));
        return res.json({
            success: true,
            sellers: pageSellers.map((seller) => ({
                ...seller,
                productCount: countBySeller.get(seller._id.toString()) || 0,
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Managed seller list error:", error);
        return res.status(500).json({ success: false, message: "Unable to load sellers" });
    }
};

export const updateSellerStatus = async (req, res) => {
    const action = String(req.params.action);
    if (!["suspend", "ban", "reactivate", "unban"].includes(action)) {
        return res.status(400).json({ success: false, message: "Invalid seller action" });
    }
    const reasonRequired = action === "suspend" || action === "ban";
    const reason = String(req.body.reason || req.body.optionalNote || "").trim();
    if (reasonRequired && !isReasonValid(reason)) {
        return res.status(400).json({ success: false, message: "Reason is required and must be between 10 and 500 characters" });
    }
    if (!reasonRequired && reason.length > 500) {
        return res.status(400).json({ success: false, message: "Note must be at most 500 characters" });
    }

    try {
        if (!mongoose.isValidObjectId(req.params.sellerId)) {
            return res.status(404).json({ success: false, message: "Seller account not found" });
        }
        const seller = await Seller.findById(req.params.sellerId);
        if (!seller) return res.status(404).json({ success: false, message: "Seller account not found" });

        const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        if (adminEmail && seller.email.toLowerCase() === adminEmail) {
            return res.status(403).json({ success: false, message: "Administrators cannot act on an administrator account" });
        }

        const now = new Date();
        if (action === "suspend" || action === "ban") {
            await hideSellerProducts(seller);
        } else {
            await restoreSellerProducts(seller);
        }

        seller.status = action === "suspend" ? "suspended" : action === "ban" ? "banned" : "active";
        seller.isActive = seller.status === "active";
        seller.statusReason = reasonRequired ? reason : "";
        seller.statusChangedAt = now;
        if (action === "suspend") seller.suspendedAt = now;
        if (action === "ban") seller.bannedAt = now;
        seller.latestAction = {
            action,
            reason: reasonRequired ? reason : reason,
            adminId: adminId(req),
            timestamp: now,
        };
        await seller.save();

        const normalizedAction = action === "reactivate" || action === "unban"
            ? "restore"
            : action;
        const message = sellerActionMessages({
            action: normalizedAction,
            sellerName: seller.storeName || seller.name,
            reason,
            note: reason,
            date: now,
        });
        let messageSent = true;
        try {
            await SellerNotification.create({
                userId: seller.userId,
                sellerId: seller._id,
                subject: message.subject,
                body: message.body,
                type: normalizedAction === "restore"
                    ? "seller_restored"
                    : normalizedAction === "suspend"
                        ? "seller_suspended"
                        : "seller_banned",
            });
        } catch (notificationError) {
            messageSent = false;
            console.error("Seller notification delivery error:", notificationError);
        }
        await SellerActionAudit.create({
            adminId: adminId(req),
            sellerId: seller._id,
            action,
            reason: reasonRequired ? reason : reason,
            messageSent,
            timestamp: now,
        });
        return res.json({ success: true, message: `Seller ${action === "reactivate" || action === "unban" ? "reactivated" : action + "ed"}`, seller, notification: message });
    } catch (error) {
        console.error("Seller status action error:", error);
        return res.status(500).json({ success: false, message: "Unable to update seller status" });
    }
};
