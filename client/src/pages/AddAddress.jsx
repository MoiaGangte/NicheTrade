import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

//input field component//
const InputField = ({ type, placeholder, name, handleChange, address }) => (
    <input className='w-full px-4 py-3 border-2 border-black rounded-lg outline-none text-gray-700 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300'
        type={type}
        placeholder={placeholder}
        onChange={handleChange}
        name={name}
        value={address[name]}
        required
    />
)

const AddAddress = () => {
    const { axios, user, navigate } = useAppContext()
    const [loading, setLoading] = useState(true)

    const [address, setAddress] = useState(() => {
        // Try to get saved address data from localStorage
        const savedAddress = localStorage.getItem('addressFormData');
        return savedAddress ? JSON.parse(savedAddress) : {
            firstname: '',
            lastname: '',
            street: '',
            city: '',
            state: '',
            zipcode: '',
            country: '',
            phone: '',
        };
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newAddress = {
            ...address,
            [name]: value,
        };
        setAddress(newAddress);
        // Save to localStorage whenever the form changes
        localStorage.setItem('addressFormData', JSON.stringify(newAddress));
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            // Get token from user object or localStorage
            const token = user?.token || localStorage.getItem('token');
            const { data } = await axios.post(
                '/api/address/add',
                {
                    address: {
                        ...address,
                        email: user.email
                    },
                    userId: user._id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );

            if (data.success) {
                toast.success(data.message)
                localStorage.removeItem('addressFormData');
                navigate('/cart')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

        useEffect(() => {
            const checkAuth = async () => {
                try {
                    const { data } = await axios.get('/api/user/is-auth');
                    if (!data.success) {
                        navigate('/');
                    }
                } catch (error) {
                    navigate('/');
                } finally {
                    setLoading(false);
                }
            };

            checkAuth();
        }, [navigate, axios]);

        // Hide footer when component mounts and show it when unmounts
        useEffect(() => {
            const footer = document.querySelector('footer');
            if (footer) {
                footer.style.display = 'none';
            }
            return () => {
                if (footer) {
                    footer.style.display = 'block';
                }
            };
        }, []);

        // Clean up localStorage when component unmounts
        useEffect(() => {
            return () => {
                // Only clear if we're navigating away from the page (not on refresh)
                if (window.performance.navigation.type === window.performance.navigation.TYPE_NAVIGATE) {
                    localStorage.removeItem('addressFormData');
                }
            };
        }, []);

        if (loading) {
            return (
                <div className="mt-16 flex justify-center items-center">
                    <p className="text-xl">Loading...</p>
                </div>
            );
        }

        return (
            <div className='mt-16 pb-16 relative'>
                {/* Background image for mobile */}
                <div className='md:hidden absolute inset-0 z-0 opacity-0.2'>
                    <img
                        className='w-full h-full object-cover'
                        src={assets.add_address_iamge}
                        alt='Background'
                    />
                </div>

                <div className='flex flex-col-reverse md:flex-row justify-between gap-10 relative z-10'>
                    <div className='flex-1 max-w-xl bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-sm border-2 border-black md:border md:border-gray-100'>
                        <h1 className='text-2xl md:text-3xl font-semibold text-gray-800 mb-6'>Add Shipping Address</h1>
                        <form onSubmit={onSubmitHandler} className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>First Name</label>
                                    <InputField handleChange={handleChange} address={address} name='firstname' type='text' placeholder='Enter first name' />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Last Name</label>
                                    <InputField handleChange={handleChange} address={address} name='lastname' type='text' placeholder='Enter last name' />
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Street Address</label>
                                <InputField handleChange={handleChange} address={address} name='street' type='text' placeholder='Enter street address' />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>City</label>
                                    <InputField handleChange={handleChange} address={address} name='city' type='text' placeholder='Enter city' />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>State</label>
                                    <InputField handleChange={handleChange} address={address} name='state' type='text' placeholder='Enter state' />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Zip Code</label>
                                    <InputField handleChange={handleChange} address={address} name='zipcode' type='text' placeholder='Enter zip code' />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Country</label>
                                    <InputField handleChange={handleChange} address={address} name='country' type='text' placeholder='Enter country' />
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Phone Number</label>
                                <InputField handleChange={handleChange} address={address} name='phone' type='text' placeholder='Enter phone number' />
                            </div>

                            <button className='w-full mt-8 bg-[var(--color-primary)] text-white py-3.5 rounded-lg font-medium hover:bg-primary-dull transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg'>
                                Save Address
                            </button>
                        </form>
                    </div>

                    {/* Image for desktop */}
                    <div className='hidden md:flex md:w-1/2 items-center justify-center'>
                        <img
                            className='w-full max-w-md object-contain'
                            src={assets.add_address_iamge}
                            alt='Add Address'
                        />
                    </div>
                </div>
            </div>
        )
    }

    export default AddAddress