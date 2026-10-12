import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Auth middleware for users
export const authUser = async (req, res, next) => {
    try {
        const headerAuth = req.headers.authorization || req.headers.Authorization;
        const bearerToken = headerAuth && headerAuth.startsWith('Bearer ')
            ? headerAuth.substring(7)
            : null;
        const token = bearerToken || req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        req.userId = user._id;
        req.isSeller = false;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
};