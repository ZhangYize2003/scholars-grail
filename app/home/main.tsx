import { FiClock, FiBookOpen, FiFlag} from "react-icons/fi";

const Main = () => {
    return (
        <main className="ml-90">
            <div className="my-12 space-y-12">
                <div className="flex flex-col items-start gap-1">
                    <div className="flex justify-start gap-1 text-gray-200 text-sm">
                        <FiClock className=" w-3.5 h-3.5 my-0.5"/> 
                        <h2> Recently Opened </h2>
                    </div>
                    <div className="bg-gray-700 rounded-md p-2 w-3xl min-h-28">

                    </div>
                </div>
                <div className="flex flex-col items-start gap-1">
                    <div className="flex justify-start gap-1 text-gray-200 text-sm">  
                        <FiBookOpen className="w-3.5 h-3.5 my-0.5"/>
                        <h2> Unattempted Papers </h2>
                    </div>
                    <div className="bg-gray-700 rounded-md p-2 w-3xl min-h-28">

                    </div>
                </div>
                <div className="flex flex-col items-start gap-1">
                    <div className="flex justify-start gap-1 text-gray-200 text-sm">
                        <FiFlag className="w-3.5 h-3.5 my-0.5"/>
                        <h2> Compile Mistakes </h2>
                    </div>
                    <div className="bg-gray-700 rounded-md p-2 w-3xl min-h-28">

                    </div>
                </div>
            </div>
        </main>
    );
}

export default Main;