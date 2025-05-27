import { useEffect } from "react";
import { FiClock, FiBookOpen, FiFlag} from "react-icons/fi";

const Main = () => {
    return (
        <main className="ml-90">
            <div className="my-10 space-y-40">
                <div className="flex items-center gap-2">
                    <FiClock className="text-gray-200 w-3 h-3 mt-6" />
                    <h2 className="text-gray-200 text-sm text-left">
                        Recently Opened
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <FiBookOpen className="text-gray-200 w-3 h-3 mt-6"/>
                    <h2 className="text-gray-200 text-sm text-left">
                        Unattempted Papers
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <FiFlag className="text-gray-200 w-3 h-3 mt-6"/>
                    <h2 className="text-gray-200 text-sm text-left">
                        Compile Mistakes
                    </h2>
                </div>
            </div>
        </main>
    );
}

export default Main;