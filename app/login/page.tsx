"use client"
import { useEffect, useState } from 'react';
import { useSignInWithEmailAndPassword, useSignInWithGoogle } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { collection, query, where, getDocs } from "firebase/firestore";
import { FiEye, FiEyeOff} from "react-icons/fi";
import Image from 'next/image';
import logo from "../images/sg-logo.png";

function getFirebaseErrorMessage(error: unknown) {
  if (!error) return "";
  const code = (error as { code?: string }).code;
  console.log(code)
  switch (code) {
    case "auth/invalid-credential":
      return "Error: Invalid Username/Email or Password";
    default:
      return (error as Error)?.message || "An unknown error occurred";
  }
}

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const [signInWithGoogle, googleUser] = useSignInWithGoogle(auth);
    
    useEffect(() => {
      if (googleUser) {
        // Set items in localStorage to be used in other parts of the app
        localStorage.setItem("uid", googleUser.user.uid);
        const uid = googleUser.user.uid;
        const userRef = doc(db, 'users', uid);
        const upsertUser = async () => {
          const userSnap = await getDoc(userRef);
          const existingData = userSnap.exists() ? userSnap.data() : {};
          await setDoc(userRef, {
            userName: googleUser.user.displayName,
            email: googleUser.user.email,
            createdAt: existingData.createdAt || serverTimestamp(),
          });
          localStorage.setItem("uid", uid);
          localStorage.setItem("userName", googleUser.user.displayName || '');
          localStorage.setItem("isLoggedIn", "true");
          router.push("/");
        };
        upsertUser();
      }
    }, [googleUser, router]);

    const [
        signInWithEmailAndPassword,
        ,
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
          let emailToUse = email;
          // if user enters username instead of email
          if (!email.includes('@')) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('userName', '==', email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
              setError('Username not found');
              return;
            }
            emailToUse = querySnapshot.docs[0].data().email;
          };
          const res = await signInWithEmailAndPassword(emailToUse, password);
          console.log({res});
          setPassword('');
          if (res){
            setEmail('');
            router.push('/');
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("uid", res.user.uid);
          }
      } catch (err) {
          console.error("Sign-in error:", err);
          setError('Invalid email or password');
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
          <h1>
            Sign In to Your Account 
          </h1>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email">
                Username / Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="placeholder_text"
                placeholder="Enter your username or email"
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
                  {showPassword ? <FiEye/> : <FiEyeOff/>}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between -mt-4">
            <div className="text-sm linktext_format">
              <Link href="/login/forgot-password">
                Forgot your password?
              </Link>
            </div>
          </div>
          
          {(error || firebaseError) && (
              <div className= "error">
                    {error || getFirebaseErrorMessage(firebaseError)}
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
              'Sign In'
            )}
          </button>

          <div className="text-center text-sm linktext_format">
            <span className="text-main">Don&apos;t have an account? </span>
            <Link href="/signup">
              Sign up
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-stroke">
            <div className="h-px w-full bg-stroke"></div>
            OR
            <div className="h-px w-full bg-stroke"></div>
          </div>
          <button 
            type="button" 
            className="flex items-center gap-2 button_format"
            onClick={() => signInWithGoogle()}
            >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              height={18} 
              width={18}
            />
            Continue with Google
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}