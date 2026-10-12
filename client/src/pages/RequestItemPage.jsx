import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const RequestItemPage = () => {
    const { axios, user, isUserLoading, setShowUserLogin, currency } = useAppContext();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    useEffect(() => {
        if (!selectedImage) {
            setImagePreview("");
            return undefined;
        }

        const previewUrl = URL.createObjectURL(selectedImage);
        setImagePreview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
    }, [selectedImage]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) {
            setShowUserLogin(true);
            return;
        }

        setIsSubmitting(true);
        const form = event.currentTarget;
        const formData = new FormData(form);

        try {
            const { data } = await axios.post("/api/request-items", formData);
            if (!data.success) {
                throw new Error(data.message || "Unable to post item request");
            }
            toast.success(data.message || "Item request posted");
            navigate("/", { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to post item request");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading) {
        return <p className="py-12 text-center text-gray-600">Checking your sign-in...</p>;
    }

    if (!user) {
        return (
            <main className="mx-auto max-w-xl py-12 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Sign in to request an item</h1>
                <p className="mt-2 text-gray-600">Sign in so your name and email can be shown with your request.</p>
                <button
                    type="button"
                    onClick={() => setShowUserLogin(true)}
                    className="mt-5 rounded-full bg-[var(--color-primary)] px-5 py-2 font-medium text-white hover:bg-primary-dull"
                >
                    Sign in
                </button>
                <div>
                    <Link to="/" className="mt-4 inline-block text-sm text-gray-600 underline">Back home</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-2xl py-8">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">&larr; Back home</Link>
            <section className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <h1 className="text-2xl font-semibold text-gray-900">Request an Item</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Need something brought to campus? Describe it for day scholars and enter the extra amount you promise to pay for delivery.
                </p>

                <div className="mt-5 rounded-md bg-gray-50 p-4 text-sm text-gray-700">
                    <h2 className="font-semibold">Your signed-in details</h2>
                    <p className="mt-1">{user.name}</p>
                    <p>{user.email}</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Item name
                        <input
                            name="itemName"
                            type="text"
                            required
                            maxLength={100}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                        />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Item image
                        <input
                            name="image"
                            type="file"
                            accept="image/*"
                            required
                            onChange={(event) => {
                                const image = event.target.files?.[0] || null;
                                if (image && image.size > 5 * 1024 * 1024) {
                                    toast.error("Image must be 5 MB or smaller");
                                    event.target.value = "";
                                    setSelectedImage(null);
                                    return;
                                }
                                setSelectedImage(image);
                            }}
                            className="mt-1 block w-full rounded border border-gray-300 p-2 font-normal file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1"
                        />
                    </label>
                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Preview of requested item"
                            className="max-h-64 w-full rounded border border-gray-200 bg-gray-50 object-contain"
                        />
                    )}
                    <label className="block text-sm font-medium text-gray-700">
                        Description
                        <textarea
                            name="description"
                            required
                            maxLength={2000}
                            rows={5}
                            className="mt-1 w-full resize-y rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                        />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Extra payment promised
                        <div className="mt-1 flex items-center overflow-hidden rounded border border-gray-300 focus-within:border-[var(--color-primary)]">
                            <span className="bg-gray-50 px-3 py-2 text-gray-600">{currency}</span>
                            <input
                                name="promiseAmount"
                                type="number"
                                required
                                min="0.01"
                                max="10000000"
                                step="0.01"
                                inputMode="decimal"
                                className="w-full px-3 py-2 font-normal outline-none"
                            />
                        </div>
                    </label>
                    <p className="text-xs text-gray-500">This is the extra amount you promise to pay the person who brings the item.</p>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 font-medium text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                        {isSubmitting ? "Posting..." : "Post Request"}
                    </button>
                </form>
            </section>
        </main>
    );
};

export default RequestItemPage;
