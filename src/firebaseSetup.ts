import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Add this line for authentication

const firebaseConfig = {
  apiKey: "AIzaSyCUw-xo--h7I1at4xWUzEOOuHBaq0bZQxY",
  authDomain: "fir-auth-tut-55f75.firebaseapp.com",
  projectId: "fir-auth-tut-55f75",
  storageBucket: "fir-auth-tut-55f75.firebasestorage.app",
  messagingSenderId: "927055653202",
  appId: "1:927055653202:web:45bd0089b3175e3147b28b",
  measurementId: "G-0WPR8GMZLP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Initialize Firebase Authentication

export { app, analytics, auth };
