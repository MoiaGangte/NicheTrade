import jwt from "jsonwebtoken";

const authAdmin = (req, res, next) => {
    try {
        const token = req.cookies.adminToken;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized as admin" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(401).json({ success: false, message: "Not authorized as admin" });
        }

        req.isAdmin = true;
        next();
    } catch (error) {
        console.error("Admin auth middleware error:", error);
        res.status(401).json({ success: false, message: "Not authorized as admin" });
    }
};

export default authAdmin;
