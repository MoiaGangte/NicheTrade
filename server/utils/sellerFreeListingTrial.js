import Product from "../models/Product.js";
import Seller from "../models/Seller.js";

export const FREE_LISTING_TRIAL_LIMIT = 10;

export const getSellerProductUploadCount = async (sellerId) => {
    const seller = await Seller.collection.findOne(
        { _id: sellerId },
        { projection: { productUploadsCount: 1, freeProductUploadsUsed: 1 } },
    );

    if (!seller) {
        throw new Error("Seller account not found");
    }
    if (Number.isInteger(seller.productUploadsCount)) {
        return seller.productUploadsCount;
    }

    const existingProductCount = await Product.countDocuments({ sellerId });
    const initialCount = Math.max(existingProductCount, seller.freeProductUploadsUsed || 0);
    await Seller.collection.updateOne(
        { _id: sellerId, productUploadsCount: { $exists: false } },
        { $set: { productUploadsCount: initialCount } },
    );

    const updatedSeller = await Seller.collection.findOne(
        { _id: sellerId },
        { projection: { productUploadsCount: 1 } },
    );
    if (!Number.isInteger(updatedSeller?.productUploadsCount)) {
        throw new Error("Unable to initialize seller free listing trial");
    }

    return updatedSeller.productUploadsCount;
};

export const reserveSellerProductUpload = async (sellerId, requiresFreeTrialSlot) => {
    const filter = { _id: sellerId };
    if (requiresFreeTrialSlot) {
        filter.productUploadsCount = { $lt: FREE_LISTING_TRIAL_LIMIT };
    }
    const result = await Seller.collection.updateOne(
        filter,
        { $inc: { productUploadsCount: 1 } },
    );

    return result.modifiedCount === 1;
};

export const releaseSellerProductUpload = async (sellerId) => {
    await Seller.collection.updateOne(
        { _id: sellerId, productUploadsCount: { $gt: 0 } },
        { $inc: { productUploadsCount: -1 } },
    );
};
