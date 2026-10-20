import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const UploadRequests = () => {
    const { axios } = useAppContext();
    const [status, setStatus] = useState(null);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;

    const fetchStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get("/api/seller/upload-status");
            if (!data.success) throw new Error(data.message || "Unable to load upload status");
            setStatus(data);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to load upload status");
        } finally {
            setIsLoading(false);
        }
    }, [axios]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const submitRequest = async (event) => {
        event.preventDefault();
        if (isSubmitting || wordCount < 1 || wordCount > 50) return;

        setIsSubmitting(true);
        try {
            const { data } = await axios.post("/api/seller/upload-requests", { description });
            if (!data.success) throw new Error(data.message || "Unable to submit request");
            toast.success(data.message);
            setDescription("");
            await fetchStatus();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const latestRequest = status?.latestRequest;
    const canRequest = !latestRequest || latestRequest.status !== "pending";

    return (
        <main className="h-[95vh] flex-1 overflow-y-auto p-4 md:p-8">
            <h1 className="text-3xl font-semibold">Request Free Uploads</h1>
            <p className="mt-2 text-sm text-gray-600">Ask the admin for free product listings. Keep your request under 50 words.</p>

            {isLoading ? (
                <p className="mt-6 text-gray-600">Loading upload status...</p>
            ) : (
                <>
                    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Your upload benefits</h2>
                        <p className="mt-2 text-gray-700">
                            Free uploads remaining: <strong>{status?.isVip ? "Unlimited (VIP)" : status?.freeUploads ?? 0}</strong>
                        </p>
                        {status?.isVip && <p className="mt-1 text-sm text-green-700">All your product uploads are free while VIP is enabled.</p>}
                    </section>

                    {latestRequest && (
                        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold">Latest request: <span className="capitalize">{latestRequest.status}</span></h2>
                            <p className="mt-2 text-sm text-gray-700">{latestRequest.description}</p>
                            {latestRequest.status === "approved" && (
                                <p className="mt-2 text-sm text-green-700">
                                    {latestRequest.decisionType === "vip"
                                        ? "VIP access was granted."
                                        : `${latestRequest.grantedUploads} free upload${latestRequest.grantedUploads === 1 ? "" : "s"} granted.`}
                                </p>
                            )}
                        </section>
                    )}

                    {canRequest && !status?.isVip && (
                        <form onSubmit={submitRequest} className="mt-6 max-w-2xl space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <label htmlFor="uploadRequestDescription" className="block font-medium text-gray-800">
                                Request description
                            </label>
                            <textarea
                                id="uploadRequestDescription"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={4}
                                maxLength={1000}
                                required
                                placeholder="Explain why you are requesting free product uploads..."
                                className="w-full rounded-md border border-gray-300 p-3"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className={`text-sm ${wordCount > 50 ? "text-red-600" : "text-gray-500"}`}>
                                    {wordCount}/50 words
                                </span>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || wordCount < 1 || wordCount > 50}
                                    className="rounded-md bg-[var(--color-primary)] px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? "Sending..." : "Send Request to Admin"}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </main>
    );
};

export default UploadRequests;
