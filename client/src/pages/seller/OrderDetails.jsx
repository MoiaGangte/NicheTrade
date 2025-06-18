import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import toast from 'react-hot-toast';

const OrderDetails = () => {
    const { axios, currency } = useAppContext();
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
                const { data } = await axios.get(`/api/order/details/${orderId}`);
                
                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch order details');
                }

                if (!data.order) {
                    throw new Error('Order not found');
                }

                setOrder(data.order);
            } catch (error) {
                console.error('Error fetching order details:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Error fetching order details';
                setError(errorMessage);
                toast.error(errorMessage);
                navigate('/seller/orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, navigate, axios]);

    const updateOrderStatus = async (newStatus) => {
        if (!orderId) {
            toast.error('Invalid order ID');
            return;
        }

        try {
            const { data } = await axios.put(`/api/order/status/${orderId}`, { status: newStatus });
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to update order status');
            }

            setOrder(prev => ({ ...prev, status: newStatus }));
            toast.success('Order status updated successfully');
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error(error.response?.data?.message || error.message || 'Error updating order status');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[95vh]">
                <p className="text-xl">Loading order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-[95vh]">
                <p className="text-xl text-red-500">{error}</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex justify-center items-center h-[95vh]">
                <p className="text-xl text-red-500">Order not found</p>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString();
    const formattedTime = orderDate.toLocaleTimeString();

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
            <div className="md:p-10 p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header with Back Button */}
                    <div className="flex items-center justify-between mb-6">
                        <button 
                            onClick={() => navigate('/seller/orders')}
                            className="flex items-center text-[var(--color-primary)] hover:underline"
                        >
                            ← Back to Orders
                        </button>
                        <h1 className="text-2xl font-semibold">Order Details</h1>
                    </div>

                    {/* Order Status Section */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold">Order Status</h2>
                                <p className={`text-lg font-medium ${
                                    order.status === 'Delivered' ? 'text-green-600' : 
                                    order.status === 'Cancelled' ? 'text-red-600' : 
                                    'text-blue-600'
                                }`}>
                                    {order.status || 'Pending'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                    <>
                                        <button
                                            onClick={() => updateOrderStatus('Processing')}
                                            className={`px-4 py-2 rounded ${
                                                order.status === 'Processing' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            Processing
                                        </button>
                                        <button
                                            onClick={() => updateOrderStatus('Shipped')}
                                            className={`px-4 py-2 rounded ${
                                                order.status === 'Shipped' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            Shipped
                                        </button>
                                        <button
                                            onClick={() => updateOrderStatus('Delivered')}
                                            className={`px-4 py-2 rounded ${
                                                order.status === 'Delivered' 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            Delivered
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Information */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Order Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600">Order ID</p>
                                <p className="font-medium">{order._id || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Order Date</p>
                                <p className="font-medium">{formattedDate} at {formattedTime}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Payment Method</p>
                                <p className="font-medium">{order.paymentType || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Payment Status</p>
                                <p className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.isPaid ? 'Paid' : 'Pending'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600">Name</p>
                                <p className="font-medium">{order.userId?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Email</p>
                                <p className="font-medium">{order.userId?.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                        <div className="space-y-2">
                            <p className="font-medium">{order.address?.street || 'N/A'}</p>
                            <p>{order.address?.city || 'N/A'}, {order.address?.state || 'N/A'}</p>
                            <p>{order.address?.country || 'N/A'} - {order.address?.zipcode || 'N/A'}</p>
                            <p>Phone: {order.address?.phone || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                        <div className="space-y-4">
                            {order.items?.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
                                    <img 
                                        src={item.product?.image?.[0] || assets.placeholder_image} 
                                        alt={item.product?.name || 'Product'} 
                                        className="w-20 h-20 object-contain"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = assets.placeholder_image;
                                        }}
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
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold mb-4">Price Summary</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>{currency}{order.amount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (2%)</span>
                                <span>{currency}{((order.amount || 0) * 0.02).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                                <span>Total Amount</span>
                                <span className="text-[var(--color-primary)]">
                                    {currency}{((order.amount || 0) + ((order.amount || 0) * 0.02)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails; 