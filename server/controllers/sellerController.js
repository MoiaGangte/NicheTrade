import jwt from 'jsonwebtoken';

// Login Seller : /api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
            const token = jwt.sign({ 
                id: 'seller', // Add a fixed ID for the seller
                email 
            }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.cookie('sellerToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            });

            return res.json({ success: true, message: "Logged In Successfully" });
        } else {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    } catch (error) {
        console.error('Seller login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Seller isAuth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        const { sellerToken } = req.cookies;
        
        if (!sellerToken) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
        if (!tokenDecode || tokenDecode.email !== process.env.SELLER_EMAIL) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        return res.json({ success: true, message: 'Authenticated' });
    } catch (error) {
        console.error('Seller auth check error:', error);
        res.status(401).json({ success: false, message: error.message });
    }
};

// Logout seller : /api/seller/logout
export const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            path: '/'
        });
        return res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error('Seller logout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
