import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { FlashcardStep } from '../types/services';
import { Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EnhancedAvatarCompanion from '../components/ai/EnhancedAvatarCompanion';
import ChatInterface from '../components/ai/ChatInterface';
import FlashcardPanel from '../components/ai/FlashcardPanel';
import { ttsService } from '../services/TextToSpeechService';
import { AvatarProvider, useAvatar } from '../contexts/AvatarContext';
import { parseCommand } from '../utils/CommandParser';
import { MemoryService, Message } from '../services/MemoryService';

const ChatDashboardContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userData } = useUser();
  const navigate = useNavigate();
  const { state: avatarState, setEmotion, setListening, setSpeaking, setThinking } = useAvatar();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flashcardSteps, setFlashcardSteps] = useState<FlashcardStep[]>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
      const userId = userData?.id || 'guest';

      // Load Chat History
      const history = await MemoryService.getHistory(userId);
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Welcome Message if no history
        const welcomeText = t('chat.welcome', 'Hello {{name}}! I\'m here to help.', { name: userData?.firstName || 'friend' });
        const welcomeMessage: Message = { id: 'welcome', content: welcomeText, sender: 'ai', timestamp: new Date() };
        setMessages([welcomeMessage]);
        await MemoryService.saveMessage(userId, welcomeMessage);
      }
    };

    loadData();
  }, [userData?.id]);

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

  const handleSendMessage = async (messageContent: string) => {
    const userId = userData?.id || 'guest';

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

    // 2. Add user message
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date()
    };

    // Optimistic update
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Save User Message
    await MemoryService.saveMessage(userId, userMessage);

    setIsLoading(true);
    setThinking(true);

    try {
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
      const systemPrompt = `You are TechSteps, a helpful assistant for seniors.
       
       ${factsContext}
       
       CONTEXT:
       ${historyContext}
       
       INSTRUCTIONS:
       1. Answer the User's latest question based on the history and Known User Facts.
       2. If the user mentions a new important detail about themselves (e.g., "I have an iPad", "I am 70 years old", "I like cooking"), extract it as a "new_fact".
       3. IMPORTANT: YOU MUST RESPOND IN THE LANGUAGE: "${i18n.language}" (e.g. if 'es', Spanish; if 'fr', French). Translate your entire response including "display_text", "spoken_text", and "flashcards" content to this language.
       4. OUTPUT FORMAT: You MUST return a JSON object. Do not return plain text.
       
       JSON Structure:
       {
         "display_text": "The full, rich text to show on screen. Use formatting if needed.",
         "spoken_text": "A simple, concise summary for text-to-speech. NO markdown, NO lists, just natural speech sentences.",
         "new_facts": ["User has an iPad"], 
         "flashcards": {  
            "type": "guide",
            "summary": "Brief summary",
            "steps": [ { "title": "Step 1", "content": "..." } ]
         }
       }
       
       If you need clarification, set "display_text" to the question and "spoken_text" to the same question.
       KEEP "spoken_text" SHORT. User complains about long talking.
       `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      if (!response.ok) throw new Error("API Request Failed");

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

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

          // Handle Flashcards
          if (parsed.flashcards && parsed.flashcards.type === 'guide' && parsed.flashcards.steps) {
            setFlashcardSteps(parsed.flashcards.steps);
            setShowFlashcards(true);
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

    } catch (e) {
      console.error(e);
      setEmotion('concerned');
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), content: t('chat.error.connection', "I'm having trouble connecting right now. Please try again."), sender: 'ai', timestamp: new Date() }]);
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
      <div className="fixed bottom-4 left-4 z-50">
        <EnhancedAvatarCompanion onAvatarClick={handleAvatarClick} />
      </div>

      {/* Chat Area */}
      <div className="h-full pt-20 pb-4 px-4 w-full max-w-5xl mx-auto flex gap-4">
        <div className={`flex-1 glass-panel rounded-3xl overflow-hidden transition-all duration-500 ease-in-out ${showFlashcards ? 'w-1/2' : 'w-full'}`}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isListening={avatarState.isListening}
            currentTranscript={currentTranscript}
          />
        </div>

        {/* Flashcards Panel (Conditional) */}
        {showFlashcards && (
          <div className="w-1/2 glass-panel rounded-3xl p-4 animate-in slide-in-from-right duration-500">
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