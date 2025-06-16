"use client";
import { useState, useEffect } from "react";

interface FolderSelectorProps {
  onFolderSelect: (subject: string, subfolder: string) => void;
}

export default function FolderSelector({ onFolderSelect }: FolderSelectorProps) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subfolders, setSubfolders] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const uid = localStorage.getItem("uid");

  useEffect(() => {
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

    if (uid) fetchSubjects();
  }, [uid]);

  useEffect(() => {
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

    if (selectedSubject) fetchSubfolders();
  }, [selectedSubject, uid]);

  return (
    <div className="min-h-screen">
      <div className="flex justify-center mt-8 space-x-8">
        {/* Subject Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 text-center">
            Select Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              onFolderSelect(e.target.value, "");
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
            <label className="block text-sm font-medium text-gray-300 mb-1 text-center">
              Select Folder
            </label>
            <select
              onChange={(e) => onFolderSelect(selectedSubject, e.target.value)}
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
    </div>
  );
}
