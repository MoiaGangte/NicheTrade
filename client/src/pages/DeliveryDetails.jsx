import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const deliveryLocations = ['AFC', 'Near Department Store', 'MBA Canteen', 'Cafe Canteen', 'Other'];
const deliveryTimes = ['During lunch break', 'After college', 'Other'];

const DeliveryDetails = () => {
    const { user, isUserLoading, cartItems, products, currency, getCartAmount, axios, setCartItems, setShowUserLogin, navigate } = useAppContext();
    const [location, setLocation] = useState('');
    const [customLocation, setCustomLocation] = useState('');
    const [time, setTime] = useState('');
    const [customTime, setCustomTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const items = Object.entries(cartItems)
        .map(([productId, quantity]) => ({ productId, quantity, product: products.find((item) => item._id === productId) }))
        .filter((item) => item.product);

    useEffect(() => {
        if (!isUserLoading && !user) {
            navigate('/cart', { replace: true });
        }
        if (!isUserLoading && user && products.length > 0 && items.length === 0) {
            navigate('/cart', { replace: true });
        }
    }, [isUserLoading, user, products.length, items.length, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (location === 'Other' && !customLocation.trim()) {
            toast.error('Enter your preferred delivery location');
            return;
        }
        if (time === 'Other' && !customTime.trim()) {
            toast.error('Enter your preferred delivery time');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await axios.post('/api/order/place', {
                items: items.map(({ productId, quantity }) => ({ product: productId, quantity })),
                deliveryLocation: location,
                customDeliveryLocation: location === 'Other' ? customLocation.trim() : '',
                deliveryTime: time,
                customDeliveryTime: time === 'Other' ? customTime.trim() : '',
            });

            if (!data.success) {
                toast.error(data.message || 'Unable to place your order');
                return;
            }

            setCartItems({});
            toast.success('Order placed successfully');
            navigate('/my-orders');
        } catch (error) {
            if (error.response?.status === 401) {
                toast.error('Your session expired. Please log in again to place your order.');
                setShowUserLogin(true);
            } else {
                toast.error(error.response?.data?.message || error.message || 'Unable to place your order');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading || !user || products.length === 0 || items.length === 0) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-xl">Loading order details...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto mt-16 max-w-3xl p-4 pb-12">
            <button type="button" onClick={() => navigate('/cart')} className="mb-5 text-[var(--color-primary)] hover:underline">
                ← Back to cart
            </button>
            <div className="rounded-lg bg-white p-6 shadow-md md:p-8">
                <h1 className="text-2xl font-semibold text-gray-800">Choose Delivery Details</h1>
                <p className="mt-2 text-gray-600">Select where and when you would like to receive your order.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-7">
                    <fieldset>
                        <legend className="mb-3 text-lg font-medium">Place of delivery</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {deliveryLocations.map((option) => (
                                <label key={option} className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-300 p-3 hover:border-[var(--color-primary)]">
                                    <input
                                        type="radio"
                                        name="deliveryLocation"
                                        value={option}
                                        checked={location === option}
                                        onChange={(event) => setLocation(event.target.value)}
                                        required
                                    />
                                    <span>{option === 'Other' ? 'Other (enter location)' : option}</span>
                                </label>
                            ))}
                        </div>
                        {location === 'Other' && (
                            <input
                                type="text"
                                value={customLocation}
                                onChange={(event) => setCustomLocation(event.target.value)}
                                placeholder="Enter your delivery location"
                                maxLength={120}
                                required
                                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        )}
                    </fieldset>

                    <fieldset>
                        <legend className="mb-3 text-lg font-medium">Preferred timing</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {deliveryTimes.map((option) => (
                                <label key={option} className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-300 p-3 hover:border-[var(--color-primary)]">
                                    <input
                                        type="radio"
                                        name="deliveryTime"
                                        value={option}
                                        checked={time === option}
                                        onChange={(event) => setTime(event.target.value)}
                                        required
                                    />
                                    <span>{option === 'Other' ? 'Other (enter time)' : option}</span>
                                </label>
                            ))}
                        </div>
                        {time === 'Other' && (
                            <input
                                type="text"
                                value={customTime}
                                onChange={(event) => setCustomTime(event.target.value)}
                                placeholder="Enter your preferred time"
                                maxLength={120}
                                required
                                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        )}
                    </fieldset>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-lg font-semibold">
                        <span>Amount</span>
                        <span>{currency}{getCartAmount()}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                        Product purchases are paid directly to the seller. Donations to NicheTrade are separate and optional.
                    </p>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded bg-[var(--color-primary)] py-3 font-medium text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Placing order...' : 'Place Order'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DeliveryDetails;
