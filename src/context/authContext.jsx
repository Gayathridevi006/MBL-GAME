
import React, { createContext, useContext, useState, useEffect } from "react";
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

// Create AuthContext
const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Google Sign In with Session Persistence
    const signInWithGoogle = async () => {
        try {
            // Set session-based authentication
            await setPersistence(auth, browserSessionPersistence);

            // Proceed with Google sign-in
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Save user data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: new Date().toISOString()
            }, { merge: true });

            // Set user in context
            setUser(user);
            return user;
        } catch (error) {
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            throw error;
        }
    };

    // Monitor auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        setUser,
        signInWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
