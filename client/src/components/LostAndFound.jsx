import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const getLocalDateTime = (date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

const LostAndFound = () => {
    const { axios } = useAppContext();
    const [posts, setPosts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [postType, setPostType] = useState("found");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [maxFoundAt] = useState(() => getLocalDateTime(new Date()));
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const closeForm = () => {
        setShowForm(false);
        setSelectedImage(null);
    };

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const { data } = await axios.get("/api/lost-found");
                if (!data.success) {
                    throw new Error(data.message || "Unable to load lost and found posts");
                }
                setPosts(data.posts);
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || "Unable to load lost and found posts");
            } finally {
                setIsLoading(false);
            }
        };

        loadPosts();
    }, [axios]);

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
        setIsSubmitting(true);
        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("postType", postType);
        formData.set("foundAt", new Date(formData.get("foundAt")).toISOString());

        try {
            const { data } = await axios.post("/api/lost-found", formData);
            if (!data.success) {
                throw new Error(data.message || "Unable to create post");
            }
            setPosts((currentPosts) => [data.post, ...currentPosts]);
            setShowForm(false);
            setSelectedImage(null);
            toast.success(data.message || "Lost and found post added");
            form.reset();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to create post");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="mt-8 w-full min-w-0">
            <div className="flex flex-col items-center gap-3 text-center">
                <div>
                    <h2 className="text-2xl font-semibold text-black">Lost &amp; Found</h2>
                    <p className="mt-1 text-sm text-black">Items Found or Lost at the NICHE campus</p>
                </div>
                <div className="grid w-full max-w-md grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setPostType("found");
                            setSelectedImage(null);
                            setShowForm(true);
                        }}
                        className="w-full rounded-full bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-dull"
                    >
                        Add Found Product
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPostType("lost");
                            setSelectedImage(null);
                            setShowForm(true);
                        }}
                        className="w-full rounded-full bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-dull"
                    >
                        Add Lost Product
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p className="py-8 text-center text-sm text-gray-500">Loading lost and found posts...</p>
            ) : posts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No items have been posted yet.</p>
            ) : (
                <div className="mt-4 flex bg-white py-4 overflow-x-auto no-scrollbar gap-4 md:bg-transparent md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
                    {posts.map((post) => (
                        <div key={post._id} className="min-w-[110px] md:min-w-0">
                            <Link
                                to={`/lost-found/${post._id}`}
                                className="block h-full overflow-hidden rounded-md border border-black border-r-2 bg-white p-1 shadow-sm transition hover:shadow-md md:p-3"
                            >
                                {post.image && (
                                    <img
                                        src={post.image}
                                        alt={post.itemName}
                                        className="h-25 w-full object-contain md:h-32 sm:h-40"
                                    />
                                )}
                                <div className="mt-1 text-black">
                                    <h3 className="truncate text-sm font-medium md:text-lg">{post.itemName}</h3>
                                    <p className="truncate text-[10px] text-gray-600 md:text-sm">
                                        {post.postType === "lost" ? "Lost item" : `Found at ${post.placeFound}`}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-[10px] text-gray-600 md:text-sm">{post.description}</p>
                                    <p className="mt-1 text-[10px] font-medium text-[var(--color-primary)] md:text-sm">View details</p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                    onClick={closeForm}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="lost-found-form-title"
                        className="my-auto w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <h2 id="lost-found-form-title" className="text-xl font-semibold text-gray-900">
                                Add {postType === "lost" ? "Lost" : "Found"} Product
                            </h2>
                            <button
                                type="button"
                                onClick={closeForm}
                                aria-label="Close form"
                                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Product name
                                <input
                                    name="itemName"
                                    type="text"
                                    required
                                    maxLength={100}
                                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                Product image
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
                                    alt="Selected lost and found item preview"
                                    className="max-h-56 w-full rounded border border-gray-200 bg-gray-50 object-contain"
                                />
                            )}
                            {postType === "found" && <label className="block text-sm font-medium text-gray-700">
                                Place found
                                <input
                                    name="placeFound"
                                    type="text"
                                    required
                                    maxLength={200}
                                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                                />
                            </label>}
                            <label className="block text-sm font-medium text-gray-700">
                                Date and time {postType === "lost" ? "lost" : "found"}
                                <input
                                    name="foundAt"
                                    type="datetime-local"
                                    required
                                    max={maxFoundAt}
                                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                Product description
                                <textarea
                                    name="description"
                                    required
                                    maxLength={2000}
                                    rows={4}
                                    className="mt-1 w-full resize-y rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                                />
                            </label>
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="mb-3 font-semibold text-gray-900">Your contact details</h3>
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Name
                                        <input
                                            name="founderName"
                                            type="text"
                                            required
                                            maxLength={100}
                                            autoComplete="name"
                                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mobile number
                                        <input
                                            name="founderMobile"
                                            type="tel"
                                            required
                                            maxLength={30}
                                            pattern="\+?[\d\s().-]{7,30}"
                                            autoComplete="tel"
                                            title="Enter a valid mobile number"
                                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Department
                                        <input
                                            name="founderDepartment"
                                            type="text"
                                            required
                                            maxLength={120}
                                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Your contact details are shown to viewers only after they select Claim.</p>
                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? "Posting..." : "Post Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default LostAndFound;
