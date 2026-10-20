import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const SellerRegistration = () => {
    const { user, isUserLoading, setShowUserLogin, setUser, setSeller, setIsSeller, axios, navigate } = useAppContext();
    const [storeName, setStoreName] = useState("");
    const [phone, setPhone] = useState("");
    const [storeDescription, setStoreDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isUserLoading && !user) {
            setShowUserLogin(true);
            navigate("/", { replace: true });
        }
    }, [isUserLoading, user, setShowUserLogin, navigate]);

    useEffect(() => {
        if (user?.mobileNumber) setPhone(user.mobileNumber);
    }, [user]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data } = await axios.post("/api/seller/register", {
                storeName,
                phone,
                storeDescription,
            });
            if (!data.success) {
                toast.error(data.message || "Unable to register seller");
                return;
            }

            setUser({ ...user, ...data.user });
            setSeller(data.seller);
            setIsSeller(true);
            toast.success(data.message);
            navigate("/seller");
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to register seller");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading || !user) {
        return <div className="mt-16 text-center">Loading your account...</div>;
    }

    return (
        <div className="mx-auto my-10 max-w-2xl rounded-lg bg-white p-6 shadow-md sm:p-8">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800">Register as a Seller</h1>
            <p className="mb-6 text-sm text-gray-600">
                Your seller profile will be linked to your existing account. An administrator must approve new seller profiles.
            </p>
            <div className="mb-6 rounded-md bg-gray-50 p-4 text-sm text-gray-700">
                <p><span className="font-medium">Name:</span> {user.name}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                    Store name
                    <input
                        type="text"
                        value={storeName}
                        onChange={(event) => setStoreName(event.target.value)}
                        minLength={2}
                        maxLength={120}
                        autoComplete="organization"
                        required
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
                    />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                    Seller phone number
                    <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        autoComplete="tel"
                        pattern="[\d\s()+.-]{7,20}"
                        title="Enter a valid phone number"
                        required
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
                    />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                    Store description <span className="font-normal text-gray-500">(optional)</span>
                    <textarea
                        value={storeDescription}
                        onChange={(event) => setStoreDescription(event.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
                    />
                </label>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-[var(--color-primary)] px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Submitting..." : "Create Seller Profile"}
                </button>
            </form>
        </div>
    );
};

export default SellerRegistration;
