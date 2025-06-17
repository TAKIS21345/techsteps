import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import Cookies from 'js-cookie';

interface QuestionHistory {
  question: string;
  timestamp: Date;
  stepsCompleted: number;
  totalSteps: number;
  completed: boolean;
}

interface UserStats {
  questionsAsked: number;
  stepsCompleted: number;
  featuresUsed: string[];
  lastActive: Date;
  questionHistory: QuestionHistory[];
}

interface ChatMemory {
  id: string;
  userId: string;
  timestamp: Date;
  type: 'question' | 'clarification' | 'completion' | 'context';
  content: string;
  metadata?: {
    deviceType?: string;
    techLevel?: string;
    stepCount?: number;
    successful?: boolean;
    tags?: string[];
  };
}

interface UserData {
  firstName: string;
  lastName: string;
  age: number;
  os: string;
  techExperience: 'beginner' | 'some' | 'comfortable';
  primaryConcerns: string[];
  assistiveNeeds: string[];
  communicationStyle: 'simple' | 'detailed' | 'visual';
  selectedLanguages?: string[];
  stats?: UserStats;
  chatMemory?: ChatMemory[];
  learningProgress?: UserProgress[];
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  preferences?: {
    theme: 'light' | 'dark';
    textToSpeech: boolean;
    voiceInput: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
    highContrast: boolean;
    videoRecommendations: boolean;
    speechLanguages?: string[];
  };
  createdAt?: Date;
}

interface UserProgress {
  courseId: string;
  lessonId: string;
  completed: boolean;
  bookmarked: boolean;
  lastAccessed: Date;
  timeSpent: number;
}

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  updateUserStats: (stats: Partial<UserStats>) => Promise<void>;
  addQuestionToHistory: (question: string, totalSteps: number) => Promise<void>;
  markQuestionCompleted: (question: string) => Promise<void>;
  hasCompletedOnboarding: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData({ ...data, uid: user.uid }); // Add uid for CometChat
        } else {
          setUserData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user data:', error);
        setUserData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Initialize CometChat when user data is available
  useEffect(() => {
    if (userData && user) {
      const initializeCometChat = async () => {
        try {
          await cometChatService.loginUser(
            user.uid,
            userData.firstName || 'User'
          );
        } catch (error) {
          console.error('Failed to initialize CometChat:', error);
        }
      };
      
      initializeCometChat();
    }
  }, [userData, user]);

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) throw new Error('No authenticated user');

    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);

    const updateData = {
      ...data,
      ...(userData ? {} : { createdAt: new Date() })
    };

    await setDoc(userDocRef, updateData, { merge: true });
  };

  const updateUserStats = async (stats: Partial<UserStats>) => {
    if (!user) throw new Error('No authenticated user');

    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);

    const currentStats = userData?.stats || {
      questionsAsked: 0,
      stepsCompleted: 0,
      featuresUsed: [],
      lastActive: new Date(),
      questionHistory: []
    };

    const updatedStats = {
      ...currentStats,
      ...stats,
      lastActive: new Date()
    };

    await setDoc(userDocRef, { stats: updatedStats }, { merge: true });
  };

  const addQuestionToHistory = async (question: string, totalSteps: number) => {
    if (!user) return;

    const currentStats = userData?.stats || {
      questionsAsked: 0,
      stepsCompleted: 0,
      featuresUsed: [],
      lastActive: new Date(),
      questionHistory: []
    };

    const newQuestion: QuestionHistory = {
      question,
      timestamp: new Date(),
      stepsCompleted: 0,
      totalSteps,
      completed: false
    };

    const updatedHistory = [newQuestion, ...currentStats.questionHistory.slice(0, 9)];

    await updateUserStats({
      questionsAsked: currentStats.questionsAsked + 1,
      questionHistory: updatedHistory
    });
  };

  const markQuestionCompleted = async (question: string) => {
    if (!user || !userData?.stats) return;

    const updatedHistory = userData.stats.questionHistory.map(q => 
      q.question === question ? { ...q, completed: true, stepsCompleted: q.totalSteps } : q
    );

    const completedQuestion = updatedHistory.find(q => q.question === question);
    const stepsToAdd = completedQuestion ? completedQuestion.totalSteps : 0;

    await updateUserStats({
      questionHistory: updatedHistory,
      stepsCompleted: userData.stats.stepsCompleted + stepsToAdd
    });
  };
  const hasCompletedOnboarding = userData !== null;

  const value = {
    userData,
    loading,
    updateUserData,
    updateUserStats,
    addQuestionToHistory,
    markQuestionCompleted,
    hasCompletedOnboarding
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};