import { FiFolder, FiX, FiCopy } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

type S3Folder = {
  prefix: string;
};

interface MoveSelectedFolderProps {
  rootPrefix: string;
  folderPrefix: string;
}

export default function MoveSelectedFolder({ rootPrefix, folderPrefix }: MoveSelectedFolderProps) {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [folders, setFolders] = useState<S3Folder[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Maybe add uid to useContext
  useEffect(() => {
    const userID = localStorage.getItem("uid");
    if (userID) {
      setUid(userID);
    }
  }, []);

  // Switched to use query
  const { data: repo, isLoading, isError} = useQuery({
    queryKey: ["repo", rootPrefix],
    queryFn: async () => {
      const response = await fetch(`/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(rootPrefix)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }
      return (await response.json());
    },
    enabled: !!uid,
  });

  useEffect(() => {
    const fetchAllFolders = async () => {
      setFolders(repo.folders || []);
    };

    if (isCopyModalOpen) {
      fetchAllFolders();
    }
  }, [isCopyModalOpen, rootPrefix]);

  // Handles copying of folder
  const copyFolderMutation = useMutation({
    mutationFn: async ({ sourceKey, newDestination }: { sourceKey: string, newDestination: string }) => {
      const response = await fetch(`/api/s3-copy?sourceKey=${encodeURIComponent(sourceKey)}&destinationKey=${encodeURIComponent(newDestination)}`, {
        method: "PUT",
      });
      if (!response.ok) {
        throw new Error("Failed to copy folder");
      }
    },
  });

  // Handles deletion of og folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (sourceKey: string) => {
      const response = await fetch(`/api/s3-delete?key=${encodeURIComponent(sourceKey)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete folder");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repo", rootPrefix] });
      setFolders(repo.folders || []);
      window.dispatchEvent(new CustomEvent("foldersUpdated"));
      setIsCopyModalOpen(false);
    },
  });

  const handleMoveFolder = async (sourceKey: string, destinationKey: string) => {
  try {
    const folderName = sourceKey.split('/').filter(Boolean).pop();
    const newDestination = `${destinationKey}${folderName}/`;

    await copyFolderMutation.mutateAsync({ sourceKey, newDestination });

    if (sourceKey !== newDestination) {
      await deleteFolderMutation.mutateAsync(sourceKey);
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
        <div>
         <div className="fixed inset-0 backdrop-blur-sm z-40 cursor-default"/>
          <div className="fixed inset-0 flex items-center justify-center z-50 cursor-default">
            <div className="bg-secondary rounded-md ring-2 ring-primary/55 w-full max-w-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Select Destination Folder
                </h3>
                <button
                  onClick={async () => {
                    setIsCopyModalOpen(false);  
                  }}
                  className="hover:bg-tertiary rounded-full p-2 transition-all cursor-pointer"
                >
                  <FiX size={20}/>
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {folders.map((folder) => (
                  <button
                    key={folder.prefix}
                    
                    onClick={async () => {
                      await handleMoveFolder(folderPrefix, folder.prefix);
                    }}
                    className="w-full text-left p-2 hover:bg-tertiary rounded flex items-center gap-2 mb-2 cursor-pointer"
                  >
                    <FiFolder className="w-4 h-4 text-amber-300" />
                    <span>
                      {folder.prefix.replace(rootPrefix, "").split("/")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}