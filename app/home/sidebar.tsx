"use client"
import { FiHome, FiFileText, FiFolder, FiUsers, FiSettings, FiLogOut} from "react-icons/fi";
import { useRouter } from "next/navigation";

const SideBar = () => {
    const router = useRouter();

    const handleSignOut = () => {
        localStorage.removeItem("isLoggedIn");
        router.replace("/login");
    };
    return (
        <div className="fixed top-0 left-0 h-screen w-50 m-0 flex flex-col
                        bg-gray-800 text-white shadow-lg">
            <div className="pt-20 space-y-1">
                <button className="w-full hover:bg-gray-900 transition-colors text-left" 
                onClick={handleSignOut}> {/* Placeholder function */}
                <SideBarIcon icon ={<FiHome size = "20" />} text = "Home" />
                </button>
                <button className="w-full hover:bg-gray-900 transition-colors text-left" 
                onClick={handleSignOut}> {/* Placeholder function */}
                <SideBarIcon icon ={<FiFileText size = "20" />} text = "Mark Paper" />
                </button>
                <button className="w-full hover:bg-gray-900 transition-colors text-left" 
                onClick={handleSignOut}> {/* Placeholder function */}
                <SideBarIcon icon ={<FiFolder size = "20" />} text = "Repository" />
                </button>
                <button className="w-full hover:bg-gray-900 transition-colors text-left" 
                onClick={handleSignOut}> {/* Placeholder function */}
                <SideBarIcon icon ={<FiUsers size = "20" />} text = "Friends" />
                </button>
            </div>

                <div className="mt-auto flex flex-col">
                    <button onClick={handleSignOut}>
                    <SideBarIcon icon = {<FiLogOut size="20" />} text = "Sign Out" />
                    </button>
                    <button onClick={handleSignOut}> {/* Placeholder function */}
                    <SideBarIcon icon = {<FiSettings size="20" />} text = "Settings" />
                    </button>
            </div>
        </div>
    );
}

const SideBarIcon = ({ icon, text }: { icon: React.ReactNode; text: string}) => (
    <div className="sidebar-icon group flex items-center p-4 hover:bg-gray-900 cursor-pointer">
        {icon}
        <span className="ml-4 text-sm font-normal text-gray-200 group-hover:text-white">
        {text}
        </span>
    </div>
);

export default SideBar;