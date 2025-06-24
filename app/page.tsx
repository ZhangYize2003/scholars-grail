"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./home/header";
import Main from "./home/main";
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../app/firebase/config";
import S3UploadForm from './components/S3UploadForm';
import S3UploadForm2 from './components/S3UploadForm2';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [openModal, setOpenModal] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);
  const [subject, setSubject] = useState<string>("");
  const [paperFolder, setPaperFolder] = useState<string>("");
  const [paper, setPaper] = useState<File | null>(null); 
  const [working, setWorking] = useState<File | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    const uid = localStorage.getItem("uid");
    const fetchUserData = async (uid: string) => {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        console.log("No such user!");
        return null;
      }
    };

    if (uid) {
      fetchUserData(uid).then(user => {
        setUserName(user?.userName || "");
      });
    }
  }, [router]);

  return (
  <div className="min-h-screen bg-background">
      <Header/>
        <h1 className="pt-20 text-3xl">
          Welcome{userName ? `, ${userName}!` : ""}
        </h1>

      <div>
          <div className="flex flex-col items-center space-y-2 text-main">
            <button onClick={() => setOpenModal(true)} 
                    className="flex p-2 mx-2 bg-accent text-xl rounded-md hover:bg-accent/75 transition cursor-pointer">
                start revision
            </button>
            <hr className="border-t border-stroke w-1/2 my-2"></hr>
            {openModal && <S3UploadForm setOpenModal={setOpenModal} setOpenModal2={setOpenModal2} subject={subject}
            setSubject={setSubject} paperFolder={paperFolder} setPaperFolder={setPaperFolder} paper={paper} setPaper={setPaper}/>}
            {openModal2 && <S3UploadForm2 setOpenModal2={setOpenModal2} subject={subject} paperFolder={paperFolder} setPaper={setPaper}
            working={working} setWorking={setWorking}/>}
          </div>
      </div>

      <Main/>
    </div>
  );
}