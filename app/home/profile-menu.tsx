import Link from 'next/link';
import { FiUser, FiLogOut, FiSettings} from "react-icons/fi";
import { useRouter } from "next/navigation";

interface ProfileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileMenu = ({isOpen}: ProfileMenuProps) => {
    const router = useRouter();

    const handleSignOut = () => {
        localStorage.removeItem("isLoggedIn");
        router.replace("/login");
    };

    return (
        <div className={`fixed top-16 right-3 h-40 w-30 bg-secondary shadow-lg z-50
                        flex flex-col justify-between border-t-1 border-stroke rounded-md
                        ${isOpen ? 'translate-x-0' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col mt-3 text-sm text-main font-normal">
                <Link href="/profile" className="flex items-center p-3 gap-2 hover:bg-tertiary cursor-pointer">
                    <FiUser size="20" /> 
                    Profile
                </Link>
                <button onClick={handleSignOut} className="flex items-center p-3 gap-2 hover:bg-tertiary cursor-pointer">
                    <FiLogOut size="20" />
                    Sign out
                </button>
                <Link href="/" className="flex items-center p-3 gap-2 hover:bg-tertiary cursor-pointer"> {/* Placeholder href */}
                    <FiSettings size="20" />
                    Settings
                </Link>
            </div>
        </div>
    
    );
}

export default ProfileMenu;