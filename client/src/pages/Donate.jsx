import { useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const donationOptions = [50, 100, 500];

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
        resolve();
        return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => {
        script.remove();
        reject(new Error("Unable to load the donation payment form"));
    };
    document.head.appendChild(script);
});

export default function Donate() {
    const { axios, user } = useAppContext();
    const [amount, setAmount] = useState("50");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDonate = async (event) => {
        event.preventDefault();
        const donationAmount = Number(amount);
        if (!Number.isSafeInteger(donationAmount) || donationAmount < 1 || donationAmount > 100000) {
            toast.error("Enter a whole-rupee donation between ₹1 and ₹100,000.");
            return;
        }

        setIsSubmitting(true);
        try {
            await loadRazorpayCheckout();
            const { data } = await axios.post("/api/donation/create-order", { amount: donationAmount });
            if (!data.success) throw new Error(data.message || "Unable to start donation");

            const checkout = new window.Razorpay({
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                order_id: data.order.id,
                name: "NicheTrade",
                description: "Voluntary community donation",
                prefill: { name: user?.name, email: user?.email },
                theme: { color: "#4f46e5" },
                handler: async (payment) => {
                    try {
                        const { data: verification } = await axios.post("/api/donation/verify", payment);
                        if (!verification.success) throw new Error(verification.message || "Unable to verify donation");
                        toast.success("Thank you for supporting NicheTrade!");
                    } catch (error) {
                        toast.error(error.response?.data?.message || error.message || "Donation confirmation failed. Contact support before retrying.");
                    } finally {
                        setIsSubmitting(false);
                    }
                },
                modal: { ondismiss: () => setIsSubmitting(false) },
            });
            checkout.on("payment.failed", (response) => {
                setIsSubmitting(false);
                toast.error(response.error?.description || "Donation payment failed. Please try again.");
            });
            checkout.open();
        } catch (error) {
            setIsSubmitting(false);
            toast.error(error.response?.data?.message || error.message || "Unable to start donation");
        }
    };

    return (
        <main className="mx-auto my-12 max-w-xl rounded-2xl bg-white p-6 shadow-md md:p-9">
            <h1 className="text-3xl font-bold text-gray-900">Support NicheTrade</h1>
            <p className="mt-3 leading-7 text-gray-600">
                Donations are completely optional and are not connected to buying items or publishing listings.
            </p>
            <form onSubmit={handleDonate} className="mt-7 space-y-5">
                <fieldset>
                    <legend className="mb-3 font-semibold text-gray-800">Choose an amount</legend>
                    <div className="flex gap-3">
                        {donationOptions.map((option) => (
                            <button
                                type="button"
                                key={option}
                                onClick={() => setAmount(String(option))}
                                aria-pressed={amount === String(option)}
                                className={`rounded-lg border px-4 py-2 font-medium ${amount === String(option) ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-300 text-gray-700"}`}
                            >
                                ₹{option}
                            </button>
                        ))}
                    </div>
                </fieldset>
                <label className="block font-semibold text-gray-800">
                    Custom amount (₹)
                    <input
                        type="number"
                        min="1"
                        max="100000"
                        step="1"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal"
                        required
                    />
                </label>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Opening secure checkout…" : "Donate"}
                </button>
            </form>
            <p className="mt-4 text-sm leading-6 text-gray-500">
                Donations are processed by Razorpay. Please contact support before retrying if payment completed but confirmation failed.
            </p>
        </main>
    );
}
