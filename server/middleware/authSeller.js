import { authUser } from "./authMiddleware.js";
import Seller from "../models/Seller.js";

const requireSeller = async (req, res, next) => {
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({ success: false, message: "Seller access required" });
        }

        const seller = await Seller.findOne({ userId: req.userId })
            .select("_id userId name email phone department storeName address gstNumber storeDescription freeUploads isVip isApproved isActive");
        if (!seller || !seller.isApproved || seller.isActive === false) {
            return res.status(403).json({ success: false, message: "Seller account is not approved or has been disabled" });
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

const authSeller = (req, res, next) => authUser(req, res, (error) => {
    if (error) return next(error);
    return requireSeller(req, res, next);
});

export default authSeller;
