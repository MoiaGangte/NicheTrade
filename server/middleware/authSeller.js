import jwt from "jsonwebtoken";
import Seller from "../models/Seller.js";

const authSeller = async (req, res, next) => {
    try {
        const token = req.cookies.sellerToken;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized as seller" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "seller" || !decoded.id) {
            return res.status(401).json({ success: false, message: "Not authorized as seller" });
        }

        const seller = await Seller.findById(decoded.id).select("_id name email department isApproved isActive");
        if (!seller || !seller.isApproved || seller.isActive === false) {
            return res.status(403).json({ success: false, message: "Seller account is not approved or has been disabled" });
        }

        req.sellerId = seller._id;
        req.seller = seller;
        req.isSeller = true;
        next();
    } catch (error) {
        console.error("Seller auth middleware error:", error);
        res.status(401).json({ success: false, message: "Not authorized as seller" });
    }
};

export default authSeller;
