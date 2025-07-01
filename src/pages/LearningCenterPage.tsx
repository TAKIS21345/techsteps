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
  MessageSquare
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Logo from '../components/Logo';
import { ttsService } from '../utils/ttsService';

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
  const [currentView, setCurrentView] = useState<'overview' | 'assessment' | 'course' | 'lesson'>('overview');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [userLevel, setUserLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | null>(null);
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<number[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useTranslation();

  const { userData, updateUserData } = useUser();
  const navigate = useNavigate();

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
  }, [userData]);

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
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
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
          
          {!userLevel && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentView('assessment')}
                className="btn-primary text-lg px-8 py-4"
              >
                {t('learningPage.takeSkillsAssessment')}
              </button>
              <div className="text-gray-500">{t('learningPage.orSeparator')}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => chooseLevel('Beginner')}
                  className="btn-secondary"
                >
                  {t('learningPage.iAmBeginner')}
                </button>
                <button
                  onClick={() => chooseLevel('Intermediate')}
                  className="btn-secondary"
                >
                  {t('learningPage.iAmIntermediate')}
                </button>
                <button
                  onClick={() => chooseLevel('Advanced')}
                  className="btn-secondary"
                >
                  {t('learningPage.iAmAdvanced')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Level Display */}
        {userLevel && (
          <div className="card p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{t('learningPage.yourLevel', { level: userLevel })}</h3>
                  <p className="text-gray-600">{t('learningPage.levelDescription')}</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('assessment')}
                className="btn-secondary text-sm"
              >
                {t('learningPage.retakeAssessment')}
              </button>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {getRecommendedCourses().map((course) => {
            const courseProgress = userProgress.filter(p => p.courseId === course.id);
            const completedLessons = courseProgress.filter(p => p.completed).length;
            const progressPercentage = (completedLessons / course.lessons.length) * 100;
            
            return (
              <div 
                key={course.id}
                className="card p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2"
                onClick={() => {
                  setSelectedCourse(course);
                  setCurrentView('course');
                }}
              >
                <div className={`w-16 h-16 bg-${course.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <course.icon className={`w-8 h-8 text-${course.color}-600`} />
                </div>
                
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                  course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.difficulty}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{course.title}</h3>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons.length} {t('learningPage.lessonsLabel')}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {progressPercentage > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t('learningPage.progressLabel')}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${course.color}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t('learningPage.completedOutOfTotal', {completed: completedLessons, total: course.lessons.length })}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="text-center mb-12"> {/* Added text-center and margin for the new heading */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('learningPage.featuresGridTitle')}</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Play,
              titleKey: "learningPage.featureInteractiveDemos",
              descriptionKey: "learningPage.featureInteractiveDemosDesc"
            },
            {
              icon: Volume2,
              titleKey: "learningPage.featureAudioSupport",
              descriptionKey: "learningPage.featureAudioSupportDesc"
            },
            {
              icon: Download,
              titleKey: "learningPage.featurePrintableGuides",
              descriptionKey: "learningPage.featurePrintableGuidesDesc"
            },
            {
              icon: Award,
              titleKey: "learningPage.featureCertificates",
              descriptionKey: "learningPage.featureCertificatesDesc"
            }
          ].map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t(feature.titleKey)}</h3>
              <p className="text-sm text-gray-600">{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningCenterPage;