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
  Lightbulb,
  HelpCircle,
  ChevronRight,
  Phone,
  Wifi,
  Smartphone,
  Laptop,
  AlertCircle,
  Menu,
  X
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
    if (userData) {
      const userInfo: any = {};
      try {
        const auth = require('../contexts/AuthContext');
        const authUser = auth?.useAuth?.().user;
        if (authUser && typeof authUser.email === 'string' && authUser.email.trim()) {
          userInfo.email = authUser.email;
        }
      } catch {}
      if (!userInfo.email && (userData as any).email && typeof (userData as any).email === 'string' && (userData as any).email.trim()) {
        userInfo.email = (userData as any).email;
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

  // Simplified quick tips for seniors
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

  // Simple popular questions for seniors
  const popularQuestions = [
    t('questions.makeTextBigger'),
    t('questions.connectWifi'),
    t('questions.takeScreenshot'),
    t('questions.makeVideoCall')
  ];

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
      const relevantMemories = await chatMemoryService.getRelevantMemories(
        (userData as any)?.uid || 'anonymous',
        question,
        userData
      );
      
      const memoryContext = chatMemoryService.formatMemoriesForContext(relevantMemories);
      
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

      await generateSteps(question);
    } catch (error) {
      console.error('Error in initial question processing:', error);
      await generateSteps(question);
    }
  };

  const generateSteps = async (userQuestion: string) => {
    try {
      const relevantMemories = await chatMemoryService.getRelevantMemories(
        (userData as any)?.uid || 'anonymous',
        userQuestion,
        userData
      );
      
      const memoryContext = chatMemoryService.formatMemoriesForContext(relevantMemories);
      
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
          
          await addQuestionToHistory(userQuestion, parsed.steps.length);
          
          await chatMemoryService.analyzeAndSaveMemory(
            (userData as any)?.uid || 'anonymous',
            question,
            steps,
            userData
          );
          
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
    
    const generalQuestion = `${question}\n\nNote: Provide general instructions that work for multiple devices/scenarios since the user skipped providing specific details. Make intelligent inferences based on their profile and provide the most helpful general guidance.`;
    await generateSteps(generalQuestion);
  };
  
  const handleResourceClick = (resource: any) => {
    const interactions = JSON.parse(Cookies.get('resourceInteractions') || '[]');
    interactions.push({
      resource: resource.title,
      timestamp: new Date().toISOString(),
      question: question
    });
    Cookies.set('resourceInteractions', JSON.stringify(interactions.slice(-50)), { expires: 30 });
    
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleVoiceInput = () => {
    if (speechStatus === 'recording') {
      speechService.stopRecording();
      setSpeechStatus('processing');
    } else {
      setSpeechStatus('recording');
      
      speechService.startRecording(
        (transcript: string) => {
          setQuestion(transcript);
          setSpeechStatus('complete');
          
          setTimeout(() => {
            setSpeechStatus('idle');
          }, 2000);
        },
        (error: string) => {
          console.error('Speech recognition error:', error);
          alert(error);
          setSpeechStatus('error');
          
          setTimeout(() => {
            setSpeechStatus('idle');
          }, 3000);
        },
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center senior-friendly">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-2xl text-gray-700 font-medium mb-4">{t('dashboard.craftingSteps')}</h2>
          <p className="text-lg text-gray-500">{t('dashboard.takesAMoment')}</p>
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
    <div className="min-h-screen bg-white senior-friendly">
      <LanguageNotificationBanner />
      
      {/* Simplified Header */}
      <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {userData ? t('dashboard.welcomeUser', { name: userData.firstName }) : t('dashboard.welcome')}
                </h1>
                <p className="text-lg text-gray-600">{t('dashboard.ready')}</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/learning"
                className="px-6 py-3 bg-green-100 text-green-800 rounded-xl hover:bg-green-200 transition-colors font-medium"
              >
                <BookOpen className="inline w-5 h-5 mr-2" />
                {t('learning.title')}
              </Link>
              <Link 
                to="/settings" 
                className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                <Settings className="inline w-5 h-5 mr-2" />
                {t('common.settings')}
              </Link>
              <button 
                onClick={logout}
                className="px-6 py-3 bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors font-medium"
              >
                <LogOut className="inline w-5 h-5 mr-2" />
                {t('common.signOut')}
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t-2 border-gray-100 p-4">
            <div className="space-y-3">
              <Link 
                to="/learning"
                className="block w-full p-4 bg-green-100 text-green-800 rounded-xl hover:bg-green-200 transition-colors font-medium text-center"
                onClick={() => setShowMobileMenu(false)}
              >
                <BookOpen className="inline w-5 h-5 mr-2" />
                {t('learning.title')}
              </Link>
              <Link 
                to="/settings" 
                className="block w-full p-4 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium text-center"
                onClick={() => setShowMobileMenu(false)}
              >
                <Settings className="inline w-5 h-5 mr-2" />
                {t('common.settings')}
              </Link>
              <button 
                onClick={() => { setShowMobileMenu(false); logout(); }}
                className="w-full p-4 bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors font-medium"
              >
                <LogOut className="inline w-5 h-5 mr-2" />
                {t('common.signOut')}
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Main Question Interface - Prominent and Clean */}
        <div className="card p-10 text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {t('dashboard.getHelp')}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('dashboard.askQuestion')}
          </p>
          
          <div className="relative mb-8">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('dashboard.placeholder')}
              className="input-field text-xl p-8 text-center resize-none min-h-[140px] w-full rounded-xl border-2 border-gray-200 focus:border-blue-400"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskQuestion();
                }
              }}
            />
            {userData?.preferences?.voiceInput && (
              <button
                onClick={handleVoiceInput}
                disabled={speechStatus === 'processing'}
                className={`absolute right-4 bottom-4 p-4 rounded-full transition-all duration-200 ${
                  speechStatus === 'recording'
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : speechStatus === 'processing'
                    ? 'bg-yellow-100 text-yellow-600'
                    : speechStatus === 'complete'
                    ? 'bg-green-100 text-green-600'
                    : speechStatus === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
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
                  <MicOff className="w-6 h-6" />
                ) : speechStatus === 'processing' ? (
                  <div className="w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            )}
          </div>

          <button
            onClick={handleAskQuestion}
            disabled={loading || !question.trim()}
            className="btn-primary text-xl px-12 py-5 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl mb-6"
          >
            {loading ? t('dashboard.gettingSteps') : t('dashboard.getSteps')}
          </button>
          
          {needsClarification && (
            <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-center justify-center space-x-3 text-amber-800">
                <AlertCircle className="w-6 h-6" />
                <span className="font-medium text-lg">{t('dashboard.needMoreInfo')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Popular Questions - Simplified */}
        <div className="card p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <Lightbulb className="w-8 h-8 text-yellow-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.popularQuestions')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuestion(q);
                  handleAskQuestion();
                }}
                className="text-left p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group flex items-center justify-between"
              >
                <span className="text-gray-700 group-hover:text-blue-800 text-lg font-medium flex-1">{q}</span>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 ml-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setShowAITools(true)}
            className="card p-6 text-center hover:bg-purple-50 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
              <Camera className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('aiTools.title')}</h3>
            <p className="text-gray-600">{t('aiTools.description')}</p>
          </button>

          <Link 
            to="/learning"
            className="card p-6 text-center hover:bg-green-50 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('learning.title')}</h3>
            <p className="text-gray-600">{t('learning.structuredCourses')}</p>
          </Link>

          <button
            onClick={handleNeedHelp}
            className="card p-6 text-center hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('dashboard.needHelp')}</h3>
            <p className="text-gray-600">{t('dashboard.chatHuman')}</p>
          </button>
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