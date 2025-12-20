import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAvatar } from '../../contexts/AvatarContext';

interface EnhancedAvatarCompanionProps {
  onAvatarClick?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
  isTyping?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number;
  emotion?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EnhancedAvatarCompanion: React.FC<EnhancedAvatarCompanionProps> = ({
  onAvatarClick,
  size = 'lg',
  className = '',
  isListening: propListening,
  isSpeaking: propSpeaking,
  audioLevel: propAudioLevel
}) => {
  const { state } = useAvatar();
  const isListening = propListening ?? state.isListening;
  const isSpeaking = propSpeaking ?? state.isSpeaking;
  const isThinking = state.isThinking;
  const audioLevel = propAudioLevel ?? 0;

  // Configuration for sizes
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm': return 'w-12 h-12 p-1 gap-1 rounded-xl';
      case 'md': return 'w-24 h-24 p-2 gap-2 rounded-2xl';
      case 'lg': return 'w-32 h-32 p-3 gap-3 rounded-3xl';
      default: return 'w-32 h-32 p-3 gap-3 rounded-3xl';
    }
  }, [size]);

  // "Balancing" Physics - The container wobbles to stay upright
  const balanceAnimation = {
    rotate: isThinking
      ? [0, -5, 5, -3, 3, 0] // Intense wobbling when thinking
      : [0, -2, 2, -1, 1, 0], // Gentle balancing when idle
  };

  const balanceTransition = {
    rotate: {
      duration: isThinking ? 2 : 6, // Faster when thinking
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut"
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        className={`grid grid-cols-3 ${sizeConfig} bg-white/20 backdrop-blur-md shadow-2xl border border-white/40 cursor-pointer overflow-hidden`}
        onClick={onAvatarClick}
        animate={balanceAnimation}
        transition={balanceTransition}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <FluidSquare
            key={i}
            index={i}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            audioLevel={audioLevel}
          />
        ))}
      </motion.div>

      {/* Status Label */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-4 py-1.5 bg-white/80 backdrop-blur-lg rounded-full shadow-lg border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          {isListening ? "Listening..." : isSpeaking ? "Speaking..." : isThinking ? "Thinking..." : "TechSteps AI"}
        </span>
      </div>
    </div>
  );
};

// Individual "Fluid" Square
const FluidSquare = ({ index, isListening, isSpeaking, isThinking, audioLevel }: {
  index: number,
  isListening: boolean,
  isSpeaking: boolean,
  isThinking: boolean,
  audioLevel: number
}) => {

  // Random "organic" movement generation
  const randomBorderRadius = () => {
    // Generate 4 corners
    const tl = 20 + Math.random() * 30; // 20-50%
    const tr = 20 + Math.random() * 30;
    const br = 20 + Math.random() * 30;
    const bl = 20 + Math.random() * 30;
    return `${tl}% ${tr}% ${br}% ${bl}%`;
  };

  // Determine State-based Animations
  const getAnimation = () => {
    if (isThinking) {
      // Rapid Morphing
      return {
        borderRadius: [randomBorderRadius(), randomBorderRadius(), randomBorderRadius(), randomBorderRadius()],
        scale: [1, 0.8, 1.1, 0.9, 1],
        backgroundColor: ["#6366f1", "#a855f7", "#6366f1"],
        rotate: [0, 90, 180, 270, 360]
      };
    }

    if (isListening) {
      // Breathing / Expanding
      const isCenter = index === 4;
      return {
        scale: isCenter ? [1, 1.2, 1] : [1, 0.9, 1],
        borderRadius: isCenter ? ["50%", "40%", "50%"] : [randomBorderRadius(), randomBorderRadius()],
        backgroundColor: isCenter ? "#ef4444" : "#6366f1", // Red center
      };
    }

    if (isSpeaking) {
      // Audio Reactive (Simulated)
      const isMiddleCol = index % 3 === 1;
      const heightMod = audioLevel * 0.5;
      return {
        borderRadius: ["40%", "10%", "40%"],
        scaleY: isMiddleCol ? [0.8, 1 + heightMod, 0.8] : [0.8, 0.9 + (heightMod * 0.5), 0.8],
      };
    }

    // Idle: Gentle Fluid Motion
    return {
      borderRadius: [randomBorderRadius(), randomBorderRadius(), randomBorderRadius()],
      scale: [1, 0.98, 1],
      opacity: [0.8, 1, 0.8],
    };
  };

  const getTransition = () => {
    if (isThinking) {
      return {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
        times: [0, 0.25, 0.5, 0.75, 1]
      };
    }
    if (isListening) {
      return {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.05 // Ripple
      };
    }
    if (isSpeaking) {
      return {
        duration: 0.2,
        ease: "linear"
      };
    }
    // Idle
    return {
      duration: 3 + Math.random() * 2, // Random duration for organic feel
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut",
      delay: Math.random() * 1 // Random start time
    };
  };

  return (
    <motion.div
      className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm backdrop-blur-sm"
      animate={getAnimation()}
      transition={getTransition()}
    />
  );
};

export default EnhancedAvatarCompanion;