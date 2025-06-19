"use client";
import { useState, useRef, useEffect } from 'react';
import { FiX } from "react-icons/fi";
// import S3UploadForm2 from "./S3UploadForm2";

const S3UploadForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModal2Open, setIsModal2Open] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isFromRepository, setFromRepository] = useState(true);
    const [isToNewFolder, setToNewFolder] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [folderList, setFolderList] = useState<{ prefix: string }[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>("");
    const [subjectFiles, setSubjectFiles] = useState<{ key: string }[]>([]);
    const [newFolderName, setNewFolderName] = useState("");
    const [selectedCurrentFolder, setSelectedCurrentFolder] = useState("");

    const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const folderPrefix = e.target.value;
        setSelectedFolder(folderPrefix);

        const uid = localStorage.getItem("uid");
        if (!uid) return;

        const response = await fetch(`/api/s3-render?uid=${uid}&prefix=${folderPrefix}`);
        if (!response.ok) {
            console.error("Failed to fetch files for subject folder");
            return;
        }

        const data = await response.json();
        setSubjectFiles(data.files || []);
    };

    useEffect(() => {
        const fetchRepository = async () => {
            const uid = localStorage.getItem("uid");
            if (!uid) {
                return;
            }

            const response = await fetch(`/api/s3-render?uid=${uid}`);
            if (!response.ok) {
                console.error("Failed to fetch repository from S3");
                return;
            }

            const data = await response.json();
            setFolderList(data.folders || []);
        };
        fetchRepository();
    }, []);

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
                        setFile(null);
                        e.target.value = "";
                    } else {
                        setFile(selectedFile);
                    }
                };
                fileReader.readAsText(selectedFile);
            } else {
                //if not pdf, can restrict to only pdf files later
                setFile(selectedFile);
            }
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
        
        if (!isFromRepository) {
            if (isToNewFolder && newFolderName.trim() !== "") {
                formData.append("subject", newFolderName.trim());
            } else if (!isToNewFolder) {
                const parts = selectedCurrentFolder.split('/').filter(Boolean);
                const subject = parts[parts.length - 1];
                formData.append("subject", subject);
            }
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
            window.dispatchEvent(new CustomEvent("foldersUpdated"));
            setIsModalOpen(false);
            setIsModal2Open(true);
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploading(false);
        }
    };

    const resetModal = () => {
        setFile(null);
        setUploading(false);
        setSuccess(false)
        setIsModalOpen(false);
        setFromRepository(true);
        setToNewFolder(true);
        setNewFolderName("");    
    }
    
    const handleFileOrigin = () => {
        const status = !isFromRepository;
        setFromRepository(status);
        setFile(null);
        setSelectedFolder("");
        if (status == true) {
            setToNewFolder(true)          
        }
    };

    const handleIsNewFolder = () => {
        setToNewFolder(!isToNewFolder);
        setSelectedCurrentFolder("");
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
                                <div className="ml-9 text-main text-sm">
                                    <div className="flex gap-2 items-center">
                                        <label htmlFor="repositoryFolders">Subject:</label>
                                        <select id="repositoryFolders" name="repositoryFolders" onChange={handleSubjectChange}
                                                className="w-50 bg-tertiary rounded-md drop-shadow-2xl cursor-pointer">
                                            <option value="chooseSubject">— Choose Subject —</option>
                                            {folderList.map((folder) => (
                                                <option key={folder.prefix} value={folder.prefix}>
                                                    {folder.prefix.split('/').filter(Boolean).pop()}
                                                </option>
                                            ))}
                                        </select>

                                        {selectedFolder && (
                                            <div className="flex ml-9 gap-2 text-main text-sm">
                                                <label htmlFor="repositoryFiles">Paper:</label>
                                                <select id="repositoryFiles" name="repositoryFiles" 
                                                        onChange={(e) => setFile({ name: e.target.value } as File)}
                                                        className="w-50 bg-tertiary rounded-md drop-shadow-2xl cursor-pointer">
                                                    <option value="choosePaper">— Choose Paper —</option>                                    
                                                    {subjectFiles.map((file) => (
                                                        <option key={file.key} value={file.key}>
                                                            {file.key.split('/').pop()}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
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

                                        <div className="flex gap-2 ml-4 text-sm">
                                            <input type="radio" id="newFolderOption" name="isNewFolder" value="newFolder"
                                                    onChange={handleIsNewFolder} className="cursor-pointer" defaultChecked/>
                                            <label htmlFor="newFolderOption" className="cursor-pointer">
                                                New subject folder:
                                            </label>
                                            {isToNewFolder && (
                                                <div className="flex">
                                                    <input type="text" id="newFolderName" name="newFolderName"
                                                            onChange={(e) => setNewFolderName(e.target.value)} required
                                                            className="w-50 bg-tertiary pl-1 rounded-md drop-shadow-2xl cursor-text">
                                                    </input>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 ml-4 text-sm">                                    
                                            <input type="radio" id="currentFolderOption" name="isNewFolder" value="currentFolder"
                                                    onChange={handleIsNewFolder} className="cursor-pointer"/>
                                            <label htmlFor="currentFolderOption" className="cursor-pointer">
                                                Current subject folder:
                                            </label>                                            
                                            {!isToNewFolder && (
                                                <div className="flex">
                                                    <select id="currentFolderSelect" name="currentFolderSelect" value={selectedCurrentFolder}
                                                            onChange={(e) => setSelectedCurrentFolder(e.target.value)}
                                                            className="w-50 bg-tertiary rounded-md drop-shadow-2xl cursor-pointer">   
                                                        <option value="chooseSubject">— Choose Subject —</option>
                                                        {folderList.map((folder) => (
                                                            <option key={folder.prefix} value={folder.prefix}>
                                                                {folder.prefix.split('/').filter(Boolean).pop()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>                                
                                    </div>
                                </div>
                            )}
                            
                            {uploading && (
                                <p className="my-4 text-center text-main font-medium"> Uploading file... </p>
                            )}

                            {success && (
                                <p className="my-4 text-center text-success font-medium"> File uploaded successfully!</p>
                            )}

                            <br></br>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={resetModal} className="px-4 py-2 rounded-md 
                                        bg-tertiary hover:bg-tertiary/75 cursor-pointer" disabled={uploading}>                                   
                                    Cancel
                                </button>
                                <button type="submit" className= {
                                    `px-4 py-2 rounded-md ${
                                        !file || uploading || 
                                        (isToNewFolder && newFolderName.trim() === "") || 
                                        (!isToNewFolder && selectedCurrentFolder === "") ? 
                                        "bg-accent cursor-not-allowed" : "bg-accent hover:bg-accent/75 cursor-pointer"                                      
                                    }`}
                                    disabled={!file || uploading ||
                                            (isToNewFolder && newFolderName.trim() === "") || 
                                            (!isToNewFolder && selectedCurrentFolder === "")}>
                                    Next
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