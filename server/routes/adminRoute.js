import express from "express";
import {
  adminAuthStatus,
  adminLogin,
  adminLogout,
  approveSeller,
  deleteAdminLostFoundPost,
  deleteAdminProduct,
  deleteAdminRequestItem,
  deleteDisabledSeller,
  decideSellerUploadRequest,
  listAdminLostFoundPosts,
  listAdminProducts,
  listAdminRequestItems,
  listSellers,
  listSellerUploadRequests,
  setSellerActiveStatus,
  setSellerUploadBenefits,
  updateAdminProduct,
} from "../controllers/adminController.js";
import authAdmin from "../middleware/authAdmin.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/is-auth", authAdmin, adminAuthStatus);
router.get("/logout", authAdmin, adminLogout);
router.get("/sellers", authAdmin, listSellers);
router.patch("/sellers/:sellerId/approve", authAdmin, approveSeller);
router.patch("/sellers/:sellerId/status", authAdmin, setSellerActiveStatus);
router.patch("/sellers/:sellerId/upload-benefits", authAdmin, setSellerUploadBenefits);
router.delete("/sellers/:sellerId", authAdmin, deleteDisabledSeller);
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
