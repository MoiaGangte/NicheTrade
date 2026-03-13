import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { assets, footerLinks } from "../assets/assets";

const Footer = () => {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const { axios } = useContext(AppContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setLoading(true);
        try {
            const { data } = await axios.post('/api/feedback/send', { feedback });
            if (data.success) {
                alert('Feedback sent successfully!');
                setFeedback('');
            } else {
                alert(data.message || 'Failed to send feedback');
            }
        } catch (error) {
            console.error('Error sending feedback:', error);
            alert('Failed to send feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer className="bg-[var(--color-primary)]/10 border-t border-gray-300">
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-24">
                <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30 text-gray-800">
                    <div>
                    <p className="text-xl font-medium">EimiCart</p>
                        <p className="max-w-[410px] mt-6">This is just a demo project, Still in development. Therefore the site is currently operating with a payment integration test API key. Any payments attempted through this website will not be processed or accepted.” </p>
                        <p className="mt-2">If you have any feedback or encounter any errors, please let me know THANK YOU!!</p>
                        <form onSubmit={handleSubmit} className="mt-4 flex gap-2 flex-nowrap">
                            <input 
                                type="text" 
                                placeholder="Enter your feedback here"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="border border-black-500 rounded px-3 py-2 flex-1 min-w-0"
                                disabled={loading}
                            />
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary)]/80 transition disabled:opacity-50 whitespace-nowrap text-sm md:text-base"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send'}
                            </button>
                        </form>
                    </div>
                    <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                        {footerLinks.map((section, index) => (
                            <div key={index}>
                                <h3 className="font-semibold text-base text-gray-900 md:mb-5 mb-2">{section.title}</h3>
                                <ul className="text-sm space-y-1">
                                    {section.links.map((link, i) => (
                                        <li key={i}>
                                            <a href={link.url} className="hover:underline transition">{link.text}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="py-4 text-center text-sm md:text-base text-gray-600/80">
                    MOIA GANGTE Copyright {new Date().getFullYear()} © All Right Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer