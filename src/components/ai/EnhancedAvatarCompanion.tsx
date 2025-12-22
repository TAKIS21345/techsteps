import React, { useMemo, useState } from 'react';
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
  audioLevel: propAudioLevel,
  emotion = 'neutral'
}) => {
  const { state } = useAvatar();
  const isListening = propListening ?? state.isListening;
  const isSpeaking = propSpeaking ?? state.isSpeaking;
  const isThinking = state.isThinking;
  const audioLevel = propAudioLevel ?? state.audioLevel ?? 0;

  const [isHovered, setIsHovered] = useState(false);

  // Staircase Shape: 0, 3, 4, 6, 7, 8 (Indices to show)
  const visibleIndices = [0, 3, 4, 6, 7, 8];

  // Configuration for sizes
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm': return 'w-16 h-16 p-1 gap-0.5';
      case 'md': return 'w-24 h-24 p-2 gap-1';
      case 'lg': return 'w-32 h-32 p-2 gap-1';
      default: return 'w-32 h-32 p-2 gap-1';
    }
  }, [size]);

  // "Balancing" Physics
  const balanceAnimation = {
    rotate: isThinking
      ? [-45, -55, -35, -50, -40, -45]
      : isSpeaking
        ? [-44, -46, -44] // Very minimal sway instead of jitter
        : [-45, -48, -42, -45],
  };

  const balanceTransition = {
    rotate: {
      duration: isThinking ? 0.5 : isSpeaking ? 1 : 6, // Slower duration for speaking
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const
    }
  };

  // "Purr" Effect - gentle pulse on hover
  const purrAnimation = isHovered ? {
    scale: [1, 1.02, 1, 1.01, 1],
  } : {};

  const purrTransition = {
    scale: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover Glow Effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full bg-indigo-400/20 blur-2xl -z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Container wrapper for rotation */}
      <div className="relative p-4">
        <motion.div
          className={`grid grid-cols-3 ${sizeConfig} cursor-pointer overflow-hidden origin-center relative`}
          onClick={onAvatarClick}
          animate={{ ...balanceAnimation, ...purrAnimation }}
          transition={{ ...balanceTransition, ...purrTransition }}
          whileTap={{ scale: 0.95 }}
          style={{ transform: 'rotate(-45deg)' }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <FluidSquare
              key={i}
              index={i}
              isVisible={visibleIndices.includes(i)}
              isListening={isListening}
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              audioLevel={audioLevel}
              emotion={emotion}
              isHovered={isHovered}
            />
          ))}

          {/* "Techy" Name - Shows centered on hover */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: 'rotate(45deg)' }} // Counter-rotate to stay upright
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-white font-bold text-lg drop-shadow-lg">
              {isThinking ? "🤔" : isListening ? "👂" : isSpeaking ? "💬" : "Techy"}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Balance Line / Floor - Always visible */}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent rounded-full"
        style={{ filter: 'blur(0.5px)' }}
      />

      {/* Mood/State Indicator - Small pill below */}
      <motion.div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-white/90 backdrop-blur-lg rounded-full shadow-md border border-white/50 pointer-events-none"
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: isHovered || isThinking || isListening || isSpeaking ? 1 : 0, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <span className="text-xs font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          {isListening ? "I'm all ears!" : isSpeaking ? "Let me explain..." : isThinking ? "Hmm, thinking..." : "Hey there! 👋"}
        </span>
      </motion.div>
    </div>
  );
};

// Individual "Fluid" Square
const FluidSquare = ({ index, isVisible, isListening, isSpeaking, isThinking, audioLevel, emotion, isHovered }: {
  index: number,
  isVisible: boolean,
  isListening: boolean,
  isSpeaking: boolean,
  isThinking: boolean,
  audioLevel: number,
  emotion: string,
  isHovered: boolean
}) => {

  if (!isVisible) return <div className="w-full h-full bg-transparent" />;

  // Color Mapping based on Emotion/State
  const getColors = () => {
    if (isListening) return ["#ef4444", "#f87171"]; // Red
    if (isThinking) return ["#eab308", "#facc15"]; // Yellow/Gold
    if (isSpeaking) return ["#a855f7", "#6366f1"]; // Purple/Indigo activity

    switch (emotion) {
      case 'happy': return ["#22c55e", "#4ade80"]; // Green
      case 'concerned': return ["#f97316", "#fb923c"]; // Orange
      case 'sad': return ["#64748b", "#94a3b8"]; // Grey/Blue
      case 'excited': return ["#ec4899", "#f472b6"]; // Pink
      default: return ["#6366f1", "#818cf8"]; // Default Indigo
    }
  };

  const colors = getColors();

  // Random "organic" movement generation
  const randomBorderRadius = () => {
    const tl = 20 + Math.random() * 30;
    const tr = 20 + Math.random() * 30;
    const br = 20 + Math.random() * 30;
    const bl = 20 + Math.random() * 30;
    return `${tl}% ${tr}% ${br}% ${bl}%`;
  };

  // Determine State-based Animations
  const getAnimation = () => {
    if (isThinking) {
      // Rapid Morphing + Rotation for chaos
      return {
        borderRadius: [randomBorderRadius(), randomBorderRadius(), randomBorderRadius(), randomBorderRadius()],
        scale: [1, 0.6, 1.1, 0.8, 1],
        backgroundColor: colors[0],
        rotate: [0, 90, 180, 270, 360]
      };
    }

    if (isListening) {
      // Breathing / Expanding
      // Index 6 is the "anchor" (bottom tip), so maybe it stays stable?
      // Let's make the "top" ones (0, 3, 4) breathe more
      return {
        scale: [1, 1.1, 1],
        borderRadius: [randomBorderRadius(), randomBorderRadius()],
        backgroundColor: colors[0]
      };
    }

    if (isSpeaking) {
      // Audio Reactive
      const heightMod = audioLevel * 0.8;
      // Index 6 (Anchor) moves less
      const isAnchor = index === 6;
      return {
        borderRadius: ["30%", "10%", "30%"],
        scale: isAnchor ? [1, 1 + heightMod * 0.2, 1] : [0.8, 0.8 + heightMod, 0.8],
        backgroundColor: colors[0]
      };
    }

    // Idle with Emotion
    return {
      borderRadius: [randomBorderRadius(), randomBorderRadius(), randomBorderRadius()],
      scale: [1, 0.95, 1],
      backgroundColor: colors,
    };
  };

  const getTransition = () => {
    if (isThinking) {
      return {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear" as const,
      };
    }
    if (isListening) {
      return {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: index * 0.1 // Ripple
      };
    }
    if (isSpeaking) {
      return {
        duration: 0.15,
        ease: "easeOut" as const
      };
    }
    // Idle
    return {
      duration: 4 + Math.random() * 2,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const,
      delay: Math.random() * 1
    };
  };

  return (
    <motion.div
      className="w-full h-full shadow-lg backdrop-blur-sm"
      animate={getAnimation()}
      transition={getTransition()}
      style={{
        boxShadow: isHovered
          ? `0 0 20px ${colors[0]}60, 0 0 40px ${colors[0]}30` // Enhanced glow on hover
          : `0 0 15px ${colors[0]}40`,
        filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
      }}
    />
  );
};

export default EnhancedAvatarCompanion;