import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStudentDetails, parseDateOfBirth } from '../utils/studentDetails.js';

const getAuthCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
});

const getPublicUser = (user) => {
    const publicUser = user.toObject();
    delete publicUser.password;
    return publicUser;
};

//register user : /api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const studentDetails = getStudentDetails(req.body);

        if (
            typeof name !== 'string' || !name.trim() ||
            typeof email !== 'string' || !email.trim() ||
            typeof password !== 'string' || !password ||
            !studentDetails
        ) {
            return res.status(400).json({ success: false, message: 'Complete all account and student information fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'User already exists' });
        }

        const existingRegisterNumber = await User.findOne({ registerNumber: studentDetails.registerNumber });
        if (existingRegisterNumber) {
            return res.status(409).json({ success: false, message: 'Register number is already associated with another account' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: email.trim(),
            password: hashedPassword,
            ...studentDetails,
            cartItems: {},
            favorites: {}
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, getAuthCookieOptions());

        return res.json({ success: true, user: getPublicUser(user), token });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email or register number is already associated with an account' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message });
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

        res.cookie('token', token, getAuthCookieOptions());

        return res.json({ success: true, user: getPublicUser(user), token });

    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: error.message });
    }
}

export const loginWithRegisterNumber = async (req, res) => {
    try {
        const { registerNumber, dateOfBirth } = req.body;
        const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);

        if (typeof registerNumber !== 'string' || !registerNumber.trim() || !parsedDateOfBirth) {
            return res.status(400).json({ success: false, message: 'Register number and date of birth are required' });
        }

        const user = await User.findOne({
            registerNumber: registerNumber.trim(),
            dateOfBirth: parsedDateOfBirth,
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid register number or date of birth' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, getAuthCookieOptions());

        return res.json({ success: true, user: getPublicUser(user), token });
    } catch (error) {
        console.error('Register number login error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

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
        res.clearCookie('token', getAuthCookieOptions());
        res.clearCookie('token', {
            ...getAuthCookieOptions(),
            secure: true,
            sameSite: 'none',
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

export const updateProfile = async (req, res) => {
    try {
        const studentDetails = getStudentDetails(req.body);
        if (!studentDetails) {
            return res.status(400).json({ success: false, message: 'Invalid profile information' });
        }

        const existingUser = await User.findOne({
            registerNumber: studentDetails.registerNumber,
            _id: { $ne: req.userId },
        });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Register number is already associated with another account' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            studentDetails,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, user, message: 'Profile information saved' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Register number is already associated with another account' });
        }
        console.error('Profile update error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};