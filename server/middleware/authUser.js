import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: 'Not Authorized' });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if (!tokenDecode || !tokenDecode.userId) {
            return res.json({ success: false, message: 'Invalid token' });
        }
        
        req.userId = tokenDecode.userId;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.json({ success: false, message: 'Not Authorized' });
    }
}

export default authUser;