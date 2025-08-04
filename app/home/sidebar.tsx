import Link from 'next/link';
import { FiHome, FiFileText, FiFolder } from "react-icons/fi";
import { useRevisionContext } from "../components/RevisionContext";

const SideBar = () => {
    const {isSideBarOpen} = useRevisionContext();

    return (
        <div className={`fixed top-16 left-0 h-screen w-45 bg-primary shadow-lg transform transition-transform 
                        duration-300 z-50 flex flex-col justify-between border-t-1 border-stroke
                        ${isSideBarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex flex-col pt-4 text-sm text-main font-normal">
                <Link href="/" className="sidebar_button">
                    <FiHome size="20" /> 
                    Home
                </Link>
                <Link href="/grail-session" className="sidebar_button">
                    <FiFileText size="20" /> 
                    Grail Session
                </Link>
                <Link href="/repository" className="sidebar_button">
                    <FiFolder size="20" /> 
                    Repository
                </Link>
            </div>
        </div>
    );
}

export default SideBar;