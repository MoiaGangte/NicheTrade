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

// Auth middleware for sellers
export const authSeller = async (req, res, next) => {
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
        
        // Check if the token belongs to a seller
        if (decoded.email === process.env.SELLER_EMAIL && decoded.id === 'seller') {
            req.userId = decoded.id;
            req.isSeller = true;
            return next();
        }

        return res.status(401).json({ success: false, message: 'Not authorized as seller' });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

// Combined auth middleware for both users and sellers
export const combinedAuth = async (req, res, next) => {
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
        
        // First check if it's a seller
        if (decoded.email === process.env.SELLER_EMAIL && decoded.id === 'seller') {
            req.userId = decoded.id;
            req.isSeller = true;
            return next();
        }

        // If not a seller, check if it's a user///////
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
            req.userId = user._id;
            req.isSeller = false;
            return next();
        }

        // If neither user nor seller found////for security//
        return res.status(401).json({ success: false, message: 'Not authorized' });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
}; 