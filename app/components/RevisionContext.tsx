"use client";
import { createContext, useContext, useState } from "react";

interface revisionContextType {
  subject: string;
  setSubject: (subject: string) => void;
  paperFolder: string;
  setPaperFolder: (folder: string) => void;
  paper: File | null;
  setPaper: (paper: File | null) => void;
  working: File | null;
  setWorking: (working: File | null) => void;
};

export const revisionContext = createContext<revisionContextType | null>(null);

export function useRevisionContext() {
  const revision = useContext(revisionContext); 
  // Prevent returning null when misused
  if (!revision) {
    throw new Error("Context was used outside of provider!");
  }
  return revision;
}

export function RevisionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [subject, setSubject] = useState<string>("");
  const [paperFolder, setPaperFolder] = useState<string>("");
  const [paper, setPaper] = useState<File | null>(null);
  const [working, setWorking] = useState<File | null>(null);

  return (
    <revisionContext.Provider value={{subject, setSubject, paperFolder, setPaperFolder, paper, setPaper, working, setWorking}}>                              
        {children}
    </revisionContext.Provider> 
  );
}