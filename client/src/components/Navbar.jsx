import React, { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Navbar = () => {
    const [open, setOpen] = React.useState(false)
    const { user, setUser, setShowUserLogin, navigate, setSearchQuery, searchQuery, getCartCount, axios, setCartItems } = useAppContext();
    const location = useLocation();
    const isProductDetailPage = location.pathname.includes('/products/') && location.pathname.split('/').length > 3;
    const dropdownRef = useRef(null);

    const logout = async () => {
        try {
            const {data} = await axios.get('/api/user/logout')
            if (data.success){
                toast.success(data.message)
                setUser(null);
                setCartItems({});
                navigate('/')
            }else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (searchQuery.length > 0 && !isProductDetailPage) {
            navigate("/products")
        }
    }, [searchQuery])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = (e) => {
        if (isProductDetailPage) {
            if (e.key === 'Enter') {
                navigate("/products")
            }
        } else {
            setSearchQuery(e.target.value)
        }
    }

    return (
        <div className="sticky top-0 z-50 bg-white">
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-4 flex items-center justify-between">
                <NavLink to='/' className="flex items-center gap-2">
                    {/* site logo/favicon image */}
                    <img src={assets.logo || assets.favicon} alt="EimiCart logo" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                    <p className="text-xl font-medium">EimiCart</p>
                </NavLink>

                {/* Search Box - Visible on small screens */}
                <div className="flex lg:hidden items-center text-sm gap-2 border border-gray-300 px-3 rounded-full mx-4">
                    <input 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={handleSearch}
                        value={searchQuery} 
                        className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500" 
                        type="text" 
                        placeholder="Search products" 
                    />
                    <img src={assets.search_icon} alt='search' className='w-4 h-4' />
                </div>

                {/* Desktop Menu */}
                <div className="hidden sm:flex items-center gap-8">
                    <NavLink to='/'>Home</NavLink>
                    <NavLink to='/products'>All Product</NavLink>

                    {/* Search Box - Original position for large screens */}
                    <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
                        <input 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            onKeyDown={handleSearch}
                            value={searchQuery} 
                            className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500" 
                            type="text" 
                            placeholder="Search products" 
                        />
                        <img src={assets.search_icon} alt='search' className='w-4 h-4' />
                    </div>

                    <div onClick={() => navigate("/cart")} className="relative cursor-pointer">
                        <img src={assets.nav_cart_icon} alt='cart' className='w-6 opacity-80' />
                        <button className="absolute -top-2 -right-3 text-xs text-white bg-[var(--color-primary)] w-[18px] h-[18px] rounded-full">{getCartCount()}</button>
                    </div>
                    {!user ? (<button onClick={() => setShowUserLogin(true)} className="cursor-pointer px-8 py-2 bg-[var(--color-primary)] hover:bg-primary-dull transition text-white rounded-full">
                        Login
                    </button>)
                        :
                        (
                            <div className='relative group'>
                                <img src={assets.profile_icon} className='w-10' alt='' />
                                <ul className='hidden group-hover:block absolute top-10 right-0 bg-white shadow-lg border border-gray-200 py-2 w-40 rounded-md text-sm z-40'>
                                    <li onClick={() => navigate("/profile")} className='px-4 py-2 hover:bg-[var(--color-primary)]/5 hover:border-l-4 hover:border-[var(--color-primary)] cursor-pointer transition-all duration-200'>Profile</li>
                                    <li onClick={() => navigate("/my-orders")} className='px-4 py-2 hover:bg-[var(--color-primary)]/5 hover:border-l-4 hover:border-[var(--color-primary)] cursor-pointer transition-all duration-200'>My Orders</li>
                                    <li onClick={logout} className='px-4 py-2 hover:bg-[var(--color-primary)]/5 hover:border-l-4 hover:border-[var(--color-primary)] cursor-pointer transition-all duration-200'>Logout</li>
                                </ul>
                            </div>
                        )}
                </div>

                <div className='flex items-center gap-6 sm:hidden'>
                    <div onClick={() => navigate("/cart")} className="relative cursor-pointer">
                        <img src={assets.nav_cart_icon} alt='cart' className='w-6 opacity-80' />
                        <button className="absolute -top-2 -right-3 text-xs text-white bg-[var(--color-primary)] w-[18px] h-[18px] rounded-full">{getCartCount()}</button>
                    </div>
                    <button onClick={() => open ? setOpen(false) : setOpen(true)} aria-label="Menu" className="">
                        <img src={assets.menu_icon} alt='menu' />
                    </button>
                </div>

                {/* Mobile Menu */}
                {open && (
                    <div 
                        ref={dropdownRef}
                        className={`${open ? 'flex' : 'hidden'} absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden`}
                    >
                        <NavLink to='/' onClick={() => setOpen(false)}>Home</NavLink>
                        <NavLink to='/products' onClick={() => setOpen(false)}>All Product</NavLink>
                        {user && (
                            <>
                                <NavLink to='/my-orders' onClick={() => setOpen(false)}>My Orders</NavLink>
                                <NavLink to='/profile' onClick={() => setOpen(false)}>Profile</NavLink>
                            </>
                        )}

                        {!user ? (
                            <button onClick={() => {
                                setOpen(false);
                                setShowUserLogin(true)
                            }} className="cursor-pointer px-6 py-2 mt-2 bg-[var(--color-primary)] hover:bg-primary-dull transition text-white rounded-full text-sm">
                                Login
                            </button>
                        ) : (
                            <button onClick={logout} className="cursor-pointer px-6 py-2 mt-2 bg-[var(--color-primary)] hover:bg-primary-dull transition text-white rounded-full text-sm">
                                Logout
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Navbar