"use client";
import { FiFolder, FiFile, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { useEffect, useState } from "react";
import CopySelectedFolder from "./MoveSelectedFolder";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

// Not used?
type S3File = {
  key: string;
  lastModified?: string;
  size?: number;
};

type S3Folder = {
  prefix: string;
  files: S3File[];
};

export default function S3RenderFile() {
  const queryClient = useQueryClient();
  const [uid, setUid] = useState<string | null>(null);
  const [rootPrefix, setRootPrefix] = useState("");
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [folders, setFolders] = useState<S3Folder[]>([]);
  const [files, setFiles] = useState<S3File[]>([]);

  useEffect(() => {
    const userID = localStorage.getItem("uid");
    if (userID) {
      setUid(userID);
    }
  }, []);

  useEffect(() => {
    if (!uid) {
      return;
    }
    const initialPrefix = `usersData/${uid}/`;
    setRootPrefix(initialPrefix);
    setCurrentPrefix(initialPrefix);
  }, [uid]);

  // Change to useQuery instead to make life easier
  const { data: repo, isLoading, isError} = useQuery({
    queryKey: ["repo", currentPrefix],
    queryFn: async () => {
      const response = await fetch(`/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(currentPrefix)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }
      return (await response.json());
    },
    enabled: !!uid && currentPrefix !== "",
    // Cashe for 15 min
    gcTime: 15*60*1000,
  });

  // UPdates the folders data when new repo data is fetched
  useEffect(() => {
    console.log("Repository:", repo);
    if (repo?.folders) {
      setFolders(repo.folders);
      console.log("Folders:", repo.folders);
    }
    if (repo?.files) {
      setFiles(repo.files);
      console.log("Files:", repo.files);
    }
  }, [repo]);

  // Handles deletion of folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/s3-delete?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete folder");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repo", currentPrefix] });
    },
  });

  // When user clicks into a folder
  const handleForward = (prefix: string) => {
    console.log("Current prefix: ", currentPrefix);
    setCurrentPrefix(prefix);
  }

  // When user clicks back button
  const handleBack = () => {
    const parts = currentPrefix.split("/").filter(Boolean);
    const prevPrefix = parts.slice(0, -1).join("/") + "/";
    console.log("Previous prefix: ", prevPrefix);
    setCurrentPrefix(prevPrefix);
  }

  if (isLoading) {
    return (
      <div className="bg-secondary border border-primary p-3 overflow-y-auto w-4xl h-[calc(100vh-200px)] text-main/75 text-xl rounded-lg shadow mx-auto">
        <div className="py-8 text-center">
          Loading...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-secondary border border-primary p-3 overflow-y-auto w-4xl h-[calc(100vh-200px)] text-error/75 text-xl rounded-lg shadow mx-auto">
        <div className="py-8 text-center">
          Error: Failed to load repository. Please refresh and try again.
        </div>      
      </div>
    );
  }

  return (
    <div className="bg-secondary border border-primary py-3 px-3 overflow-y-auto w-4xl h-[calc(100vh-200px)] text-main text-base rounded-lg shadow mx-auto">
      <div className="flex items-center px-3 mb-3">
        {currentPrefix !== rootPrefix && (
          <button
            className="hover:text-main/75 cursor-pointer mr-2"
            onClick={() => {handleBack()}}
            title="Back">
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}
        <span className="font-bold">
          {currentPrefix == rootPrefix ? "Subjects" : currentPrefix.split("/").filter(Boolean).pop()}
        </span>
      </div>
      {folders.length == 0 && files.length == 0 ? (
        <div>
          <span className="flex items-center justify-between px-3">
            <div>Name</div>
            <div className="pl-53">| Date added</div>
            <div className="pr-35">| Size</div> 
          </span>
          <div className="py-8 text-center text-main/75 text-xl">No Papers Here</div>
        </div>
      ) : (
        <div>
          <span className="flex items-center justify-between px-3">
            <div>Name</div>
            <div className="pl-54">| Date added</div>
            <div className="pr-35">| Size</div> 
          </span>

          {/* Listing all the folders */}
          <ul>
            {folders.map((folder) => {
              const folderName = folder.prefix.split("/").filter(Boolean).pop()!;
              const displayFolderName = folderName.length > 40 ? folderName.slice(0, 40) + "…" : folderName; // I think max is 50 char
              return(
              <li key={folder.prefix} className="grid grid-cols-[1fr_250px_120px_50px] items-center cursor-pointer 
                                                  hover:bg-tertiary border-b-2 border-primary/50 px-3 py-1"
                  onClick={() => {handleForward(folder.prefix)}}>
                
                <div className="flex items-center my-1">
                  <FiFolder className="w-5 h-5 mr-3 text-amber-300" />
                  <span className="text-left">
                    {displayFolderName}
                  </span>
                </div>

                <span className="">-</span>
                <span className="">-</span>

                <div className="flex items-center gap-2 cursor-pointer">
                  {currentPrefix !== rootPrefix && (
                    <div onClick={(e) => {e.stopPropagation();}}>
                      <CopySelectedFolder
                        rootPrefix={rootPrefix}
                        folderPrefix={folder.prefix}/>
                    </div>
                  )}

                  <button
                    className="text-error hover:text-error/75 cursor-pointer"
                    title="Delete folder"
                    onClick={(e) => {
                      e.stopPropagation(); // Need this to prevent cd into the folder
                      deleteFolderMutation.mutate(folder.prefix)}}>
                  <FiTrash2 className="w-5 h-5"/>
                  </button>

                </div>           
              </li>
            )})}
          </ul>

          {/* Listing all the files */}
          <ul>
            {files.map((file) => {
              const fileName = file.key.split("/").filter(Boolean).pop()!;
              const displayFileName = fileName.length > 40 ? fileName.slice(0, 40) + "…" : fileName; // I think max is 50 char
              // Date follow SG convention
              const fileDate = new Date(file.lastModified!).toLocaleDateString("en-SG", {year: "numeric", month: "2-digit", day: "2-digit"});
              // Convert to KB should be enough
              const fileSize = (file.size!/1024).toFixed(1);
              return(
              <li key={file.key} className="grid grid-cols-[1fr_250px_120px_50px] items-center cursor-pointer 
                                                  hover:bg-tertiary border-b-2 border-primary/50 px-3 py-1">

                <div className="flex items-center my-1">
                  <FiFile className="w-5 h-5 mr-3" /> 
                  <span className="text-left">
                    {displayFileName}
                  </span>
                </div>

                <span className="">{fileDate}</span>
                <span className="">{fileSize}KB</span>
           
              </li>
            )})}
          </ul>
        </div>
      )}    
    </div>
  );
}
