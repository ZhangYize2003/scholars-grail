"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import Image from 'next/image';
import logo from "../../images/sg-logo.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Error: Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox");
      setEmail("");
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/user-not-found") {
          setError("Error: No account found with this email");
        } else if (err.code === "auth/invalid-email") {
          setError("Error: Invalid email address");
        } else {
          setError("Error: Failed to send reset email. Please try again");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin_signout_bg">
      <div className="flex items-center justify-center">
        <Image src={logo} width={100} height={100} alt="Logo"/>
        <h1 className="text-5xl font-bold">
            Scholar&apos;s Grail
        </h1>
      </div>
      <div className="flex justify-center my-4">
        <hr className="border-t border-stroke w-1/2"></hr>
      </div>
      <div className="flex flex-col items-center w-full my-5">
        <div className="w-md">
          <div>
            <h1>
              Reset Your Password
            </h1>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleReset}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="placeholder_text"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {(error || message) && (
                <div className={`text-sm text-center ${error ? "text-error" : "text-success"}`}>
                  {error || message}
                </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="button_format"
            >
              {loading ? (
                <div className="loading"></div>
              ) : (
                "Send Reset Email"
              )}
            </button>
            <div className="text-center text-sm linktext_format">
              <Link href="/login">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}