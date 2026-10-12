import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const LostFoundDetails = () => {
    const { axios } = useAppContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [founder, setFounder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClaimLoading, setIsClaimLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        const loadPost = async () => {
            setIsLoading(true);
            setPost(null);
            setFounder(null);
            try {
                const { data } = await axios.get(`/api/lost-found/${id}`);
                if (!data.success) {
                    throw new Error(data.message || "Unable to load lost and found item");
                }
                setPost(data.post);
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || "Unable to load lost and found item");
            } finally {
                setIsLoading(false);
            }
        };

        loadPost();
    }, [axios, id]);

    useEffect(() => {
        const loadRelatedPosts = async () => {
            try {
                const { data } = await axios.get("/api/lost-found");
                if (!data.success) {
                    throw new Error(data.message || "Unable to load related lost and found items");
                }
                setRelatedPosts(data.posts.filter((item) => item._id !== id).slice(0, 8));
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || "Unable to load related lost and found items");
            }
        };

        loadRelatedPosts();
    }, [axios, id]);

    const handleClaim = async () => {
        setIsClaimLoading(true);
        try {
            const { data } = await axios.get(`/api/lost-found/${id}/claim`);
            if (!data.success) {
                throw new Error(data.message || "Unable to load founder details");
            }
            setFounder(data.founder);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to load founder details");
        } finally {
            setIsClaimLoading(false);
        }
    };

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            const { data } = await axios.post(`/api/lost-found/${id}/confirm`);
            if (!data.success) {
                throw new Error(data.message || "Unable to confirm this claim");
            }
            toast.success(data.message || "Item removed from Lost & Found");
            navigate("/", { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to confirm this claim");
            if (error.response?.status === 404) {
                navigate("/", { replace: true });
            }
        } finally {
            setIsConfirming(false);
        }
    };

    if (isLoading) {
        return <p className="py-12 text-center text-gray-600">Loading lost and found item...</p>;
    }

    if (!post) {
        return (
            <div className="mx-auto max-w-2xl py-12 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Item not found</h1>
                <p className="mt-2 text-gray-600">This item may have already been claimed or removed.</p>
                <Link to="/" className="mt-5 inline-block rounded-full bg-[var(--color-primary)] px-5 py-2 text-white hover:bg-primary-dull">
                    Back to home
                </Link>
            </div>
        );
    }

    return (
        <main className="mx-auto w-full max-w-3xl py-8">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                &larr; Back to Lost &amp; Found
            </Link>
            <article className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="p-5 sm:p-7">
                    <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Lost &amp; Found item</p>
                    <h1 className="mt-2 break-words text-2xl font-semibold text-gray-900 sm:text-3xl">{post.itemName}</h1>
                    <p className="mt-2 text-sm font-medium uppercase text-gray-600">
                        {post.postType === "lost" ? "Lost item" : "Found item"}
                    </p>
                    {post.image && (
                        <img
                            src={post.image}
                            alt={post.itemName}
                            className="mt-5 max-h-[28rem] w-full rounded-lg bg-gray-100 object-contain"
                        />
                    )}
                    <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                        {post.postType !== "lost" && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Place found</dt>
                                <dd className="mt-1 break-words text-gray-900">{post.placeFound}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Date and time {post.postType === "lost" ? "lost" : "found"}
                            </dt>
                            <dd className="mt-1 text-gray-900">{new Date(post.foundAt || post.foundDate).toLocaleString()}</dd>
                        </div>
                    </dl>
                    <div className="mt-6">
                        <h2 className="text-sm font-medium text-gray-500">Description</h2>
                        <p className="mt-1 whitespace-pre-wrap break-words text-gray-900">{post.description}</p>
                    </div>

                    {!founder ? (
                        <button
                            type="button"
                            onClick={handleClaim}
                            disabled={isClaimLoading}
                            className="mt-7 w-full rounded-full bg-[var(--color-primary)] px-5 py-3 font-medium text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {isClaimLoading ? "Loading founder details..." : "Claim"}
                        </button>
                    ) : (
                        <section className="mt-7 border-t border-gray-200 pt-5">
                            <h2 className="text-lg font-semibold text-gray-900">Founder contact details</h2>
                                                        <h3 className="text-md font-medium text-gray-700">Please take screenshots before confirming!!</h3>
                            <p className="mt-1 text-sm text-gray-500">Inorder to cantact the founder by using mobile phone number</p>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                                    <dd className="mt-1 break-words text-gray-900">{founder.name || "Not provided"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Mobile number</dt>
                                    <dd className="mt-1 break-words text-gray-900">{founder.mobile || "Not provided"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                                    <dd className="mt-1 break-words text-gray-900">{founder.department || "Not provided"}</dd>
                                </div>
                            </dl>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isConfirming}
                                className="mt-6 w-full rounded-full bg-[var(--color-primary)] px-5 py-3 font-medium text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                {isConfirming ? "Confirming..." : "Confirm and remove item"}
                            </button>
                            <p className="mt-2 text-xs text-gray-500">Confirming removes this item from the public Lost &amp; Found listing.</p>
                        </section>
                    )}
                </div>
            </article>
            {relatedPosts.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-gray-900">Related Lost &amp; Found</h2>
                    <div className="mt-2 flex bg-white py-4 overflow-x-auto no-scrollbar gap-4 md:bg-transparent md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
                        {relatedPosts.map((relatedPost) => (
                            <div key={relatedPost._id} className="min-w-[110px] md:min-w-0">
                                <Link
                                    to={`/lost-found/${relatedPost._id}`}
                                className="block h-full overflow-hidden rounded-md border border-black border-r-2 bg-white p-1 shadow-sm transition hover:shadow-md md:p-3"
                                >
                                    {relatedPost.image && (
                                        <img
                                            src={relatedPost.image}
                                            alt={relatedPost.itemName}
                                            className="h-25 w-full object-contain md:h-32 sm:h-40"
                                        />
                                    )}
                                    <div className="mt-1 text-black">
                                        <h3 className="truncate text-sm font-medium md:text-lg">{relatedPost.itemName}</h3>
                                        <p className="truncate text-[10px] text-gray-600 md:text-sm">
                                            {relatedPost.postType === "lost" ? "Lost item" : `Found at ${relatedPost.placeFound}`}
                                        </p>
                                        <p className="mt-1 line-clamp-2 text-[10px] text-gray-600 md:text-sm">{relatedPost.description}</p>
                                        <p className="mt-1 text-[10px] font-medium text-[var(--color-primary)] md:text-sm">View details</p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
};

export default LostFoundDetails;
