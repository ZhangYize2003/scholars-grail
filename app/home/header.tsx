import Link from 'next/link';
import { FiMenu, FiUser} from "react-icons/fi";
import { useState } from 'react';
import SideBar from "./sidebar";
import ProfileMenu from "./profile-menu";
import Image from 'next/image';
import logo from "../images/sg-logo.png";

const Header = () => {
    const [isSideBarOpen, setSideBarOpen] = useState(true);
    const toggleSideBar = () => {
        setSideBarOpen(!isSideBarOpen);
    };
    
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    const toggleProfileMenu = () => {
        setProfileMenuOpen(!isProfileMenuOpen);
    };

    return (
        <header className="bg-background text-main drop-shadow-md p-3 fixed top-0 left-0 right-0 z-50 border-b-1 border-stroke">
            <nav className="container mx-auto flex items-center justify-between">
                <div className="flex items-center justify-center ml-1 gap-4">
                    <button onClick={toggleSideBar} className="hover:bg-secondary rounded-full p-2 transition-all cursor-pointer">
                        <FiMenu size="20" className="hover:text-blue-100"/>
                    </button>
                    <SideBar isOpen={isSideBarOpen} onClose={toggleSideBar}/>
                    <Link href="/" className="flex items-center text-2xl font-bold">
                        <Image src={logo} width={40} height={40} alt="Logo"/>
                        Scholar&apos;s Grail
                    </Link>
                </div>
                
                <div className="flex items-center mr-10">
                    <button onClick={toggleProfileMenu} className="hover:bg-secondary rounded-full p-2 transition-all cursor-pointer">
                        <FiUser size="20"/>
                    </button>
                    <ProfileMenu isOpen={isProfileMenuOpen} onClose={toggleProfileMenu}/>
                </div>
            </nav>
        </header>
    );
}

export default Header;