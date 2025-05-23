import Link from 'next/link';
import { FiHome, FiFileText, FiFolder, FiUsers, FiSettings, FiLogOut} from "react-icons/fi";
import { useRouter } from "next/navigation";

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
}

const SideBar = ({isOpen, onClose}: SideBarProps) => {
    const router = useRouter();

    const handleSignOut = () => {
        localStorage.removeItem("isLoggedIn");
        router.replace("/login");
    };
    return (
        <div className={`fixed top-15 left-0 h-screen w-50 bg-gray-800 text-white shadow-lg transform 
                        transition-transform duration-300 z-50 flex flex-col justify-between
                        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="pt-3">
                <Link href="/" className="w-full hover:bg-gray-900 transition-colors text-left">
                <SideBarIcon icon ={<FiHome size = "20" />} text = "Home" />
                </Link>
                <Link href="/" className="w-full hover:bg-gray-900 transition-colors text-left"> {/* Placeholder href */}
                <SideBarIcon icon ={<FiFileText size = "20" />} text = "Mark Paper" />
                </Link>
                <Link href="/" className="w-full hover:bg-gray-900 transition-colors text-left"> {/* Placeholder href */}
                <SideBarIcon icon ={<FiFolder size = "20" />} text = "Repository" />
                </Link>
                <Link href="/" className="w-full hover:bg-gray-900 transition-colors text-left"> {/* Placeholder href */}
                <SideBarIcon icon ={<FiUsers size = "20" />} text = "Friends" />
                </Link>
            </div>

                <div className="mb-19 flex flex-col">
                    <button onClick={handleSignOut}>
                    <SideBarIcon icon = {<FiLogOut size="20" />} text = "Sign Out" />
                    </button>
                    <Link href="/"> {/* Placeholder href */}
                    <SideBarIcon icon = {<FiSettings size="20" />} text = "Settings" />
                    </Link>
            </div>
        </div>
    );
}

const SideBarIcon = ({ icon, text }: { icon: React.ReactNode; text: string}) => (
    <div className="sidebar-icon group flex items-center p-4 ml-2 mr-2 hover:bg-gray-900 cursor-pointer rounded-xl">
        {icon}
        <span className="ml-4 text-sm font-normal text-gray-200 group-hover:text-white">
        {text}
        </span>
    </div>
);

export default SideBar;