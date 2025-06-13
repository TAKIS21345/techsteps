import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const { userData, updateUserData } = useUser();
  const navigate = useNavigate();

  // Course definitions
  const courses: Course[] = [
    {
      id: 'beginner',
      title: 'Getting Started with Technology',
      description: 'Perfect for complete beginners. Learn the basics step by step.',
      icon: Target,
      difficulty: 'Beginner',
      estimatedTime: '2-3 hours',
      color: 'green',
      lessons: [
        {
          id: 'device-basics',
          title: 'Device Basics',
          description: 'Learn how to turn your device on and off safely',
          duration: '15 min',
          content: `
            <div class="space-y-6">
              <h3 class="text-xl font-semibold">Turning Your Device On and Off</h3>
              <p>Every device has a power button. Let's learn how to use it safely.</p>
              
              <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">For Computers:</h4>
                <ul class="space-y-2">
                  <li>• Look for a round button with a power symbol (⏻)</li>
                  <li>• Press it once to turn on</li>
                  <li>• To turn off: Use the Start menu, then "Shut down"</li>
                  <li>• Never just press the power button to turn off!</li>
                </ul>
              </div>

              <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">For Phones/Tablets:</h4>
                <ul class="space-y-2">
                  <li>• Power button is usually on the side</li>
                  <li>• Press and hold for 2-3 seconds to turn on</li>
                  <li>• To turn off: Press and hold, then slide to power off</li>
                </ul>
              </div>
            </div>
          `,
          keyPoints: [
            'Always use proper shutdown procedures',
            'Power button location varies by device',
            'Never force power off unless absolutely necessary'
          ],
          practiceExercise: 'Practice turning your device on and off 3 times using the proper method.',
          animation: {
            type: 'power-button',
            description: 'Watch how to properly press the power button'
          }
        },
        {
          id: 'mouse-keyboard',
          title: 'Using Mouse and Keyboard',
          description: 'Master the basics of computer input devices',
          duration: '20 min',
          content: `
            <div class="space-y-6">
              <h3 class="text-xl font-semibold">Mouse and Keyboard Basics</h3>
              
              <div class="bg-purple-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Mouse Basics:</h4>
                <ul class="space-y-2">
                  <li>• Left click: Select items, open programs</li>
                  <li>• Right click: Open menus with more options</li>
                  <li>• Double click: Open files and programs</li>
                  <li>• Scroll wheel: Move up and down on pages</li>
                </ul>
              </div>

              <div class="bg-orange-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Keyboard Essentials:</h4>
                <ul class="space-y-2">
                  <li>• Space bar: Add spaces between words</li>
                  <li>• Enter: Start a new line or confirm</li>
                  <li>• Backspace: Delete the letter before cursor</li>
                  <li>• Shift: Make capital letters</li>
                </ul>
              </div>
            </div>
          `,
          keyPoints: [
            'Left click is your main tool',
            'Right click opens helpful menus',
            'Practice makes perfect'
          ],
          practiceExercise: 'Open a simple text program and type your name, then delete it using backspace.',
          animation: {
            type: 'mouse-click',
            description: 'See how to click, double-click, and right-click'
          }
        },
        {
          id: 'internet-safety',
          title: 'Internet Safety Fundamentals',
          description: 'Stay safe online with these essential tips',
          duration: '25 min',
          content: `
            <div class="space-y-6">
              <h3 class="text-xl font-semibold">Staying Safe Online</h3>
              
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 class="font-medium mb-2 text-red-800">Warning Signs of Scams:</h4>
                <ul class="space-y-2 text-red-700">
                  <li>• Urgent messages asking for money</li>
                  <li>• Requests for passwords or personal info</li>
                  <li>• "You've won" messages you didn't enter</li>
                  <li>• Suspicious links or attachments</li>
                </ul>
              </div>

              <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Safe Browsing Tips:</h4>
                <ul class="space-y-2">
                  <li>• Look for "https://" in web addresses</li>
                  <li>• Only download from official app stores</li>
                  <li>• Keep your software updated</li>
                  <li>• Use strong, unique passwords</li>
                </ul>
              </div>
            </div>
          `,
          keyPoints: [
            'Never give personal information to strangers',
            'When in doubt, ask a trusted person',
            'Legitimate companies won\'t ask for passwords via email'
          ],
          practiceExercise: 'Identify 3 warning signs of online scams from the lesson.'
        }
      ]
    },
    {
      id: 'intermediate',
      title: 'Connecting with Family & Friends',
      description: 'Learn to use social media, video calls, and messaging safely.',
      icon: MessageSquare,
      difficulty: 'Intermediate',
      estimatedTime: '3-4 hours',
      color: 'blue',
      lessons: [
        {
          id: 'video-calls',
          title: 'Video Calls with Family',
          description: 'Connect face-to-face with loved ones anywhere',
          duration: '30 min',
          content: `
            <div class="space-y-6">
              <h3 class="text-xl font-semibold">Making Video Calls</h3>
              
              <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Popular Video Call Apps:</h4>
                <ul class="space-y-2">
                  <li>• <strong>FaceTime</strong> (iPhone/iPad): Built-in, very easy</li>
                  <li>• <strong>WhatsApp</strong>: Works on all phones</li>
                  <li>• <strong>Zoom</strong>: Great for group calls</li>
                  <li>• <strong>Skype</strong>: Works on computers and phones</li>
                </ul>
              </div>

              <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Before Your Call:</h4>
                <ul class="space-y-2">
                  <li>• Check your internet connection</li>
                  <li>• Find good lighting (face a window)</li>
                  <li>• Test your camera and microphone</li>
                  <li>• Have the person's contact ready</li>
                </ul>
              </div>
            </div>
          `,
          keyPoints: [
            'Good lighting makes a big difference',
            'Test your setup before important calls',
            'Most apps work similarly once you learn one'
          ],
          practiceExercise: 'Make a test video call to a family member or friend.'
        },
        {
          id: 'social-media',
          title: 'Social Media Basics',
          description: 'Connect with friends and family on Facebook and other platforms',
          duration: '35 min',
          content: `
            <div class="space-y-6">
              <h3 class="text-xl font-semibold">Getting Started with Social Media</h3>
              
              <div class="bg-purple-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Facebook Basics:</h4>
                <ul class="space-y-2">
                  <li>• Create a profile with your real name</li>
                  <li>• Add a nice profile picture</li>
                  <li>• Send friend requests to people you know</li>
                  <li>• Share updates, photos, and memories</li>
                </ul>
              </div>

              <div class="bg-yellow-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Privacy Settings:</h4>
                <ul class="space-y-2">
                  <li>• Only accept friends you actually know</li>
                  <li>• Set posts to "Friends only"</li>
                  <li>• Don't share personal information publicly</li>
                  <li>• Review what others can see about you</li>
                </ul>
              </div>
            </div>
          `,
          keyPoints: [
            'Privacy settings are very important',
            'Only connect with people you know',
            'Think before you post - it stays online'
          ],
          practiceExercise: 'Set up your privacy settings to "Friends only" for posts.'
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Digital Life Mastery',
      description: 'Advanced skills for confident digital living.',
      icon: Brain,
      difficulty: 'Advanced',
      estimatedTime: '4-5 hours',
      color: 'purple',
      lessons: [
        {
          id: 'smart-home',
          title: 'Smart Home Devices',
          description: 'Control your home with voice commands and apps',
          duration: '40 min',
          content: `
            <div class="space-y-6">
              <h3 class="text-xl font-semibold">Smart Home Basics</h3>
              
              <div class="bg-indigo-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Popular Smart Devices:</h4>
                <ul class="space-y-2">
                  <li>• <strong>Smart Speakers</strong>: Alexa, Google Home</li>
                  <li>• <strong>Smart Thermostats</strong>: Control temperature remotely</li>
                  <li>• <strong>Smart Lights</strong>: Dim, change colors, set schedules</li>
                  <li>• <strong>Smart Doorbells</strong>: See who's at the door</li>
                </ul>
              </div>

              <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">Getting Started:</h4>
                <ul class="space-y-2">
                  <li>• Start with one device to learn</li>
                  <li>• Download the device's app</li>
                  <li>• Follow setup instructions step by step</li>
                  <li>• Practice basic voice commands</li>
                </ul>
              </div>
            </div>
          `,
          keyPoints: [
            'Start simple with one device',
            'Voice commands make life easier',
            'Most devices have helpful apps'
          ],
          practiceExercise: 'If you have a smart device, practice 3 different voice commands.'
        },
        {
          id: 'online-banking',
          title: 'Online Banking Security',
          description: 'Manage your finances safely online',
          duration: '45 min',
          content: `
            <div class="space-y-6">
              <h3 class="text-xl font-semibold">Safe Online Banking</h3>
              
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 class="font-medium mb-2 text-red-800">Security Essentials:</h4>
                <ul class="space-y-2 text-red-700">
                  <li>• Always type your bank's web address directly</li>
                  <li>• Look for the lock icon in your browser</li>
                  <li>• Never bank on public Wi-Fi</li>
                  <li>• Log out completely when finished</li>
                </ul>
              </div>

              <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">What You Can Do Online:</h4>
                <ul class="space-y-2">
                  <li>• Check account balances</li>
                  <li>• View transaction history</li>
                  <li>• Transfer money between accounts</li>
                  <li>• Pay bills electronically</li>
                </ul>
              </div>
            </div>
          `,
          keyPoints: [
            'Security is the top priority',
            'Your bank will never ask for passwords via email',
            'Online banking is very convenient when done safely'
          ],
          practiceExercise: 'Visit your bank\'s website and practice logging in (don\'t do any transactions yet).'
        }
      ]
    }
  ];

  // Assessment questions
  const assessmentQuestions = [
    {
      question: "How comfortable are you with turning a computer or phone on and off?",
      options: ["Never done it", "Need help every time", "Can do it sometimes", "Very comfortable"],
      category: 'basic'
    },
    {
      question: "How often do you use the internet?",
      options: ["Never", "Rarely", "Sometimes", "Daily"],
      category: 'internet'
    },
    {
      question: "Have you ever sent an email?",
      options: ["Never", "With lots of help", "A few times", "Regularly"],
      category: 'communication'
    },
    {
      question: "How comfortable are you with downloading apps?",
      options: ["Never tried", "Very nervous", "With help", "Confident"],
      category: 'apps'
    },
    {
      question: "Do you use video calling (FaceTime, Zoom, etc.)?",
      options: ["Never", "Tried once", "Sometimes", "Regularly"],
      category: 'communication'
    },
    {
      question: "How do you feel about online shopping?",
      options: ["Too scary", "Very nervous", "Willing to try", "Shop online often"],
      category: 'advanced'
    },
    {
      question: "Have you used social media (Facebook, etc.)?",
      options: ["Never", "Looked at it", "Have an account", "Use it regularly"],
      category: 'social'
    },
    {
      question: "How comfortable are you with passwords?",
      options: ["Very confused", "Need help", "Understand basics", "Manage them well"],
      category: 'security'
    },
    {
      question: "Do you back up your photos and files?",
      options: ["Don't know how", "Someone helps me", "Sometimes", "Regularly"],
      category: 'advanced'
    },
    {
      question: "How do you learn new technology?",
      options: ["Avoid it", "Ask for help", "Try carefully", "Explore confidently"],
      category: 'learning'
    }
  ];

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
          {showAnimation ? 'Reset' : 'Show Animation'}
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
                <h1 className="text-xl font-semibold text-gray-800">Skills Assessment</h1>
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
                Question {assessmentStep + 1} of {assessmentQuestions.length}
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
                Skip Assessment
              </button>
              
              <div className="text-sm text-gray-500">
                Choose the option that best describes you
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
                  title="Read lesson aloud"
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
                    <h3 className="text-lg font-semibold mb-4">Interactive Demo</h3>
                    <AnimationDemo 
                      type={selectedLesson.animation.type}
                      description={selectedLesson.animation.description}
                    />
                  </div>
                )}

                {/* Practice Exercise */}
                {selectedLesson.practiceExercise && (
                  <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Practice Exercise</h3>
                    <p className="text-yellow-700">{selectedLesson.practiceExercise}</p>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => saveProgress(selectedCourse.id, selectedLesson.id, true)}
                    className="btn-primary"
                  >
                    Mark as Complete
                  </button>
                  
                  <button className="btn-secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Repeat Lesson
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Points */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Points</h3>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Take it with you</h3>
                <button className="btn-secondary w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Get a printable summary of this lesson
                </p>
              </div>

              {/* Help */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <button className="btn-secondary w-full text-sm">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Ask a Question
                  </button>
                  <button className="btn-secondary w-full text-sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with Helper
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
                    <span>{selectedCourse.lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>{selectedCourse.difficulty}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{completedLessons} of {selectedCourse.lessons.length} completed</span>
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
            <h3 className="text-2xl font-bold text-gray-800">Lessons</h3>
            
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
                        <h4 className="text-lg font-semibold text-gray-800">{lesson.title}</h4>
                        <p className="text-gray-600 mb-2">{lesson.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{lesson.duration}</span>
                          </div>
                          {lesson.animation && (
                            <div className="flex items-center space-x-1">
                              <Play className="w-4 h-4" />
                              <span>Interactive demo</span>
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
                        {isCompleted ? 'Review' : 'Start Lesson'}
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
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h3>
              <p className="text-gray-600 mb-4">You've completed the {selectedCourse.title} course!</p>
              <button className="btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Download Certificate
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
              <h1 className="text-xl font-semibold text-gray-800">Learning Center</h1>
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
            Tech Skills for Seniors
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Learn technology at your own pace with step-by-step lessons, interactive demos, and personalized guidance.
          </p>
          
          {!userLevel && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentView('assessment')}
                className="btn-primary text-lg px-8 py-4"
              >
                Take Skills Assessment
              </button>
              <div className="text-gray-500">or</div>
              <div className="flex gap-2">
                <button
                  onClick={() => chooseLevel('Beginner')}
                  className="btn-secondary"
                >
                  I'm a Beginner
                </button>
                <button
                  onClick={() => chooseLevel('Intermediate')}
                  className="btn-secondary"
                >
                  I'm Intermediate
                </button>
                <button
                  onClick={() => chooseLevel('Advanced')}
                  className="btn-secondary"
                >
                  I'm Advanced
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
                  <h3 className="text-lg font-semibold text-gray-800">Your Level: {userLevel}</h3>
                  <p className="text-gray-600">Courses are personalized for your skill level</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('assessment')}
                className="btn-secondary text-sm"
              >
                Retake Assessment
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
                    <span>{course.lessons.length} lessons</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {progressPercentage > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
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
                    {completedLessons} of {course.lessons.length} completed
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Play,
              title: "Interactive Demos",
              description: "See exactly how to perform each action"
            },
            {
              icon: Volume2,
              title: "Audio Support",
              description: "Have lessons read aloud to you"
            },
            {
              icon: Download,
              title: "Printable Guides",
              description: "Take summaries with you offline"
            },
            {
              icon: Award,
              title: "Certificates",
              description: "Earn certificates as you complete courses"
            }
          ].map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningCenterPage;