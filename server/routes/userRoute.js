import express from 'express';
import { isAuth, login, logout, register, updateFavorites } from '../controllers/userController.js';
import { authUser } from '../middleware/authMiddleware.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const userRouter = express.Router();

userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.get('/is-auth', authUser, isAuth)
userRouter.get('/logout', authUser, logout)
userRouter.post('/favorites/update', authUser, updateFavorites)

export default userRouter