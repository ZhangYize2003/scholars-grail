"use client";
import { useState, useEffect } from "react";

interface FolderSelectorProps {
  onFolderSelect: (subject: string, subfolder: string) => void;
  parsing: boolean;
  refreshkey: number;
}

export default function FolderSelector({ onFolderSelect, parsing, refreshkey }: FolderSelectorProps) {
  const [uid, setUid] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subfolders, setSubfolders] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>("");
  const fetchSubfolders = async () => {
    if (!selectedSubject) {
      setSubfolders([]);
      return;
    }

    try {
      const prefix = `usersData/${uid}/${selectedSubject}/`;
      const res = await fetch(`/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();

      const subfolderList = data.folders.map((f: any) => {
        const parts = f.prefix.split("/").filter(Boolean);
        return parts[parts.length - 1];
      });

      setSubfolders(subfolderList);
    } catch (error) {
      console.error("Error fetching subfolders:", error);
    }
  };
  
  const fetchSubjects = async () => {
    try {
      const res = await fetch(`/api/s3-render?uid=${uid}`);
      const data = await res.json();

      const subjectList = data.folders.map((f: any) => {
        const parts = f.prefix.split("/").filter(Boolean);
        return parts[parts.length - 1];
      });

      setSubjects(subjectList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  useEffect(() => {
    const storedUid = localStorage.getItem("uid");
    setUid(storedUid);
  }, []);

  useEffect(() => {
    if (uid) fetchSubjects();
  }, [uid]);

  useEffect(() => {
    if (selectedSubject) fetchSubfolders();
  }, [selectedSubject, uid]);
  
  useEffect(() => {
    fetchSubfolders();
  }, [refreshkey]);
  
  return (
    <div>
      <div className="flex justify-center mt-8 space-x-8">
        {/* Subject Dropdown */}
        <div>
          <label htmlFor="subject-select" className="block text-sm font-medium text-gray-300 mb-1 text-center">
            Select Subject
          </label>
          <select id="subject-select"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              onFolderSelect(e.target.value, ""); // Reset subfolder on subject change
              setSelectedSubfolder(""); // reset subfolder selection
            }}
            className="w-64 text-white bg-tertiary rounded-md drop-shadow-2xl cursor-pointer px-3 py-2"
          >
            <option value="">Choose a subject</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Subfolder Dropdown */}
        {selectedSubject && (
          <div>
            <label htmlFor="folder-select" className="block text-sm font-medium text-gray-300 mb-1 text-center">
              Select Folder
            </label>
            <select id="folder-select"
              value={selectedSubfolder}
              onChange={(e) => setSelectedSubfolder(e.target.value)}
              className="w-64 text-white bg-tertiary rounded-md drop-shadow-2xl cursor-pointer px-3 py-2"
            >
              <option value="">Choose a folder</option>
              {subfolders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedSubject && selectedSubfolder && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => onFolderSelect(selectedSubject, selectedSubfolder)}
            disabled={parsing}
            className={`px-4 py-2 rounded ${
              parsing ? "bg-gray-500 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-900 cursor-pointer"
            }`}
          >
            {parsing ? "Parsing..." : "Parse"}
          </button>
        </div>
      )}
    </div>
  );
}
