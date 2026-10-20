import crypto from "node:crypto";
import Razorpay from "razorpay";
import Product from "../models/Product.js";
import SellerListingPayment from "../models/SellerListingPayment.js";
import {
    getSellerListingAmountInPaise,
    normalizeListingQuantity,
} from "../utils/productCategories.js";

const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new Error("Razorpay is not configured");
    }
    if (!keyId.startsWith("rzp_test_")) {
        throw new Error("Seller listing payments require Razorpay test-mode keys (rzp_test_).");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

export const createSellerListingOrder = async (req, res) => {
    try {
        const quantity = normalizeListingQuantity(req.body.quantity);
        if (req.seller.isVip || (req.seller.freeUploads || 0) > 0) {
            return res.json({
                success: true,
                freeListing: true,
                freeUploads: req.seller.freeUploads || 0,
                isVip: req.seller.isVip === true,
            });
        }
        const amount = getSellerListingAmountInPaise(quantity);
        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `listing_${req.sellerId}_${Date.now()}`,
            notes: {
                sellerId: req.sellerId.toString(),
                quantity: quantity.toString(),
            },
        });

        await SellerListingPayment.create({
            sellerId: req.sellerId,
            orderId: order.id,
            quantity,
            amount,
        });

        return res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            seller: {
                name: req.seller.name,
                email: req.seller.email,
                contact: req.seller.phone,
            },
        });
    } catch (error) {
        console.error("Seller listing order creation error:", error);
        return res.status(error.status || 503).json({
            success: false,
            message: error.message === "Razorpay is not configured"
                || error.message?.startsWith("Seller listing payments require")
                ? error.message
                : error.status === 400
                    ? error.message
                    : "Unable to create listing payment. Please try again.",
        });
    }
};

export const beginSellerListingPayment = async (sellerId, quantityValue, paymentDetails) => {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = paymentDetails;
    const quantity = normalizeListingQuantity(quantityValue);
    if (!orderId || !paymentId || !signature || !/^[a-f\d]{64}$/i.test(signature)) {
        const error = new Error("Listing payment details are incomplete");
        error.status = 400;
        throw error;
    }
    const razorpay = getRazorpay();
    const listingPayment = await SellerListingPayment.findOne({
        sellerId,
        orderId,
        quantity,
    });
    if (!listingPayment || listingPayment.amount !== getSellerListingAmountInPaise(quantity)) {
        const error = new Error("Listing payment does not match the submitted quantity");
        error.status = 400;
        throw error;
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    const providedSignature = Buffer.from(signature, "hex");
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");
    if (
        providedSignature.length !== expectedSignatureBuffer.length
        || !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
    ) {
        const error = new Error("Payment signature verification failed");
        error.status = 400;
        throw error;
    }

    if (listingPayment.status === "used") {
        if (listingPayment.paymentId !== paymentId) {
            const error = new Error("This listing payment has already been used");
            error.status = 409;
            throw error;
        }
        const existingProduct = await Product.findOne({
            _id: listingPayment.productId,
            sellerId,
        });
        if (existingProduct) {
            return { alreadyCompleted: true, product: existingProduct };
        }
        const error = new Error("This payment was already applied to a listing");
        error.status = 409;
        throw error;
    }

    const [order, payment] = await Promise.all([
        razorpay.orders.fetch(orderId),
        razorpay.payments.fetch(paymentId),
    ]);
    if (
        order.notes?.sellerId !== sellerId.toString()
        || Number(order.notes?.quantity) !== quantity
        || order.amount !== listingPayment.amount
        || order.currency !== "INR"
        || order.status !== "paid"
        || payment.order_id !== orderId
        || payment.amount !== listingPayment.amount
        || payment.currency !== "INR"
        || payment.status !== "captured"
    ) {
        const error = new Error("Payment could not be verified as captured for this listing");
        error.status = 400;
        throw error;
    }

    try {
        const claimedPayment = await SellerListingPayment.findOneAndUpdate(
            { _id: listingPayment._id, status: "pending" },
            { $set: { status: "processing", paymentId } },
            { new: true },
        );
        if (!claimedPayment) {
            const error = new Error("This listing payment has already been used");
            error.status = 409;
            throw error;
        }
        return claimedPayment;
    } catch (error) {
        if (error.code === 11000) {
            error.status = 409;
            error.message = "This payment has already been used";
        }
        throw error;
    }
};

export const completeSellerListingPayment = async (listingPayment, productId) => {
    const result = await SellerListingPayment.updateOne(
        { _id: listingPayment._id, status: "processing" },
        { $set: { status: "used", productId } },
    );
    if (result.modifiedCount !== 1) {
        throw new Error("Unable to record listing payment");
    }
};

export const releaseSellerListingPayment = async (listingPayment) => {
    await SellerListingPayment.updateOne(
        { _id: listingPayment._id, status: "processing" },
        { $set: { status: "pending" }, $unset: { paymentId: 1 } },
    );
};
