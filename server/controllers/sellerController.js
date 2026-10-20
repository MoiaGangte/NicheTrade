import Seller from "../models/Seller.js";
import User from "../models/User.js";

const publicSeller = (seller) => ({
    _id: seller._id,
    userId: seller.userId,
    name: seller.name,
    email: seller.email,
    phone: seller.phone,
    department: seller.department || "",
    storeName: seller.storeName || "",
    address: seller.address || "",
    gstNumber: seller.gstNumber || "",
    storeDescription: seller.storeDescription || "",
    isApproved: seller.isApproved,
    isActive: seller.isActive !== false,
    freeUploads: seller.freeUploads || 0,
    isVip: seller.isVip === true,
});

export const sellerRegister = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User account not found" });
        }

        const storeName = typeof req.body.storeName === "string" ? req.body.storeName.trim() : "";
        const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : user.mobileNumber || "";
        const storeDescription = typeof req.body.storeDescription === "string" ? req.body.storeDescription.trim() : "";
        if (storeName.length < 2 || storeName.length > 120 || phone.replace(/\D/g, "").length < 7) {
            return res.status(400).json({ success: false, message: "Enter a valid store name and phone number" });
        }

        let seller = await Seller.findOne({ $or: [{ userId: user._id }, { email: user.email.toLowerCase() }] });
        if (seller && seller.userId && seller.userId.toString() !== user._id.toString()) {
            return res.status(409).json({ success: false, message: "This seller profile is linked to another account" });
        }

        const sellerDetails = {
            userId: user._id,
            name: user.name,
            email: user.email,
            phone,
            department: user.department || "",
            storeName,
            storeDescription,
        };
        if (seller) {
            seller.set(sellerDetails);
            await seller.save();
        } else {
            seller = await Seller.create(sellerDetails);
        }

        user.role = "seller";
        if (phone && !user.mobileNumber) user.mobileNumber = phone;
        await user.save();

        return res.status(201).json({
            success: true,
            message: seller.isApproved
                ? "Your seller profile is ready"
                : "Your seller profile was submitted and is awaiting admin approval",
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
            seller: publicSeller(seller),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "A seller profile is already linked to this account" });
        }
        console.error("Seller registration error:", error);
        return res.status(500).json({ success: false, message: "Unable to register seller" });
    }
};

export const isSellerAuth = async (req, res) => {
    try {
        const [user, seller] = await Promise.all([
            User.findById(req.userId).select("_id name email role"),
            Seller.findOne({ userId: req.userId }),
        ]);
        if (!user || user.role !== "seller" || !seller) {
            return res.status(404).json({ success: false, message: "Seller profile not found" });
        }
        return res.json({ success: true, seller: publicSeller(seller) });
    } catch (error) {
        console.error("Seller auth status error:", error);
        return res.status(500).json({ success: false, message: "Unable to load seller profile" });
    }
};
