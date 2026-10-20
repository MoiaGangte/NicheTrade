import crypto from "crypto";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import SellerUploadRequest from "../models/SellerUploadRequest.js";
import User from "../models/User.js";
import LostFoundPost from "../models/LostFoundPost.js";
import RequestItem from "../models/RequestItem.js";

const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const constantTimeMatch = (provided, configured) => {
  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);
  return providedBuffer.length === configuredBuffer.length
    && crypto.timingSafeEqual(providedBuffer, configuredBuffer);
};

export const adminLogin = (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const configuredEmail = (process.env.ADMIN_EMAIL || process.env.SELLER_EMAIL || "").trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || process.env.SELLER_PASSWORD || "";

  if (!configuredEmail || !configuredPassword) {
    return res.status(503).json({ success: false, message: "Admin credentials are not configured" });
  }
  if (!email || !password || !constantTimeMatch(email, configuredEmail) || !constantTimeMatch(password, configuredPassword)) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("adminToken", token, adminCookieOptions);
  return res.json({ success: true, message: "Logged in successfully" });
};

export const adminLogout = (_req, res) => {
  res.clearCookie("adminToken", { ...adminCookieOptions, maxAge: undefined });
  return res.json({ success: true, message: "Logged out successfully" });
};

export const adminAuthStatus = (_req, res) => res.json({ success: true, isAdmin: true });

export const listSellers = async (req, res) => {
  try {
    const filter = req.query.status === "approved"
      ? { isApproved: true, isActive: { $ne: false } }
      : req.query.status === "disabled"
        ? { isApproved: true, isActive: false }
        : req.query.status === "pending"
          ? { isApproved: false }
          : {};
    const sellers = await Seller.find(filter)
      .select("_id userId name email phone department storeName address gstNumber storeDescription freeUploads isVip isApproved isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, sellers });
  } catch (error) {
    console.error("Admin seller list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load seller accounts" });
  }
};

export const approveSeller = async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.sellerId,
      { isApproved: true },
      { new: true, runValidators: true }
    ).select("_id name email phone department freeUploads isVip isApproved isActive createdAt");
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller account not found" });
    }
    return res.json({ success: true, message: "Seller approved", seller });
  } catch (error) {
    console.error("Admin seller approval error:", error);
    return res.status(400).json({ success: false, message: "Unable to approve seller account" });
  }
};

export const setSellerActiveStatus = async (req, res) => {
  try {
    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }
    const seller = await Seller.findOneAndUpdate(
      { _id: req.params.sellerId, isApproved: true },
      { isActive: req.body.isActive },
      { new: true, runValidators: true }
    ).select("_id name email phone department freeUploads isVip isApproved isActive createdAt");
    if (!seller) {
      return res.status(404).json({ success: false, message: "Approved seller account not found" });
    }
    return res.json({
      success: true,
      message: req.body.isActive ? "Seller enabled" : "Seller disabled",
      seller,
    });
  } catch (error) {
    console.error("Admin seller status update error:", error);
    return res.status(400).json({ success: false, message: "Unable to update seller status" });
  }
};

export const setSellerUploadBenefits = async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.isVip === "boolean") updates.isVip = req.body.isVip;
    if (req.body.freeUploads !== undefined) {
      if (!Number.isSafeInteger(req.body.freeUploads) || req.body.freeUploads < 0) {
        return res.status(400).json({ success: false, message: "Free uploads must be a non-negative whole number" });
      }
      updates.freeUploads = req.body.freeUploads;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "Provide VIP status or a free upload balance" });
    }

    const seller = await Seller.findByIdAndUpdate(
      req.params.sellerId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("_id name email freeUploads isVip isApproved isActive");
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller account not found" });
    }
    return res.json({ success: true, message: "Seller upload benefits updated", seller });
  } catch (error) {
    console.error("Admin seller upload benefit update error:", error);
    return res.status(500).json({ success: false, message: "Unable to update seller upload benefits" });
  }
};

export const listSellerUploadRequests = async (_req, res) => {
  try {
    const requests = await SellerUploadRequest.find({ status: "pending" })
      .populate("sellerId", "name email storeName freeUploads isVip")
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ success: true, requests });
  } catch (error) {
    console.error("Admin seller upload request list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load seller upload requests" });
  }
};

export const decideSellerUploadRequest = async (req, res) => {
  const { decision, freeUploads } = req.body;
  if (!["credits", "vip", "reject"].includes(decision)) {
    return res.status(400).json({ success: false, message: "Choose a valid request decision" });
  }
  if (decision === "credits" && (!Number.isSafeInteger(freeUploads) || freeUploads < 1)) {
    return res.status(400).json({ success: false, message: "Grant at least one free upload" });
  }

  try {
    const request = await SellerUploadRequest.findOneAndUpdate(
      { _id: req.params.requestId, status: "pending" },
      { $set: { status: "processing" } },
      { new: true },
    );
    if (!request) {
      return res.status(404).json({ success: false, message: "Pending upload request not found" });
    }

    let benefitsApplied = false;
    try {
      if (decision !== "reject") {
        const sellerUpdate = decision === "vip"
          ? { $set: { isVip: true } }
          : { $inc: { freeUploads } };
        const seller = await Seller.findByIdAndUpdate(request.sellerId, sellerUpdate, { new: true });
        if (!seller) throw new Error("Seller account not found");
        benefitsApplied = true;
      }

      request.status = decision === "reject" ? "rejected" : "approved";
      request.decisionType = decision === "reject" ? undefined : decision;
      request.grantedUploads = decision === "credits" ? freeUploads : 0;
      request.decidedAt = new Date();
      await request.save();
      return res.json({ success: true, message: decision === "reject" ? "Request rejected" : "Seller upload request approved" });
    } catch (error) {
      if (!benefitsApplied) {
        await SellerUploadRequest.updateOne(
          { _id: request._id, status: "processing" },
          { $set: { status: "pending" }, $unset: { decisionType: 1, decidedAt: 1 } },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Admin seller upload request decision error:", error);
    return res.status(500).json({ success: false, message: "Unable to process seller upload request" });
  }
};

export const deleteDisabledSeller = async (req, res) => {
  try {
    const seller = await Seller.findOne({
      _id: req.params.sellerId,
      isApproved: true,
      isActive: false,
    }).select("_id userId");

    if (!seller) {
      return res.status(409).json({
        success: false,
        message: "Seller must be disabled before it can be deleted",
      });
    }

    await Product.deleteMany({ sellerId: seller._id });
    await SellerUploadRequest.deleteMany({ sellerId: seller._id });

    const deletedSeller = await Seller.findOneAndDelete({
      _id: seller._id,
      isApproved: true,
      isActive: false,
    });
    if (!deletedSeller) {
      return res.status(409).json({
        success: false,
        message: "Seller status changed before deletion. No seller account was deleted; try again.",
      });
    }

    if (deletedSeller.userId) {
      await User.updateOne(
        { _id: deletedSeller.userId, role: "seller" },
        { $set: { role: "user" } }
      );
    }

    return res.json({
      success: true,
      message: "Seller account and all of their product listings were permanently deleted",
    });
  } catch (error) {
    console.error("Admin seller deletion error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete seller account" });
  }
};

export const listAdminProducts = async (_req, res) => {
  try {
    const products = await Product.find({})
      .populate("sellerId", "name email department")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, products });
  } catch (error) {
    console.error("Admin product list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load products" });
  }
};

export const listAdminLostFoundPosts = async (_req, res) => {
  try {
    const posts = await LostFoundPost.find({})
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, posts });
  } catch (error) {
    console.error("Admin lost and found list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load lost and found posts" });
  }
};

export const deleteAdminLostFoundPost = async (req, res) => {
  try {
    const post = await LostFoundPost.findByIdAndDelete(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Lost and found post not found" });
    }
    return res.json({ success: true, message: "Lost and found post deleted" });
  } catch (error) {
    console.error("Admin lost and found deletion error:", error);
    return res.status(400).json({ success: false, message: "Unable to delete lost and found post" });
  }
};

export const listAdminRequestItems = async (_req, res) => {
  try {
    const requests = await RequestItem.find({})
      .populate("requesterId", "name email department")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, requests });
  } catch (error) {
    console.error("Admin item request list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load item requests" });
  }
};

export const deleteAdminRequestItem = async (req, res) => {
  try {
    const request = await RequestItem.findByIdAndDelete(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Item request not found" });
    }
    return res.json({ success: true, message: "Item request deleted" });
  } catch (error) {
    console.error("Admin item request deletion error:", error);
    return res.status(400).json({ success: false, message: "Unable to delete item request" });
  }
};

export const updateAdminProduct = async (req, res) => {
  try {
    const { name, category, price, offerPrice, description, image, stockQuantity, isVisible, isBestSeller } = req.body;
    const updates = {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }
    if (typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ success: false, message: "Product category is required" });
    }
    const parsedPrice = Number(price);
    const parsedOfferPrice = Number(offerPrice);
    const parsedStock = Number(stockQuantity);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || !Number.isFinite(parsedOfferPrice) || parsedOfferPrice < 0) {
      return res.status(400).json({ success: false, message: "Product prices must be non-negative numbers" });
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: "Stock quantity must be a non-negative whole number" });
    }
    if (typeof isVisible !== "boolean" || typeof isBestSeller !== "boolean") {
      return res.status(400).json({ success: false, message: "Product visibility and bestseller status are required" });
    }

    const cleanDescription = Array.isArray(description)
      ? description.filter((line) => typeof line === "string" && line.trim()).map((line) => line.trim())
      : typeof description === "string"
        ? description.split("\n").map((line) => line.trim()).filter(Boolean)
        : [];
    if (!cleanDescription.length) {
      return res.status(400).json({ success: false, message: "Product description is required" });
    }
    if (!Array.isArray(image) || image.length === 0 || image.length > 4 || image.some((url) => (
      typeof url !== "string" || !/^https?:\/\/\S+$/i.test(url.trim())
    ))) {
      return res.status(400).json({ success: false, message: "Product images must be valid HTTP or HTTPS URLs" });
    }

    Object.assign(updates, {
      name: name.trim(),
      category: category.trim(),
      price: parsedPrice,
      offerPrice: parsedOfferPrice,
      description: cleanDescription,
      image: image.map((url) => url.trim()),
      stockQuantity: parsedStock,
      inStock: parsedStock > 0,
      isVisible,
      isBestSeller,
    });

    const existingProduct = await Product.findById(req.params.productId).select("category categories");
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    updates.categories = existingProduct.category === category.trim()
      ? (existingProduct.categories?.length ? existingProduct.categories : [category.trim()])
      : [category.trim()];

    const product = await Product.findByIdAndUpdate(req.params.productId, updates, {
      new: true,
      runValidators: true,
    }).populate("sellerId", "name email department");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, message: "Product updated", product });
  } catch (error) {
    console.error("Admin product update error:", error);
    return res.status(400).json({ success: false, message: "Unable to update product" });
  }
};

export const deleteAdminProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Admin product deletion error:", error);
    return res.status(400).json({ success: false, message: "Unable to delete product" });
  }
};
