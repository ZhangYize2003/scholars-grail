"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "./home/sidebar";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex">
      <SideBar />
    </div>
  );
}