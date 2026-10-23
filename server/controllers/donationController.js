import crypto from "node:crypto";
import Razorpay from "razorpay";

const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        const error = new Error("Donations are not configured");
        error.status = 503;
        throw error;
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const createDonationOrder = async (req, res) => {
    const amount = req.body.amount;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) {
        return res.status(400).json({
            success: false,
            message: "Enter a donation amount between ₹1 and ₹100,000",
        });
    }

    try {
        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `donation_${Date.now()}`,
            notes: { purpose: "nichetrade_donation" },
        });
        return res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error("Donation order creation error:", error);
        return res.status(error.status || 503).json({
            success: false,
            message: error.status === 503 ? error.message : "Unable to start donation. Please try again.",
        });
    }
};

export const verifyDonation = async (req, res) => {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (
        typeof orderId !== "string"
        || typeof paymentId !== "string"
        || typeof signature !== "string"
        || !/^[a-f\d]{64}$/i.test(signature)
    ) {
        return res.status(400).json({ success: false, message: "Donation payment details are incomplete" });
    }

    try {
        const razorpay = getRazorpay();
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
            return res.status(400).json({ success: false, message: "Donation payment could not be verified" });
        }

        const [order, payment] = await Promise.all([
            razorpay.orders.fetch(orderId),
            razorpay.payments.fetch(paymentId),
        ]);
        if (
            order.notes?.purpose !== "nichetrade_donation"
            || order.status !== "paid"
            || payment.order_id !== orderId
            || payment.amount !== order.amount
            || payment.currency !== "INR"
            || payment.status !== "captured"
        ) {
            return res.status(400).json({ success: false, message: "Donation payment was not captured" });
        }

        return res.json({ success: true, message: "Thank you for supporting NicheTrade!" });
    } catch (error) {
        console.error("Donation verification error:", error);
        return res.status(error.status || 400).json({
            success: false,
            message: error.status === 503 ? error.message : "Unable to verify donation. Please contact support before retrying.",
        });
    }
};
