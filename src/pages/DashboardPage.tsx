import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Camera, 
  BookOpen, 
  Settings, 
  LogOut, 
  Mic, 
  MicOff, 
  Clock,
  TrendingUp,
  Award,
  Heart,
  Lightbulb,
  HelpCircle,
  Star,
  ChevronRight,
  Phone,
  Wifi,
  Smartphone,
  Laptop,
  AlertCircle,
  Menu
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import Logo from '../components/Logo';
import AIToolsModal from '../components/AIToolsModal';
import StepsView from '../components/StepsView';
import ClarificationModal from '../components/ClarificationModal';
import LanguageNotificationBanner from '../components/LanguageNotificationBanner';
import { speechService } from '../utils/speechService';
import { crispService } from '../utils/crispService';
import { chatMemoryService } from '../utils/chatMemoryService';
import Cookies from 'js-cookie';

const DashboardPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [currentView, setCurrentView] = useState<'main' | 'loading' | 'steps'>('main');
  const [steps, setSteps] = useState<string[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'recording' | 'processing' | 'complete' | 'error'>('idle');
  const [showAITools, setShowAITools] = useState(false);
  const [showClarification, setShowClarification] = useState(false);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [originalQuestion, setOriginalQuestion] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { logout } = useAuth();
  const { userData, addQuestionToHistory, markQuestionCompleted, updateUserData } = useUser();
  const { t, i18n } = useTranslation();

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Initialize Crisp when component mounts
  useEffect(() => {
    crispService.initialize();
    // Set user info if available
    if (userData) {
      const userInfo: any = {};
      // Try to get email from AuthContext's user if available
      let email = undefined;
      try {
        // Try to get the user from AuthContext
        const auth = require('../contexts/AuthContext');
        const authUser = auth?.useAuth?.().user;
        if (authUser && typeof authUser.email === 'string' && authUser.email.trim()) {
          email = authUser.email;
        }
      } catch {}
      // Fallback: try userData.email if it exists
      if (!email && (userData as any).email && typeof (userData as any).email === 'string' && (userData as any).email.trim()) {
        email = (userData as any).email;
      }
      if (email) {
        userInfo.email = email;
      }
      if (userData.firstName && typeof userData.firstName === 'string' && userData.firstName.trim()) {
        userInfo.nickname = userData.firstName;
      }
      if ((userData as any).uid && typeof (userData as any).uid === 'string' && (userData as any).uid.trim()) {
        userInfo.userId = (userData as any).uid;
      }
      if (Object.keys(userInfo).length > 0) {
        crispService.setUserInfo(userInfo);
      }
    }
  }, [userData]);

  const quickTips = [
    {
      icon: Wifi,
      title: t('tips.connectWifi'),
      description: t('tips.connectWifiDesc'),
      category: t('category.internet')
    },
    {
      icon: Phone,
      title: t('tips.videoCall'),
      description: t('tips.videoCallDesc'),
      category: t('category.communication')
    },
    {
      icon: Smartphone,
      title: t('tips.screenshot'),
      description: t('tips.screenshotDesc'),
      category: t('category.basicSkills')
    },
    {
      icon: Laptop,
      title: t('tips.updateApps'),
      description: t('tips.updateAppsDesc'),
      category: t('category.maintenance')
    }
  ];

  // Get real recent activity from user data
  const recentActivity = userData?.stats?.questionHistory?.slice(0, 3).map(q => ({
    question: q.question,
    time: formatTimeAgo(q.timestamp),
    steps: q.totalSteps,
    completed: q.completed
  })) || [];

  // Real popular questions based on common senior tech issues
  const popularQuestions = [
    t('questions.makeTextBigger'),
    t('questions.connectWifi'),
    t('questions.takeScreenshot'),
    t('questions.makeVideoCall'),
    t('questions.backupPhotos'),
    t('questions.updateApps')
  ];

  // Calculate real achievements based on user stats
  const userStats = userData?.stats;
  const achievements = [
    { 
      icon: Award, 
      title: t('achievements.gettingStarted'),
      description: t('achievements.gettingStartedDesc'),
      unlocked: (userStats?.questionsAsked || 0) >= 1 
    },
    { 
      icon: Star, 
      title: t('achievements.questionExplorer'),
      description: t('achievements.questionExplorerDesc'),
      unlocked: (userStats?.questionsAsked || 0) >= 5 
    },
    { 
      icon: Heart, 
      title: t('achievements.stepMaster'),
      description: t('achievements.stepMasterDesc'),
      unlocked: (userStats?.stepsCompleted || 0) >= 25 
    }
  ];

  function formatTimeAgo(timestamp: any): string {
    try {
      let date: Date;
      
      // Handle different timestamp formats
      if (!timestamp) {
        return t('time.now');
      }
      
      // Check if it's a Firestore Timestamp (has toDate method)
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Check if it's already a Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Check if it's a string
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Check if it's a number (Unix timestamp)
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Fallback
      else {
        return t('time.now');
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        return t('time.now');
      }
      
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return t('time.now');
      if (diffInHours < 24) return diffInHours === 1 ? t('time.hourAgo') : t('time.hoursAgo', { count: diffInHours });
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return diffInDays === 1 ? t('time.dayAgo') : t('time.daysAgo', { count: diffInDays });
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return t('time.now');
    }
  }

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      alert(t('error.askQuestionFirst'));
      return;
    }

    setOriginalQuestion(question);
    setLoading(true);
    setCurrentView('loading');
    setNeedsClarification(false);

    try {
      // Get relevant chat memories for context
      const relevantMemories = await chatMemoryService.getRelevantMemories(
        (userData as any)?.uid || 'anonymous',
        question,
        userData
      );
      
      const memoryContext = chatMemoryService.formatMemoriesForContext(relevantMemories);
      
      // Build comprehensive user context for AI decision making
      const userContext = userData ? `
User Profile:
- Name: ${userData.firstName} ${userData.lastName || ''}
- Age: ${userData.age || 'Not specified'}
- Primary device: ${userData.os}
- Tech experience: ${userData.techExperience}
- Communication style: ${userData.communicationStyle}
- Primary concerns: ${userData.primaryConcerns?.join(', ') || 'None specified'}
- Assistive needs: ${userData.assistiveNeeds?.join(', ') || 'None'}
- Previous questions: ${userData.stats?.questionHistory?.slice(0, 3).map(q => q.question).join('; ') || 'None'}
- Preferred language: ${i18n.language}
${memoryContext}
` : `User is a senior citizen with basic information available. Preferred language: ${i18n.language}`;

      // Smart clarification check that considers user context
      const clarificationResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI assistant specialized in helping seniors with technology. Analyze this question and decide if you need clarification.

${userContext}

User's question: "${question}"

IMPORTANT: Respond in ${i18n.language} language.

DECISION CRITERIA:
1. PRIORITIZE using the user's profile information to make intelligent inferences
2. Consider their tech experience level - beginners need less clarification, just helpful assumptions
3. Use their device type and previous questions to fill in gaps
4. Only ask for clarification if the question is genuinely ambiguous and cannot be answered helpfully

WHEN TO SKIP CLARIFICATION:
- User is a beginner (provide general, safe instructions)
- Question can be answered for their known device type
- Similar questions in their history provide context
- Question is common and has standard solutions

WHEN TO ASK FOR CLARIFICATION:
- Question is extremely vague ("help with computer")
- Multiple completely different solutions exist
- Safety-critical operations that need precision
- User is experienced and would benefit from specific guidance

If clarification is needed, generate 2-4 specific, helpful questions that would improve the answer quality.

Respond with JSON format:
{
  "needsClarification": boolean,
  "reason": "brief explanation of decision",
  "questions": ["specific question 1", "specific question 2"],
  "canAnswerGenerally": boolean
}

Remember: It's better to provide a helpful general answer than to overwhelm seniors with clarification requests.`
            }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      const clarificationData = await clarificationResponse.json();
      const clarificationResult = JSON.parse(clarificationData.candidates?.[0]?.content?.parts?.[0]?.text || '{"needsClarification": false, "questions": [], "canAnswerGenerally": true}');

      if (clarificationResult.needsClarification) {
        setNeedsClarification(true);
        setClarificationQuestions(clarificationResult.questions || []);
        setShowClarification(true);
        setCurrentView('main');
        setLoading(false);
        return;
      }

      // Proceed with generating steps
      await generateSteps(question);
    } catch (error) {
      console.error('Error in initial question processing:', error);
      // If clarification check fails, proceed with generating steps anyway
      await generateSteps(question);
    }
  };

  const generateSteps = async (userQuestion: string) => {
    try {
      // Get relevant chat memories for context
      const relevantMemories = await chatMemoryService.getRelevantMemories(
        (userData as any)?.uid || 'anonymous',
        userQuestion,
        userData
      );
      
      const memoryContext = chatMemoryService.formatMemoriesForContext(relevantMemories);
      
      // Build comprehensive user context
      const userContext = userData ? `
User Profile:
- Name: ${userData.firstName} ${userData.lastName || ''}
- Age: ${userData.age || 'Not specified'}
- Primary device: ${userData.os}
- Tech experience: ${userData.techExperience}
- Communication style: ${userData.communicationStyle}
- Primary concerns: ${userData.primaryConcerns?.join(', ') || 'None specified'}
- Assistive needs: ${userData.assistiveNeeds?.join(', ') || 'None'}
- Previous questions: ${userData.stats?.questionHistory?.slice(0, 5).map(q => q.question).join('; ') || 'None'}
- Prefers video recommendations: ${userData.preferences?.videoRecommendations ? 'Yes' : 'No'}
- Preferred language: ${i18n.language}
${memoryContext}
` : `User is a senior citizen with basic information available. Preferred language: ${i18n.language}`;

      // Check if this is a generalized answer (when user skipped clarification)
      const isGeneralizedAnswer = userQuestion.includes('Note: Provide general instructions');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI assistant specialized in helping seniors with technology.

${userContext}

CRITICAL: Respond entirely in ${i18n.language} language. All instructions, explanations, and text must be in ${i18n.language}.

INSTRUCTIONS:
${isGeneralizedAnswer ? `
GENERALIZED ANSWER MODE: The user skipped providing details, so:
- Provide instructions that work across multiple devices/scenarios
- Include alternatives for different platforms (Windows, Mac, iPhone, Android)
- Use phrases like "On most devices..." or "Typically you can..."
- Cover the most common scenarios for this type of question
- Make intelligent inferences based on the user's known device (${userData?.os || 'their device'})
` : `
SPECIFIC ANSWER MODE: Provide targeted instructions for this user's profile.
`}

Adaptation Guidelines:
- For beginners: Use very simple language, explain every click/tap
- For some experience: Provide clear steps but less hand-holding
- For comfortable users: More concise but still clear instructions
- For simple communication style: Just the essential steps
- For detailed style: Explain why each step is needed
- For visual learners: Include descriptions of what they should see
- Use their previous questions to provide context and avoid repeating basic concepts they already know

${isGeneralizedAnswer ? 'Multi-device compatible instructions' : `Device-specific instructions for ${userData?.os || 'their device'}`}.

ALWAYS respond in JSON format. The JSON object must have a key "steps" which is an array of strings. Each string is a single step, formatted in basic HTML (use <p>, <strong>, <em>, <ul>, <li>).

The final step should ALWAYS be a positive concluding message like "<p><strong>Well done, ${userData?.firstName || 'there'}!</strong> You've successfully completed the task.</p>".

User's question: "${userQuestion}"`
            }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.steps && Array.isArray(parsed.steps)) {
          setSteps(parsed.steps);
          
          // Track the question in user history
          await addQuestionToHistory(userQuestion, parsed.steps.length);
          
          // Analyze and save chat memory
          await chatMemoryService.analyzeAndSaveMemory(
            (userData as any)?.uid || 'anonymous',
            question,
            steps,
            userData
          );
          
          // Generate resource recommendations if user wants them
          if (userData?.preferences?.videoRecommendations) {
            await generateResourceRecommendations(userQuestion);
          }
          
          setCurrentView('steps');
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('No response content');
      }
    } catch (error) {
      console.error('Error getting AI help:', error);
      alert(t('error.couldntGetAnswer'));
      setCurrentView('main');
    } finally {
      setLoading(false);
    }
  };

  const generateResourceRecommendations = async (userQuestion: string) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant for seniors. Based on this tech question: "${userQuestion}"

Find 2-3 REAL, EXISTING resources that would help answer this question. Only suggest resources that actually exist.

Focus on these trusted sources:
- YouTube: "Tech for Seniors", "AARP", "Seniors Guide to Tech", "ExplainTech", "TechBoomers"
- Articles: AARP.org, SeniorPlanet.org, TechBoomers.com, major tech company support pages
- Only suggest resources with realistic, working URLs

IMPORTANT: Provide titles and descriptions in ${i18n.language} language.

Respond in JSON format:
{
  "resources": [
    {
      "type": "video" or "article",
      "title": "Resource title in ${i18n.language}",
      "url": "https://realistic-url.com",
      "description": "Brief description in ${i18n.language}",
      "source": "YouTube/AARP/etc",
      "duration": "5 min" (for videos),
      "rating": 4.5 (optional)
    }
  ]
}

IMPORTANT: Only suggest resources that actually exist. Use real YouTube channel names and realistic URLs.
For YouTube videos, use format: https://youtube.com/watch?v=realistic-video-id
For articles, use real website domains like aarp.org, seniorplanet.org, etc.`
            }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.resources && Array.isArray(parsed.resources)) {
          setResources(parsed.resources);
        }
      }
    } catch (error) {
      console.error('Error generating resource recommendations:', error);
      // Don't show error to user, just skip recommendations
    }
  };

  const handleClarificationSubmit = async (clarification: string) => {
    if (clarification === 'SKIP_CLARIFICATION') {
      handleSkipClarification();
      return;
    }
    
    const enhancedQuestion = `${question}\n\nAdditional details: ${clarification}`;
    setQuestion(enhancedQuestion);
    setShowClarification(false);
    setLoading(true);
    setCurrentView('loading');
    
    await generateSteps(enhancedQuestion);
  };

  const handleSkipClarification = async () => {
    setShowClarification(false);
    setLoading(true);
    setCurrentView('loading');
    
    // Generate a general answer that covers multiple scenarios
    const generalQuestion = `${question}\n\nNote: Provide general instructions that work for multiple devices/scenarios since the user skipped providing specific details. Make intelligent inferences based on their profile and provide the most helpful general guidance.`;
    await generateSteps(generalQuestion);
  };
  
  const handleResourceClick = (resource: any) => {
    // Save interaction to cookies for analytics
    const interactions = JSON.parse(Cookies.get('resourceInteractions') || '[]');
    interactions.push({
      resource: resource.title,
      timestamp: new Date().toISOString(),
      question: question
    });
    Cookies.set('resourceInteractions', JSON.stringify(interactions.slice(-50)), { expires: 30 });
    
    // Open resource in new tab
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleVoiceInput = () => {
    if (speechStatus === 'recording') {
      // Stop recording
      speechService.stopRecording();
      setSpeechStatus('processing');
    } else {
      // Start recording with AssemblyAI
      setSpeechStatus('recording');
      
      speechService.startRecording(
        // onTranscript
        (transcript: string) => {
          setQuestion(transcript);
          setSpeechStatus('complete');
          
          // Auto-clear status after 2 seconds
          setTimeout(() => {
            setSpeechStatus('idle');
          }, 2000);
        },
        // onError
        (error: string) => {
          console.error('Speech recognition error:', error);
          alert(error);
          setSpeechStatus('error');
          
          // Auto-clear status after 3 seconds
          setTimeout(() => {
            setSpeechStatus('idle');
          }, 3000);
        },
        // onStatusChange
        (status: 'recording' | 'processing' | 'complete' | 'error') => {
          setSpeechStatus(status);
        }
      );
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setQuestion('');
    setSteps([]);
    setResources([]);
    setNeedsClarification(false);
    setClarificationQuestions([]);
    setOriginalQuestion('');
    
    // Mark the current question as completed if we have one
    if (originalQuestion && steps.length > 0) {
      markQuestionCompleted(originalQuestion);
    }
  };

  const handleNeedHelp = () => {
    crispService.openChat({
      question: originalQuestion || question,
      steps: steps,
      userProfile: userData
    });
  };

  if (currentView === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl text-gray-700 font-medium mb-2">{t('dashboard.craftingSteps')}</p>
          <p className="text-gray-500">{t('dashboard.takesAMoment')}</p>
        </div>
      </div>
    );
  }

  if (currentView === 'steps') {
    return (
      <StepsView 
        steps={steps} 
        resources={resources}
        onBack={handleBackToMain}
        onResourceClick={handleResourceClick}
        userName={userData?.firstName}
        userProfile={userData}
        originalQuestion={originalQuestion}
        updateUserData={updateUserData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Language Setup Notification */}
      <LanguageNotificationBanner />
      {/* Responsive Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
                  {userData ? t('dashboard.welcomeUser', { name: userData.firstName }) : t('dashboard.welcome')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">{t('dashboard.ready')}</p>
              </div>
            </div>
            {/* Desktop Nav: show on sm and up */}
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
              <Link 
                to="/settings" 
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                title={t('common.settings')}
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={logout}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                title={t('common.signOut')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            {/* Mobile Hamburger: show below sm */}
            <button
              className="sm:hidden p-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              aria-label="Menu"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Mobile Menu Drawer: only show below sm */}
        {showMobileMenu && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 z-50 shadow-md animate-slide-down">
            <div className="flex flex-col items-center py-2">
              <Link 
                to="/settings" 
                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 text-center"
                onClick={() => setShowMobileMenu(false)}
              >
                <Settings className="inline w-5 h-5 mr-2" /> {t('common.settings')}
              </Link>
              <button 
                onClick={() => { setShowMobileMenu(false); logout(); }}
                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 text-center"
              >
                <LogOut className="inline w-5 h-5 mr-2" /> {t('common.signOut')}
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-2 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-4 md:space-y-8">
            {/* Main Interface */}
            <div className="card p-4 sm:p-8 text-center rounded-xl shadow-md bg-white">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                {t('dashboard.getHelp')}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
                {t('dashboard.askQuestion')}
              </p>
              
              <div className="relative mb-3 sm:mb-6">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t('dashboard.placeholder')}
                  className="input-field text-base sm:text-lg p-3 sm:p-6 text-center resize-none min-h-[80px] sm:min-h-[120px] w-full rounded-lg border border-gray-200 focus:border-blue-400"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                />
                {userData?.preferences?.voiceInput && (
                  <>
                    <button
                      onClick={handleVoiceInput}
                      disabled={speechStatus === 'processing'}
                      className={`absolute right-2 bottom-2 sm:right-4 sm:bottom-4 p-2 sm:p-3 rounded-full transition-all duration-200 ${
                        speechStatus === 'recording'
                          ? 'bg-red-100 text-red-600 animate-pulse' 
                          : speechStatus === 'processing'
                          ? 'bg-yellow-100 text-yellow-600'
                          : speechStatus === 'complete'
                          ? 'bg-green-100 text-green-600'
                          : speechStatus === 'error'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-110'
                      }`}
                      title={
                        speechStatus === 'recording' ? t('voice.stopRecording') :
                        speechStatus === 'processing' ? t('voice.processing') :
                        speechStatus === 'complete' ? t('voice.recognized') :
                        speechStatus === 'error' ? t('voice.failed') :
                        t('voice.startInput')
                      }
                    >
                      {speechStatus === 'recording' ? (
                        <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : speechStatus === 'processing' ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </button>
                    {speechStatus === 'recording' && (
                      <div className="absolute left-2 bottom-2 sm:left-4 sm:bottom-4 bg-white text-red-600 text-xs sm:text-sm rounded px-2 py-1 shadow-md border border-red-200 animate-pulse z-10">
                        {t('voice.pressToStop', 'Press the button again to stop recording.')}
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={handleAskQuestion}
                disabled={loading || !question.trim()}
                className="btn-primary w-full text-base px-4 py-3 sm:text-lg sm:px-8 sm:py-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {loading ? t('dashboard.gettingSteps') : t('dashboard.getSteps')}
              </button>
              
              {needsClarification && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{t('dashboard.needMoreInfo')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="card p-4 sm:p-8 rounded-xl shadow-md bg-white">
              <div className="flex items-center justify-between mb-3 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">{t('dashboard.quickTips')}</h2>
                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickTips.map((tip, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuestion(tip.title);
                      handleAskQuestion();
                    }}
                    className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <tip.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 group-hover:text-blue-800 text-base">{tip.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{tip.description}</p>
                      <span className="text-xs text-blue-600 mt-1 block">{tip.category}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Questions */}
            <div className="card p-4 sm:p-8 rounded-xl shadow-md bg-white">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-6">{t('dashboard.popularQuestions')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {popularQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuestion(q);
                      handleAskQuestion();
                    }}
                    className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group flex items-center justify-between"
                  >
                    <span className="text-gray-700 group-hover:text-blue-800 text-base">{q}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="card p-4 rounded-xl shadow-md bg-white">
              <h3 className="text-base font-semibold text-gray-800 mb-3">{t('dashboard.quickActions')}</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAITools(true)}
                  className="w-full p-4 text-left rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                      <Camera className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{t('aiTools.title')}</h4>
                      <p className="text-sm text-gray-600">{t('aiTools.description')}</p>
                    </div>
                  </div>
                </button>

                <Link 
                  to="/settings"
                  className="block w-full p-4 text-left rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{t('common.settings')}</h4>
                      <p className="text-sm text-gray-600">{t('settings.customizePrefs')}</p>
                    </div>
                  </div>
                </Link>

                <Link 
                  to="/learning"
                  className="block w-full p-4 text-left rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{t('learning.title')}</h4>
                      <p className="text-sm text-gray-600">{t('learning.structuredCourses')}</p>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    // Show popular questions in the main interface
                    const randomTip = quickTips[Math.floor(Math.random() * quickTips.length)];
                    setQuestion(randomTip.title);
                  }}
                  className="w-full p-4 text-left rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200">
                      <Lightbulb className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{t('dashboard.browseTips')}</h4>
                      <p className="text-sm text-gray-600">{t('dashboard.commonSolutions')}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-4 rounded-xl shadow-md bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800">{t('dashboard.recentActivity')}</h3>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-800 mb-1">{activity.question}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{activity.time}</span>
                      <span>{t('dashboard.stepsCompleted', { count: activity.steps })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="card p-4 rounded-xl shadow-md bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800">{t('dashboard.yourProgress')}</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${achievement.unlocked ? 'bg-green-500' : 'bg-gray-400'}`}> 
                        <achievement.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}`}> 
                          {achievement.title}
                        </p>
                        <p className={`text-xs ${achievement.unlocked ? 'text-green-600' : 'text-gray-500'}`}> 
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help & Support */}
            <div className="card p-4 rounded-xl shadow-md bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800">{t('dashboard.needHelp')}</h3>
                <HelpCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-gray-600">
                  {t('dashboard.helpingHand')}
                </p>
                <button 
                  onClick={handleNeedHelp}
                  className="w-full p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {t('dashboard.chatHuman')}
                </button>
                <button className="w-full p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">{t('dashboard.browseGuides')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIToolsModal 
        isOpen={showAITools} 
        onClose={() => setShowAITools(false)} 
      />
      
      <ClarificationModal
        isOpen={showClarification}
        onClose={() => {
          setShowClarification(false);
          setNeedsClarification(false);
        }}
        question={question}
        clarificationQuestions={clarificationQuestions}
        onSubmitClarification={handleClarificationSubmit}
        loading={loading}
      />
    </div>
  );
};

export default DashboardPage;