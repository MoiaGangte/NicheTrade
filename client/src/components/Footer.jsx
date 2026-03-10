import { assets, footerLinks } from "../assets/assets";

const Footer = () => {

    return (
        <footer className="bg-[var(--color-primary)]/10 border-t border-gray-300">
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-24">
                <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30 text-gray-800">
                    <div>
                    <p className="text-xl font-medium">EimiCart</p>
                        <p className="max-w-[410px] mt-6">This is just a demo project. Any Payment made should be considered as a donation for the development of this app and the cost of hosting. </p>
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
                <p className="py-4 text-center text-sm md:text-base text-gray-500/80">
                    MOIA GANGTE Copyright {new Date().getFullYear()} © All Right Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer