import { Link, Navigate, NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useRef } from "react";

const SellerLayout = () => {
    const { axios, navigate, seller, setIsSeller, setSeller, setUser, setCartItems } = useAppContext();
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const sidebarLinks = [
        { name: "Add Product", path: "/seller", icon: assets.add_icon },
        { name: "Product List", path: "/seller/product-list", icon: assets.product_list_icon },
        { name: "Orders", path: "/seller/orders", icon: assets.order_icon },
    ];

    // Swipe handlers for mobile
    const handleTouchStart = (e) => {
        if (window.innerWidth >= 640) return;
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
        if (window.innerWidth >= 640) return;
        touchEndX.current = e.changedTouches[0].clientX;
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            // Find current page index
            const currentPath = window.location.pathname;
            const currentIndex = sidebarLinks.findIndex(link => link.path === currentPath || (link.path === "/seller" && currentPath === "/seller"));
            if (currentIndex < 0) return;
            if (diff > 0) {
                // Swipe left: next page (loop)
                const nextIndex = (currentIndex + 1) % sidebarLinks.length;
                navigate(sidebarLinks[nextIndex].path);
            } else if (diff < 0) {
                // Swipe right: previous page (loop)
                const prevIndex = (currentIndex - 1 + sidebarLinks.length) % sidebarLinks.length;
                navigate(sidebarLinks[prevIndex].path);
            }
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const logout = async () => {
        try {
            const {data} = await axios.post('/api/user/logout');
            if(data.success){
                setIsSeller(false);
                setSeller(null);
                setUser(null);
                setCartItems({});
                localStorage.removeItem('token');
                toast.success(data.message)
                navigate('/')
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to log out");
        }
    }

    return (
        <>
            <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white shadow-sm">
                <Link to='/' className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[var(--color-primary)]">NicheTrade Seller</span>
                </Link>
                <div className="flex items-center gap-5 text-black">
                    <p className="font-medium">Hi {seller?.name || "Seller"}</p>
                    <button 
                        onClick={logout} 
                        className='border border-[var(--color-primary)] text-[var(--color-primary)] rounded-full text-sm px-4 py-1 hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-200'
                    >
                        Logout
                    </button>
                </div>
            </div>

            {!seller?.isApproved || seller?.isActive === false ? (
                <div className="grid min-h-[70vh] place-items-center bg-gray-50 px-6 text-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Seller profile under review</h1>
                        <p className="mt-2 text-gray-600">Your seller profile must be approved before you can use the dashboard.</p>
                    </div>
                </div>
            ) : <div className="flex" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div className="md:w-64 w-16 border-r h-[95vh] text-base border-gray-300 pt-4 flex flex-col bg-white">
                    {sidebarLinks.map((item) => (
                        <NavLink to={item.path} key={item.name} end={item.path === "/seller"}
                            className={({isActive})=>`flex items-center py-3 px-4 gap-3 
                            ${isActive ? "border-r-4 md:border-r-[6px] bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                                    : "hover:bg-gray-100/90 border-white "
                                }`
                            }
                        >
                            <img src={item.icon} alt="" className="w-7 h-7" />
                            <p className="md:block hidden text-center">{item.name}</p>
                        </NavLink>
                    ))}
                </div>

                <div className="flex-1 bg-gray-50">
                    <Outlet />
                </div>
            </div>}
        </>
    );
};

export default SellerLayout;