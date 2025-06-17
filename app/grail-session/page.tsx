"use client"
import { useEffect, useState } from "react";
import FolderSelector from "../components/FolderSelector";
import Header from "../home/header";

type GeminiResponse = {
  numberOfQuestions: number;
  hints: string[];
};

type S3File = {
  key: string;
  url: string;
};

export default function Page() {
  const [subject, setSubject] = useState<string | null>(null);
  const [subfolder, setSubfolder] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [output, setOutput] = useState<GeminiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState<number | null>(null);
  const [parsing, setParsing] = useState<boolean>(false);
  const [files, setFiles] = useState<S3File[]>([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  const handleFolderSelect = (selectedSubject: string, selectedSubfolder: string) => {
    setSubject(selectedSubject);
    setSubfolder(selectedSubfolder);
  };

  // Fetch file list from S3 for preview
  useEffect(() => {
    const fetchFiles = async () => {
      const uid = localStorage.getItem("uid");
      if (!uid || !subject || !subfolder) return;

      const prefix = `usersData/${uid}/${subject}/${subfolder}/`;
      const res = await fetch(`/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      setFiles(data.files || []);
    };

    fetchFiles();
  }, [subject, subfolder]);

  useEffect(() => {
    const fetchPdfText = async () => {
      const uid = localStorage.getItem("uid");
      if (!uid || !subject || !subfolder) return;
      setParsing(true);

      const prefix = `usersData/${uid}/${subject}/${subfolder}/`;
      const url = `/api/read-pdf?uid=${uid}&prefix=${encodeURIComponent(prefix)}`;

      const res = await fetch(url);
      const data = await res.json();
      setPdfText(data.text);
      setParsing(false);
    };

    fetchPdfText();
  }, [subject, subfolder]);

  useEffect(() => {
    const generateText = async () => {
      try {
        setLoading(true);
        setError(null);
        setOutput(null);

        if (!pdfText) return;

        const prompt = `
          You are an assistant that processes educational content. 
          Given the following extracted PDF text, identify all the questions present and generate a short but helpful hint for each question.

          Return the response strictly in the following JSON format:
          {
            "numberOfQuestions": <number>,
            "hints": ["hint 1", "hint 2", ...]
          }

          PDF Text:
          """${pdfText}"""      
        `;

        const response = await fetch('/api/generate-ai', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({ body: prompt })
        });

        const data: GeminiResponse = await response.json();
        if(response.ok) {
          setOutput(data);
        } else {
          setError("Failed to generate hints.");
        }
      } catch (error) {
        console.error(error);
        setError("Error occurred while generating content.");
      } finally {
        setLoading(false);
      }
    };

    if (pdfText) {
      generateText();
    }
  }, [pdfText]);

  return (
    <div className="min-h-screen text-white pb-20 px-6">
      <Header />
      <h1 className="pt-20 text-gray-200">Grail Session</h1>
      <FolderSelector onFolderSelect={handleFolderSelect} parsing={parsing} />

      {loading && <p className="text-yellow-400 mt-2">Generating hints...</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {output && (
        <div className="mt-8 flex justify-center gap-8">
          {/* Working Upload Area */}
          <div className="w-1/2 h-120 bg-black rounded p-4 shadow-lg">
            <h2 className="font-bold mb-4 text-white text-lg">Upload Your Workings Here</h2>
            <div className="w-full h-95 border-2 border-dashed border-white flex items-center justify-center rounded">
              <p className="text-gray-300 text-center">Drop your working files here or click to upload</p>
            </div>
          </div>

          <div className="w-1/2 flex flex-col gap-6">
            {/* File Preview */}
            <div className="bg-black rounded p-4 shadow-lg w-full">
              {files.length > 0 && (
                <div className="mb-4">
                  <label className="font-bold mb-4 text-white text-lg block">
                    Working on {subject} &rarr; {subfolder}
                  </label>
                  <div className="flex flex-col gap-2 mt-4">
                    {files.map((file) => {
                      const fileName = file.key.split("/").pop()?.replace(/^\d+-/, "");
                      return (
                        <button
                          key={file.key}
                          onClick={() => setSelectedFileUrl(selectedFileUrl === file.url ? null : file.url)}
                          className={`text-left w-full px-3 py-2 rounded cursor-pointer ${
                            selectedFileUrl === file.url
                              ? "bg-gray-500 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {fileName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedFileUrl && (
                <div className="mt-4 text-gray-300">
                  <iframe
                    src={selectedFileUrl}
                    className="w-full h-120 mt-2 border-2 border-gray-500 rounded"
                  ></iframe>
                </div>
              )}
            </div>

            {/* Hints Section */}
            <div className="bg-black rounded p-4 shadow-lg">
              <h2 className="font-bold mb-4 text-white text-lg">Generated Hints:</h2>
              <p className="text-gray-300 mb-4">Questions: {output.numberOfQuestions}</p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {output.hints.map((_, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setSelectedHint(selectedHint === index ? null : index)
                    }
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                      selectedHint === index
                        ? "bg-gray-500"
                        : "bg-gray-800 hover:bg-gray-900"
                    } text-white font-semibold cursor-pointer`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {selectedHint !== null && (
                <div className="mt-6 text-gray-200">
                  <h3 className="font-semibold mb-2 text-center">
                    Hint for Question {selectedHint + 1}:
                  </h3>
                  <p className="text-center">{output.hints[selectedHint]}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      )}
    </div>
  );
}
