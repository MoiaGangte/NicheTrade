import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const RequestItemDetails = () => {
    const { axios, user, setShowUserLogin, currency } = useAppContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [relatedRequests, setRelatedRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        const loadRequest = async () => {
            setIsLoading(true);
            setRequest(null);
            try {
                const [{ data: detailsData }, { data: listData }] = await Promise.all([
                    axios.get(`/api/request-items/${id}`),
                    axios.get('/api/request-items'),
                ]);
                if (!detailsData.success) {
                    throw new Error(detailsData.message || 'Unable to load item request');
                }
                if (!listData.success) {
                    throw new Error(listData.message || 'Unable to load related requests');
                }
                setRequest(detailsData.request);
                setRelatedRequests(listData.requests.filter((item) => item._id !== id).slice(0, 8));
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || 'Unable to load item request');
            } finally {
                setIsLoading(false);
            }
        };

        loadRequest();
    }, [axios, id]);

    const hasConfirmed = Boolean(user && request?.confirmations?.some(
        (confirmation) => confirmation.userId?._id === user._id || confirmation.userId === user._id,
    ));
    const isRequester = Boolean(user && request?.requesterId?._id === user._id);

    const handleConfirm = async () => {
        if (!user) {
            setShowUserLogin(true);
            return;
        }
        if (isRequester) {
            toast.error('You cannot confirm your own item request');
            return;
        }

        setIsConfirming(true);
        try {
            const { data } = await axios.post(`/api/request-items/${id}/confirm`);
            if (!data.success) {
                throw new Error(data.message || 'Unable to confirm this request');
            }
            toast.success(data.message || 'Your offer has been confirmed');
            const { data: detailsData } = await axios.get(`/api/request-items/${id}`);
            if (detailsData.success) {
                setRequest(detailsData.request);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Unable to confirm this request');
        } finally {
            setIsConfirming(false);
        }
    };

    if (isLoading) {
        return <p className="py-12 text-center text-gray-600">Loading item request...</p>;
    }

    if (!request) {
        return (
            <main className="mx-auto max-w-2xl py-12 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Request not found</h1>
                <Link to="/" className="mt-5 inline-block text-[var(--color-primary)] underline">Back home</Link>
            </main>
        );
    }

    const requester = request.requesterId;

    return (
        <main className="mx-auto w-full max-w-5xl py-8">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                &larr; Back to requests
            </Link>

            <article className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-2">
                    <img
                        src={request.image}
                        alt={request.itemName}
                        className="max-h-[420px] w-full rounded-md bg-gray-50 object-contain"
                    />
                    <div>
                        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Requested item</p>
                        <h1 className="mt-2 break-words text-2xl font-semibold text-gray-900 sm:text-3xl">{request.itemName}</h1>
                        <p className="mt-4 whitespace-pre-wrap text-gray-700">{request.description}</p>
                        <p className="mt-5 text-lg font-semibold text-[var(--color-primary)]">
                            Extra payment: {currency}{Number(request.promiseAmount).toFixed(2)}
                        </p>

                        <div className="mt-6 rounded-md bg-gray-50 p-4">
                            <h2 className="font-semibold text-gray-900">Requester information</h2>
                            <p className="mt-2 text-gray-700">Name: {requester?.name || 'NicheTrade user'}</p>
                            <p className="text-gray-700">Department: {requester?.department || 'Not provided'}</p>
                            <p className="text-gray-700">Mobile number: {requester?.mobileNumber || 'Not provided'}</p>
                            {requester?.email ? (
                                <a className="text-gray-700 underline" href={`mailto:${requester.email}`}>
                                    Gmail: {requester.email}
                                </a>
                            ) : (
                                <p className="text-gray-700">Gmail: Not provided</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isConfirming || hasConfirmed || isRequester}
                            className="mt-5 w-full rounded-full bg-[var(--color-primary)] px-5 py-3 font-medium text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isConfirming
                                ? 'Confirming...'
                                : hasConfirmed
                                    ? 'Confirmed'
                                    : isRequester
                                        ? 'Your request'
                                        : 'Confirm — I can provide this'}
                        </button>
                        {request.confirmations?.length > 0 && (
                            <p className="mt-2 text-sm text-gray-600">
                                {request.confirmations.length} {request.confirmations.length === 1 ? 'person has' : 'people have'} confirmed they can provide this item.
                            </p>
                        )}
                    </div>
                </div>
            </article>

            {relatedRequests.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-xl font-semibold text-gray-900">Related item requests</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {relatedRequests.map((relatedRequest) => (
                            <button
                                key={relatedRequest._id}
                                type="button"
                                onClick={() => {
                                    navigate(`/request-item/${relatedRequest._id}`);
                                    window.scrollTo(0, 0);
                                }}
                                className="overflow-hidden rounded-md border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
                            >
                                <img
                                    src={relatedRequest.image}
                                    alt={relatedRequest.itemName}
                                    className="h-32 w-full object-contain"
                                />
                                <h3 className="mt-2 truncate font-medium text-gray-900">{relatedRequest.itemName}</h3>
                                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{relatedRequest.description}</p>
                                <p className="mt-2 text-sm font-medium text-[var(--color-primary)]">
                                    Extra Payment: {currency}{Number(relatedRequest.promiseAmount).toFixed(2)}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
};

export default RequestItemDetails;
