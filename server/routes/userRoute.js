import express from 'express';
import { isAuth, login, loginWithRegisterNumber, logout, register, updateFavorites, updateProfile } from '../controllers/userController.js';
import { authUser } from '../middleware/authMiddleware.js';
import passport from 'passport';
import { getStudentDetails } from '../utils/studentDetails.js';

const userRouter = express.Router();

userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.post('/login-register-number', loginWithRegisterNumber)
userRouter.post('/google', (req, res, next) => {
    const studentDetails = getStudentDetails(req.body);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name || !studentDetails) {
        return res.status(400).json({ success: false, message: 'Complete all student information fields before using Google sign-in' });
    }

    req.session.googleStudentDetails = { name, ...studentDetails };
    req.session.save((error) => {
        if (error) {
            return next(error);
        }
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    });
})
userRouter.get('/is-auth', authUser, isAuth)
userRouter.get('/logout', logout)
userRouter.post('/logout', logout)
userRouter.post('/favorites/update', authUser, updateFavorites)
userRouter.put('/profile', authUser, updateProfile)

export default userRouter