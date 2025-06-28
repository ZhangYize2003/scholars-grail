"use client"
import { useState, useEffect, useRef } from "react";
import { Upload } from 'lucide-react';
import { useRevisionContext } from "../components/RevisionContext";

interface WorkingFileProps {
  onUploadComplete: (file: File) => void;
}

export default function UploadingWorking({ onUploadComplete }: WorkingFileProps) {
    const {subject,  paperFolder, working, setWorking} = useRevisionContext();    
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (working: File) => {
        if (!working) {
            return;
        }
        setUploading(true);
        const uid = localStorage.getItem("uid");
        if (!uid) {
            return;
        }   

        const formData = new FormData();
        formData.append("uid", uid);    
        formData.append("subject", subject);
        formData.append("paperFolder", paperFolder);
        formData.append("working", working);
        
        console.log(uid);
        try {
            const response = await fetch("/api/workings-upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Working upload failed");
            }
            const data = await response.json();
            console.log("Working uploaded successfully:", data);
            window.dispatchEvent(new CustomEvent("foldersUpdated"));
            onUploadComplete(working);
            setUploading(false);
        } catch (error) {
            console.error("Error uploading Working:", error);
            setUploading(false);
        }
    };

    const processFile = (file: File) => {
        if (file.type === "application/pdf") {
            const fileReader = new FileReader();
            fileReader.onload = function() {
                const fileContent = fileReader.result as string;
                const pageMatches = fileContent.match(/\/Type\s*\/Page[^s]/g);
                const pageCount = pageMatches ? pageMatches.length : 0;
                console.log("page count:", pageCount);
                if (pageCount > 10) {
                    alert("You can only upload PDF files with 10 pages or fewer.");
                } else {
                    setWorking(file);
                    handleSubmit(file);
                }
            };
            fileReader.readAsText(file);
        } else {
            setWorking(file);
            handleSubmit(file);
        }
    };

    const handleWorkingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            processFile(selectedFile);
            e.target.value = ""; // reset input
        } else {
            setWorking(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            console.log("File dropped:", file.name);
            processFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
    };

    return (
        <div>
            {!working && (
                <div className="flex items-center justify-center w-full ">
                    <label
                        htmlFor="dropzone-file"
                        data-testid="dropzone"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="flex flex-col items-center justify-center w-full h-98 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="text-blue-600 w-9 h-9"/>
                            <br/>
                            <p className="mb-2 text-xl text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                        </div>
                        <input
                            id="dropzone-file"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleWorkingChange}
                            className="hidden"
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
