"use client";
import { useEffect, useState } from "react";
import FolderSelector from "../components/FolderSelector"
import Header from "../home/header"

export default function Page() {
  const [subject, setSubject] = useState<string | null>(null);
  const [subfolder, setSubfolder] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>("");
  
  useEffect(() => {
    const fetchPdfText = async () => {
      const uid = localStorage.getItem("uid");
      if (!uid || !subject || !subfolder) return;

      const prefix = `usersData/${uid}/${subject}/${subfolder}/`;
      const url = `/api/read-pdf?uid=${uid}&prefix=${encodeURIComponent(prefix)}`;

      const res = await fetch(url);
      const data = await res.json();
      setPdfText(data.text);
    };

    fetchPdfText();
  }, [subject, subfolder]); 

  return (
    <div className="min-h-screen text-white">
      <Header />
      <h1 className="pt-20 text-gray-200">Grail Session</h1>
      <div>
        <FolderSelector 
          onFolderSelect={(selectedSubject: string, selectedSubfolder: string) => {
            console.log("Selected:", selectedSubject, selectedSubfolder);
            setSubject(selectedSubject);
            setSubfolder(selectedSubfolder);
          }} 
        />
      </div>
      <div className="mt-4 p-4 rounded">
        <h2 className="font-bold mb-2">Parsed PDF Text:</h2>
        <pre className="whitespace-pre-wrap">{pdfText}</pre>
      </div>
    </div>
  );
}

