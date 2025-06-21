import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

//register user : /api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            cartItems: {},
            favorites: {}
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',//////////////
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        return res.json({ success: true, user });

    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: error.message });
    }
};

// login user : /api/user/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.json({ success: false, message: 'Email and password are required' });
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch)
            return res.json({ success: false, message: 'Invalid email or password' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',///////////
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        return res.json({ success: true, user });

    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: error.message });
    }
}

//check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, user });
    } catch (error) {
        console.error('Auth check error:', error);
        res.json({ success: false, message: error.message });
    }
}

//logout User : /api/user/logout
export const logout = async (_req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            path: '/'
        });
        return res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error('Logout error:', error);
        res.json({ success: false, message: error.message });
    }
}

//update favorites : /api/user/favorites/update
export const updateFavorites = async (req, res) => {
    try {
        const { favorites } = req.body;
        await User.findByIdAndUpdate(req.userId, { favorites });
        res.json({ success: true, message: "Favorites Updated" });
    } catch (error) {
        console.error('Favorites update error:', error);
        res.json({ success: false, message: error.message });
    }
}