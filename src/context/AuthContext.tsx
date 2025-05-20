import { User } from "firebase/auth";
import React from "react";

// this creates a react context to store the current authenticated user
export const AuthContext = React.createContext<User | null>(null);
// it will hold a user object [LOGGED IN] or null [LOGGED OUT]