import Link from 'next/link';
import { FiHome, FiFileText, FiFolder, FiUsers } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
}

const SideBar = ({isOpen}: SideBarProps) => {
    const router = useRouter();

    const handleSignOut = () => {
        localStorage.removeItem("isLoggedIn");
        router.replace("/login");
    };
    return (
        <div className={`fixed top-16 left-0 h-screen w-45 bg-primary shadow-lg transform transition-transform 
                        duration-300 z-50 flex flex-col justify-between border-t-1 border-stroke
                        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="pt-3">
                <Link href="/" className="sidebar_button">
                <SideBarIcon icon ={<FiHome size = "20" />} text = "Home" />
                </Link>
                <Link href="/" className="sidebar_button"> {/* Placeholder href */}
                <SideBarIcon icon ={<FiFileText size = "20" />} text = "Grail Session" />
                </Link>
                <Link href="/repository" className="sidebar_button"> {/* Placeholder href */}
                <SideBarIcon icon ={<FiFolder size = "20" />} text = "Repository" />
                </Link>
                <Link href="/" className="sidebar_button"> {/* Placeholder href */}
                <SideBarIcon icon ={<FiUsers size = "20" />} text = "Friends" />
                </Link>
            </div>
        </div>
    );
}

const SideBarIcon = ({ icon, text }: { icon: React.ReactNode; text: string}) => (
    <div className="sidebar-icon group flex items-center p-4 ml-2 hover:bg-secondary cursor-pointer rounded-md">
        {icon}
        <span className="ml-4 text-sm font-normal text-gray-200 group-hover:text-white">
        {text}
        </span>
    </div>
);

export default SideBar;