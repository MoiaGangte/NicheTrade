import crypto from "node:crypto";
import Razorpay from "razorpay";
import Seller from "../models/Seller.js";
import SellerSubscription from "../models/SellerSubscription.js";
import {
    FREE_LISTING_TRIAL_LIMIT,
    getSellerProductUploadCount,
} from "../utils/sellerFreeListingTrial.js";

const plans = {
    monthly: { amount: 2000, durationDays: 30 },
    yearly: { amount: 10000, durationDays: 365 },
};

const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay is not configured");
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export const getSellerSubscriptionStatus = async (req, res) => {
    try {
        const seller = await Seller.findById(req.sellerId).select("subscriptionPlan subscriptionExpiresAt");
        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller account not found" });
        }

        const productUploadsCount = await getSellerProductUploadCount(req.sellerId);
        const expiresAt = seller.subscriptionExpiresAt || null;
        const active = Boolean(expiresAt && expiresAt > new Date());
        const freeListingsRemaining = Math.max(0, FREE_LISTING_TRIAL_LIMIT - productUploadsCount);
        const daysRemaining = active
            ? Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            : 0;

        return res.json({
            success: true,
            subscription: {
                active,
                plan: active ? seller.subscriptionPlan : null,
                expiresAt,
                daysRemaining,
                freeTrial: {
                    limit: FREE_LISTING_TRIAL_LIMIT,
                    used: Math.min(FREE_LISTING_TRIAL_LIMIT, productUploadsCount),
                    remaining: freeListingsRemaining,
                },
                canCreateListings: active || freeListingsRemaining > 0,
            },
            plans: {
                monthly: { amount: plans.monthly.amount / 100, durationDays: plans.monthly.durationDays },
                yearly: { amount: plans.yearly.amount / 100, durationDays: plans.yearly.durationDays },
            },
        });
    } catch (error) {
        console.error("Seller subscription status error:", error);
        return res.status(500).json({ success: false, message: "Unable to fetch subscription status" });
    }
};

export const createSellerSubscriptionOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        if (!Object.hasOwn(plans, plan)) {
            return res.status(400).json({ success: false, message: "Choose a valid subscription plan" });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount: plans[plan].amount,
            currency: "INR",
            receipt: `seller_${req.sellerId}_${Date.now()}`,
            notes: { sellerId: req.sellerId.toString(), plan },
        });

        return res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            seller: {
                name: req.seller.name,
                email: req.seller.email,
                phone: req.seller.phone,
            },
        });
    } catch (error) {
        console.error("Seller subscription order creation error:", error);
        return res.status(503).json({
            success: false,
            message: error.message === "Razorpay is not configured"
                ? error.message
                : "Unable to create subscription payment. Please try again.",
        });
    }
};

export const verifySellerSubscriptionPayment = async (req, res) => {
    try {
        const { plan, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
        if (!Object.hasOwn(plans, plan) || !orderId || !paymentId || !signature) {
            return res.status(400).json({ success: false, message: "Subscription payment details are incomplete" });
        }
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ success: false, message: "Razorpay is not configured" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");
        const providedSignature = Buffer.from(signature, "hex");
        const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");
        if (
            !process.env.RAZORPAY_KEY_SECRET
            || providedSignature.length !== expectedSignatureBuffer.length
            || !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
        ) {
            return res.status(400).json({ success: false, message: "Payment signature verification failed" });
        }

        const razorpay = getRazorpay();
        const [order, payment] = await Promise.all([
            razorpay.orders.fetch(orderId),
            razorpay.payments.fetch(paymentId),
        ]);
        const amount = plans[plan].amount;

        if (
            order.notes?.sellerId !== req.sellerId.toString()
            || order.notes?.plan !== plan
            || order.amount !== amount
            || order.currency !== "INR"
            || order.status !== "paid"
            || payment.order_id !== orderId
            || payment.amount !== amount
            || payment.currency !== "INR"
            || payment.status !== "captured"
        ) {
            return res.status(400).json({ success: false, message: "Payment could not be verified as captured for this subscription" });
        }

        let subscription = await SellerSubscription.findOne({ paymentId });
        if (subscription) {
            if (
                subscription.sellerId.toString() !== req.sellerId.toString()
                || subscription.orderId !== orderId
                || subscription.plan !== plan
            ) {
                return res.status(409).json({ success: false, message: "This payment has already been used" });
            }
            if (subscription.status === "active") {
                return res.json({
                    success: true,
                    message: "This subscription payment has already been applied",
                    expiresAt: subscription.expiresAt,
                });
            }
        } else {
            const seller = await Seller.findById(req.sellerId).select("subscriptionExpiresAt");
            if (!seller) {
                return res.status(404).json({ success: false, message: "Seller account not found" });
            }

            const now = new Date();
            const startsAt = seller.subscriptionExpiresAt && seller.subscriptionExpiresAt > now
                ? seller.subscriptionExpiresAt
                : now;
            const expiresAt = new Date(startsAt.getTime() + plans[plan].durationDays * 24 * 60 * 60 * 1000);

            try {
                subscription = await SellerSubscription.create({
                    sellerId: req.sellerId,
                    plan,
                    amount,
                    orderId,
                    paymentId,
                    startsAt,
                    expiresAt,
                });
            } catch (error) {
                if (error.code !== 11000) {
                    throw error;
                }
                subscription = await SellerSubscription.findOne({ paymentId });
                if (
                    !subscription
                    || subscription.sellerId.toString() !== req.sellerId.toString()
                    || subscription.orderId !== orderId
                    || subscription.plan !== plan
                ) {
                    return res.status(409).json({ success: false, message: "This payment has already been used" });
                }
                if (subscription.status === "active") {
                    return res.json({
                        success: true,
                        message: "This subscription payment has already been applied",
                        expiresAt: subscription.expiresAt,
                    });
                }
            }
        }

        const updatedSeller = await Seller.findByIdAndUpdate(req.sellerId, {
            $set: { subscriptionPlan: plan },
            $max: { subscriptionExpiresAt: subscription.expiresAt },
        });
        if (!updatedSeller) {
            return res.status(404).json({ success: false, message: "Seller account not found" });
        }
        await SellerSubscription.updateOne({ _id: subscription._id }, { $set: { status: "active" } });

        return res.json({
            success: true,
            message: "Seller subscription activated",
            expiresAt: subscription.expiresAt,
        });
    } catch (error) {
        console.error("Seller subscription verification error:", error);
        return res.status(500).json({ success: false, message: "Unable to verify subscription payment" });
    }
};
