"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./home/header";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen">
      <Header />
    </div>
  );
}