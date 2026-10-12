import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const RequestItems = () => {
    const { axios, navigate, currency } = useAppContext();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                const { data } = await axios.get("/api/request-items");
                if (!data.success) {
                    throw new Error(data.message || "Unable to load item requests");
                }
                setRequests(data.requests);
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || "Unable to load item requests");
            } finally {
                setIsLoading(false);
            }
        };

        loadRequests();
    }, [axios]);

    return (
        <section className="mt-4 w-full min-w-0">
            <div className="flex flex-col items-center gap-3 text-center">
                <div>
                    <h4 className="text-lg font-medium text-black">Wanna Make some Money as a Student?</h4>
                    <h2 className="text-2xl font-semibold text-black">Hosteller Item Requests</h2>
                    <h3 className="mt-1 text-sm text-black">Help bring an item to a hosteller and earn extra money</h3>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/request-item/add")}
                    className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dull"
                >
                    Request Item
                </button>
            </div>

            {isLoading ? (
                <p className="py-8 text-center text-sm text-gray-500">Loading item requests...</p>
            ) : requests.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No item requests have been posted yet.</p>
            ) : (
                <div className="mt-4 flex gap-4 overflow-x-auto bg-white py-4 no-scrollbar md:grid md:grid-cols-2 md:bg-transparent lg:grid-cols-3 xl:grid-cols-4">
                    {requests.map((request) => (
                        <article
                            key={request._id}
                            onClick={() => navigate(`/request-item/${request._id}`)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    navigate(`/request-item/${request._id}`);
                                }
                            }}
                            role="link"
                            tabIndex={0}
                            className="min-w-[110px] cursor-pointer overflow-hidden rounded-md border border-black border-r-2 bg-white p-1 shadow-sm md:min-w-0 md:p-3"
                        >
                            <img
                                src={request.image}
                                alt={request.itemName}
                                className="h-25 w-full object-contain md:h-32 sm:h-40"
                            />
                            <div className="mt-1 text-black">
                                <h3 className="truncate text-sm font-medium md:text-lg">{request.itemName}</h3>
                                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[10px] text-gray-600 md:text-sm">{request.description}</p>
                                <p className="mt-2 text-[10px] font-medium text-gray-700 md:text-sm">
                                    Requested by {request.requesterId?.name || "NicheTrade user"}
                                </p>
                                {request.requesterId?.email && (
                                    <a
                                        href={`mailto:${request.requesterId.email}`}
                                        onClick={(event) => event.stopPropagation()}
                                        className="block truncate text-[10px] text-gray-600 underline md:text-sm"
                                    >
                                        {request.requesterId.email}
                                    </a>
                                )}
                                <p className="mt-2 text-[10px] font-medium text-[var(--color-primary)] md:text-sm">
                                    Earn Rupee: {currency}{Number(request.promiseAmount).toFixed(2)}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default RequestItems;
