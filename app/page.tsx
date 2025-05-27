"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./home/header";
import Main from "./home/main";
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../app/firebase/config";

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
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
  <div className="min-h-screen">
      <Header />
        <h1 className="my-10 text-gray-200">
          Welcome{userName ? `, ${userName}!` : ""}
        </h1>
      <Main />
    </div>
  );
}