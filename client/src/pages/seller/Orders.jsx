import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";

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
        console.error('Error in Orders:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex justify-center items-center h-[95vh]">
                    <p className="text-xl text-red-500">Something went wrong. Please try again.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

const Orders = () => {
    const { currency, axios, navigate } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await axios.get('/api/order/seller');
            if (data.success) {
                setOrders(data.orders);
            } else {
                setError(data.message);
                toast.error(data.message);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleOrderClick = (orderId) => {
        navigate(`/seller/order-details/${orderId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[95vh]">
                <p className="text-xl">Loading orders...</p>
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

    if (orders.length === 0) {
        return (
            <div className="flex justify-center items-center h-[95vh]">
                <p className="text-xl text-gray-500">No orders found</p>
            </div>
        );
    }

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
            <div className="md:p-10 p-4 space-y-4">
                <h2 className="text-lg font-medium">Orders List</h2>
                {orders.map((order, index) => (
                    <div 
                        key={index} 
                        onClick={() => handleOrderClick(order._id)}
                        className="flex flex-col md:items-center md:flex-row gap-5 justify-between p-5 max-w-4xl rounded-md border border-gray-300 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="flex gap-5 max-w-80">
                            <img className="w-12 h-12 object-cover" src={assets.box_icon} alt="boxIcon" />
                            <div>
                                <p className="font-medium text-[var(--color-primary)] mb-2">
                                    {order.userId?.name || 'Unknown User'}
                                </p>
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex flex-col">
                                        <p className="font-medium">
                                            {item.product?.name || 'Product Unavailable'}{" "}
                                            <span className="text-[var(--color-primary)]">x {item.quantity}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-sm md:text-base text-black/60">
                            <p className='text-black/80'>
                                {order.address?.firstName || 'N/A'} {order.address?.lastName || ''}
                            </p>
                            <p>{order.address?.street || 'N/A'}, {order.address?.city || 'N/A'}</p>
                            <p>{order.address?.state || 'N/A'}, {order.address?.zipcode || 'N/A'}, {order.address?.country || 'N/A'}</p>
                            <p>{order.address?.phone || 'N/A'}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <p className="font-medium text-lg text-black">
                                {currency}{order.amount || 0}
                            </p>
                            <div className="flex flex-col text-sm text-right">
                                <p>Method: {order.paymentType || 'N/A'}</p>
                                <p>Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                                <p className={`font-medium ${
                                    order.isPaid ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    Payment: {order.isPaid ? "Paid" : "Pending"}
                                </p>
                                <p className={`font-medium ${
                                    order.status === 'Delivered' ? 'text-green-600' : 
                                    order.status === 'Cancelled' ? 'text-red-600' : 
                                    'text-blue-600'
                                }`}>
                                    Status: {order.status || 'Pending'}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-sm text-[var(--color-primary)] hover:underline">
                                View Details →
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Wrap the component with ErrorBoundary
const OrdersWithErrorBoundary = (props) => (
    <ErrorBoundary>
        <Orders {...props} />
    </ErrorBoundary>
);

export default OrdersWithErrorBoundary;