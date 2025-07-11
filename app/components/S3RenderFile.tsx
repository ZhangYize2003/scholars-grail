"use client";
import { FiFolder, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { useEffect, useState } from "react";
import CopySelectedFolder from "./MoveSelectedFolder";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

// Not used?
type S3File = {
  key: string;
  lastModified?: string;
  size?: number;
  url: string;
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
  });

  // UPdates the folders data when new repo data is fetched
  useEffect(() => {
    if (repo?.folders) {
      setFolders(repo.folders);
      console.log("Folders: ", folders);
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
      <div className="bg-neutral-800 border-r border-gray-800 p-3 overflow-y-auto w-200 h-[500px] text-gray-100 text-xl rounded-lg shadow mx-auto">
        <div className="text-gray-500 py-8 text-center">
          Loading...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-neutral-800 border-r border-gray-800 p-3 overflow-y-auto w-200 h-[500px] text-gray-100 text-xl rounded-lg shadow mx-auto">
        <div className="text-error py-8 text-center">
          Error: Failed to load repository. Please refresh and try again.
        </div>      
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 border-r border-gray-800 p-3 overflow-y-auto w-200 h-[500px] text-gray-100 text-xl rounded-lg shadow mx-auto">
      <div className="flex items-center mb-2">
        {currentPrefix !== rootPrefix && (
          <button
            className="mr-2 text-gray-300 hover:text-white"
            onClick={() => {handleBack()}}
            title="Back">
            <FiArrowLeft className="w-6 h-6" />
          </button>
        )}
        <span className="font-bold text-gray-200">
          {currentPrefix == rootPrefix ? "" : currentPrefix.split("/").filter(Boolean).pop()}
        </span>
      </div>
      {folders.length === 0 ? (
        <div className="text-gray-500 py-8 text-center">No Papers Here</div>
      ) : (
        <ul className="pl-2">
          {folders.map((folder) => (
            <li key={folder.prefix} className="flex items-center justify-between">
              <div
                className="flex items-center flex-grow cursor-pointer hover:bg-neutral-900 rounded px-2 py-0.5"
                onClick={() => {handleForward(folder.prefix)}}>
              <FiFolder className="w-4 h-4 mr-1 text-main" />
              <span className="text-gray-100 text-left">
                {folder.prefix.split("/").filter(Boolean).pop()}
              </span>
              </div>
                {currentPrefix !== rootPrefix && (
                  <div className="flex items-center gap-2">
                    <CopySelectedFolder
                      rootPrefix={rootPrefix}
                      folderPrefix={folder.prefix}/>
                  </div>
                )}
                <button
                  className="text-error hover:text-red-600 flex items-center gap-2 cursor-pointer"
                  title="Delete folder"
                  onClick={() => {deleteFolderMutation.mutate(folder.prefix)}}>
                <FiTrash2 className="w-5 h-5" />
                </button>
            </li>
          ))}
        </ul>
      )}    
    </div>
  );
}
