import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  CheckCircle, 
  Star, 
  Clock, 
  Users, 
  Award,
  Download,
  HelpCircle,
  Volume2,
  Bookmark,
  RotateCcw,
  ChevronRight,
  Target,
  Brain,
  Smartphone,
  Wifi,
  Shield,
  Camera,
  CreditCard,
  Home as HomeIcon,
  Heart,
  Cloud,
  MessageSquare,
  // Import all lucide icons for dynamic use, or ensure specific ones used are imported
  // For now, assuming specific ones like Target, Wifi, MessageSquare, Sparkles, Award, Star, HelpCircle are imported
+  // If more are needed for badges/paths, they should be added here.
+  // Alternatively, a more dynamic approach: import * as LucideIcons from 'lucide-react';
+  // Then use <LucideIcons[IconName] />
+  // For now, let's use specific imports as they are known for paths/badges.
+  // Target, Wifi, MessageSquare, Sparkles, Award, Star, HelpCircle, Power, MousePointer2, Keyboard, Folder, Globe, Search, Mail, ShieldCheck, MailOpen, Video, Users as UsersIcon, Image as ImageIcon, ShoppingCart, Map, ImageEdit, FileText as FileTextIcon
+} from 'lucide-react';
+import * as LucideIcons from 'lucide-react'; // Using this for dynamic icon rendering based on string names

import { useUser } from '../contexts/UserContext';
import Logo from '../components/Logo';
import { ttsService } from '../utils/ttsService';
import SkillAssessmentModal from '../components/SkillAssessmentModal';
import { SkillAssessmentResult, LearningPath, Module, Badge } from '../types/learning'; // Added LearningPath, Module, Badge
import { learningService, getBadgeById } from '../services/learningService'; // Added learningService and getBadgeById

interface Course {
  id: string;
  title: string;
  description: string;
  icon: any;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  lessons: Lesson[];
  color: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  content: string;
  practiceExercise?: string;
  keyPoints: string[];
  animation?: {
    type: 'power-button' | 'mouse-click' | 'typing' | 'swipe' | 'tap';
    description: string;
  };
}

interface UserProgress {
  courseId: string;
  lessonId: string;
  completed: boolean;
  bookmarked: boolean;
  lastAccessed: Date;
  timeSpent: number;
}

const LearningCenterPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'pathDetail' | 'moduleContent' | 'assessment'>('overview');
  // SelectedCourse and selectedLesson will be replaced by selectedPath and selectedModule
  // const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  // const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [userLevel, setUserLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | null>(null); // This might be driven by recommendedStartingPathId or assessment
  const [assessmentStep, setAssessmentStep] = useState(0); // For the old assessment, might remove or adapt
  const [assessmentAnswers, setAssessmentAnswers] = useState<number[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const { t } = useTranslation();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);

  const { userData, updateUserData, loading: userLoading } = useUser(); // Added userLoading
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPaths = async () => {
      setIsLoadingPaths(true);
      try {
        const paths = await learningService.getLearningPaths();
        setLearningPaths(paths);
      } catch (error) {
        console.error("Error fetching learning paths:", error);
        // Handle error appropriately, e.g., show error message
      } finally {
        setIsLoadingPaths(false);
      }
    };
    fetchPaths();
  }, []);

  // Course definitions - these are already largely translated via `learning.courses` in JSON
  // We will fetch titles, descriptions, etc., from `t` function when rendering.
  // The structure here will remain, but the text values will be replaced by keys or fetched dynamically.
  const coursesDataStructure = [
    {
      id: 'beginner',
      icon: Target,
      difficulty: 'Beginner', // This could be translated too, e.g. t('learningPage.difficulty.beginner')
      color: 'green',
      lessons: [
        { id: 'device-basics', animationType: 'power-button' },
        { id: 'mouse-keyboard', animationType: 'mouse-click' },
        { id: 'internet-safety' }
      ]
    },
    {
      id: 'intermediate',
      icon: MessageSquare,
      difficulty: 'Intermediate', // t('learningPage.difficulty.intermediate')
      color: 'blue',
      lessons: [
        { id: 'video-calls' },
        { id: 'social-media' }
      ]
    },
    {
      id: 'advanced',
      icon: Brain,
      difficulty: 'Advanced', // t('learningPage.difficulty.advanced')
      color: 'purple',
      lessons: [
        { id: 'smart-home' },
        { id: 'online-banking' }
      ]
    }
  ];

  const courses: Course[] = coursesDataStructure.map(courseStruct => ({
    id: courseStruct.id,
    title: t(`learning.courses.${courseStruct.id}.title`),
    description: t(`learning.courses.${courseStruct.id}.description`),
    icon: courseStruct.icon,
    difficulty: courseStruct.difficulty as 'Beginner' | 'Intermediate' | 'Advanced', // Assuming difficulty is not translated for now, or handled elsewhere
    estimatedTime: t(`learning.courses.${courseStruct.id}.estimatedTime`),
    color: courseStruct.color,
    lessons: courseStruct.lessons.map(lessonStruct => ({
      id: lessonStruct.id,
      title: t(`learning.courses.${courseStruct.id}.lessons.${lessonStruct.id}.title`),
      description: t(`learning.courses.${courseStruct.id}.lessons.${lessonStruct.id}.description`),
      duration: t(`learning.courses.${courseStruct.id}.lessons.${lessonStruct.id}.duration`),
      content: t(`learning.courses.${courseStruct.id}.lessons.${lessonStruct.id}.content`),
      keyPoints: t(`learning.courses.${courseStruct.id}.lessons.${lessonStruct.id}.keyPoints`, { returnObjects: true }) as string[],
      practiceExercise: t(`learning.courses.${courseStruct.id}.lessons.${lessonStruct.id}.practiceExercise`),
      animation: lessonStruct.animationType ? {
        type: lessonStruct.animationType as any,
        description: t(`learning.courses.${courseStruct.id}.lessons.${lessonStruct.id}.animationDesc`)
      } : undefined
    }))
  }));

  // Assessment questions - also translated via `learning.assessment.questions`
  const assessmentQuestions = Array.from({ length: 10 }).map((_, i) => ({
    question: t(`learning.assessment.questions.${i}.question`),
    options: Object.values(t(`learning.assessment.questions.${i}.options`, { returnObjects: true })) as string[],
    // category can remain if it's not user-facing or used for logic
    category: ['basic', 'internet', 'communication', 'apps', 'communication', 'advanced', 'social', 'security', 'advanced', 'learning'][i]
  }));


  // Calculate skill level from assessment
  const calculateSkillLevel = (answers: number[]) => {
    const total = answers.reduce((sum, answer) => sum + answer, 0);
    const average = total / answers.length;
    
    if (average <= 1) return 'Beginner';
    if (average <= 2.5) return 'Intermediate';
    return 'Advanced';
  };

  // Load user progress
  useEffect(() => {
    if (userData?.learningProgress) {
      setUserProgress(userData.learningProgress);
    }
    if (userData?.skillLevel) {
      setUserLevel(userData.skillLevel);
    }
    // Show assessment modal if not completed and user data is loaded
    if (!userLoading && userData && !userData.skillAssessmentResult && currentView === 'overview') {
      // Check if onboarding was just completed to avoid immediate modal popup
      const onboardingJustCompleted = sessionStorage.getItem('onboardingJustCompleted');
      if (!onboardingJustCompleted) {
        setShowAssessmentModal(true);
      } else {
        sessionStorage.removeItem('onboardingJustCompleted'); // Clear flag
      }
    }
  }, [userData, userLoading, currentView]);

  const handleSubmitAssessment = async (answers: SkillAssessmentResult) => {
    let recommendedPathId = 'fundamentals'; // Default
    let determinedSkillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';

    if (answers.q1ComfortLevel === 'confident' && answers.q2EmailSent && answers.q3SmartphoneUsed) {
      recommendedPathId = 'digitalLife'; // Or 'advancedSkills'
      determinedSkillLevel = 'Advanced';
    } else if (answers.q1ComfortLevel === 'basics' && answers.q2EmailSent) {
      recommendedPathId = 'onlineWorld';
      determinedSkillLevel = 'Intermediate';
    }
    // Default is 'fundamentals' and 'Beginner'

    try {
      await updateUserData({
        skillAssessmentResult: answers,
        recommendedStartingPathId: recommendedPathId,
        skillLevel: determinedSkillLevel // Also update skillLevel for consistency with old system
      });
      setUserLevel(determinedSkillLevel); // Update local state
      // Potentially auto-scroll or highlight the recommended path later
    } catch (error) {
      console.error("Error saving assessment results:", error);
      // Handle error appropriately
    }
    setShowAssessmentModal(false);
  };

  // Save progress
  const saveProgress = async (courseId: string, lessonId: string, completed: boolean = false) => {
    const newProgress: UserProgress = {
      courseId,
      lessonId,
      completed,
      bookmarked: false,
      lastAccessed: new Date(),
      timeSpent: 0
    };

    const updatedProgress = [...userProgress.filter(p => !(p.courseId === courseId && p.lessonId === lessonId)), newProgress];
    setUserProgress(updatedProgress);

    if (updateUserData) {
      await updateUserData({
        learningProgress: updatedProgress,
        skillLevel: userLevel
      });
    }
  };

  // Handle assessment
  const handleAssessmentAnswer = (answerIndex: number) => {
    const newAnswers = [...assessmentAnswers, answerIndex];
    setAssessmentAnswers(newAnswers);

    if (assessmentStep < assessmentQuestions.length - 1) {
      setAssessmentStep(assessmentStep + 1);
    } else {
      // Complete assessment
      const level = calculateSkillLevel(newAnswers);
      setUserLevel(level);
      if (updateUserData) {
        updateUserData({ skillLevel: level });
      }
      setCurrentView('overview');
    }
  };

  // Skip assessment
  const skipAssessment = () => {
    setCurrentView('overview');
  };

  // Choose level manually
  const chooseLevel = (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setUserLevel(level);
    if (updateUserData) {
      updateUserData({ skillLevel: level });
    }
    setCurrentView('overview');
  };

  // Get recommended courses based on level
  const getRecommendedCourses = () => {
    if (!userLevel) return courses;
    
    const levelOrder = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
    const userLevelIndex = levelOrder[userLevel];
    
    return courses.filter((course, index) => index <= userLevelIndex);
  };

  // Animation component
  const AnimationDemo: React.FC<{ type: string; description: string }> = ({ type, description }) => {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <div className="mb-4">
          <div className="w-32 h-32 mx-auto bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center relative overflow-hidden">
            {type === 'power-button' && (
              <div className="relative">
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full border-3 border-white flex items-center justify-center transition-all duration-1000 ${showAnimation ? 'bg-green-400' : 'bg-gray-600'}`}>
                    <div className="w-2 h-4 bg-white rounded-sm"></div>
                  </div>
                </div>
                {showAnimation && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                )}
              </div>
            )}
            {type === 'mouse-click' && (
              <div className="relative">
                <div className="w-12 h-16 bg-gray-300 rounded-t-full rounded-b-lg border border-gray-400">
                  <div className={`w-10 h-6 bg-gray-400 rounded-t-full mx-auto transition-all duration-300 ${showAnimation ? 'bg-blue-400 scale-95' : ''}`}></div>
                </div>
                {showAnimation && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <button
          onClick={() => setShowAnimation(!showAnimation)}
          className="btn-primary text-sm px-4 py-2"
        >
          {showAnimation ? t('learningPage.animationReset') : t('learningPage.animationShow')}
        </button>
      </div>
    );
  };

  // Render assessment view
  if (currentView === 'assessment') {
    const currentQuestion = assessmentQuestions[assessmentStep];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentView('overview')}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Logo size="sm" />
                <h1 className="text-xl font-semibold text-gray-800">{t('assessmentView.headerTitle')}</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-2xl">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t('assessmentView.questionProgress', { current: assessmentStep + 1, total: assessmentQuestions.length })}
              </h2>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((assessmentStep + 1) / assessmentQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAssessmentAnswer(index)}
                    className="w-full p-4 text-left rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={skipAssessment}
                className="btn-secondary"
              >
                {t('assessmentView.skipAssessment')}
              </button>
              
              <div className="text-sm text-gray-500">
                {t('assessmentView.chooseBestOption')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render lesson view
  if (currentView === 'lesson' && selectedLesson && selectedCourse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentView('course')}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Logo size="sm" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">{selectedLesson.title}</h1>
                  <p className="text-sm text-gray-600">{selectedCourse.title}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const content = selectedLesson.content.replace(/<[^>]*>/g, '');
                    ttsService.speak(content, { speed: 0.8 });
                    setIsPlaying(!isPlaying);
                  }}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                  title={t('lessonView.readAloud')}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="card p-8 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedLesson.title}</h2>
                    <p className="text-gray-600">{selectedLesson.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{selectedLesson.duration}</span>
                  </div>
                </div>

                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                />

                {/* Animation Demo */}
                {selectedLesson.animation && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">{t('lessonView.interactiveDemoHeader')}</h3>
                    <AnimationDemo 
                      type={selectedLesson.animation.type}
                      description={selectedLesson.animation.description}
                    />
                  </div>
                )}

                {/* Practice Exercise */}
                {selectedLesson.practiceExercise && (
                  <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t('lessonView.practiceExerciseHeader')}</h3>
                    <p className="text-yellow-700">{selectedLesson.practiceExercise}</p>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => saveProgress(selectedCourse.id, selectedLesson.id, true)}
                    className="btn-primary"
                  >
                    {t('lessonView.markAsComplete')}
                  </button>
                  
                  <button className="btn-secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t('lessonView.repeatLesson')}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Points */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('lessonView.keyPointsHeader')}</h3>
                <ul className="space-y-3">
                  {selectedLesson.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Download Summary */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('lessonView.takeItWithYouHeader')}</h3>
                <button className="btn-secondary w-full">
                  <Download className="w-4 h-4 mr-2" />
                  {t('lessonView.downloadSummaryButton')}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  {t('lessonView.downloadSummaryDescription')}
                </p>
              </div>

              {/* Help */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('lessonView.needHelpHeader')}</h3>
                <div className="space-y-3">
                  <button className="btn-secondary w-full text-sm">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    {t('lessonView.askAQuestionButton')}
                  </button>
                  <button className="btn-secondary w-full text-sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('lessonView.chatWithHelperButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render course view
  if (currentView === 'course' && selectedCourse) {
    const courseProgress = userProgress.filter(p => p.courseId === selectedCourse.id);
    const completedLessons = courseProgress.filter(p => p.completed).length;
    const progressPercentage = (completedLessons / selectedCourse.lessons.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentView('overview')}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Logo size="sm" />
                <h1 className="text-xl font-semibold text-gray-800">{selectedCourse.title}</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {/* Course Header */}
          <div className="card p-8 mb-8">
            <div className="flex items-start space-x-6">
              <div className={`w-16 h-16 bg-${selectedCourse.color}-100 rounded-2xl flex items-center justify-center`}>
                <selectedCourse.icon className={`w-8 h-8 text-${selectedCourse.color}-600`} />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedCourse.title}</h2>
                <p className="text-lg text-gray-600 mb-4">{selectedCourse.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{selectedCourse.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{selectedCourse.lessons.length} {t('learningPage.lessonsLabel')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>{selectedCourse.difficulty}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{t('learningPage.progressLabel')}</span>
                    <span>{t('learningPage.completedOutOfTotal', {completed: completedLessons, total: selectedCourse.lessons.length})}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${selectedCourse.color}-500 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">{t('courseView.lessonsHeader')}</h2>
            
            {selectedCourse.lessons.map((lesson, index) => {
              const isCompleted = courseProgress.some(p => p.lessonId === lesson.id && p.completed);
              const isBookmarked = courseProgress.some(p => p.lessonId === lesson.id && p.bookmarked);
              
              return (
                <div key={lesson.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <span className="text-gray-600 font-semibold">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{lesson.title}</h3>
                        <p className="text-gray-600 mb-2">{lesson.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{lesson.duration}</span>
                          </div>
                          {lesson.animation && (
                            <div className="flex items-center space-x-1">
                              <Play className="w-4 h-4" />
                              <span>{t('courseView.interactiveDemoLabel')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          // Toggle bookmark
                          const newProgress = userProgress.map(p => 
                            p.courseId === selectedCourse.id && p.lessonId === lesson.id
                              ? { ...p, bookmarked: !p.bookmarked }
                              : p
                          );
                          setUserProgress(newProgress);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isBookmarked ? 'text-yellow-600 bg-yellow-100' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setCurrentView('lesson');
                          saveProgress(selectedCourse.id, lesson.id);
                        }}
                        className="btn-primary"
                      >
                        {isCompleted ? t('courseView.reviewLesson') : t('courseView.startLesson')}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Course Completion */}
          {progressPercentage === 100 && (
            <div className="card p-8 text-center bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('courseView.congratulations')}</h2>
              <p className="text-gray-600 mb-4">{t('courseView.courseComplete', { courseTitle: selectedCourse.title })}</p>
              <button className="btn-primary">
                <Download className="w-4 h-4 mr-2" />
                {t('courseView.downloadCertificate')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main overview
  if (currentView === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50">
        {showAssessmentModal && !userLoading && ( // Ensure user data is loaded before deciding on modal
          <SkillAssessmentModal
            isOpen={showAssessmentModal}
            onClose={() => {
              setShowAssessmentModal(false);
              if (!userData?.skillAssessmentResult && updateUserData) { // Check if updateUserData is defined
                updateUserData({
                  skillAssessmentResult: { q1ComfortLevel: 'basics', q2EmailSent: false, q3SmartphoneUsed: false },
                  recommendedStartingPathId: 'fundamentals',
                  skillLevel: 'Beginner' // Keep skillLevel for now
                }).catch(err => console.error("Failed to set default assessment", err));
              }
            }}
            onSubmit={handleSubmitAssessment}
          />
        )}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Logo size="sm" />
              <h1 className="text-xl font-semibold text-gray-800">{t('learningPage.headerTitle')}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {t('learningPage.heroTitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('learningPage.heroSubtitle')}
          </p>
          
          {/* Button to retake/trigger assessment if needed - or could be in a user profile/settings area */}
          {userData && userData.skillAssessmentResult && (
             <button
                onClick={() => setShowAssessmentModal(true)} // Allow re-taking assessment
                className="btn-secondary text-sm mb-8"
              >
                {t('learningPage.retakeAssessment')}
              </button>
          )}
        </div>

        {/* Learning Paths Grid */}
        {isLoadingPaths && (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('learningPage.loadingPaths')}</p>
          </div>
        )}

        {!isLoadingPaths && learningPaths.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 text-xl">{t('learningPage.noPathsAvailable')}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {learningPaths.map((path) => {
            const totalModulesInPath = path.modules.length;
            const completedModulesForPath = path.modules.filter(
              module => userData?.userLearningProgress?.completedModules?.[module.id]
            ).length;
            const progressPercent = totalModulesInPath > 0 ? (completedModulesForPath / totalModulesInPath) * 100 : 0;
            
            const IconComponent = LucideIcons[path.iconName as keyof typeof LucideIcons] || Target;
            const isPathBadgeEarned = userData?.userLearningProgress?.earnedBadges?.[path.badgeIdOnCompletion] || false;

            return (
              <div 
                key={path.id}
                className="card p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2"
                onClick={() => {
                  setSelectedPath(path);
                  setCurrentView('pathDetail');
                }}
              >
                <div className={`w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6`}> {/* Generic color for now */}
                  <IconComponent className={`w-8 h-8 text-blue-600`} />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">{t(path.titleKey)}</h3>
                <p className="text-gray-600 mb-4 text-sm text-center">{t(path.descriptionKey)}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{t('learningPage.progressComplete', { value: Math.round(progressPercent) })}</p>
                  {isPathBadgeEarned && (
                    <div title={t(getBadgeById(path.badgeIdOnCompletion)?.nameKey || '')} className="text-yellow-500">
                      <Award className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Indication if path is recommended */}
                {userData?.recommendedStartingPathId === path.id && !isPathBadgeEarned && ( // Show recommendation only if badge not yet earned for this path
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Star className="w-4 h-4 mr-1.5" />
                      {t('learningPage.recommendedStart')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Features Section - can remain as is or be integrated differently if desired */}
        {/* Ensure LucideIcons and getBadgeById are imported if not already */}
        {/* import * as LucideIcons from 'lucide-react'; */}
        {/* import { getBadgeById } from '../services/learningService'; */}
        <div className="text-center mb-12 pt-12 border-t border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('learningPage.featuresGridTitle')}</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { iconName: 'Play', titleKey: "learningPage.featureInteractiveDemos", descriptionKey: "learningPage.featureInteractiveDemosDesc"},
            { iconName: 'Volume2', titleKey: "learningPage.featureAudioSupport", descriptionKey: "learningPage.featureAudioSupportDesc"},
            { iconName: 'Download', titleKey: "learningPage.featurePrintableGuides", descriptionKey: "learningPage.featurePrintableGuidesDesc"},
            { iconName: 'Award', titleKey: "learningPage.featureCertificates", descriptionKey: "learningPage.featureCertificatesDesc"}
          ].map((feature, index) => {
            const FeatureIcon = LucideIcons[feature.iconName as keyof typeof LucideIcons] || HelpCircle;
            return (
              <div key={index} className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FeatureIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-gray-600">{t(feature.descriptionKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    );
  } // End of 'overview' view

  // Placeholder for pathDetail and moduleContent views
  // These will be built out in subsequent steps/commits
  if (currentView === 'pathDetail' && selectedPath) {
    // Basic display for now
    return (
      <div>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="container mx-auto px-6 py-4 flex items-center space-x-4">
            <button onClick={() => setCurrentView('overview')} className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo size="sm" />
            <h1 className="text-xl font-semibold text-gray-800">{t(selectedPath.titleKey)}</h1>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold mb-4">{t(selectedPath.descriptionKey)}</h2>
          <p className="mb-6">{t('learningPage.moduleListTitle', { pathTitle: t(selectedPath.titleKey) })}</p>
          <div className="space-y-4">
            {selectedPath.modules.map(module => (
              <div key={module.id} className="card p-4">
                <h3 className="text-lg font-semibold">{t(module.titleKey)}</h3>
                <p className="text-sm text-gray-600">{t(module.descriptionKey)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('learningPage.moduleTimeLabel')}{module.estimatedTime}</p>
                 {/* TODO: Add click handler to go to module content */}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'moduleContent' && selectedModule) {
     return (
      <div>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="container mx-auto px-6 py-4 flex items-center space-x-4">
            <button onClick={() => setCurrentView('pathDetail')} className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo size="sm" />
            <h1 className="text-xl font-semibold text-gray-800">{t(selectedModule.titleKey)}</h1>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
            {t('learningPage.moduleContentTitle', { moduleTitle: t(selectedModule.titleKey) })}
            {/* This is where the old 'lesson' view logic might be adapted */}
        </div>
      </div>
    );
  }

  // Fallback or loading state for other views if any
  return (
    <div className="min-h-screen flex items-center justify-center">
        <p>{t('learningPage.loadingCenter')}</p>
    </div>
  );
};

export default LearningCenterPage;