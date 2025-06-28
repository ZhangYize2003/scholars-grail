"use client";
import { useState, useRef, useEffect } from 'react';
import { FiX } from "react-icons/fi";
import { useRevisionContext } from "./RevisionContext";

interface props {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenModal2: React.Dispatch<React.SetStateAction<boolean>>;
};

const S3UploadForm = ({setOpenModal, setOpenModal2}: props) => {
    const {subject, setSubject, paperFolder, setPaperFolder, paper, setPaper} = useRevisionContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFromRepository, setFromRepository] = useState(true);
    const [isToNewSubject, setToNewSubject] = useState(true);
    const [subjectList, setSubjectList] = useState<{ prefix: string }[]>([]);
    const [paperList, setPaperList] = useState<{ prefix: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false); 

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
            setSubjectList(data.folders || []);
        };
        fetchRepository();
    }, []);

    const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const folderPrefix = e.target.value;
        setSubject(folderPrefix);
        console.log("Subject:", subject);

        if (isFromRepository) {
            const uid = localStorage.getItem("uid");
            if (!uid) return;

            const response = await fetch(`/api/s3-render?uid=${uid}&prefix=${folderPrefix}`);
            if (!response.ok) {
                console.error("Failed to fetch files for subject folder");
                return;
            }

            const data = await response.json();
            setPaperList(data.folders || []);
        }
    };

    const handlePaperSelection = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const paperPrefix = e.target.value; // Path is subject/paper folder/paper (paper folder and paper have the same name)
        setPaperFolder(paperPrefix);
        const fileName = paperPrefix.split("/").filter(Boolean).pop();

        const uid = localStorage.getItem("uid");
        if (!uid) return;

        console.log("Paper folder:", paperFolder);

        const response = await fetch(`/api/s3-render?uid=${uid}&prefix=${paperPrefix}`);
        if (!response.ok) {
            console.error("Failed to fetch files for paper");
            return;
        }

        const data = await response.json();
        const paperKey = data.files.find((file: {key: string}) => 
            file.key.endsWith(`/${fileName}.pdf`)
        );
        console.log("data:", data.files);
        console.log("subjectFiles:", paperList);

        if (paperKey) {
            setPaper(paperKey)
            console.log("Paper:", paper);
        }
        else {
            console.log(`Error: cannot locate file ${fileName}.pdf`);
        }
    };

    const handlePaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                        setPaper(null);
                        e.target.value = "";
                    } else {
                        setPaper(selectedFile);
                        console.log("Paper:", paper);                       
                    }
                };
                fileReader.readAsText(selectedFile);
            } else {
                //if not pdf, can restrict to only pdf files later
                setPaper(selectedFile);
            }
        } else {
            setPaper(null);
        }     
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paper) {
            return;
        }
        setUploading(true);

        const uid = localStorage.getItem("uid");
        const formData = new FormData();
        const paperFolderName = paper.name.split(".")[0];
        
        if (uid) {
            formData.append("uid", uid);
            formData.append("paper", paper);
            formData.append("paperFolder", paperFolderName);
        }
        
        if (!isFromRepository) {
            if (isToNewSubject && subject.trim() !== "") {
                formData.append("subject", subject.trim());
            } else if (!isToNewSubject) {
                const parts = subject.split('/').filter(Boolean);
                const subjectName = parts[parts.length - 1];
                formData.append("subject", subjectName);
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
            setPaperFolder(paperFolderName);
            setUploading(false);
            setSuccess(true);
            setFromRepository(true);
            setToNewSubject(true);
            window.dispatchEvent(new CustomEvent("foldersUpdated"));
            
            setTimeout(() => {
                setSuccess(false);
                setOpenModal(false);
                setOpenModal2(true);
            }, 1500);

        } 
        catch (error) {
            console.error("Error uploading file:", error);
            setUploading(false);
        }
    };

    const resetModal = () => {
        setOpenModal(false);
        setSubject("");
        setPaper(null); 
        setFromRepository(true);
        setToNewSubject(true);     
        setUploading(false);
        setSuccess(false);
    }
    
    const handlePaperOrigin = () => {
        const status = !isFromRepository;
        setFromRepository(status);
        setPaper(null);
        setSubject("");
        if (status == true) {
            setToNewSubject(true);          
        }
    };

    const handleIsNewSubject = () => {
        setToNewSubject(!isToNewSubject);
        setSubject("");
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleNext = () => {
        if (isFromRepository) {
            setOpenModal(false);
            setOpenModal2(true);
        }
        else {
            return;
        }
    }

    return(
        <div className="fixed inset-0 backdrop-blur-sm z-40">
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
                                <input type="radio" id="repositoryOption" name="PaperOrigin" value="Repository"
                                        onChange={handlePaperOrigin} className="cursor-pointer" defaultChecked/>
                                <label htmlFor="repositoryOption" className="cursor-pointer">
                                    Select from repository
                                </label>
                            </div>

                            <div className="flex gap-2 ml-4">                                    
                                <input type="radio" id="deviceOption" name="PaperOrigin" value="Device"
                                        onChange={handlePaperOrigin} className="cursor-pointer"/>
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
                                        {subjectList.map((folder) => (
                                            <option key={folder.prefix} value={folder.prefix}>
                                                {folder.prefix.split('/').filter(Boolean).pop()}
                                            </option>
                                        ))}
                                    </select>

                                    {subject && (
                                        <div className="flex ml-9 gap-2 text-main text-sm">
                                            <label htmlFor="repositoryFiles">Paper:</label>
                                            <select id="repositoryFiles" name="repositoryFiles" 
                                                    onChange={handlePaperSelection}
                                                    className="w-50 bg-tertiary rounded-md drop-shadow-2xl cursor-pointer">
                                                <option value="choosePaper">— Choose Paper —</option>                                    
                                                    {paperList.map((folder) => (               
                                                        <option key={folder.prefix} value={folder.prefix}>
                                                            {folder.prefix.split("/").filter(Boolean).pop()}
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
                                    <input type="file" data-testid="file-input" ref={fileInputRef} onChange={handlePaperUpload}
                                        className="hidden" disabled={uploading}/>
                                    {paper && (
                                        <p className="truncate"> File name: {paper.name}</p>
                                    )}      
                                </div>
                                
                                <br></br>
                                <div className="flex flex-col mb-4 space-y-2">
                                    <h2 className="block mb-2 text-md font-semibold">
                                        Upload to:
                                    </h2>

                                    <div className="flex gap-2 ml-4 text-sm">
                                        <input type="radio" id="newFolderOption" name="isNewSubject" value="newSubject"
                                                onChange={handleIsNewSubject} className="cursor-pointer" defaultChecked/>
                                        <label htmlFor="newFolderOption" className="cursor-pointer">
                                            New subject folder:
                                        </label>
                                        {isToNewSubject && (
                                            <div className="flex">
                                                <input type="text" id="newSubjectName" name="newSubjectName" data-testid="new-subject-input"
                                                        onChange={(e) => setSubject(e.target.value)} required
                                                        className="w-50 bg-tertiary pl-1 rounded-md drop-shadow-2xl cursor-text">
                                                </input>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 ml-4 text-sm">                                    
                                        <input type="radio" id="currentSubjectOption" name="isNewSubject" value="currentSubject" data-testid="current-subject-input"
                                                onChange={handleIsNewSubject} className="cursor-pointer"/>
                                        <label htmlFor="currentSubjectOption" className="cursor-pointer">
                                            Current subject folder:
                                        </label>                                            
                                        {!isToNewSubject && (
                                            <div className="flex">
                                                <select id="currentSubjectSelect" name="currentSubjectSelect" data-testid="current-subject-input" value={subject}
                                                        onChange={handleSubjectChange}
                                                        className="w-50 bg-tertiary rounded-md drop-shadow-2xl cursor-pointer">   
                                                    <option value="chooseSubject">— Choose Subject —</option>
                                                    {subjectList.map((folder) => (
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
                            <button type={isFromRepository ? "button" : "submit"} data-testid="next-button" onClick={handleNext} className= {
                                `px-4 py-2 rounded-md ${
                                    !paper || uploading || subject.trim() === "" ? 
                                    "bg-accent cursor-not-allowed" : "bg-accent hover:bg-accent/75 cursor-pointer"                                      
                                }`}
                                disabled={!paper || uploading || subject.trim() === ""}>
                                Next
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default S3UploadForm;