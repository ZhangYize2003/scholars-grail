import { ChangeEvent, useState } from "react"

type UploadStatus = "idle" | "uploading" | "success" | "error";

const FileUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>("idle");

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    }

    async function handleFileUpload() {
        if (!file) {
            return;
        }
        setStatus("uploading");

        const formData = new FormData();
        formData.append("file", file);
        try {

        } catch{
            setStatus("error");
        };
    }
    return (
        <div className="flex flex-col items-center sapce-y-2 mb-4 text-sm">
            <input type="file" onChange={handleFileChange}></input>
            { file && (
                <div>
                    <p>File name: {file.name}</p>
                    <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
                    <p>type: {file.type}</p>
                </div>
            )}
            {file && status !== "uploading" && (
                <button onClick={handleFileUpload}>
                    Upload
                </button>
            )}
        </div>
    );
}

export default FileUploader;