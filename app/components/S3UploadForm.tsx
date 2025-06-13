"use client";
import { useState, useRef } from 'react';
import { FiX } from "react-icons/fi";

const S3UploadForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isFromRepository, setFromRepository] = useState(true);
    const [isToNewFolder, setToNewFolder] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            return;
        }
        setUploading(true);

        const uid = localStorage.getItem("uid");

        const formData = new FormData();
        formData.append("file", file);
        if (uid) {
            formData.append("uid", uid);
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
            setSuccess(true);
            resetModal();
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploading(false);
        }
    };

    const resetModal = () => {
        setFile(null);
        setUploading(false);
        setIsModalOpen(false);
        setFromRepository(true);
    }
    
    const handleFileOrigin = () => {
        setFromRepository(!isFromRepository);
    };

    const handleIsNewFolder = () => {
        setToNewFolder(!isToNewFolder);
    };

    const handleButtonClick = () => {
    fileInputRef.current?.click();
    };

    return(
        <div className="flex flex-col items-center space-y-2 text-main">
            <div className={`${isModalOpen ? 'fixed inset-0 backdrop-blur-sm z-40' : ''}`}/>
            <button onClick={() => setIsModalOpen(true)} 
                    className="flex p-2 mx-2 bg-accent text-xl rounded-md hover:bg-accent/75 transition cursor-pointer">
                start revision
            </button>
            <hr className="border-t border-stroke w-1/2 my-2"></hr>
            
            {success && (
                <p className="text-success font-semibold ">File uploaded successfully!</p>
            )}

            {isModalOpen && (
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
                                    Select the question paper or answer key:
                                </h2>

                                <div className="flex gap-2 ml-4">
                                    <input type="radio" id="repositoryOption" name="FileOrigin" value="Repository"
                                            onChange={handleFileOrigin} className="cursor-pointer" defaultChecked/>
                                    <label htmlFor="repositoryOption" className="cursor-pointer">
                                        Select from repository
                                    </label>
                                </div>

                                <div className="flex gap-2 ml-4">                                    
                                    <input type="radio" id="deviceOption" name="FileOrigin" value="Device"
                                            onChange={handleFileOrigin} className="cursor-pointer"/>
                                    <label htmlFor="deviceOption" className="cursor-pointer">
                                        Upload from device
                                    </label>
                                </div>                                
                            </div>

                            {isFromRepository && (
                                <div className="flex ml-9 gap-2 text-main text-sm">
                                    <label htmlFor="repositoryFiles">File:</label>
                                    <select id="repositoryFiles" name="repositoryFiles"
                                            className="w-20 bg-tertiary rounded-md cursor-pointer">
                                                <option value="Love">Love</option>
                                    </select>
                                </div>
                            )}

                            {!isFromRepository && (
                                <div>
                                    <div className="flex ml-9 gap-2 text-main text-sm">
                                        <button type="button" onClick={handleButtonClick} disabled={uploading}
                                                className="w-20 bg-tertiary rounded-md cursor-pointer hover:bg-tertiary/75">
                                            choose file
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange}
                                            className="hidden" disabled={uploading}/>
                                        {file && (
                                            <p className="truncate"> File name: {file.name}</p>
                                        )}      
                                    </div>
                                    
                                    <br></br>
                                    <div className="flex flex-col mb-4 space-y-2">
                                        <h2 className="block mb-2 text-md font-semibold">
                                            Upload to:
                                        </h2>

                                        <div className="flex gap-2 ml-4">
                                            <input type="radio" id="newFolderOption" name="isNewFolder" value="newFolder"
                                                    onChange={handleIsNewFolder} className="cursor-pointer" defaultChecked/>
                                            <label htmlFor="newFolderOption" className="cursor-pointer">
                                                New folder:
                                            </label>
                                        </div>

                                        <div className="flex gap-2 ml-4">                                    
                                            <input type="radio" id="currentFolderOption" name="isNewFolder" value="currentFolder"
                                                    onChange={handleIsNewFolder} className="cursor-pointer"/>
                                            <label htmlFor="currentFolderOption" className="cursor-pointer">
                                                Current folder:
                                            </label>
                                        </div>                                
                                    </div>
                                </div>
                            )}
                            
                            {uploading && (
                                <div className="mb-4">
                                    <p className="text-blue-700 font-medium"> Uploading file... </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-700 h-2 rounded-full animate-pulse"                               
                                            style={{ width: "30%" }}>                                               
                                        </div>
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
                                        !file || uploading 
                                            ? "bg-accent cursor-not-allowed"    
                                            : "bg-accent hover:bg-accent/75 cursor-pointer"
                                    }`}
                                    disabled={!file || uploading}>
                                    {uploading ? "Uploading..." : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default S3UploadForm;
