"use client"
import { useEffect, useState} from "react";
import Header from "../home/header";
import UploadWorking from "./UploadWorking";
import RevisionModal from "./RevisionModal";
import { useRevisionContext } from "./RevisionContext";
import { useQuery, useMutation} from "@tanstack/react-query";
import { MoonLoader } from "react-spinners";

type HintsResponse = {
  numberOfQuestions: number;
  hints: string[];
};

type MarkedResponse = {
  numberOfQuestions: number;
  correct: number[];
  wrong: number[];
  tips: {
    [key: number]: string;
  };
};

// Each question has a text, page numbers it is on, and its corresponding bounding box
type BoundingBox = {
  Left: number;
  Top: number;
  Width: number;
  Height: number;
};
type PageBoundingBox = {
  page: number;
  boundingBox: BoundingBox;
};
type QuestionBoundingBox = {
  question: string;
  pages: PageBoundingBox[];
};
type BoundingBoxResponse = QuestionBoundingBox[];

type S3File = {
  key: string;
  url: string;
};
// adding testOutput supports testing after output has been set
export default function GrailSession({ testOutput }: { testOutput?: HintsResponse | null }) {
  const {subject, paperFolder, working} = useRevisionContext();
  const [uid, setUid] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [workingText, setWorkingText] = useState<string>("");
  const [output, setOutput] = useState<HintsResponse | null>(testOutput || null);
  const [marked, setMarked] = useState<MarkedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState<number | null>(null);
  const [selectedTips, setSelectedTips] = useState<number | null>(null);
  const [hardQues, setHardQues] = useState<number[]>([]);
  const [boundingBoxes, setBoundingBoxes] = useState<QuestionBoundingBox[]>([]);
  const [adding, setAdding] = useState<boolean>(false);
  const [files, setFiles] = useState<S3File[]>([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [orderedBoundingBoxes, setOrderedBoundingBoxes] = useState<boolean>(false);
  
  // Handle exit button click -> Refreshes the page
  const handleExit = () => {
    window.location.reload();
  };

  // Gets the uid so we don't have to call it every time
  useEffect(() => {
    const userID = localStorage.getItem("uid");
    if (userID) {
      setUid(userID);
    }
  }, []);

  // Gets PDF text and bounding boxes for each line in the PDF -> Later sent to Gemini to restructure it
  const { data: pdfData, isLoading: parsing} = useQuery({
    queryKey: ["pdfData", subject, paperFolder],
    queryFn: async () => {
      const prefix = `usersData/${uid}/${subject}/${paperFolder}/`;
      const response = await fetch(`/api/read-pdf?uid=${uid}&prefix=${encodeURIComponent(prefix)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch PDF text");
      }
      return (await response.json());
    },
    enabled: uid != null && subject != "" && paperFolder != "",
    // Cashe for 30 min
    gcTime: 30*60*1000,
  });

  useEffect(() => {
    if (pdfData) {
      setBoundingBoxes(pdfData.boundingBoxes);
      setPdfText(pdfData.text);
      console.log("PDF Data:", pdfData);
      console.log("PDF Text:", pdfData.text);
    }
  }, [pdfData]);

  // Gets the list of files in the S3 bucket for the current subject & paperFolder
   const { data: s3Files, isLoading: fetching } = useQuery({
    queryKey: ["s3Files", subject, paperFolder, working],
    queryFn: async () => {
      const prefix = `usersData/${uid}/${subject}/${paperFolder}/`;
      const response = await fetch(`/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(prefix)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch s3Files");
      }
      return (await response.json());
    },
    enabled: uid != null && subject != "" && paperFolder != "",
    // Cashe for 30 min
    gcTime: 30*60*1000,
  });

  useEffect(() => {
    if (s3Files) {
      const allowedExtensions = ['.pdf', '.jpeg', '.jpg', '.png'];
      const filteredFiles = (s3Files.files || []).filter((file: S3File) => {
        const fileExtension = file.key.toLowerCase().substring(file.key.lastIndexOf('.'));
        return allowedExtensions.includes(fileExtension);
      });
      setFiles(filteredFiles);
    }
  }, [s3Files]);

  // Use Gemini to order the bounding boxes into questions -> Handles pages spread across multiple pages
  const { mutate: orderBoundingBoxMutation, isPending: ordering } = useMutation<BoundingBoxResponse, Error, QuestionBoundingBox[]>({
    mutationFn: async (boundingBoxes) => {
        // Role Prompting
        const prompt = `
        Given the following JSON of text blocks with bounding boxes, you are tasked to group them into questions, their corresponding bounding boxes, and return a JSON object. DO NOT RETURN ANYTHING ELSE. ONLY JSON.

        For each question:
        1. Combine all related line blocks into a single 'question' array.
        2. Create bounding boxes for each question such that it covers all the line blocks up till the start of the next question. This is to cover the diagrams drawn under the question.
        3. Since the questions can be on multiple pages, include each page number the question appears, in the "pages" component of the following JSON format.

        Use the following format:
        {
          "question": "...",
          "pages": [
            {
              "page": <page number 1>,
              "boundingBox": {
                "Left": <float>,
                "Top": <float>,
                "Width": <float>,
                "Height": <float>
              }
            },
            {
              "page": <page number 2>,
              "boundingBox": {
                "Left": <float>,
                "Top": <float>,
                "Width": <float>,
                "Height": <float>
              }
            }
          ]
        }

        Example:
        Suppose the following blocks occur in order:

        - { text: "Question 5", page: 1 }
        - { text: "A company wants to implement a solution that can automatically extract information from", page: 1 }
        - { text: "documents like invoices and receipts. Which Google Cloud AI API would be most appropriate for this", page: 2 }
        - { text: "purpose?", page: 2 }
        - { text: "A) Cloud Vision API", page: 2 }
        - ...
        - { text: "Question 6", page: 2 }

        Then, the grouped question should span page 1 and 2, and its bounding boxes should cover all the related blocks on both pages, even though they are split.
        The output should be in the following format:
        {
          "question": "Question 5 A company wants to implement a solution that can automatically extract information from documents like invoices and receipts. Which Google Cloud AI API would be most appropriate for this purpose? A) Cloud Vision API",
          "pages": [
            {
              "page": 1,
              "boundingBox": {
                "Left": 0.1,
                "Top": 0.2,
                "Width": 0.8,
                "Height": 0.1
              }
            },
            {
              "page": 2,
              "boundingBox": {
                "Left": 0.1,
                "Top": 0.3,
                "Width": 0.8,
                "Height": 0.1
              }
            }
          ]
        }

        Bounding Box Info:
        """${JSON.stringify(boundingBoxes)}"""
        `; 
        
        const response = await fetch("/api/generate-ai", {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
          body: JSON.stringify({ body: prompt })
        });
        if (!response.ok) {
            throw new Error("Failed to order bounding boxes");
        }
        return (await response.json());
    },
    // Retry once if failed
    retry: 1,
    retryDelay: 1000,
    onSuccess: (newBoundingBoxes) => {
      setBoundingBoxes(newBoundingBoxes);
      setOrderedBoundingBoxes(true);
    },
    onError: (error) => {
        setError(error.message);
    },
  });

  // Resets errors and output. Orders the question bonuding boxes
  useEffect(() => {
    if (!pdfText) {
        return;
    }
    setError(null);
    setOutput(null);
    orderBoundingBoxMutation(boundingBoxes);
  }, [pdfText]);

  // Generate hints for each question using Gemini
  const { mutate: generateHintsMutation, isPending: hinting} = useMutation<HintsResponse, Error, string>({
    mutationFn: async (pdfText) => {
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

        const response = await fetch("/api/generate-ai", {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
          body: JSON.stringify({ body: prompt })
        });
        if (!response.ok) {
            throw new Error("Failed to order bounding boxes");
        }
        return (await response.json());
    },
    // Retry once if failed
    retry: 1,
    retryDelay: 1000,
    onSuccess: (hints) => {
      setOutput(hints);
    },
    onError: (error) => {
      setError(error.message);
    },
  })

  // Generate hints for each question after bounding boxes are ordered
  useEffect(() => {
    if (pdfText && orderedBoundingBoxes ) {
      generateHintsMutation(pdfText);
    }
  }, [orderedBoundingBoxes]);

  // Sends the student's working to Textract to convert to text for Gemini to read
  const { data: fetchedWorkingText, isLoading: parsingWorking } = useQuery({
    queryKey: ["fetchedWorkingText", working],
    queryFn: async () => {
        const workingURL = `usersData/${uid}/${subject}/${paperFolder}/${working?.name}`
        const response = await fetch(`/api/workings-upload?key=${workingURL}`, {
        method: "GET",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch working");
        }
        const json = await response.json();
        return json.text;
    },
    enabled: uid != null && subject != "" && paperFolder != "" && working != null,
    // Cashe for 30 min
    gcTime: 30*60*1000,
  })

  useEffect (() => {
    if (fetchedWorkingText != null) {
        console.log("Working:", fetchedWorkingText);
        setWorkingText(fetchedWorkingText);
    }
  }, [fetchedWorkingText]);

  // Marking student's working
  const { mutate: markWorkingMutation, isPending: marking} = useMutation<MarkedResponse, Error>({
    mutationFn: async () => {
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
        """${workingText}"""   
        `;

      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({ body: prompt })
      });
        if (!response.ok) {
            throw new Error("Failed to mark working");
        }
        return (await response.json());
    },
    // Retry once if failed
    retry: 1,
    retryDelay: 1000,
    onSuccess: (markedWorking) => {
        setMarked(markedWorking);
        setHardQues(markedWorking.wrong);
        console.log(markedWorking);
    },
    onError: (error) => {
        setError(error.message);
    },
  })

  // Mark student's working once parsed
  useEffect(() => {
    if (workingText) {
        setError(null);
        markWorkingMutation();
    }
  }, [workingText]);

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

  // Compiles challenging qns into a separate pdf
  const addHardQues = async (boundingBoxes: QuestionBoundingBox[]) =>{
    console.log(hardQues);
    setAdding(true);
    // Create a JSON metadata for tracking what we addin in
    if (!uid || !subject) {
      setError("User ID or subject missing");
      setAdding(false);
      return;
    }
    while(orderedBoundingBoxes === false){
      console.log("Waiting for ordered bounding boxes to be set");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    const url = `usersData/${uid}/${subject}/Challenging Questions/${paperFolder}.json`;
    console.log("Complete BoundingBoxes:", boundingBoxes);
    const filteredBoundingBoxes: QuestionBoundingBox[] = [];
    console.log("Filtering BoundingBoxes for hard questions");
    boundingBoxes.forEach((box, index) => {
      const questionNumber = index + 1;
      console.log("Question Number:", questionNumber);
      if (hardQues.includes(questionNumber)) {
        filteredBoundingBoxes.push(box);
      }
    });

    console.log("Filtered BoundingBoxes:", filteredBoundingBoxes);
    const formData = new FormData();
    formData.append("url", url);
    formData.append("hardQues", JSON.stringify(hardQues));
    formData.append("boundingBoxes", JSON.stringify(filteredBoundingBoxes));
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

      const cropResponse = await fetch("/api/crop-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
          uid,
          subject,
          paperFolder,
        }),
      });

      if (!cropResponse.ok) {
        const cropError = await cropResponse.json();
        throw new Error(cropError.error || "Failed to crop PDF");
      }
      const cropData = await cropResponse.json();
      console.log("Crop PDF result:", cropData);
      
    } catch(error){
      console.error("Error during file operation:", error);
    }
    setAdding(false);
  };

  return (
    <div className="min-h-screen text-main pb-20 w-[80%] mx-auto">
      <Header />
      <h1 className="pt-20">Grail Session</h1>
      {!output && (
        <RevisionModal />
      )}
     
      {(fetching || parsing || ordering || hinting) && !parsingWorking &&
      <div className="flex flex-col items-center">
        {hinting ? 
        <p className="text-2xl text-yellow-400 mt-5">Generating hints...</p> :
        <p className="text-2xl text-yellow-400 mt-5">Parsing PDF...</p>
        }
        <MoonLoader className="mt-5" color="#edf2f7" size={30}/>
        <p className="text-xs text-main mt-5">Please be patient. This might take a few minutes.</p>
      </div>}

      {error && <p className="flex flex-col items-center text-error mt-2">{error}</p>}

      {adding && <p className="text-yellow-400 mt-2">Adding to Challenging Questions repo...</p>}
      
      {/* Wait for Bounding Boxes to be ordered before displaying*/}
      {output && orderedBoundingBoxes && (
        <div className="mt-8 flex justify-center gap-8">
          {/* Working Upload Area */}
          <div className="w-1/2 bg-secondary rounded p-4 shadow-lg space-y-6">
          
            {/* Only appears if working is empty */}
            {working == null &&
              <div>
                <h2 className="font-bold mb-4 text-lg">Upload Your Workings Here</h2>
                <UploadWorking/>
              </div>
            }

            {(parsingWorking || marking) && 
            <div className="flex flex-col items-center">
                <p className="text-yellow-400 text-xl mt-2">Marking...</p>
                <MoonLoader className="mt-5" color="#edf2f7" size={30}/>
            </div>
            }

            {/* Appears once the working is marked */}
            <div>              
              {marked && paperFolder !== "Challenging Questions" && (
              <div className="w-full bg-secondary rounded p-4 shadow-lg space-y-6">
                <h2 className="font-bold mb-4 text-lg">Add these to {subject}&apos;s Challenging questions Repo.</h2>

                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {Array.from({ length: marked.numberOfQuestions }, (_, i) => {
                    const qNum = i + 1;
                    const isHard = hardQues.includes(qNum);
                    return (
                      <div key={`question-wrapper-${qNum}`}>
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => toggleHardQues(qNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
                              ${isHard ? "bg-yellow-600" 
                              : "bg-tertiary hover:bg-teriary/75"}`
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
                  onClick={()=>addHardQues(boundingBoxes)}
                  disabled={adding}
                  className={`mt-4 px-4 py-2 rounded w-full ${
                    adding ? "bg-tertiary cursor-not-allowed" : "bg-tertiary hover:bg-tertiary/75 cursor-pointer"
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
            <div className="bg-secondary rounded p-4 shadow-lg w-full">
              {files.length > 0 && (
                <div className="mb-4">
                  <label className="font-bold mb-4 text-lg block">
                    Working on {subject} &rarr; {paperFolder}
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
                              ? "bg-tertiary"
                              : "bg-tertiary hover:bg-tertiary/75"
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
                <div className="mt-4">
                  <iframe
                    src={selectedFileUrl}
                    className="w-full h-120 mt-2 border-2 border-tertiary rounded"
                  ></iframe>
                </div>
              )}
            </div>

            {/* Hints Section */}
            <div className="bg-secondary rounded p-4 shadow-lg">
              <h2 className="font-bold mb-4 text-lg">Generated Hints:</h2>
              <p className="mb-4">Questions: {output.numberOfQuestions}</p>

              {/* Buttons */}
              {output?.hints?.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {output.hints.map((_, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setSelectedHint(selectedHint === index ? null : index)
                      }
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                        selectedHint === index
                          ? "bg-tertiary"
                          : "bg-tertiary hover:bg-tertiary/75"
                      } font-semibold cursor-pointer`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}

              {selectedHint !== null && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2 text-center">
                    Hint for Question {selectedHint + 1}:
                  </h3>
                  <p className="text-center">{output.hints[selectedHint]}</p>
                </div>
              )}
            </div>
            
            {/* Marked Section */}
            {marked && (
              <div className="bg-secondary p-4 shadow-lg">
                <h2 className="font-bold mb-4text-lg">Score: {marked.correct.length}/{marked.numberOfQuestions}</h2>

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
                            ${isCorrect ? "bg-success/75 hover:bg-success/50" 
                              : isWrong ? "bg-error/75 hover:bg-error/50" 
                              : "bg-teriary hover:bg-teriary/75"}`}
                        >
                          {qNum}
                        </button>

                      </div>
                    );
                  })}
                </div>
                <div>
                  {selectedTips !== null && (
                    <div className="mt-2 text-center">
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
      <div className="flex justify-end mt-4">
        {output && (
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-error/75 hover:bg-error/50 rounded text-main cursor-pointer"
          >
            Exit Session
          </button>
        )}
      </div>
    </div>
  );
}