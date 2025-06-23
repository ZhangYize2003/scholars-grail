"use client";
import { useState, useRef, useEffect } from 'react';
import { FiX } from "react-icons/fi";

interface props {
  setOpenModal2: React.Dispatch<React.SetStateAction<boolean>>;
};

const S3UploadForm2 = ({ setOpenModal2 }: props) => {
    const [working, setWorking] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isPaperCompleted, setIsPaperCompleted] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const resetModal = () => {
        setWorking(null);
        setUploading(false);
        setOpenModal2(false);
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handlePaperCompletion = () => {
        setIsPaperCompleted(!isPaperCompleted);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (!file) {
    //         return;
    //     }
    //     setUploading(true);

    //     const uid = localStorage.getItem("uid");
    //     const formData = new FormData();
    //     formData.append("file", file);
    //     if (uid) {
    //         formData.append("uid", uid);
    //     }
        
    //     if (!isFromRepository) {
    //         if (isToNewFolder && newFolderName.trim() !== "") {
    //             formData.append("subject", newFolderName.trim());
    //         } else if (!isToNewFolder) {
    //             const parts = selectedCurrentFolder.split('/').filter(Boolean);
    //             const subject = parts[parts.length - 1];
    //             formData.append("subject", subject);
    //         }
    //     }

    //     try {
    //         const response = await fetch("/api/s3-upload", {
    //             method: "POST",
    //             body: formData,
    //         });
    //         if (!response.ok) {
    //             throw new Error("File upload failed");
    //         }
    //         const data = await response.json();
    //         console.log("File uploaded successfully:", data);
    //         setSuccess(true);
    //         window.dispatchEvent(new CustomEvent("foldersUpdated"));
    //         setOpenModal(false);
    //     } catch (error) {
    //         console.error("Error uploading file:", error);
    //         setUploading(false);
    //     }
    // };
    
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

                    <form className="px-10 py-4">
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
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange}
                                        className="hidden" disabled={uploading}/>
                                    {working && (
                                        <p className="truncate"> File name: {working.name}</p>
                                    )}      
                                </div>
                            </div>    
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