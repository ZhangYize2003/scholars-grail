"use client";
import { Folders, Trash2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import CopySelectedFolder from "./MoveSelectedFolder";

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

let layer = 0;

const getDocument = async (prefix?: string) => {
  try {
    const uid = localStorage.getItem("uid");
    const url = `/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(prefix!)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch document");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching document:", error);
    return { folders: [], files: [] };
  }
};

// for "back" button
function getParentPrefix(prefix: string, rootPrefix: string) {
  layer=0;
  if (!prefix || prefix === rootPrefix) return "";
  const parts = prefix.split("/").filter(Boolean);
  if (parts.length <= 1) return rootPrefix;
  return parts.slice(0, -1).join("/") + "/";
}

export default function S3RenderFile() {
  const [uid, setUid] = useState<string | null>(null);
  
  useEffect(() => {
    setUid(localStorage.getItem("uid"));
  }, []);
  const rootPrefix = uid ? `usersData/${uid}/` : "";

  useEffect(() => {
    if (uid) {
      setCurrentPrefix(`usersData/${uid}/`);
    }
  }, [uid]);

  const [folders, setFolders] = useState<S3Folder[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState<string>(rootPrefix);
  useEffect(() => {
    if (!uid) {
      return;
    }

    const handleFoldersUpdated = () => {
      getDocument(currentPrefix).then((data) => {
        setFolders(data.folders || []);
      });
    };
    // refresh page when change made -> move/delete functions
    window.addEventListener("foldersUpdated", handleFoldersUpdated);
    handleFoldersUpdated();
    return () => {
      window.removeEventListener("foldersUpdated", handleFoldersUpdated);
    };
  }, [uid, currentPrefix]);

  const handleDeleteFolder = async (key: string) => {
    await fetch(`/api/s3-delete?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    setFolders((prev) => prev.filter((f) => f.prefix !== key));
  };

  const subFolders = folders.filter((f) => {
    if (!f.prefix.startsWith(currentPrefix) || f.prefix === currentPrefix) return false;
    const rest = f.prefix.slice(currentPrefix.length);
    return rest.split("/").filter(Boolean).length === 1;
  });
  console.log("Subfolders:", subFolders);

  return (
    <div className="bg-neutral-800 border-r border-gray-800 p-3 overflow-y-auto w-200 h-[500px] text-gray-100 text-xl rounded-lg shadow mx-auto">
      <div className="flex items-center mb-2">
        {currentPrefix !== rootPrefix && (
          <button
            className="mr-2 text-gray-300 hover:text-white"
            onClick={() => {
              setCurrentPrefix(getParentPrefix(currentPrefix, rootPrefix));
              layer = 0;
            }}
            title="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <span className="font-bold text-gray-200">
          {layer === 0 ? 
            "Repository" : currentPrefix.replace(rootPrefix, "").split("/")
          }
        </span>
      </div>
      {subFolders.length === 0 ? (
        <div className="text-gray-500 py-8 text-center">No Papers Here</div>
      ) : (
        <ul className="pl-2">
          {subFolders.map((folder) => (
            <li key={folder.prefix} className="flex items-center justify-between">
              <div
                className="flex items-center flex-grow cursor-pointer hover:bg-neutral-900 rounded px-2 py-0.5"
                onClick={() => {
                  if (layer === 0) {
                    setCurrentPrefix(folder.prefix);
                    layer = 1;
                  }
                }}
              >
              <Folders className="w-4 h-4 mr-1 text-yellow-700" />
              <span className="text-gray-100 text-left">
                {folder.prefix.replace(currentPrefix, "").split("/")[0]}
              </span>
              </div>
                {layer === 1 && (
                  <div className="flex items-center gap-2">
                    <CopySelectedFolder
                      rootPrefix={rootPrefix}
                      folderPrefix={folder.prefix}
                    />
                  </div>
                )}
                <button
                  className="text-red-400 hover:text-red-600 flex items-center gap-2 cursor-pointer"
                  title="Delete folder"
                  onClick={() => {
                    console.log(folder.prefix)
                    handleDeleteFolder(folder.prefix);
                  }}
                >
                <Trash2 className="w-5 h-5" />
                </button>
            </li>
          ))}
        </ul>
      )}    
    </div>
  );
}