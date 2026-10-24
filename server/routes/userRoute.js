import express from 'express';
import passport from 'passport';
import { adminAccessStatus, adminMobileLogin } from '../controllers/adminController.js';
import { createMobileGoogleRegistration, exchangeMobileAuthCode, isAuth, login, loginWithRegisterNumber, logout, readMobileGoogleRegistration, register, updateFavorites, updateProfile } from '../controllers/userController.js';
import { authUser } from '../middleware/authMiddleware.js';
import { getStudentDetails } from '../utils/studentDetails.js';
import { createMobileGoogleOAuthState, isAllowedMobileWebRedirect } from '../utils/mobileGoogleOAuth.js';

const userRouter = express.Router();

userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.post('/login-register-number', loginWithRegisterNumber)
userRouter.post('/mobile-auth/start', createMobileGoogleRegistration)
userRouter.post('/mobile-auth/exchange', exchangeMobileAuthCode)
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
        res.json({ success: true });
    });
})
userRouter.get('/google', (req, res, next) => {
    if (req.query.mobileRegistration !== undefined) {
        const registration = readMobileGoogleRegistration(req.query.mobileRegistration);
        if (!registration) {
            return res.status(400).json({ success: false, message: 'Mobile Google registration data is invalid or expired' });
        }
        req.session.googleStudentDetails = registration;
    }
    if (req.query.mobileRedirect !== undefined) {
        const isMobileRedirect = req.query.mobileRedirect === 'nichetrade://auth';
        const isWebRedirect = typeof req.query.mobileRedirect === 'string'
            && isAllowedMobileWebRedirect(req.query.mobileRedirect);
        if ((!isMobileRedirect && !isWebRedirect)
            || typeof req.query.mobileState !== 'string'
            || req.query.mobileState.length < 32
            || req.query.mobileState.length > 128
            || (req.query.mobileRegistration !== undefined && typeof req.query.mobileRegistration !== 'string')) {
            return res.status(400).json({ success: false, message: 'Invalid mobile sign-in redirect' });
        }
        req.mobileGoogleOAuthState = createMobileGoogleOAuthState({
            mobileRedirect: req.query.mobileRedirect,
            mobileState: req.query.mobileState,
            mobileRegistration: req.query.mobileRegistration,
        });
        return next();
    }
    next();
}, (req, res, next) => {
    const options = { scope: ['profile', 'email'] };
    if (req.mobileGoogleOAuthState) options.state = req.mobileGoogleOAuthState;
    passport.authenticate('google', options)(req, res, next);
})
userRouter.get('/is-auth', authUser, isAuth)
userRouter.get('/logout', logout)
userRouter.post('/logout', logout)
userRouter.get('/admin-access', authUser, adminAccessStatus)
userRouter.post('/admin-login', authUser, adminMobileLogin)
userRouter.post('/favorites/update', authUser, updateFavorites)
userRouter.put('/profile', authUser, updateProfile)

export default userRouter