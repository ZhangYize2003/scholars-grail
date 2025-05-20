import React, { useState, useEffect, ReactNode } from "react";
import { User } from "firebase/auth"; 
import { auth } from "../firebaseSetup";
import { AuthContext } from "../context/AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

// creating AuthProvider component to provide authentication context to its children
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // creating a subscription to firebase which will feed us back information 
    // whenever the state of the user changes
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser); // firebase is the user state
    });
    
    // clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
};
