"use client";
import { useState } from 'react';
import { FiX } from "react-icons/fi";

const S3UploadForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [success, setSuccess] = useState(false);

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
            setFile(null);
            setUploading(false);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploading(false);
        }
    };

    const resetModal = () => {
        setFile(null);
        setUploading(false);
        setIsModalOpen(false);
    }

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
                        <div className="flex justify-between items-center p-4 border-b">
                            <p className="text-xl font-semibold">Upload Papers</p>
                            <button onClick={resetModal} className="hover:bg-tertiary rounded-full p-2 transition-all cursor-pointer">
                                <FiX size={20}/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-4">
                            <div className="mb-4">
                                <label className="block mb-2">
                                    Select a file to upload:
                                </label>
                                <input type="file" onChange={handleFileChange}
                                    className="w-full p-2 border rounded" disabled={uploading}/>
                            </div>
                            
                            {file && (
                                <div className="mb-4 p-3 bg-gray-500 rounded border">
                                    <p className="truncate"> Name: {file.name}</p>
                                    <p> Size: {(file.size / 1024).toFixed(2)} KB</p>
                                    <p> Type: {file.type || "Unknown"}</p>
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
                            
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={resetModal} className="px-4 py-2 rounded-md 
                                        bg-tertiary hover:bg-tertiary/75 cursor-pointer" disabled={uploading}>                                   
                                    Cancel
                                </button>
                                <button type="submit" className= {
                                    `px-4 py-2 rounded-md ${
                                        !file || uploading 
                                            ? "bg-gray-500 cursor-not-allowed" 
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
