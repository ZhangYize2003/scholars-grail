"use client"
import { useEffect, useState } from 'react';
import { useSignInWithEmailAndPassword, useSignInWithGoogle } from 'react-firebase-hooks/auth';
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
    const [signInWithGoogle, googleUser, googleLoading, googleError] = useSignInWithGoogle(auth);
    useEffect(() => {
      if (googleUser) {
        localStorage.setItem("isLoggedIn", "true");
        router.push("/");
      }
    }, [googleUser, router]);

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
    <div className="background_colour">
        <div className="max-w-md w-full space-y-8">
            <div>
                <h1>
                Sign In to Your Account
                </h1>
            </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
            <div className="rounded-md shadow-sm space-y-4">
                {(error || firebaseError) && (
                    <div className= "error">
                        {error || getFirebaseErrorMessage(firebaseError)}
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

            <div>
              <label htmlFor="password">
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
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm linktext_format">
              <Link href="/login/forgot-password">
                Forgot your password?
              </Link>
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
              'Sign In'
            )}
          </button>

          <div className="text-center text-sm linktext_format">
            <span className="text-gray-400">Don't have an account? </span>
            <Link href="/signup">
              Sign up
            </Link>
          </div>
          <div className="flex w-full items-center gap-2 py-6 text-sm text-slate-200">
            <div className="h-px w-full bg-slate-200"></div>
            OR
            <div className="h-px w-full bg-slate-200"></div>
          </div>
          <button 
            type="button" 
            className="flex items-center gap-2 button_format bg-white hover:bg-gray-300 text-black"
            onClick={() => signInWithGoogle()}
            >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-[18px] w-[18px]"
            />
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}