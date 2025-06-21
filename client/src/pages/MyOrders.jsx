import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import toast from 'react-hot-toast'

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error in MyOrders:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="mt-16 flex flex-col items-center justify-center">
                    <p className="text-xl text-red-500 mb-4">Something went wrong while loading your orders.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-primary-dull transition"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const MyOrders = () => {
  const { axios, currency, navigate } = useAppContext()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get('/api/order/user')
      if (data.success) {
        setOrders(data.orders)
      } else {
        setError(data.message)
        toast.error(data.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleOrderClick = (orderId) => {
    navigate(`/order-details/${orderId}`);
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm('Are you sure you want to cancel and delete this order? This action cannot be undone.');
    if (!confirmed) return;
    try {
      const { data } = await axios.delete(`/api/order/${orderId}`);
      if (data.success) {
        toast.success('Order cancelled and deleted successfully');
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting order');
    }
  };

  if (loading) {
    return (
      <div className="mt-16 flex justify-center items-center">
        <p className="text-xl">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center">
        <p className="text-xl text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchOrders} 
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-primary-dull transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center">
        <p className="text-xl text-gray-500">No orders found</p>
        <button 
          onClick={() => navigate('/products')} 
          className="mt-4 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-primary-dull transition"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="mt-16 p-4 md:p-8">
      <h1 className='text-2xl font-medium mb-6'>My Orders</h1>
      {orders.map((order, index) => (
        <div 
          key={index} 
          onClick={() => handleOrderClick(order._id)}
          className='border border-gray-300 rounded-lg mb-6 p-4 py-5 max-w-4xl cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1'
        >
          <div className='flex justify-between md:items-center text-black-400 md:font-medium max-md:flex-col mb-4'>
            <span className="text-sm">Order ID: {order._id}</span>
            <span className="text-sm">Payment: {order.paymentType}</span>
            <span className="text-sm">Total: {currency}{order.amount}</span>
          </div>
          
          {order.items?.map((item, index) => (
            <div 
              key={index} 
              className={`relative bg-white text-black-500/70 ${
                order.items.length !== index + 1 && "border-b"
              } border-gray-300 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full max-w-4xl`}
            >
              <div className='flex items-center mb-4 md:mb-0'>
                <div className='bg-[var(--color-primary)]/10 p-4 rounded-lg'>
                  <img 
                    src={item.product?.image?.[0] || assets.placeholder_image} 
                    alt={item.product?.name || 'Product'} 
                    className='w-16 h-16 object-contain' 
                  />
                </div>
                <div className='ml-4'>
                  <h2 className='text-xl font-medium text-gray-800'>{item.product?.name || 'Product Unavailable'}</h2>
                  <p className="text-sm text-gray-500">Category: {item.product?.category || 'N/A'}</p>
                </div>
              </div>

              <div className='flex flex-col justify-center md:ml-8 mb-4 md:mb-0'>
                <p className="text-sm">Quantity: {item.quantity}</p>
                <p className="text-sm">Status: <span className={`font-medium ${
                  order.status === 'Delivered' ? 'text-green-600' : 
                  order.status === 'Cancelled' ? 'text-red-600' : 
                  'text-blue-600'
                }`}>{order.status}</span></p>
                <p className="text-sm">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              
              <p className='text-[var(--color-primary)] text-lg font-medium'>
                {currency}{item.product?.offerPrice ? item.product.offerPrice * item.quantity : 0}
              </p>
            </div>
          ))}
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-[var(--color-primary)] hover:underline">
              Click to view full details →
            </span>
            {order.status !== 'Cancelled' && (
              <button
                onClick={e => { e.stopPropagation(); handleDeleteOrder(order._id); }}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Delete Order
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Wrap MyOrders with ErrorBoundary
const MyOrdersWithErrorBoundary = () => (
  <ErrorBoundary>
    <MyOrders />
  </ErrorBoundary>
);

export default MyOrdersWithErrorBoundary;