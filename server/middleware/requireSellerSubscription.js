import Seller from "../models/Seller.js";
import {
    FREE_LISTING_TRIAL_LIMIT,
    getSellerProductUploadCount,
    reserveSellerProductUpload,
} from "../utils/sellerFreeListingTrial.js";

const requireSellerSubscription = async (req, res, next) => {
    try {
        const seller = await Seller.findOne({
            _id: req.sellerId,
            subscriptionExpiresAt: { $gt: new Date() },
        }).select("_id");

        const hasActiveSubscription = Boolean(seller);
        const uploadedCount = await getSellerProductUploadCount(req.sellerId);
        if (
            (!hasActiveSubscription && uploadedCount >= FREE_LISTING_TRIAL_LIMIT)
            || !(await reserveSellerProductUpload(req.sellerId, !hasActiveSubscription))
        ) {
            return res.status(403).json({
                success: false,
                subscriptionRequired: true,
                message: "Your 10 free product listings are used. An active seller subscription is required to add more.",
            });
        }

        req.productUploadReserved = true;
        return next();
    } catch (error) {
        console.error("Seller subscription check error:", error);
        return res.status(500).json({ success: false, message: "Unable to verify seller subscription" });
    }
};

export default requireSellerSubscription;
