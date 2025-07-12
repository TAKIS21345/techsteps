import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { SkillAssessmentResult, UserLearningProgress as NewUserLearningProgress } from '../types/learning'; // Renamed to avoid conflict

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
  learningProgress?: UserProgress[]; // Old V1 progress
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced'; // Potentially superseded by new assessment
  // New V2 Learning Center fields
  skillAssessmentResult?: SkillAssessmentResult;
  recommendedStartingPathId?: string;
  userLearningProgress?: NewUserLearningProgress; // V2 progress
  earnedBadges?: string[]; // Array of badge IDs
  onboardingCompleted?: boolean; // Added for robust onboarding check
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
  preferences: UserData['preferences'] | undefined;
  loading: boolean;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  updateUserStats: (stats: Partial<UserStats>) => Promise<void>;
  addQuestionToHistory: (question: string, totalSteps: number) => Promise<void>;
  markQuestionCompleted: (question: string) => Promise<void>;
  hasCompletedOnboarding: boolean;
  markModuleAsComplete: (moduleId: string, pathId: string, learningPaths: NewLearningPath[]) => Promise<void>; // Added NewLearningPath type
}

// Forward declaration for LearningPath from types/learning, actual import might cause circular dependency if UserContext is imported there.
// Best practice would be to ensure types are self-contained or use a central types file not importing contexts.
interface ModuleStub { id: string; }
interface NewLearningPath { id: string; modules: ModuleStub[]; badgeIdOnCompletion: string; }


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

  // Centralized function to apply preferences to DOM
  function applyPreferencesToDOM(preferences?: UserData['preferences']) {
    if (!preferences) return;
    const body = document.body;
    // Theme
    body.classList.remove('theme-light', 'theme-dark');
    if (preferences.theme === 'dark') body.classList.add('theme-dark');
    else body.classList.add('theme-light');
    // Font size
    body.classList.remove('font-normal', 'font-large', 'font-extralarge');
    if (preferences.fontSize === 'large') body.classList.add('font-large');
    else if (preferences.fontSize === 'extra-large') body.classList.add('font-extralarge');
    else body.classList.add('font-normal');
    // High contrast
    if (preferences.highContrast) body.classList.add('high-contrast');
    else body.classList.remove('high-contrast');
    // Add more settings as needed
  }

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true); // Ensure loading is true while fetching new user's data
    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData(data);
          // Apply preferences to DOM whenever userData changes
          if (data.preferences) applyPreferencesToDOM(data.preferences);
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

  // Also apply preferences if they change independently
  useEffect(() => {
    if (userData && userData.preferences) {
      applyPreferencesToDOM(userData.preferences);
    }
  }, [userData?.preferences]);

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) throw new Error('No authenticated user');

    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);

    const updateData = {
      ...data,
      ...(userData ? {} : { createdAt: new Date() })
    };

    // Ensure skillLevel is not undefined before saving
    if ('skillLevel' in updateData && updateData.skillLevel === undefined) {
      updateData.skillLevel = 'Beginner'; // Default value
    }

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
  
  const hasCompletedOnboarding = !!userData?.onboardingCompleted;

  const markModuleAsComplete = async (moduleId: string, pathId: string, allLearningPaths: NewLearningPath[]) => {
    if (!user || !userData) return;

    const currentLearningProgress = userData.userLearningProgress || {
      completedModules: {},
      earnedBadges: {},
      pathProgress: {} // This will be recalculated
    };

    const updatedCompletedModules = {
      ...currentLearningProgress.completedModules,
      [moduleId]: true
    };

    // Check for badge completion
    const path = allLearningPaths.find(p => p.id === pathId);
    let updatedEarnedBadges = { ...currentLearningProgress.earnedBadges };

    if (path) {
      const allModulesInPathComplete = path.modules.every(
        module => updatedCompletedModules[module.id]
      );
      if (allModulesInPathComplete && path.badgeIdOnCompletion) {
        updatedEarnedBadges = {
          ...updatedEarnedBadges,
          [path.badgeIdOnCompletion]: true
        };
      }
    }

    // Recalculate progress for all paths (or just the affected one)
    const updatedPathProgress: Record<string, { completedCount: number, totalCount: number, progressPercent: number }> = {};
    allLearningPaths.forEach(p => {
      const totalModules = p.modules.length;
      const completedCount = p.modules.filter(m => updatedCompletedModules[m.id]).length;
      updatedPathProgress[p.id] = {
        completedCount,
        totalCount: totalModules,
        progressPercent: totalModules > 0 ? (completedCount / totalModules) * 100 : 0,
      };
    });


    const newLearningProgress: NewUserLearningProgress = {
      completedModules: updatedCompletedModules,
      earnedBadges: updatedEarnedBadges
    };

    // Store the string array of badge IDs in UserData as defined
    const earnedBadgesArray = Object.keys(updatedEarnedBadges).filter(badgeId => updatedEarnedBadges[badgeId]);

    await updateUserData({ userLearningProgress: newLearningProgress, earnedBadges: earnedBadgesArray });
  };

  const value = {
    userData,
    preferences: userData?.preferences,
    loading,
    updateUserData,
    updateUserStats,
    addQuestionToHistory,
    markQuestionCompleted,
    hasCompletedOnboarding,
    markModuleAsComplete
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};