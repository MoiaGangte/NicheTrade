import express from "express";
import {
  adminAuthStatus,
  adminLogin,
  adminLogout,
  deleteAdminLostFoundPost,
  deleteAdminProduct,
  deleteAdminRequestItem,
  decideSellerUploadRequest,
  listAdminLostFoundPosts,
  listAdminProducts,
  listAdminRequestItems,
  listSellerUploadRequests,
  setSellerUploadBenefits,
  updateAdminProduct,
} from "../controllers/adminController.js";
import authAdmin from "../middleware/authAdmin.js";
import { listManagedSellers, updateSellerStatus } from "../controllers/adminSellerController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/is-auth", authAdmin, adminAuthStatus);
router.get("/logout", authAdmin, adminLogout);
router.get("/seller-management", authAdmin, listManagedSellers);
router.post("/seller-management/:sellerId/:action", authAdmin, updateSellerStatus);
router.patch("/sellers/:sellerId/upload-benefits", authAdmin, setSellerUploadBenefits);
router.get("/seller-upload-requests", authAdmin, listSellerUploadRequests);
router.patch("/seller-upload-requests/:requestId", authAdmin, decideSellerUploadRequest);
router.get("/products", authAdmin, listAdminProducts);
router.patch("/products/:productId", authAdmin, updateAdminProduct);
router.delete("/products/:productId", authAdmin, deleteAdminProduct);
router.get("/lost-found", authAdmin, listAdminLostFoundPosts);
router.delete("/lost-found/:postId", authAdmin, deleteAdminLostFoundPost);
router.get("/request-items", authAdmin, listAdminRequestItems);
router.delete("/request-items/:requestId", authAdmin, deleteAdminRequestItem);
export default router;
