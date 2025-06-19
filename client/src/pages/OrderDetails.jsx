import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import toast from 'react-hot-toast';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error in OrderDetails:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="mt-16 flex justify-center items-center">
                    <p className="text-xl text-red-500">Something went wrong. Please try again.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

const OrderDetails = () => {
    const { axios, currency, isSeller } = useAppContext();
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setError('No order ID provided');
                setLoading(false);
                return;
            }

            try {
                // First check if user is a seller
                if (isSeller) {
                    const { data } = await axios.get(`/api/order/details/${orderId}`);
                    if (data.success && data.order) {
                        setOrder(data.order);
                    } else {
                        setError(data.message || 'Failed to fetch order details');
                        toast.error(data.message || 'Failed to fetch order details');
                        navigate('/seller/orders');
                    }
                } else {
                    // For regular users
                    const { data } = await axios.get(`/api/order/details/${orderId}`);
                    if (data.success && data.order) {
                        setOrder(data.order);
                    } else {
                        setError(data.message || 'Failed to fetch order details');
                        toast.error(data.message || 'Failed to fetch order details');
                        navigate('/my-orders');
                    }
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
                const errorMessage = error.response?.data?.message || 'Error fetching order details';
                setError(errorMessage);
                toast.error(errorMessage);
                
                // Navigate based on user type
                if (isSeller) {
                    navigate('/seller/orders');
                } else {
                    navigate('/my-orders');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, navigate, axios, isSeller]);

    const handleDeleteOrder = async () => {
        // Show confirmation dialog
        const confirmed = window.confirm('Are you sure you want to cancel and delete this order? This action cannot be undone.');
        
        if (!confirmed) {
            return;
        }

        try {
            const { data } = await axios.delete(`/api/order/${orderId}`);
            if (data.success) {
                toast.success('Order cancelled and deleted successfully');
                if (isSeller) {
                    navigate('/seller/orders');
                } else {
                    navigate('/my-orders');
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.error(error.response?.data?.message || 'Error deleting order');
        }
    };

    if (loading) {
        return (
            <div className="mt-16 flex justify-center items-center">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-16 flex justify-center items-center">
                <p className="text-xl text-red-500">{error}</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mt-16 flex justify-center items-center">
                <p className="text-xl text-red-500">Order not found</p>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString();
    const formattedTime = orderDate.toLocaleTimeString();

    return (
        <div className="mt-16 max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6 relative">
                {/* Order Header */}
                <div className="border-b pb-4 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Order Details</h1>
                    <p className="text-gray-600 mt-2">Order ID: {order._id}</p>
                </div>

                {/* Customer Information */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Customer Information</h2>
                    <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-gray-700">Name: {order.userId?.name || 'N/A'}</p>
                        <p className="text-gray-700">Email: {order.userId?.email || 'N/A'}</p>
                    </div>
                </div>

                {/* Order Information */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Order Information</h2>
                    <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-gray-700">Order Date: {formattedDate}</p>
                        <p className="text-gray-700">Order Time: {formattedTime}</p>
                        <p className="text-gray-700">Payment Type: {order.paymentType}</p>
                        <p className="text-gray-700">Order Status: {order.status}</p>
                    </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Order Items</h2>
                    <div className="space-y-4">
                        {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-md">
                                <img 
                                    src={item.product?.image?.[0] || assets.placeholder_image} 
                                    alt={item.product?.name || 'Product'} 
                                    className="w-20 h-20 object-contain"
                                />
                                <div className="flex-1">
                                    <h3 className="font-medium">{item.product?.name || 'Product'}</h3>
                                    <p className="text-gray-600">Category: {item.product?.category || 'N/A'}</p>
                                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-[var(--color-primary)]">
                                        {currency}{item.product?.offerPrice * item.quantity || 0}
                                    </p>
                                    <p className="text-sm text-gray-500 line-through">
                                        {currency}{item.product?.price * item.quantity || 0}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Summary */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Price Summary</h2>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-700">Subtotal:</span>
                            <span className="font-medium">{currency}{order.items?.reduce((total, item) => total + (item.product?.offerPrice * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Tax (10%):</span>
                            <span className="font-medium">{currency}{(order.items?.reduce((total, item) => total + (item.product?.offerPrice * item.quantity), 0) * 0.10).toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between">
                                <span className="text-gray-800 font-semibold">Total:</span>
                                <span className="text-[var(--color-primary)] font-bold">
                                    {currency}{(order.items?.reduce((total, item) => total + (item.product?.offerPrice * item.quantity), 0) * 1.02).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Order Button - Only show for non-sellers */}
                {!isSeller && (
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleDeleteOrder}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all duration-300 hover:shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Cancel Order
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Wrap OrderDetails with ErrorBoundary
const OrderDetailsWithErrorBoundary = () => (
    <ErrorBoundary>
        <OrderDetails />
    </ErrorBoundary>
);

export default OrderDetailsWithErrorBoundary; 