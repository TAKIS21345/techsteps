import React, { useEffect, useRef, useState } from 'react';

interface SimpleAvatarProps {
  isVisible: boolean;
  textToSpeak?: string;
  onSpeechComplete?: () => void;
  className?: string;
}

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({
  isVisible,
  textToSpeak,
  onSpeechComplete,
  className = ''
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  // Animation loop for speaking mouth
  useEffect(() => {
    if (isSpeaking) {
      const animate = () => {
        updateAvatarImage();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      updateAvatarImage(); // Update once when stopped speaking
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking]);

  // Create/update avatar image
  const updateAvatarImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, '#e0f2fe');
    gradient.addColorStop(1, '#bae6fd');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);
    
    // Head
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(100, 80, 45, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(85, 70, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(115, 70, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth (changes based on speaking state with animation)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    if (isSpeaking) {
      // Animated mouth when speaking - varies size for lip sync effect
      const time = Date.now() * 0.01;
      const mouthSize = 6 + Math.sin(time) * 3; // Oscillates between 3 and 9
      const mouthHeight = 4 + Math.sin(time * 1.5) * 2; // Varies height
      ctx.ellipse(100, 95, mouthSize, mouthHeight, 0, 0, Math.PI);
    } else {
      // Closed mouth when not speaking
      ctx.arc(100, 95, 4, 0, Math.PI);
    }
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(70, 125, 60, 75);
    
    // Arms
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(50, 135, 20, 40);
    ctx.fillRect(130, 135, 20, 40);
    
    const dataURL = canvas.toDataURL('image/png');
    setAvatarImage(dataURL);
  };

  // Handle text-to-speech
  useEffect(() => {
    if (textToSpeak && isVisible) {
      setIsSpeaking(true);
      
      // Use browser's speech synthesis
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        onSpeechComplete?.();
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        onSpeechComplete?.();
      };
      
      speechSynthesis.speak(utterance);
      
      return () => {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      };
    }
  }, [textToSpeak, isVisible, onSpeechComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
      <div className="relative">
        {/* Avatar Image */}
        {avatarImage && (
          <div className="w-50 h-50 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-blue-100 to-purple-100">
            <img
              src={avatarImage}
              alt="AI Assistant Avatar"
              className="w-full h-full object-cover"
              style={{ width: '200px', height: '200px' }}
            />
          </div>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}

        {/* Avatar Label */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            AI Assistant
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAvatar;