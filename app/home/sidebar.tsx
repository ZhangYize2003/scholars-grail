import { FiHome, FiFileText, FiFolder, FiUsers, FiSettings} from "react-icons/fi";

const SideBar = () => {
    return (
        <div className="fixed top-0 left-0 h-screen w-50 m-0 flex flex-col
                        bg-gray-800 text-white shadow-lg">
            <div className="pt-20 space-y-1">
                <SideBarIcon icon ={<FiHome size = "20" />} text = "Home" />
                <SideBarIcon icon ={<FiFileText size = "20" />} text = "Mark Paper" />
                <SideBarIcon icon ={<FiFolder size = "20" />} text = "Repository" />
                <SideBarIcon icon ={<FiUsers size = "20" />} text = "Friends" />
            </div>

            <div className="mt-auto">
                <SideBarIcon icon ={<FiSettings size = "20" />} text = "Settings"/>
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