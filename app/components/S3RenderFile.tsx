"use client";
import { Folders, File, X } from "lucide-react";
import { useEffect, useState } from "react";

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
    console.log("API Response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching document:", error);
    return { folders: [], files: [] };
  }
};

export default function S3RenderFile() {
  const [folders, setFolders] = useState<S3Folder[]>([]);
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  
  const toggleFolder = async (prefix: string) => {
    setLoading(true);
    const data = await getDocument(prefix);
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      data.files?.forEach((file: S3File) => {
        if (!newFiles.some(f => f.key === file.key)) {
          newFiles.push(file);
        }
      });
      return newFiles;
    });
    setLoading(false);
    setOpenFolders(prev => {
        const next = new Set(prev);
        if (next.has(prefix)) {
            next.delete(prefix);
        } else {
            next.add(prefix);
        }
        return next;
    });
  };

  useEffect(() => {
    getDocument().then((data) => {
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 bg-gray-800 rounded shadow max-w-2xl mx-auto">
        No document available
      </div>
    );
  }

  const filteredDocs = files.filter(
    doc =>
      doc.key &&
      (doc.key.endsWith(".pdf") ||
        doc.key.endsWith(".jpg") ||
        doc.key.endsWith(".jpeg") ||
        doc.key.endsWith(".png"))
  );

  return (
    <div className="p-5 mt-5 bg-gray-800 rounded-lg space-y-8 max-w-4xl mx-auto text-gray-700">
      <div>
        <h2 className="text-left text-3xl font-extrabold text-white">Your Papers</h2>
      </div>
      <div className="p-1 bg-gray-100 rounded-lg shadow">
        {folders.length > 0 && (
          <div>
            {folders.map((folder) => (
              <div key={folder.prefix}>
                <div 
                  onClick={() => toggleFolder(folder.prefix)}
                  className="mb-2 flex items-center cursor-pointer hover:bg-gray-200 p-2 rounded-lg"
                >
                  <Folders className="mr-2 text-gray-600" />
                  <span className="font-semibold">
                    {folder.prefix.split("/").filter(Boolean).pop()}
                  </span>
                  <span className="ml-2">{openFolders.has(folder.prefix) ? '▼' : '▶'}</span>
                </div>

                {openFolders.has(folder.prefix) && (
                  <div className="ml-8 border-l-2 border-gray-300 pl-4">
                    {filteredDocs
                      .filter(doc => doc.key.startsWith(folder.prefix))
                      .map(doc => (
                        <div 
                          key={doc.key} 
                          onClick={() => setSelectedFile(doc)}
                          className={`mb-2 flex items-center cursor-pointer hover:bg-gray-200 p-2 rounded-lg ${
                            selectedFile?.key === doc.key ? 'bg-blue-100' : ''
                          }`}
                        >
                          <File className="mr-2 text-gray-600" />
                          <span className="font-semibold">
                            {doc.key.split("/").pop()}
                          </span>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
        <div className="p-1 bg-gray-100 rounded-lg shadow mx-auto">
            {filteredDocs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
                No documents available
            </div>
            ) : (
            <div>
                {filteredDocs.map((doc) => (
                <div 
                    key={doc.key} 
                    onClick={() => setSelectedFile(doc)}
                    className={`mb-2 flex items-center cursor-pointer hover:bg-gray-200 p-2 rounded-lg ${
                    selectedFile?.key === doc.key ? 'bg-blue-100' : ''
                    }`}
                >
                    <File className="mr-2 text-gray-600" />
                    <span className="font-semibold">
                    {doc.key.split("/").pop()}
                    </span>
                </div>
                ))}
                {selectedFile && (
                <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">
                        {selectedFile.key.split("/").pop()}
                    </h3>
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    </div>
                    <div className="relative w-full" style={{ height: '500px' }}>
                    {selectedFile.key.endsWith('.pdf') ? (
                        <iframe
                        src={selectedFile.url}
                        className="w-full h-full rounded border border-gray-200"
                        title={selectedFile.key}
                        />
                    ) : (
                        <img
                        src={selectedFile.url}
                        alt={selectedFile.key}
                        className="w-full h-full object-contain rounded"
                        />
                    )}
                    </div>
                </div>
                )}
            </div>
            )}
        </div>
    </div>
  );
}
