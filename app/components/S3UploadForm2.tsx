"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";

interface props {
  setOpenModal2: React.Dispatch<React.SetStateAction<boolean>>;
  subject: string;
  paperFolder: string;
  setPaper: React.Dispatch<React.SetStateAction<File | null>>;
  working: File | null;
  setWorking: React.Dispatch<React.SetStateAction<File | null>>;
};

const S3UploadForm2 = ({ setOpenModal2, subject, paperFolder, setPaper, working, setWorking }: props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPaperCompleted, setIsPaperCompleted] = useState(true); 
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleWorkingSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === "application/pdf") {
                const fileReader = new FileReader();
                fileReader.onload = function() {
                    const fileContent = fileReader.result as string;
                    // Check for PDF page count by looking for /Type /Page entries
                    const pageMatches = fileContent.match(/\/Type\s*\/Page[^s]/g);
                    const pageCount = pageMatches ? pageMatches.length : 0;
                    console.log("page count:", pageCount);
                    if (pageCount > 10) {
                        alert("You can only upload PDF files with 10 pages or fewer.");
                        setWorking(null);
                        e.target.value = "";
                    } else {
                        setWorking(selectedFile);
                    }
                };
                fileReader.readAsText(selectedFile);
            } else {
                //if not pdf, can restrict to only pdf files later
                setWorking(selectedFile);
            }
        } else {
            setWorking(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (isPaperCompleted) {
            e.preventDefault();
            if (!working) {
                return;
            }
            setUploading(true);
            console.log("paper folder:", paperFolder);

            const uid = localStorage.getItem("uid");
            const formData = new FormData();
            const paperFolderName = paperFolder.split("/").filter(Boolean).pop() || ""; 

            if (uid) {
                formData.append("uid", uid);
                formData.append("subject", subject);
                formData.append("paper", working);
                formData.append("paperFolder", paperFolderName);
            }

            try {
                const response = await fetch("/api/s3-upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("File upload failed");
                }
                const data = await response.json();
                console.log("File uploaded successfully:", data);
                setUploading(false);
                setSuccess(true);
                window.dispatchEvent(new CustomEvent("foldersUpdated"));
                setTimeout(() => {
                    setSuccess(false);
                    setOpenModal2(false);
                    router.replace("/grail-session");            
                }, 1500);
            } 
            catch (error) {
                console.error("Error uploading file:", error);
                setUploading(false);
            }
        }
        else {
            setOpenModal2(false);
            router.replace("/grail-session");
        }
    };

    const resetModal = () => {
        setOpenModal2(false);
        setPaper(null);
        setWorking(null);
        setIsPaperCompleted(true);
        setUploading(false);       
        setSuccess(false);
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handlePaperCompletion = () => {
        setIsPaperCompleted(!isPaperCompleted);
    };
    
    return (
        <div className="fixed inset-0 backdrop-blur-sm z-40">
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-secondary rounded-md shadow-xl w-full max-w-3xl">
                    <div className="flex justify-between items-center px-10 py-4 border-b bg-primary/50 border-stroke">
                        <p className="text-xl font-semibold">Start revision</p>
                        <button onClick={resetModal} className="hover:bg-tertiary rounded-full p-2 transition-all cursor-pointer">
                            <FiX size={20}/>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-10 py-4">
                        <div className="flex flex-col mb-4 space-y-2">
                            <h2 className="block mb-2 text-md font-semibold">
                                Have you completed the paper?
                            </h2>

                            <div className="flex gap-2 ml-4">
                                <input type="radio" id="yesOption" name="paperCompletion" value="Yes"
                                        onChange={handlePaperCompletion} className="cursor-pointer" defaultChecked/>
                                <label htmlFor="yesOption" className="cursor-pointer">
                                    Yes — Upload your working
                                </label>
                            </div>

                            <div className="flex gap-2 ml-4">                                    
                                <input type="radio" id="noOption" name="paperCompletion" value="No"
                                        onChange={handlePaperCompletion} className="cursor-pointer"/>
                                <label htmlFor="noOption" className="cursor-pointer">
                                    No — Revise with Scholar&apos;s Grail
                                </label>
                            </div>                                
                        </div>

                        {isPaperCompleted && (
                            <div>
                                <div className="flex ml-9 gap-2 text-main text-sm">
                                    <button type="button" onClick={handleButtonClick} disabled={uploading}
                                            className="w-20 bg-tertiary rounded-md cursor-pointer hover:bg-tertiary/75">
                                        choose file
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleWorkingSelection}
                                        className="hidden" disabled={uploading}/>
                                    {working && (
                                        <p className="truncate"> File name: {working.name}</p>
                                    )}      
                                </div>
                            </div>    
                        )}

                        {uploading && (
                            <p className="my-4 text-center text-main font-medium"> Uploading file... </p>
                        )}

                        {success && (
                            <p className="my-4 text-center text-success font-medium"> File uploaded successfully!</p>
                        )}

                        <br></br>
                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={resetModal} className="px-4 py-2 rounded-md 
                                    bg-tertiary hover:bg-tertiary/75 cursor-pointer" disabled={uploading}>                                   
                                Cancel
                            </button>
                            <button type="submit" className= {
                                `px-4 py-2 rounded-md ${
                                    !working || uploading ? 
                                    "bg-accent cursor-not-allowed" : "bg-accent hover:bg-accent/75 cursor-pointer"                                      
                                }`}
                                disabled={uploading}>
                                Next
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

    export default S3UploadForm2;