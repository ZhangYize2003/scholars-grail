"use client"
import { useEffect, useState } from "react";
import FolderSelector from "../components/FolderSelector";
import Header from "../home/header";
import UploadWorking from "../components/UploadWorking";

type HintsResponse = {
  numberOfQuestions: number;
  hints: string[];
};

type BoundingBoxResponse = {
  questionText: string[];
  boundingBox: any;
}

type MarkedResponse = {
  numberOfQuestions: number;
  correct: number[];
  wrong: number[];
  tips: {
    [key: number]: string;
  };
};

type S3File = {
  key: string;
  url: string;
};

export default function Page() {
  const [subject, setSubject] = useState<string | null>(null);
  const [subfolder, setSubfolder] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [workingsText, setWorkingsText] = useState<string>("");
  const [output, setOutput] = useState<HintsResponse | null>(null);
  const [marked, setMarked] = useState<MarkedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [marking, setMarking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState<number | null>(null);
  const [selectedTips, setSelectedTips] = useState<number | null>(null);
  const [hardQues, setHardQues] = useState<number[]>([]);
  const [boundingBoxes, setBoundingboxes] = useState<number[]>([]);
  const [parsing, setParsing] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [files, setFiles] = useState<S3File[]>([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [noOfFiles, setNoOfFiles] = useState<number | null>(null);

  const handleFolderSelect = (selectedSubject: string, selectedSubfolder: string) => {
    setSubject(selectedSubject);
    setSubfolder(selectedSubfolder);
  };
  
  const fetchFiles = async () => {
    const uid = localStorage.getItem("uid");
    if (!uid || !subject || !subfolder) return;

    const prefix = `usersData/${uid}/${subject}/${subfolder}/`;
    const res = await fetch(`/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(prefix)}`);
    const data = await res.json();
    console.log(data);
    setFiles(data.files || []);
    setNoOfFiles(data.KeyCount);
    console.log(noOfFiles);
  };

  const fetchPdfText = async () => {
    const uid = localStorage.getItem("uid");
    if (!uid || !subject || !subfolder) return;
    setParsing(true);

    const prefix = `usersData/${uid}/${subject}/${subfolder}/`;
    const url = `/api/read-pdf?uid=${uid}&prefix=${encodeURIComponent(prefix)}`;

    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
    console.log(data.boundingBoxes)
    setBoundingboxes(data.boundingBoxes);
    setPdfText(data.text);
    setParsing(false);
  };

  const orderBoundingBox= async () =>{
    try {
      setLoading(true);
      setError(null);
      setOutput(null);

      if (!pdfText) return;
      console.log(boundingBoxes);

      // Role Prompting
      const prompt = `
      Given the following JSON of text blocks with bounding boxes, group them into questions. 

      For each question:
      1. Combine all related text blocks into a single 'question' array.
      2. Calculate ONE merged bounding box that fully encloses all bounding boxes of that question.

      For each question, return:
      {
        "question": ["full text of the question with options"],
        "boundingBox": {
          "Top": min Top,
          "Left": min Left,
          "Width": (max Right) - (min Left),
          "Height": (max Bottom) - (min Top)
        }
      }

      Bounding Box Info:
      """${JSON.stringify(boundingBoxes)}"""
      `;

      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({ body: prompt })
      });

      const data: BoundingBoxResponse = await response.json();
      console.log(data);
      if(response.ok) {
        setBoundingboxes(data.boundingBox);
      } else {
        setError("Failed to generate hints.");
      }
    } catch (error) {
      console.error(error);
      setError("Error occurred while generating content.");
    }
  }

  const generateHint = async () => {
    try {
      setError(null);
      setOutput(null);

      if (!pdfText) return;

      // Role Prompting
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

      const data: HintsResponse = await response.json();
      console.log(data);
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

  const markWorkings = async () => {
    try {
      setError(null);
      setMarked(null);
      
      // Role Prompting
      const prompt = `
        You are an assistant that processes educational content. 
        Given the following extracted PDF text, and the answers of a student, determine which questions are wrong and which are correct. 
        Additionally, give them tips on where they might have gone wrong. Use "you" to address them directly.

        Return the response strictly in the following JSON format:
        {
          "numberOfQuestions": <number>,
          "correct": [1, 3, 4, 7,...],
          "wrong": [2, 5, 8, ...],
          "tips": ["2":<tip 2>, "5":<tip 5>, "8":<tip 8>...]
        }

        PDF Text with correct answers:
        """${pdfText}"""
        Workings:
        """${workingsText}"""   
      `;

      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({ body: prompt })
      });

      const data: MarkedResponse = await response.json();
      if(response.ok) {
        setMarked(data);
        setHardQues(data.wrong);
        console.log(data);
        setWorkingsText("");
      } else {
        setError("Failed to mark paper.");
      }
    } catch (error) {
      console.error(error);
      setError("Error occurred while generating content.");
    }finally {
      setMarking(false);
    }
  };

  const toggleHardQues = (qNum: number) => {
    setHardQues((prev) => {
      if (prev?.includes(qNum)){
        return prev.filter((num) => num !== qNum);
      }
      else {
        return [...prev, qNum];
      }
    });
  };

  const addHardQues = async () =>{
    console.log(hardQues);
    setAdding(true);
    // Create a JSON metadata for tracking what we addin in
    const uid = localStorage.getItem("uid");
    const url = `usersData/${uid}/${subject}/Challenging Questions/${subfolder}.json`;
    const formData = new FormData();
    formData.append("url", url);
    formData.append("hardQues", JSON.stringify(hardQues));
    console.log(hardQues)
    try {
      const postResponse = await fetch("/api/json-readwrite", {
        method: "POST",
        body: formData,
      })
      if (!postResponse.ok){
        const errorData = await postResponse.json();
        throw new Error(errorData.error || "Failed to upload file");
      }
      const postData = await postResponse.json();
      console.log("File uploaded successfully:", postData);

      const getResponse = await fetch(`/api/json-readwrite?url=${encodeURIComponent(url)}`, {method: "GET"});
      const getData = await getResponse.json();
      console.log(getData);

      
    } catch(error){
      console.error("Error during file operation:", error);
    }
    setAdding(false);
  };

  useEffect(() => {
    if (subject && subfolder) {
      fetchFiles();
      fetchPdfText();
    }
  }, [subject, subfolder]);

  useEffect(() => {
    if (pdfText) {
      orderBoundingBox();
      generateHint();
    }
  }, [pdfText]);

  useEffect(() => {
    if (workingsText) {
      markWorkings();
    }
  }, [workingsText]);

  return (
    <div className="min-h-screen text-white pb-20 px-6">
      <Header />
      <h1 className="pt-20 text-gray-200">Grail Session</h1>
      <FolderSelector onFolderSelect={handleFolderSelect} parsing={parsing} />
      {loading && <p className="text-yellow-400 mt-2">Generating hints...</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {marking && <p className="text-yellow-400 mt-2">Marking...</p>}
      {adding && <p className="text-yellow-400 mt-2">Adding to Challenging Questions repo...</p>}
      {output && (
        <div className="mt-8 flex justify-center gap-8">
          {/* Working Upload Area */}
          <div className="w-1/2 h-120 bg-black rounded p-4 shadow-lg">
            <div>
              <h2 className="font-bold mb-4 text-white text-lg">Upload Your Workings Here</h2>
              <UploadWorking subject={subject!} subfolder={subfolder!} setWorkingsText={setWorkingsText} 
                onUploadComplete={() => {
                  fetchFiles();
                  setMarking(true);
                }}
              />
            </div>
            <div>              
              {marked && (
              <div className="bg-black rounded p-4 shadow-lg">
                <h2 className="font-bold mb-4 text-white text-lg">Add these to {subject}'s Challenging questions Repo.</h2>

                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {Array.from({ length: marked.numberOfQuestions }, (_, i) => {
                    const qNum = i + 1;
                    let isHard = hardQues.includes(qNum);
                    return (
                      <div key={`question-wrapper-${qNum}`}>
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => toggleHardQues(qNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
                              ${isHard ? "bg-yellow-500" 
                              : "bg-gray-500 hover:bg-gray-500/75"}`
                            }
                          >
                            {qNum}
                          </button>
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={()=>addHardQues()}
                  disabled={adding}
                  className={`px-4 py-2 rounded ${
                    adding ? "bg-gray-500 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-900 cursor-pointer"
                  }`}
                >
                {adding ? "Adding..." : "Add"}
                </button>
              </div>
            )}
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
            
            {/* Marked Section */}
            {marked && (
              <div className="bg-black rounded p-4 shadow-lg">
                <h2 className="font-bold mb-4 text-white text-lg">Score: {marked.correct.length}/{marked.numberOfQuestions}</h2>

                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {Array.from({ length: marked.numberOfQuestions }, (_, i) => {
                    const qNum = i + 1;
                    const isCorrect = marked.correct.includes(qNum);
                    const isWrong = marked.wrong.includes(qNum);

                    return (
                      <div key={`question-wrapper-${qNum}`} className="flex flex-col items-center">
                        <button
                          onClick={() => setSelectedTips(selectedTips === qNum ? null : qNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
                            ${isCorrect ? "bg-green-900 hover:bg-green-900/75" 
                              : isWrong ? "bg-red-900 hover:bg-red-900/75" 
                              : "bg-gray-800 hover:bg-gray-700"}`}
                        >
                          {qNum}
                        </button>

                      </div>
                    );
                  })}
                </div>
                <div>
                  {selectedTips !== null && (
                    <div className="mt-2 text-gray-200 text-center">
                      <h3 className="font-semibold mb-1">Tip for Question {selectedTips}:</h3>
                      <p>{marked.tips[selectedTips] ?? "Nice."}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
