"use client"
import { useState, useEffect, useRef } from "react";

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
                        e.target.value = "";
                    } else {
                        setFile(selectedFile);
                        handleSubmit(selectedFile);
                        e.target.value = "";
                    }
                };
                fileReader.readAsText(selectedFile);
            } else {
                //if not pdf, can restrict to only pdf files later
                setFile(selectedFile);
                handleSubmit(selectedFile);
                e.target.value = "";
            }
        } else {
            setFile(null);
        }

    };

    return (
        <div>
            <button type="button"
                onClick={() => fileInputRef.current?.click()}
                className= {
                `px-4 py-2 rounded-md ${
                    uploading 
                        ? "bg-gray-700 cursor-not-allowed"    
                        : "bg-gray-700 hover:bg-gray-700/75 cursor-pointer"
                }`}
                disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={uploading}/>
        </div>
    )
}
