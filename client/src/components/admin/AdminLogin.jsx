import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import PasswordInput from "../PasswordInput";

const AdminLogin = () => {
    const { axios, isAdmin, setIsAdmin, navigate } = useAppContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAdmin) navigate("/admin");
    }, [isAdmin, navigate]);

    const onSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { data } = await axios.post("/api/admin/login", { email, password });
            if (!data.success) {
                toast.error(data.message || "Unable to log in");
                return;
            }
            setIsAdmin(true);
            navigate("/admin");
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to log in");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center text-sm text-gray-600">
            <form onSubmit={onSubmit} className="flex flex-col gap-5 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white">
                <h1 className="text-2xl font-medium m-auto">
                    <span className="text-[var(--color-primary)]">Admin</span> Login
                </h1>
                <label className="w-full">
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="username"
                        required
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]"
                    />
                </label>
                <div className="w-full">
                    <label htmlFor="adminPassword">Password</label>
                    <PasswordInput
                        id="adminPassword"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                        className="border border-gray-200 rounded w-full p-2 outline-[var(--color-primary)]"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[var(--color-primary)] text-white w-full py-2 rounded-md disabled:opacity-60"
                >
                    {isSubmitting ? "Please wait..." : "Login"}
                </button>
            </form>
        </main>
    );
};

export default AdminLogin;
