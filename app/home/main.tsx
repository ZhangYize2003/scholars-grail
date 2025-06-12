import { FiClock, FiBookOpen, FiFlag} from "react-icons/fi";

const Main = () => {
    return (
        <main className="flex flex-col items-center my-5 space-y-12 text-main text-sm">
            <div className="flex flex-col items-start gap-1">
                <div className="flex justify-center gap-1">
                    <FiClock className=" w-3.5 h-3.5 my-0.5"/> 
                    <h2> Recently Opened </h2>
                </div>
                <div className="bg-primary rounded-md p-2 w-[50vw] min-h-28">

                </div>
            </div>
            <div className="flex flex-col items-start gap-1">
                <div className="flex justify-start gap-1">  
                    <FiBookOpen className="w-3.5 h-3.5 my-0.5"/>
                    <h2> Unattempted Papers </h2>
                </div>
                <div className="bg-primary rounded-md p-2 w-[50vw] min-h-28">

                </div>
            </div>
            <div className="flex flex-col items-start gap-1">
                <div className="flex justify-start gap-1">
                    <FiFlag className="w-3.5 h-3.5 my-0.5"/>
                    <h2> Compile Mistakes </h2>
                </div>
                <div className="bg-primary rounded-md p-2 w-[50vw] min-h-28">

                </div>
            </div>
        </main>
    );
}

export default Main;