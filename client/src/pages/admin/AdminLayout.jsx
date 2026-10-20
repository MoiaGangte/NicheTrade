import { Link, NavLink, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const AdminLayout = () => {
    const { axios, navigate, setIsAdmin } = useAppContext();

    const logout = async () => {
        try {
            const { data } = await axios.get("/api/admin/logout");
            if (!data.success) {
                toast.error(data.message || "Unable to log out");
                return;
            }
            setIsAdmin(false);
            toast.success(data.message);
            navigate("/");
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to log out");
        }
    };

    const links = [
        { name: "Seller Applications", path: "/admin/sellers" },
        { name: "Free Upload Requests", path: "/admin/upload-requests" },
        { name: "All Products", path: "/admin/products" },
        { name: "Lost & Found", path: "/admin/lost-found" },
        { name: "Item Requests", path: "/admin/request-items" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white shadow-sm">
                <Link to="/admin/sellers" className="text-xl md:text-2xl font-bold text-[var(--color-primary)]">
                    NicheTrade Admin
                </Link>
                <button
                    type="button"
                    onClick={logout}
                    className="border border-[var(--color-primary)] text-[var(--color-primary)] rounded-full text-sm px-4 py-1 hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                >
                    Logout
                </button>
            </header>
            <div className="flex min-h-[calc(100vh-60px)]">
                <nav className="w-14 md:w-64 border-r border-gray-300 bg-white py-4">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `block py-3 px-2 md:px-5 text-xs md:text-base ${
                                isActive
                                    ? "border-r-4 border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            <span className="hidden md:inline">{link.name}</span>
                            <span className="md:hidden" aria-label={link.name}>
                                {link.name === "All Products" ? "Products" : link.name === "Seller Applications" ? "Sellers" : link.name === "Free Upload Requests" ? "Uploads" : link.name === "Lost & Found" ? "Lost" : "Requests"}
                            </span>
                        </NavLink>
                    ))}
                </nav>
                <section className="min-w-0 flex-1">
                    <Outlet />
                </section>
            </div>
        </div>
    );
};

export default AdminLayout;
