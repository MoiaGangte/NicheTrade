import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, axios } = useAppContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        fetchAddresses();
    }, [user, navigate]);
///////////////////////////////////////////////////////////
    const fetchAddresses = async () => {
        try {
            // Get token from localStorage, context, or user object
            const token = user?.token || localStorage.getItem('token');
            const response = await axios.get('/api/address/get', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true, // if using cookies
            });
            if (response.data.success) {
                setAddresses(response.data.addresses);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                const response = await axios.delete(`/api/address/${addressId}`);
                if (response.data.success) {
                    toast.success('Address deleted successfully');
                    fetchAddresses();
                } else {
                    toast.error(response.data.message || 'Failed to delete address');
                }
            } catch (error) {
                console.error('Error deleting address:', error);
                toast.error('Failed to delete address');
            }
        }
    };

    if (loading) {
        return (
            <div className="mt-16 flex justify-center items-center">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    return (
        <div className="mt-16 max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">Profile Details</h1>

                <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-lg font-semibold mb-3">Personal Information</h2>
                        <div className="space-y-2">
                            <p className="text-gray-700">
                                <span className="font-medium">Name:</span> {user.name}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Email:</span> {user.email}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Member Since:</span> {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Account Statistics */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-lg font-semibold mb-3">Account Statistics</h2>
                        <div className="space-y-2">
                            <p className="text-gray-700">
                                <span className="font-medium">Total Orders:</span> {user.totalOrders || 0}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Last Order:</span> {user.lastOrder ? new Date(user.lastOrder).toLocaleDateString() : 'No orders yet'}
                            </p>
                        </div>
                    </div>

                    {/* Shipping Addresses */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-semibold">Shipping Addresses</h2>
                            <button
                                onClick={() => navigate('/add-address')}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                            >
                                Add New Address
                            </button>
                        </div>

                        {addresses.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500 mb-4">No shipping addresses found</p>
                                <button
                                    onClick={() => navigate('/add-address')}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                                >
                                    Add Your First Address
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {addresses.map((address) => (
                                    <div key={address._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Full Name:</span>
                                                    <p className="text-gray-900">{address.firstname} {address.lastname}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Phone Number:</span>
                                                    <p className="text-gray-900">{address.phone}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Street Address:</span>
                                                    <p className="text-gray-900">{address.street}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">City, State & ZIP:</span>
                                                    <p className="text-gray-900">{address.city}, {address.state} {address.zipcode}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Country:</span>
                                                    <p className="text-gray-900">{address.country}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => navigate(`/add-address/${address._id}`)}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddress(address._id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 