import { Link, Navigate, NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const SellerLayout = () => {
    const { axios, navigate } = useAppContext();

    const sidebarLinks = [
        { name: "Add Product", path: "/seller", icon: assets.add_icon },
        { name: "Product List", path: "/seller/product-list", icon: assets.product_list_icon },
        { name: "Orders", path: "/seller/orders", icon: assets.order_icon },
    ];

    const logout = async () => {
        try {
            const {data} = await axios.get('/api/seller/logout');
            if(data.success){
                toast.success(data.message)
                navigate('/')
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(data.message)
        }
    }

    return (
        <>
            <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white shadow-sm">
                <Link to='/' className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[var(--color-primary)]">EimiCart Seller</span>
                </Link>
                <div className="flex items-center gap-5 text-black">
                    <p className="font-medium">Hi Boss MoiaGangte</p>
                    <button 
                        onClick={logout} 
                        className='border border-[var(--color-primary)] text-[var(--color-primary)] rounded-full text-sm px-4 py-1 hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-200'
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="flex">
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
            </div>
        </>
    );
};

export default SellerLayout;