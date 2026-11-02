import SellerNotification from "../models/SellerNotification.js";

export const listNotifications = async (req, res) => {
    const notifications = await SellerNotification.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .lean();
    return res.json({ success: true, notifications });
};

export const unreadNotificationCount = async (req, res) => {
    const count = await SellerNotification.countDocuments({ userId: req.userId, readAt: null });
    return res.json({ success: true, count });
};

export const markNotificationRead = async (req, res) => {
    const notification = await SellerNotification.findOneAndUpdate(
        { _id: req.params.notificationId, userId: req.userId },
        { $set: { readAt: new Date() } },
        { new: true },
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    return res.json({ success: true, notification });
};
