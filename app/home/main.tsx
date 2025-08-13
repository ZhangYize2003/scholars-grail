import { FiClock } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type S3File = {
  key: string;
  lastModified?: string;
  size?: number;
  url?: string;
};

const Main = () => {
  const [uid, setUid] = useState<string | null>(null);
  const [rootPrefix, setRootPrefix] = useState("");

  // Get the uid
  useEffect(() => {
    const userID = localStorage.getItem("uid");
    if (userID) {
      setUid(userID);
    }
  }, []);

  // Set the root prefix for S3 bucket
  useEffect(() => {
    if (!uid) {
      return;
    }
    const initialPrefix = `usersData/${uid}/`;
    setRootPrefix(initialPrefix);
  }, [uid]);

  const { data: repoFiles, isLoading, isError} = useQuery({
    queryKey: ["repoFiles", rootPrefix],
    queryFn: async () => {
      // If there are folders, call the function recursively until all the files are added
      async function fetchAllFiles(prefix: string): Promise<S3File[]> {
        const response = await fetch(
          `/api/s3-render?uid=${uid}&prefix=${encodeURIComponent(prefix)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const repoData = await response.json();

        let files: S3File[] = repoData.files || [];
        if (repoData.folders && repoData.folders.length > 0) {
          for (const folder of repoData.folders) {
            const allFiles = await fetchAllFiles(folder.prefix);
            files = files.concat(allFiles);
          }
        }
        return files;
      }
      return await fetchAllFiles(`${rootPrefix}`);
    },
    enabled: !!uid && rootPrefix != "",
    // Cashe for 30 min
    gcTime: 30*60*1000,
  });

  // Sorts the files by the latest modified date
  let latestFiles: S3File[] = [];
  if (repoFiles && repoFiles.length > 0) {
    latestFiles = repoFiles.filter((file) => !file.key.endsWith(".json")) // Prevents challenging questions json file from showing
      .toSorted((a, b) => {
      const dateA = a.lastModified ? new Date(a.lastModified) : new Date(0);
      const dateB = b.lastModified ? new Date(b.lastModified) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 5);
  }

  return (
    <main className="flex flex-col items-center my-5 space-y-12 text-main text-sm">
        <div className="flex flex-col gap-2">

          <div className="flex flex-col items-center">
            <p className="text-xl text-center text-main/50">
              Scholar&apos;s Grail is a AI-assisted platform designed to improve your revision experience.
              <br/>
              Through targeted hinting, grading and sorting of mistakes, the platform makes revision
              <br/>
              more efficient and effective.
              <br/>
              <br/>
              To begin, press the &quot;start revision&quot; button and follow the steps as instructed.
            </p>
          </div>

          <div className="flex items-start gap-1 mt-5">
            <FiClock className="w-3.5 h-3.5 my-0.5"/> 
            <h2> Recently Added </h2>
          </div>
          <div className="bg-primary rounded-md p-2 w-[50vw] min-h-28 flex">
            {/* All the loading and error handling displayed */}
            {(isLoading || isError || (!isLoading && latestFiles.length == 0)) &&
              <div className="flex items-center justify-center w-full">
                {isLoading && <p className="text-main/50 ">Loading...</p>}
                {isError && <p className="text-error">Error loading files</p>}
                {!isLoading && latestFiles.length == 0 && (<p className="text-main/50">Repository is empty</p>)}
              </div>
            }

            {/* List out 5 latest files added into the repo */}
            {!isLoading && latestFiles.length > 0 && (
              <ul className="list-disc pl-5">
                {latestFiles.map((file) => (
                  <li key={file.key}>
                    <a className="text-blue-500" href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.key.split("/").pop()}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
    </main>
  );
}

export default Main;