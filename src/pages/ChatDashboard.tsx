import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardStep, ConversationContext } from '../types/services';
import { Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EnhancedAvatarCompanion from '../components/ai/EnhancedAvatarCompanion';
import ChatInterface from '../components/ai/ChatInterface';
import FlashcardPanel from '../components/ai/FlashcardPanel';
import FlashcardLoader from '../components/ai/FlashcardLoader';
import { ttsService } from '../services/TextToSpeechService';
import { AvatarProvider, useAvatar } from '../contexts/AvatarContext';
import { parseCommand } from '../utils/CommandParser';
import { MemoryService, Message } from '../services/MemoryService';
import { StorageService } from '../services/StorageService';
import { getAIService } from '../services/ai';

const ChatDashboardContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userData } = useUser();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state: avatarState, setEmotion, setListening, setSpeaking, setThinking } = useAvatar();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flashcardSteps, setFlashcardSteps] = useState<FlashcardStep[]>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // Sync TTS events with Avatar Context
  useEffect(() => {
    ttsService.setCallbacks({
      onSpeakStart: () => setSpeaking(true),
      onSpeakEnd: () => setSpeaking(false),
      onAudioLevel: (_level) => { /* Optional: visualization logic */ }
    });
  }, [setSpeaking]);

  // Load History
  useEffect(() => {
    const loadData = async () => {
      const userId = user?.uid || 'guest';
      const history = await MemoryService.getHistory(userId);
      if (history.length > 0) {
        setMessages(history);
      } else {
        const welcomeText = t('chat.welcomeMessage', 'Hello {{name}}! I\'m here to help.', { name: userData?.firstName || 'friend' });
        const welcomeMessage: Message = { id: 'welcome', content: welcomeText, sender: 'ai', timestamp: new Date() };
        setMessages([welcomeMessage]);
        await MemoryService.saveMessage(userId, welcomeMessage);
      }
    };
    loadData();
  }, [user?.uid, userData?.firstName, t]);

  const handleSendMessage = async (messageContent: string, attachments: File[] = []) => {
    const userId = user?.uid || 'guest';
    setIsLoading(true);
    setThinking(true);

    // 1. Check for system commands
    const command = parseCommand(messageContent);
    if (command) {
      if (command.action === 'navigate' && command.target) {
        const userMsg: Message = { id: 'cmd-' + Date.now(), content: messageContent, sender: 'user', timestamp: new Date() };
        const aiMsg: Message = { id: 'sys-' + Date.now(), content: t('chat.navigating', 'Navigating to {{target}}...', { target: command.target }), sender: 'ai', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg, aiMsg]);
        await MemoryService.saveMessage(userId, userMsg);
        await MemoryService.saveMessage(userId, aiMsg);
        setTimeout(() => navigate(command.target!), 1000);
        setIsLoading(false);
        setThinking(false);
        return;
      }
    }

    try {
      // 2. Add user message
      const userMessage: Message = {
        id: 'user-' + Date.now(),
        content: messageContent,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      await MemoryService.saveMessage(userId, userMessage);

      // 3. Call Central AI Service
      const aiService = getAIService();

      // Fetch known facts for memory focus
      const knownFacts = await MemoryService.getFacts(userId);

      const context: ConversationContext = {
        userId,
        currentPage: 'chat',
        userSkillLevel: userData?.skillLevel || 'beginner',
        failureCount: 0,
        knownFacts: knownFacts
      };

      const response = await aiService.sendMessage(messageContent, context);

      const aiMessage: Message = {
        id: 'ai-' + Date.now(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      await MemoryService.saveMessage(userId, aiMessage);

      // 4. Save any extracted facts to the database
      if (response.extractedFacts && response.extractedFacts.length > 0) {
        console.log('Saving learned facts:', response.extractedFacts);
        for (const fact of response.extractedFacts) {
          await MemoryService.saveFact(userId, fact);
        }
      }

      // 5. Handle Flashcards (NEW)
      if (response.flashcards && response.flashcards.length > 0) {
        console.log('Displaying generated flashcards:', response.flashcards);
        setShowFlashcards(false); // Briefly close to trigger any animation/reset
        setFlashcardSteps(response.flashcards as FlashcardStep[]);
        setTimeout(() => setShowFlashcards(true), 50);
      } else {
        setShowFlashcards(false);
      }

      // 6. Speak (use optimized spokenText if available)
      const textToSpeak = response.spokenText || response.content;
      ttsService.speak(textToSpeak, { lang: i18n.language });

    } catch (e: any) {
      console.error('Chat Error:', e);
      setEmotion('concerned');
      const errorMsg = e.message?.includes('429')
        ? "I'm a bit overwhelmed right now! Please try again in a few seconds."
        : "I'm having a little trouble connecting. Could you try that again?";

      setMessages(prev => [...prev, { id: 'err-' + Date.now(), content: errorMsg, sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setThinking(false);
    }
  };

  const handleAvatarClick = () => {
    if (avatarState.isListening) setListening(false);
    else startListening();
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = i18n.language === 'en' ? 'en-US' : (i18n.language === 'es' ? 'es-ES' : 'fr-FR');
      recognition.onstart = () => {
        setListening(true);
        setCurrentTranscript('');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentTranscript(transcript);
        if (event.results[0].isFinal) {
          handleSendMessage(transcript);
        }
      };
      recognition.onend = () => setListening(false);
      recognition.start();
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-50">
      <div className="absolute top-0 w-full z-40 p-4 flex justify-between items-center">
        <div className="glass-panel px-4 py-2 rounded-xl font-bold text-indigo-900">TechSteps AI</div>
        <Link to="/settings" className="p-2 bg-white/50 rounded-full"><Settings className="w-6 h-6 text-gray-700" /></Link>
      </div>

      <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50 transform md:scale-100 scale-75 origin-bottom-left">
        <EnhancedAvatarCompanion onAvatarClick={handleAvatarClick} />
      </div>

      <div className="h-full pt-20 pb-4 px-4 pl-4 md:pl-24 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-4">
        <div className={`flex-1 glass-panel rounded-3xl overflow-hidden transition-all duration-500 ease-in-out ${showFlashcards ? 'md:w-1/2' : 'w-full'}`}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isListening={avatarState.isListening}
            currentTranscript={currentTranscript}
          />
        </div>

        {isGeneratingFlashcards && (
          <div className="w-full md:w-1/2 glass-panel rounded-3xl flex items-center justify-center min-h-[300px]">
            <FlashcardLoader isVisible={true} message="Generating your guide..." />
          </div>
        )}

        {showFlashcards && !isGeneratingFlashcards && (
          <div className="w-full md:w-1/2 glass-panel rounded-3xl p-4 animate-in slide-in-from-right duration-500 min-h-[300px]">
            <FlashcardPanel steps={flashcardSteps} isVisible={true} onClose={() => setShowFlashcards(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

const ChatDashboard: React.FC = () => (
  <AvatarProvider>
    <ChatDashboardContent />
  </AvatarProvider>
);

export default ChatDashboard;