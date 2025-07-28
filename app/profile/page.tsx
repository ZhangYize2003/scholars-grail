"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../home/header";
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../firebase/config";

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [accountCreated, setAccountCreated] = useState<string>("");
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
        setEmail(user?.email || "");
        console.log("User data:", user);
        if (user?.createdAt && user.createdAt.toDate) {
        const dateObj = user.createdAt.toDate();
        setAccountCreated(
            dateObj.toLocaleString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            })
        );
        }
      });
    }
  }, [router]);

  return (
    <div className="flex items-center-safe justify-center min-h-screen text-main">
      <Header />
      <div className="bg-secondary overflow-hidden shadow rounded-lg border border-tertiary mt-8 min-w-xl max-w-2xl">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-bold">
            User Profile
          </h3>
        </div>
        <div className="border-t border-tertiary px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-tertiary">
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium">
                Username:
              </dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                {userName || "N/A"}
              </dd>
            </div>
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium">
                Email Address:
              </dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                {email || "N/A"}
              </dd>
            </div>
            <div className ="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium">
                    Account Created:
                </dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    {accountCreated || "N/A"}
                </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}