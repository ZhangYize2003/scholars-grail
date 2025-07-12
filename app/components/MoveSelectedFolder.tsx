import { FiFolder, FiX, FiCopy } from "react-icons/fi";
import { useState, useEffect } from "react";

type S3Folder = {
  prefix: string;
};

interface MoveSelectedFolderProps {
  rootPrefix: string;
  folderPrefix: string;
}

const getDocument = async (prefix?: string) => {
  try {
    const uid = localStorage.getItem("uid");
    const baseUrl = `/api/s3-render?uid=${uid}`;
    const url = prefix && prefix !== `usersData/${uid}/`
      ? `${baseUrl}&prefix=${encodeURIComponent(prefix)}`
      : baseUrl;
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

export default function MoveSelectedFolder({ rootPrefix, folderPrefix }: MoveSelectedFolderProps) {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [allFolders, setAllFolders] = useState<S3Folder[]>([]);
  
  useEffect(() => {
    const fetchAllFolders = async () => {
      const data = await getDocument(rootPrefix);
      setAllFolders(data.folders || []);
    };

    if (isCopyModalOpen) {
      fetchAllFolders();
    }
  }, [isCopyModalOpen, rootPrefix]);
  
  const handleMoveFolder = async (sourceKey: string, destinationKey: string) => {
    try {
      const folderName = sourceKey.split('/').filter(Boolean).pop();
      const newDestination = `${destinationKey}${folderName}/`;
      
      const copyResponse = await fetch(
        `/api/s3-copy?sourceKey=${encodeURIComponent(sourceKey)}&destinationKey=${encodeURIComponent(newDestination)}`,
        { method: "PUT" }
      );
      
      if (!copyResponse.ok) {
        const errorData = await copyResponse.json();
        throw new Error(errorData.error || 'Failed to copy folder');
      }

      if (sourceKey !== newDestination) {
        const deleteResponse = await fetch(
          `/api/s3-delete?key=${encodeURIComponent(sourceKey)}`,
          { method: "DELETE" }
        );

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete original folder');
        }

        await deleteResponse.json();
        await new Promise(resolve => setTimeout(resolve, 2000));

        const data = await getDocument(rootPrefix);
        setAllFolders(data.folders || []);
        window.dispatchEvent(new CustomEvent("foldersUpdated"));
        setIsCopyModalOpen(false);
      }

    } catch (error) {
      console.error("Error moving folder:", error);
    }
  };

  return (
    <div>
      <button
        className="flex items-center text-accent hover:text-accent/75 cursor-pointer"
        title="Copy folder"
        onClick={(e) => {
          e.stopPropagation();
          setIsCopyModalOpen(true);
        }}>
      <FiCopy className="w-5 h-5"/>
      </button>

      {isCopyModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 text-main">
          <div className="bg-tertiary p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Select Destination Folder
              </h3>
              <button
                onClick={async () => {
                  setIsCopyModalOpen(false);
                }}
                className="hover:bg-tertiary rounded-full p-2 transition-all"
              >
                <FiX size={20}/>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {allFolders.map((folder) => (
                <button
                  key={folder.prefix}
                  
                  onClick={async () => {
                    await handleMoveFolder(folderPrefix, folder.prefix);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center gap-2 mb-2"
                >
                  <FiFolder className="w-4 h-4 text-amber-300" />
                  <span className="text-gray-200">
                    {folder.prefix.replace(rootPrefix, "").split("/")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}