import { ChangeEvent, useState } from "react"

export default function fileUploader() {
    const [file, setFile] = useState<File | null>(null);

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
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
        </div>
    );
}