import express from 'express';
import { authUser } from '../middleware/authMiddleware.js';
import { addAddress, getAddress, deleteAddress, } from '../controllers/addressController.js';

const addressRouter = express.Router();

addressRouter.post('/add', authUser, addAddress);
addressRouter.get('/get', authUser, getAddress);
addressRouter.delete('/:id', authUser, deleteAddress);
export default addressRouter;