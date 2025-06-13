import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB3nEO9iegcJZC3aqHVh9Th6P8n8uN0QuQ",
  authDomain: "senior-tech-help.firebaseapp.com",
  projectId: "senior-tech-help",
  storageBucket: "senior-tech-help.firebasestorage.app",
  messagingSenderId: "907395120217",
  appId: "1:907395120217:web:b4a9a131f389a346034548",
  measurementId: "G-3TVV3JHXPH"
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    setPersistence(auth, browserLocalPersistence).then(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const auth = getAuth();
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};