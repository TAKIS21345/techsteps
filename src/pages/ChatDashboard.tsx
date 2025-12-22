import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardStep } from '../types/services';
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
import { DEFAULT_GEMINI_CONFIG } from '../services/ai/config';

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

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Initialize Gemini SDK
  const genAI = useMemo(() => {
    if (!GEMINI_API_KEY) return null;
    return new GoogleGenerativeAI(GEMINI_API_KEY);
  }, [GEMINI_API_KEY]);

  // Sync TTS events with Avatar Context
  useEffect(() => {
    ttsService.setCallbacks({
      onSpeakStart: () => setSpeaking(true),
      onSpeakEnd: () => setSpeaking(false),
      onAudioLevel: (_level) => { /* Optional: visualization logic */ }
    });
  }, [setSpeaking]);

  // Load History & Facts
  useEffect(() => {
    const loadData = async () => {
      const userId = user?.uid || 'guest';

      // Load Chat History
      const history = await MemoryService.getHistory(userId);
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Welcome Message if no history
        const welcomeText = t('chat.welcomeMessage', 'Hello {{name}}! I\'m here to help.', { name: userData?.firstName || 'friend' });
        const welcomeMessage: Message = { id: 'welcome', content: welcomeText, sender: 'ai', timestamp: new Date() };
        setMessages([welcomeMessage]);
        await MemoryService.saveMessage(userId, welcomeMessage);
      }
    };

    loadData();
  }, [user?.uid]);

  const handleAvatarClick = () => {
    if (avatarState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
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
    } else {
      alert("Speech not supported");
    }
  };

  const stopListening = () => {
    setListening(false);
  };

  const handleSendMessage = async (messageContent: string, attachments: File[] = []) => {
    const userId = user?.uid || 'guest';

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
        return;
      }
      if (command.action === 'help' && command.response) {
        const userMsg: Message = { id: 'cmd-' + Date.now(), content: messageContent, sender: 'user', timestamp: new Date() };
        const aiMsg: Message = { id: 'sys-' + Date.now(), content: command.response, sender: 'ai', timestamp: new Date() };

        setMessages(prev => [...prev, userMsg, aiMsg]);

        await MemoryService.saveMessage(userId, userMsg);
        await MemoryService.saveMessage(userId, aiMsg);
        return;
      }
    }


    try {
      // Upload attachments if any
      const uploadedAttachments: { type: 'image' | 'video' | 'file'; url: string; name: string }[] = [];

      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            const url = await StorageService.uploadFile(file, `users/${userId}/uploads`);
            uploadedAttachments.push({
              type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
              url,
              name: file.name
            });
          } catch (err) {
            console.error("Failed to upload file:", file.name, err);
            // Continue with other files or show error? For now continuing.
          }
        }
      }

      // 2. Add user message
      const userMessage: Message = {
        id: 'user-' + Date.now(),
        content: messageContent,
        sender: 'user',
        timestamp: new Date(),
        attachments: uploadedAttachments
      };

      // Optimistic update
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Save User Message
      await MemoryService.saveMessage(userId, userMessage);
      // Fetch Known Facts
      const knownFacts = await MemoryService.getFacts(userId);
      const factsContext = knownFacts.length > 0
        ? `KNOWN USER FACTS:\n${knownFacts.map(f => `- ${f}`).join('\n')}\n`
        : "";

      // Construct History Context
      const historyContext = updatedMessages.slice(-10).map(m =>
        `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      // Enhanced System Prompt
      const systemPrompt = `You are TechSteps Expert, a world-class technology specialist who is also exceptionally patient and warm with seniors.
       
       YOUR MISSION:
       1. Be the ultimate technical problem solver. You understand all devices (iOS, Android, Windows, Mac), apps, hardware, and software issues deeply.
       2. Translate complex tech problems into simple, manageable, and encouraging steps for a senior learner.
       3. Use your deep technical knowledge and perform a Google Search if you need up-to-date or specific information to solve the user's problem.
       
       ${factsContext}
       
       CONTEXT:
       ${historyContext}
       
       INSTRUCTIONS:
       1. Answer the User's latest question with absolute technical accuracy but simplified language.
       2. If the user mentions a new important detail about themselves (e.g., "I have an iPad", "I am 70 years old", "I like cooking"), extract it as a "new_fact".
       3. IMPORTANT: YOU MUST RESPOND IN THE LANGUAGE: "${i18n.language}". Translate EVERYTHING.
       4. OUTPUT FORMAT: You MUST return a JSON object. Do not return plain text.
       
       JSON Structure:
       {
         "display_text": "The full, rich text to show on screen. Use clear formatting.",
         "spoken_text": "A simple, concise summary for audio. NO markdown.",
         "new_facts": ["User has an iPad"], 
         "flashcards": {  
            "type": "guide",
            "summary": "Brief summary of the actions",
            "steps": [ { "title": "Step 1", "content": "..." } ]
         }
       }
       
       FLASHCARD RULES:
       - ONLY include the "flashcards" object if you are providing specific, actionable steps to solve a problem or perform a task.
       - If you are just chatting, explaining a concept WITHOUT steps, or asking a question, YOU MUST OMIT the "flashcards" property or set it to null.
       - Do not make up steps for random things; only for actual technical instructions.
       
       KEEP "spoken_text" SHORT. User complains about long talking.
       `;

      if (!genAI) throw new Error("AI Service not initialized");

      const model = genAI.getGenerativeModel({
        model: DEFAULT_GEMINI_CONFIG.model,
        tools: [{ googleSearch: {} }] as any,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ]
      });

      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text();

      const rawText = responseText || "{}";

      let displayText = t('chat.error.understanding', "I'm sorry, I couldn't understand that.");
      let spokenText = t('chat.error.understanding', "I'm sorry, I couldn't understand that.");

      try {
        // Robust JSON extraction
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          if (parsed.display_text) displayText = parsed.display_text;
          if (parsed.spoken_text) spokenText = parsed.spoken_text;
          else spokenText = displayText; // Fallback

          // Handle New Facts
          if (parsed.new_facts && Array.isArray(parsed.new_facts)) {
            for (const fact of parsed.new_facts) {
              await MemoryService.saveFact(userId, fact);
              console.log("Learned new fact:", fact);
            }
          }

          // Handle Flashcards - show loading state first
          if (parsed.flashcards && parsed.flashcards.type === 'guide' && parsed.flashcards.steps) {
            setIsGeneratingFlashcards(true);
            // Short delay to show loading animation
            setTimeout(() => {
              setFlashcardSteps(parsed.flashcards.steps);
              setIsGeneratingFlashcards(false);
              setShowFlashcards(true);
            }, 1200); // Show loader for 1.2 seconds minimum
          }
        } else {
          // Fallback if model refuses JSON
          displayText = rawText;
          spokenText = rawText;
        }
      } catch (e) {
        console.error("JSON Parse Error", e);
        displayText = rawText;
        spokenText = rawText;
      }

      const aiMessage: Message = { id: 'ai-' + Date.now(), content: displayText || "", sender: 'ai', timestamp: new Date() };

      setMessages(prev => [...prev, aiMessage]);
      await MemoryService.saveMessage(userId, aiMessage);

      // Speak the OPTIMIZED spoken text
      ttsService.speak(spokenText || "", { lang: i18n.language });

    } catch (e: any) {
      console.error(e);
      setEmotion('concerned');

      let errorMsg = t('chat.error.connection', "I'm having trouble connecting right now. Please try again.");

      if (e.message?.includes('429') || e.message?.toLowerCase().includes('too many requests')) {
        errorMsg = "I'm a bit busy right now because too many people are asking questions! Please wait just a moment and try asking me again.";
      }

      setMessages(prev => [...prev, { id: 'err-' + Date.now(), content: errorMsg, sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setThinking(false);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-50">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-3xl" />

      {/* Header */}
      <div className="absolute top-0 w-full z-40 p-4 flex justify-between items-center">
        <div className="glass-panel px-4 py-2 rounded-xl font-bold text-indigo-900">TechSteps AI</div>
        <Link to="/settings" className="p-2 bg-white/50 rounded-full"><Settings className="w-6 h-6 text-gray-700" /></Link>
      </div>

      {/* Avatar (Fixed position) */}
      <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50 transform md:scale-100 scale-75 origin-bottom-left">
        <EnhancedAvatarCompanion onAvatarClick={handleAvatarClick} />
      </div>

      {/* Chat Area */}
      {/* Reduced padding to bring chat closer to avatar, responsive side padding */}
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

        {/* Flashcard Loader (When generating) */}
        {isGeneratingFlashcards && (
          <div className="w-full md:w-1/2 glass-panel rounded-3xl flex items-center justify-center min-h-[300px]">
            <FlashcardLoader isVisible={true} message="Generating your guide..." />
          </div>
        )}

        {/* Flashcards Panel (When ready) */}
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