"use client"
import { useState } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth, db } from '../firebase/config'
import Link from 'next/link'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export default function SignUpPage() {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(auth);
  const [accountCreated, setAccountCreated] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAccountCreated(false);

    if (!userName || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const res = await createUserWithEmailAndPassword(email, password);
      console.log({res});
      if (!res?.user?.uid) {
        throw new Error('Signup failed. No user returned.');
      }
      else {
        console.log('Firebase User Created:', res.user);
      }
      const uid = res.user.uid;
      await setDoc(doc(db, 'users', uid), {
        userName: userName,
        email: email,
        createdAt: serverTimestamp(),
      });
      setUserName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAccountCreated(true);
    } catch (err) {
      setError('An error occurred during sign up');
      console.error('Sign Up Error:', err);
    } finally {
      setIsLoading(false);
    };
  }
  return (
    <div className="background_colour">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1> Create an Account </h1>
        </div>
        {accountCreated && (
          <div className="text-green-500 text-center font-semibold">
            Account created successfully!
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="rounded-md shadow-sm space-y-4">
            {error && (
              <div className="error">{error}</div>
            )}
            <div>
              <label htmlFor="username"> Username </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="placeholder_text"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="email"> Email address </label>
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

            <div>
              <label htmlFor="password">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="placeholder_text"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="showhide_password"
                >
                  {showPassword ? '👁️' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="placeholder_text"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="button_format"
          >
            {isLoading ? (
              <div className="loading"></div>
              
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="text-center text-sm linktext_format">
            <span className="text-gray-400">Already have an account? </span>
            <Link href="/login">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}