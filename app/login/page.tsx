"use client"
import { useState } from 'react';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getFirebaseErrorMessage(error: unknown) {
  if (!error) return "";
  // react-firebase-hooks returns error as FirebaseError
  const code = (error as { code?: string }).code;
  console.log(code)
  switch (code) {
    case "auth/invalid-credential":
      return "Invalid Email / Password.";
    default:
      return (error as Error)?.message || "An unknown error occurred.";
  }
}

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const [
        signInWithEmailAndPassword,
        user,
        loading,
        firebaseError,
    ] = useSignInWithEmailAndPassword(auth);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

    if (!email || !password) {
        setError('All fields are required');
        return;
    }

    try {
        const res = await signInWithEmailAndPassword(email, password);
        console.log({res});
        setPassword('');
        if (res){
          setEmail('');
          router.push('/');
          localStorage.setItem("isLoggedIn", "true");
        }
    } catch (err) {
        setError('Invalid email or password');
    }
};

return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
            <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                Sign In to Your Account
                </h2>
            </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
            <div className="rounded-md shadow-sm space-y-4">
                {(error || firebaseError) && (
                    <div className="text-red-500 text-sm text-center">
                        {error || getFirebaseErrorMessage(firebaseError)}
                    </div>
                )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
                className="mt-1 bg-gray-800 text-white appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 text-white appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400"
                >
                  {showPassword ? '👁️' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-400">Don't have an account? </span>
            <Link
              href="/signup"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}