"use client";
import { useState } from 'react';

const UploadForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

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
        formData.append('file', file);
        if (uid) {
            formData.append('uid', uid);
        }
        try {
            const response = await fetch('/api/s3-upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error('File upload failed');
            }
            const data = await response.json();
            console.log('File uploaded successfully:', data);
            setFile(null);
            setUploading(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploading(false);
        }
    };

    return(
        <>
            <h1> Upload Files </h1>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit" disabled={!file || uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                </button>
            </form>
        </>
    )
}

export default UploadForm;
