import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const SellerSubscription = () => {
    const { axios } = useAppContext();
    const [subscription, setSubscription] = useState(null);
    const [plans, setPlans] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState("monthly");
    const [isPaying, setIsPaying] = useState(false);
    const [pendingPayment, setPendingPayment] = useState(null);

    const fetchStatus = useCallback(async () => {
        const { data } = await axios.get("/api/seller/subscription/status");
        if (!data.success) {
            throw new Error(data.message || "Unable to load subscription status");
        }
        setSubscription(data.subscription);
        setPlans(data.plans);
    }, [axios]);

    useEffect(() => {
        fetchStatus()
            .catch((error) => toast.error(error.response?.data?.message || error.message))
            .finally(() => setLoading(false));
    }, [fetchStatus]);

    const verifyPayment = async (payment, plan) => {
        try {
            const { data } = await axios.post("/api/seller/subscription/verify", {
                ...payment,
                plan,
            });
            if (!data.success) {
                throw new Error(data.message || "Payment verification failed");
            }
            setPendingPayment(null);
            await fetchStatus();
            toast.success(data.message || "Subscription activated");
        } catch (error) {
            setPendingPayment({ payment, plan });
            toast.error(error.response?.data?.message || error.message || "Payment received, but verification needs to be retried");
        } finally {
            setIsPaying(false);
        }
    };

    const startPayment = async (plan = selectedPlan) => {
        if (!window.Razorpay) {
            toast.error("Razorpay Checkout could not be loaded. Refresh the page and try again.");
            return;
        }

        setIsPaying(true);
        try {
            const { data } = await axios.post("/api/seller/subscription/create-order", { plan });
            if (!data.success) {
                throw new Error(data.message || "Unable to start subscription payment");
            }

            const checkout = new window.Razorpay({
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                order_id: data.order.id,
                name: "NicheTrade Seller",
                description: `${plan === "monthly" ? "30-day" : "365-day"} listing subscription`,
                prefill: data.seller,
                theme: { color: "#4f46e5" },
                handler: (response) => verifyPayment(response, plan),
                modal: { ondismiss: () => setIsPaying(false) },
            });
            checkout.on("payment.failed", (response) => {
                setIsPaying(false);
                toast.error(response.error?.description || "Payment failed. Please try again.");
            });
            checkout.open();
        } catch (error) {
            setIsPaying(false);
            toast.error(error.response?.data?.message || error.message || "Unable to start subscription payment");
        }
    };

    if (loading) {
        return <div className="grid min-h-[60vh] place-items-center text-gray-600">Loading subscription details...</div>;
    }

    const formattedExpiry = subscription?.expiresAt
        ? new Date(subscription.expiresAt).toLocaleDateString()
        : null;

    return (
        <main className="min-h-[95vh] overflow-y-auto px-4 py-8 md:px-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-500 p-7 text-white shadow-lg md:p-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Seller membership</p>
                    <h1 className="mt-2 text-3xl font-bold md:text-4xl">Keep your products on sale</h1>
                    <p className="mt-3 max-w-2xl text-indigo-100">
                        Choose a plan to create new product listings. Your seller dashboard, orders, and existing products stay available without an active plan.
                    </p>
                    <h2 className="text-sm mt-6 font-bold tracking-[0.1em] text-indigo-100">
                        A free trail is available for new sellers, allowing you to create a limited number of product listings without a paid plan.
                    </h2>
                    <div className="mt-6 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                        {subscription?.active
                            ? `Active until ${formattedExpiry} · ${subscription.daysRemaining} days remaining`
                            : subscription?.freeTrial?.remaining > 0
                                ? `${subscription.freeTrial.remaining} of ${subscription.freeTrial.limit} free product listings remaining`
                                : "No active subscription · free listings used"}
                    </div>
                </div>

                {pendingPayment && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
                        <p>Your payment went through but could not be verified. Retry verification before paying again.</p>
                        <button
                            type="button"
                            onClick={() => verifyPayment(pendingPayment.payment, pendingPayment.plan)}
                            disabled={isPaying}
                            className="rounded-xl bg-amber-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                        >
                            Retry verification
                        </button>
                    </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                    {plans && ["monthly", "yearly"].map((plan) => {
                        const isSelected = selectedPlan === plan;
                        const details = plans[plan];
                        return (
                            <button
                                key={plan}
                                type="button"
                                onClick={() => setSelectedPlan(plan)}
                                className={`rounded-3xl border-2 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                                    isSelected ? "border-indigo-600 ring-4 ring-indigo-100" : "border-gray-200"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-bold capitalize text-gray-900">{plan} plan</h2>
                                        <p className="mt-1 text-sm text-gray-500">One-time payment · {details.durationDays} days</p>
                                    </div>
                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                        {plan === "yearly" ? "Best value" : "Flexible"}
                                    </span>
                                </div>
                                <p className="mt-6 text-4xl font-extrabold text-gray-900">
                                    ₹{details.amount}<span className="ml-2 text-base font-medium text-gray-500">/ {details.durationDays} days</span>
                                </p>
                                <p className="mt-3 text-sm text-gray-600">Create new product listings while your plan is active.</p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
                    This is a one-time payment and does not auto-renew. Renew manually whenever you need more listing time.
                </div>
                <button
                    type="button"
                    onClick={() => startPayment()}
                    disabled={isPaying || !plans || Boolean(pendingPayment)}
                    className="mt-6 w-full rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:min-w-72"
                >
                    {isPaying ? "Processing..." : `Pay ₹${plans?.[selectedPlan]?.amount ?? "..."} with Razorpay`}
                </button>
            </div>
        </main>
    );
};

export default SellerSubscription;
