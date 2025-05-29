import { ChangeEvent, useState } from "react"
import S3UploadForm from '../components/S3UploadForm';
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";

type UploadStatus = "idle" | "uploading" | "success" | "error";

const region = process.env.NEXT_PUBLIC_AWS_S3_REGION!;
const accessKeyId = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!;

const FileUploader = () => {

    return (
        <div className="flex flex-col items-center space-y-2 mb-4 text-sm">
            <S3UploadForm />
        </div>
    );
    // const [file, setFile] = useState<File | null>(null);
    // const [status, setStatus] = useState<UploadStatus>("idle");

    // function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    //     if (e.target.files) {
    //         setFile(e.target.files[0]);
    //     }
    // }

    // async function handleFileUpload() {
    //     if (!file) {
    //         return;
    //     }
    //     setStatus("uploading");

    //     const formData = new FormData();
    //     formData.append("file", file);
    //     try {

    //     } catch{
    //         setStatus("error");
    //     };
    // }
    // return (
    //     <div className="flex flex-col items-center sapce-y-2 mb-4 text-sm">
    //         <input type="file" onChange={handleFileChange}></input>
    //         { file && (
    //             <div>
    //                 <p>File name: {file.name}</p>
    //                 <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
    //                 <p>type: {file.type}</p>
    //             </div>
    //         )}
    //         {file && status !== "uploading" && (
    //             <button onClick={handleFileUpload}>
    //                 Upload
    //             </button>
    //         )}
    //     </div>
    // );
}

export default FileUploader;