"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
      setEmail("");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    }
  };

  return (
    <div className="background_colour">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1>
            Reset Your Password
          </h1>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleReset}>
          <div className="rounded-md shadow-sm space-y-4">
            {(error || message) && (
              <div className={`text-sm text-center ${error ? "text-red-500" : "text-green-400"}`}>
                {error || message}
              </div>
            )}
            <div>
              <label htmlFor="email">
                Email address
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
  );
}