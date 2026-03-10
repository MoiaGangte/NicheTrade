import express from 'express';
import { upload } from '../configs/multer.js';
import authSeller from '../middleware/authSeller.js';
import { addProduct, changeStock, productById, productList, sellerProductList, deleteProduct, getCategories, deleteCategory } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.get('/categories', getCategories)
productRouter.delete('/category', authSeller, deleteCategory)
productRouter.post('/add', upload.array('images'), authSeller, addProduct)
productRouter.get('/list', productList)
productRouter.get('/seller/list', authSeller, sellerProductList)
productRouter.post('/stock', authSeller, changeStock)
productRouter.post('/id', productById)
productRouter.delete('/delete/:id', authSeller, deleteProduct)

export default productRouter;