import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const SellerLogin = ({ mode = "login" }) => {
    const { isSeller, setIsSeller, setSeller, navigate, axios } = useAppContext();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [department, setDepartment] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isRegistration = mode === "register";

    useEffect(() => {
        if (isSeller) navigate("/seller");
    }, [isSeller, navigate]);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        if (isRegistration && password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (isRegistration && password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = isRegistration ? "/api/seller/register" : "/api/seller/login";
            const payload = isRegistration
                ? { name, email, phone, department, password, confirmPassword }
                : { email, password };
            const { data } = await axios.post(endpoint, payload);

            if (!data.success) {
                toast.error(data.message || "Unable to continue");
                return;
            }
            if (isRegistration) {
                toast.success(data.message);
                navigate("/seller/login");
                return;
            }

            setSeller(data.seller);
            setIsSeller(true);
            navigate("/seller");
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to continue");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className="min-h-screen flex items-center text-sm text-gray-600">
            <div className="flex flex-col gap-5 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white">
                <p className="text-2xl font-medium m-auto">
                    <span className="text-[var(--color-primary)]">Seller</span>{" "}
                    {isRegistration ? "Sign Up" : "Login"}
                </p>

                {isRegistration && (
                    <label className="w-full">
                        <span>Name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoComplete="name"
                            minLength={2}
                            required
                            className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]"
                        />
                    </label>
                )}
                <label className="w-full">
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]"
                    />
                </label>
                {isRegistration && (
                    <label className="w-full">
                        <span>Phone number</span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            autoComplete="tel"
                            pattern="[\d\s()+.-]{7,20}"
                            title="Enter a valid phone number"
                            required
                            className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]"
                        />
                    </label>
                )}
                {isRegistration && (
                    <label className="w-full">
                        <span>Department</span>
                        <input
                            type="text"
                            value={department}
                            onChange={(event) => setDepartment(event.target.value)}
                            autoComplete="organization-title"
                            placeholder="Enter your department"
                            minLength={2}
                            required
                            className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]"
                        />
                    </label>
                )}
                <label className="w-full">
                    <span>Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={isRegistration ? "new-password" : "current-password"}
                        minLength={isRegistration ? 8 : undefined}
                        required
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]"
                    />
                </label>
                {isRegistration && (
                    <label className="w-full">
                        <span>Confirm password</span>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            required
                            className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]"
                        />
                    </label>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[var(--color-primary)] text-white w-full py-2 rounded-md cursor-pointer disabled:opacity-60"
                >
                    {isSubmitting ? "Please wait..." : isRegistration ? "Submit for Approval" : "Login"}
                </button>

                <p className="w-full text-center">
                    {isRegistration ? "Already registered?" : "Need a seller account?"}{" "}
                    <Link
                        to={isRegistration ? "/seller/login" : "/seller/register"}
                        className="text-[var(--color-primary)] underline"
                    >
                        {isRegistration ? "Seller Login" : "Seller Sign Up"}
                    </Link>
                </p>
                <p className="w-full text-center text-xs text-gray-500">
                    Admin? <Link to="/admin/login" className="underline">Admin login</Link>
                </p>
                {isRegistration && (
                    <p className="w-full text-center text-xs text-gray-500">
                        Seller accounts need admin approval before login.
                    </p>
                )}
            </div>
        </form>
    );
};

export default SellerLogin;
