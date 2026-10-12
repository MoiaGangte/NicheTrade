import { footerLinks } from "../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect } from "react";

const Footer = () => {
    const location = useLocation();

    const scrollToSection = useCallback((hash) => {
        const sectionId = hash.slice(1);
        if (!sectionId) return;

        requestAnimationFrame(() => {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }, []);

    useEffect(() => {
        if (location.pathname === "/" && location.hash) {
            scrollToSection(location.hash);
        }
    }, [location.pathname, location.hash, scrollToSection]);

    return (
        <footer className="bg-[var(--color-primary)]/10 border-t border-gray-300">
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-24">
                <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30 text-gray-800">
                    <div>
                    <p className="text-xl font-medium">NicheTrade</p>
                        <p className="max-w-[410px] mt-6">Niche Trade is a student-to-student marketplace created by a team of 2nd-year AI & DS students at Noorul Islam Centre for Higher Education, Kanyakumari, to make campus buying and selling easy and to earn extra pocket money for students</p>
                    </div>
                    <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                        {footerLinks.map((section, index) => (
                            <div key={index}>
                                <h3 className="font-semibold text-base text-gray-900 md:mb-5 mb-2">{section.title}</h3>
                                <ul className="text-sm space-y-1">
                                    {section.links.map((link, i) => (
                                        <li key={i}>
                                            {link.url.startsWith("/") ? (
                                                <Link
                                                    to={link.url}
                                                    onClick={() => {
                                                        const hash = link.url.split("#")[1];
                                                        if (hash) {
                                                            if (location.pathname === "/") scrollToSection(`#${hash}`);
                                                        } else {
                                                            window.scrollTo(0, 0);
                                                        }
                                                    }}
                                                    className="hover:underline transition"
                                                >
                                                    {link.text}
                                                </Link>
                                            ) : (
                                                <a href={link.url} className="hover:underline transition">{link.text}</a>
                                            )}
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