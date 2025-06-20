"use client"
import { useState, useEffect, useRef } from "react";
import { Upload } from 'lucide-react';

interface WorkingFileProps {
  subject:string;
  subfolder:string;
  setWorkingsText: (text: string) => void;
  onUploadComplete: () => void
}

export default function UploadingWorking({ subject, subfolder, setWorkingsText, onUploadComplete }: WorkingFileProps) {
    const [repository, setRepository] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const uid = localStorage.getItem("uid");
        const directory = `${subject}/${subfolder}`;
        setRepository(directory!);
    }, [subject, subfolder]);

    const fetchPdfText = async (url:string) => {
        console.log(url);
        const res = await fetch(`/api/workings-upload?key=${url}`, {
            method: 'GET',
        });
        const data = await res.json();
        setWorkingsText(data.text);
        console.log(data.text);
    };
    
    const handleSubmit = async (selectedFile: File) => {
        console.log(selectedFile);
        if (!selectedFile) {
            return;
        }
        setUploading(true);
        
        const uid = localStorage.getItem("uid");
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("repository", repository);
        formData.append("uid", uid!);
        console.log(uid);
        try {
            const response = await fetch("/api/workings-upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("File upload failed");
            }
            const data = await response.json();
            console.log("File uploaded successfully:", data);
            fetchPdfText(data.url);

            window.dispatchEvent(new CustomEvent("foldersUpdated"));
            onUploadComplete();
            setUploading(false);
        } catch (error) {
            console.error("Error uploading file:", error);
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
                    setFile(file);
                    handleSubmit(file);
                }
            };
            fileReader.readAsText(file);
        } else {
            setFile(file);
            handleSubmit(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            processFile(selectedFile);
            e.target.value = ""; // reset input
        } else {
            setFile(null);
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
        <div className="flex items-center justify-center w-full ">
            <label
                htmlFor="dropzone-file"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center w-full h-98 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
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
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
        </div>
    );
}
