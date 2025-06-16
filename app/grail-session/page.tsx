"use client";
import { useEffect, useState } from "react";
import FolderSelector from "../components/FolderSelector"
import Header from "../home/header"

type GeminiResponse = {
  numberOfQuestions: number;
  hints: string[];
};

export default function Page() {
  const [subject, setSubject] = useState<string | null>(null);
  const [subfolder, setSubfolder] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [output, setOutput] = useState<GeminiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const generateText = async () => {
    try {
      setLoading(true);
      setError(null);
      setOutput(null);

      if (!pdfText) {
        setError("No PDF text available to process.");
        setLoading(false);
        return;
      }

      const prompt = `
        You are an assistant that processes educational content. 
        Given the following extracted PDF text, identify all the questions present and generate a helpful hint for each question.

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
        console.error(error);
      }
    } catch(error){
      console.error(error);
      setError("Error occurred while generating content.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-white">
      <Header />
      <h1 className="pt-20 text-gray-200">Grail Session</h1>
      <div>
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

        <button 
          onClick={generateText} 
          className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          {loading ? "Generating..." : "Generate Hints"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        {output && (
          <div className="mt-4 p-4 bg-black rounded">
            <h2 className="font-bold mb-2">Generated Hints:</h2>
            <p>Number of Questions: {output.numberOfQuestions}</p>
            <ul className="list-disc list-inside mt-2">
              {output.hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}