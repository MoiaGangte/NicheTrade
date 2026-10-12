import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Seller from "../models/Seller.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
};

const publicSeller = (seller) => ({
    _id: seller._id,
    name: seller.name,
    email: seller.email,
    phone: seller.phone,
    department: seller.department || "",
    isApproved: seller.isApproved,
    isActive: seller.isActive !== false,
});

export const sellerRegister = async (req, res) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
        const department = typeof req.body.department === "string" ? req.body.department.trim() : "";
        const { password, confirmPassword } = req.body;
        const phoneDigits = phone.replace(/\D/g, "");

        if (!name || !email || !phone || !department || typeof password !== "string" || typeof confirmPassword !== "string" || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        if (name.length < 2) {
            return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
        }
        if (department.length < 2 || department.length > 100) {
            return res.status(400).json({ success: false, message: "Department must be between 2 and 100 characters" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address" });
        }
        if (phoneDigits.length < 7 || phoneDigits.length > 15) {
            return res.status(400).json({ success: false, message: "Enter a valid phone number" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }
        if (await Seller.exists({ email })) {
            return res.status(409).json({ success: false, message: "A seller account with this email already exists" });
        }

        const seller = await Seller.create({
            name,
            email,
            phone,
            department,
            password: await bcrypt.hash(password, 10),
            isApproved: false,
        });

        return res.status(201).json({
            success: true,
            message: "Registration submitted. An admin must approve your seller account before you can log in.",
            seller: publicSeller(seller),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "A seller account with this email already exists" });
        }
        console.error("Seller registration error:", error);
        return res.status(500).json({ success: false, message: "Unable to register seller" });
    }
};

export const sellerLogin = async (req, res) => {
    try {
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const { password } = req.body;
        if (!email || typeof password !== "string" || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const seller = await Seller.findOne({ email });
        if (!seller || !(await bcrypt.compare(password, seller.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        if (!seller.isApproved) {
            return res.status(403).json({ success: false, message: "Your seller account is awaiting admin approval" });
        }
        if (seller.isActive === false) {
            return res.status(403).json({ success: false, message: "Your seller account has been disabled. Contact the administrator." });
        }

        const token = jwt.sign({ id: seller._id.toString(), role: "seller" }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("sellerToken", token, cookieOptions);
        return res.json({ success: true, message: "Logged in successfully", seller: publicSeller(seller) });
    } catch (error) {
        console.error("Seller login error:", error);
        return res.status(500).json({ success: false, message: "Unable to log in" });
    }
};

export const isSellerAuth = async (req, res) => {
    return res.json({ success: true, seller: publicSeller(req.seller) });
};

export const sellerLogout = async (_req, res) => {
    res.clearCookie("sellerToken", { ...cookieOptions, maxAge: undefined });
    return res.json({ success: true, message: "Logged out successfully" });
};
