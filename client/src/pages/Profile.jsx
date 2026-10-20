import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const emptyStudentDetails = {
    department: '',
    registerNumber: '',
    mobileNumber: '',
    studentType: '',
    dateOfBirth: '',
};

const Profile = () => {
    const { user, setUser, axios, isUserLoading } = useAppContext();
    const navigate = useNavigate();
    const [studentDetails, setStudentDetails] = useState(emptyStudentDetails);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isUserLoading && !user) {
            navigate('/');
        }
    }, [isUserLoading, user, navigate]);

    useEffect(() => {
        if (user) {
            setStudentDetails({
                department: user.department || '',
                registerNumber: user.registerNumber || '',
                mobileNumber: user.mobileNumber || '',
                studentType: user.studentType || '',
                dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
            });
        }
    }, [user]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setStudentDetails((currentDetails) => ({
            ...currentDetails,
            [name]: value,
        }));
    };

    const handleCancelEdit = () => {
        setStudentDetails({
            department: user.department || '',
            registerNumber: user.registerNumber || '',
            mobileNumber: user.mobileNumber || '',
            studentType: user.studentType || '',
            dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
        });
        setIsEditing(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isEditing) return;
        setIsSaving(true);

        try {
            const { data } = await axios.put('/api/user/profile', studentDetails);
            if (!data.success) {
                toast.error(data.message || 'Failed to save profile information');
                return;
            }

            setUser(data.user);
            setIsEditing(false);
            toast.success('Profile information saved');
        } catch (error) {
            console.error('Error saving profile information:', error);
            toast.error(error.response?.data?.message || 'Failed to save profile information');
        } finally {
            setIsSaving(false);
        }
    };

    if (isUserLoading || !user) {
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
                    <section className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-lg font-semibold mb-3">Personal Information</h2>
                        <div className="space-y-2">
                            <p className="text-gray-700">
                                <span className="font-medium">Name:</span> {user.name}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Email:</span> {user.email}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Member Since:</span>{' '}
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                            </p>
                        </div>
                    </section>

                    <section className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-lg font-semibold mb-3">Student Information</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                                        Department
                                    </label>
                                    <input
                                        id="department"
                                        name="department"
                                        type="text"
                                        value={studentDetails.department}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="Enter your department"
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="registerNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Register Number
                                    </label>
                                    <input
                                        id="registerNumber"
                                        name="registerNumber"
                                        type="text"
                                        value={studentDetails.registerNumber}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="Enter your register number"
                                        required
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth
                                    </label>
                                    <input
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={studentDetails.dateOfBirth}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        max={new Date().toISOString().slice(0, 10)}
                                        required
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Mobile Number
                                    </label>
                                    <input
                                        id="mobileNumber"
                                        name="mobileNumber"
                                        type="tel"
                                        value={studentDetails.mobileNumber}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="Enter your mobile number"
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="studentType" className="block text-sm font-medium text-gray-700 mb-1">
                                        Student Type
                                    </label>
                                    <select
                                        id="studentType"
                                        name="studentType"
                                        value={studentDetails.studentType}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        required
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600"
                                    >
                                        <option value="">Select student type</option>
                                        <option value="Hosteller">Hosteller</option>
                                        <option value="Day Scholar">Day Scholar</option>
                                    </select>
                                </div>
                            </div>
                            {isEditing ? (
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSaving ? 'Updating...' : 'Update Information'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
                                >
                                    Edit Information
                                </button>
                            )}
                        </form>
                    </section>

                    <section className="bg-gray-50 p-4 rounded-md">
                        <h2 className="text-lg font-semibold mb-3">Account Statistics</h2>
                        <div className="space-y-2">
                            <p className="text-gray-700">
                                <span className="font-medium">Total Orders:</span> {user.totalOrders || 0}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Last Order:</span>{' '}
                                {user.lastOrder ? new Date(user.lastOrder).toLocaleDateString() : 'No orders yet'}
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;
