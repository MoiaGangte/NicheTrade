import React from 'react'
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import PasswordInput from './PasswordInput';

const Login = () => {

    const { setShowUserLogin, setUser, axios, navigate } = useAppContext()

    const [state, setState] = React.useState("login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loginMethod, setLoginMethod] = React.useState("email");
    const [registerNumber, setRegisterNumber] = React.useState("");
    const [dateOfBirth, setDateOfBirth] = React.useState("");
    const [department, setDepartment] = React.useState("");
    const [mobileNumber, setMobileNumber] = React.useState("");
    const [studentType, setStudentType] = React.useState("");

    const onSubmitHandler = async (event) => {

        try {
            event.preventDefault();

            const { data } = loginMethod === "registerNumber" && state === "login"
                ? await axios.post('/api/user/login-register-number', { registerNumber, dateOfBirth })
                : await axios.post(`/api/user/${state}`, {
                    name,
                    email,
                    password,
                    ...(state === "register" && { department, registerNumber, mobileNumber, studentType, dateOfBirth }),
                });

            if (data.success) {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                navigate('/')
                setUser(data.user)
                setShowUserLogin(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message)

        }
    }

    return (
        <div onClick={() => setShowUserLogin(false)} className='fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4 text-sm text-gray-600'>
            <div onClick={(event) => event.stopPropagation()} className="m-auto flex w-full max-w-[640px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl sm:flex-row">
                <form onSubmit={onSubmitHandler} className="flex flex-col gap-4 items-start p-8 py-12 w-full sm:w-[352px] sm:shrink-0">
                    <p className="text-2xl font-medium m-auto">
                        <span className="text-[var(--color-primary)]">User</span> {state === "login" ? "Login" : "Sign Up"}
                    </p>
                    {state === "register" && (
                        <>
                            <div className="w-full">
                                <label htmlFor="signupName">Name</label>
                                <input id="signupName" onChange={(e) => setName(e.target.value)} value={name} placeholder="Enter your name" className="border border-gray-200 rounded w-full p-2 mt-1 outline-indigo-500" type="text" required />
                            </div>
                            <div className="w-full">
                                <label htmlFor="signupDepartment">Department</label>
                                <input id="signupDepartment" onChange={(e) => setDepartment(e.target.value)} value={department} placeholder="Enter your department" className="border border-gray-200 rounded w-full p-2 mt-1 outline-indigo-500" type="text" required />
                            </div>
                            <div className="w-full">
                                <label htmlFor="signupRegisterNumber">Register Number</label>
                                <input id="signupRegisterNumber" onChange={(e) => setRegisterNumber(e.target.value)} value={registerNumber} placeholder="Enter your register number" className="border border-gray-200 rounded w-full p-2 mt-1 outline-indigo-500" type="text" autoComplete="username" required />
                            </div>
                            <div className="w-full">
                                <label htmlFor="signupDateOfBirth">Date of Birth</label>
                                <input id="signupDateOfBirth" onChange={(e) => setDateOfBirth(e.target.value)} value={dateOfBirth} max={new Date().toISOString().slice(0, 10)} className="border border-gray-200 rounded w-full p-2 mt-1 outline-indigo-500" type="date" autoComplete="bday" required />
                            </div>
                            <div className="w-full">
                                <label htmlFor="signupMobileNumber">Mobile Number</label>
                                <input id="signupMobileNumber" onChange={(e) => setMobileNumber(e.target.value)} value={mobileNumber} placeholder="Enter your mobile number" className="border border-gray-200 rounded w-full p-2 mt-1 outline-indigo-500" type="tel" autoComplete="tel" required />
                            </div>
                            <div className="w-full">
                                <label htmlFor="signupStudentType">Student Type</label>
                                <select id="signupStudentType" onChange={(e) => setStudentType(e.target.value)} value={studentType} className="border border-gray-200 rounded w-full p-2 mt-1 outline-indigo-500" required>
                                    <option value="">Select student type</option>
                                    <option value="Hosteller">Hosteller</option>
                                    <option value="Day Scholar">Day Scholar</option>
                                </select>
                            </div>
                        </>
                    )}
                    {state === "login" && (
                        <div className="flex w-full rounded-md bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => setLoginMethod("email")}
                                className={`flex-1 rounded px-2 py-1.5 ${loginMethod === "email" ? "bg-white shadow-sm text-gray-800" : "text-gray-600"}`}
                            >
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginMethod("registerNumber")}
                                className={`flex-1 rounded px-2 py-1.5 ${loginMethod === "registerNumber" ? "bg-white shadow-sm text-gray-800" : "text-gray-600"}`}
                            >
                                Register Number
                            </button>
                        </div>
                    )}
                    {(state === "register" || loginMethod === "email") && (
                        <>
                            <div className="w-full">
                                <p>Email</p>
                                <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="Enter your email" className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]" type="email" required />
                            </div>
                            <div className="w-full">
                                <label htmlFor="userPassword">Password</label>
                                <PasswordInput id="userPassword" onChange={(e) => setPassword(e.target.value)} value={password} placeholder="Enter your password" className="border border-gray-200 rounded w-full p-2 outline-[var(--color-primary)]" required />
                            </div>
                        </>
                    )}
                    {state === "login" && loginMethod === "registerNumber" && (
                        <>
                            <div className="w-full">
                                <label htmlFor="loginRegisterNumber">Register Number</label>
                                <input id="loginRegisterNumber" onChange={(e) => setRegisterNumber(e.target.value)} value={registerNumber} placeholder="Enter your register number" className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]" type="text" autoComplete="username" required />
                            </div>
                            <div className="w-full">
                                <label htmlFor="loginDateOfBirth">Date of Birth</label>
                                <input id="loginDateOfBirth" onChange={(e) => setDateOfBirth(e.target.value)} value={dateOfBirth} className="border border-gray-200 rounded w-full p-2 mt-1 outline-[var(--color-primary)]" type="date" autoComplete="bday" required />
                            </div>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/user/google`}
                        style={{
                            background: '#fff',
                            color: '#444',
                            border: '1px solid #ccc',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            marginBottom: '8px'
                        }}
                    >
                        <img
                            src="https://developers.google.com/identity/images/g-logo.png"
                            alt="Google logo"
                            style={{ width: 20, height: 20 }}
                        />
                        {state === "register" ? "Sign in with Google" : "Login with Google"}
                    </button>

                    {state === "register" ? (
                        <p>
                            Already have account? <span onClick={() => setState("login")} className="text-[var(--color-primary)] cursor-pointer">Login</span>
                        </p>
                    ) : (
                        <p>
                            Create an account? <span onClick={() => setState("register")} className="text-[var(--color-primary)] cursor-pointer">Sign Up</span>
                        </p>
                    )}

                    <button type="submit" className="bg-[var(--color-primary)] hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer">
                        {state === "register" ? "Create Account" : "Login"}
                    </button>
                </form>
                <aside className="flex w-full flex-col justify-center gap-4 border-t border-gray-200 bg-gray-50 p-6 text-center sm:w-[288px] sm:border-l sm:border-t-0">
                    <div>
                        <h2 className="text-xl font-medium text-gray-800">Seller Account</h2>
                        <p className="mt-2 text-sm text-gray-500">Manage your own listings on NicheTrade.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setShowUserLogin(false)
                            navigate('/seller/login')
                        }}
                        className="w-full rounded-md border border-[var(--color-primary)] bg-white px-3 py-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                    >
                        Seller Login
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowUserLogin(false)
                            navigate('/seller/register')
                        }}
                        className="w-full rounded-md bg-[var(--color-primary)] px-3 py-2 text-white hover:bg-primary-dull"
                    >
                        Seller Sign Up
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowUserLogin(false)
                            navigate('/admin/login')
                        }}
                        className="mt-2 text-xs text-gray-500 underline hover:text-gray-800"
                    >
                        Admin login
                    </button>
                </aside>
            </div>
        </div>
    )
}
export default Login