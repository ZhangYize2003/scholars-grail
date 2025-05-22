import Link from 'next/link';
import { FiMenu } from "react-icons/fi";
import { useState } from 'react';
import SideBar from "./sidebar";

const Header = () => {
    const [isSideBarOpen, setSideBarOpen] = useState(false);
    const toggleSideBar = () => {
        setSideBarOpen(!isSideBarOpen);
    };

    return (
        <header className="bg-gray-900 text-gray-300 p-3 shadow-md">
            <nav className="container mx-auto flex items-center justify-between">
                <div className="flex items-center ml-1 gap-4">
                <button onClick={toggleSideBar} 
                        className="hover:bg-white/10 rounded-full p-2 transition-all">
                    <FiMenu size="20" className="hover:text-blue-100"/>
                </button>
                <Link href="/" className="text-2xl font-bold hover:text-blue-100">
                Scholar&apos;s Grail
                </Link>
                </div>
                <SideBar isOpen={isSideBarOpen} onClose={toggleSideBar}/>
            </nav>
        </header>
    );
}

export default Header;