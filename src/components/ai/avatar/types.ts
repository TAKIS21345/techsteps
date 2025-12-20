/**
 * Lightweight Avatar System Types
 * Defines interfaces and types for the 3x3 grid avatar system
 */

export type AvatarState =
  | 'idle'
  | 'thinking'
  | 'speaking'
  | 'listening'
  | 'celebrating'
  | 'error'
  | 'transitioning';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LightweightAvatarProps {
  size?: AvatarSize;
  state?: AvatarState;
  className?: string;
  onAnimationComplete?: (state: AvatarState) => void;
  reducedMotion?: boolean;
  highContrast?: boolean;
  'data-testid'?: string;
}

export interface GridSquare {
  id: number; // 0-8 for 3x3 grid
  opacity: number; // 0-1
  scale: number; // 0.8-1.2
  color: string; // CSS color value
  delay: number; // Animation delay in ms
  borderRadius?: string; // CSS border-radius value
}

export interface GridState {
  squares: GridSquare[];
  pattern: AnimationPattern;
  duration: number;
  easing: string;
}

export interface AnimationPattern {
  name: string;
  keyframes: GridKeyframe[];
  duration: number;
  easing: string;
  loop: boolean;
  priority: number;
}

export interface GridKeyframe {
  time: number; // 0-1 (percentage of animation)
  squares: Partial<GridSquare>[];
}

export interface AnimationEvent {
  type: AvatarState;
  priority: number; // 1-5, higher = more important
  duration?: number;
  context?: Record<string, any>;
}

export interface AnimationEngine {
  currentState: AvatarState;
  targetState: AvatarState;
  animationQueue: AnimationEvent[];
  isAnimating: boolean;

  setState(state: AvatarState): void;
  queueAnimation(event: AnimationEvent): void;
  processQueue(): void;
  clearQueue(): void;
}

export interface ColorScheme {
  primary: string[];     // 9 colors for grid squares
  accent: string;        // Highlight color
  background: string;    // Container background
  border: string;        // Container border
}

export interface AvatarGridProps {
  squares: GridSquare[];
  size: AvatarSize;
  colorScheme: ColorScheme;
  className?: string;
  reducedMotion?: boolean;
  'data-testid'?: string;
}

export interface AnimationEngineProps {
  initialState?: AvatarState;
  onStateChange?: (state: AvatarState) => void;
  onAnimationComplete?: (state: AvatarState) => void;
  reducedMotion?: boolean;
}

// Size configurations following design system patterns
export const AVATAR_SIZES: Record<AvatarSize, {
  container: string;
  square: string;
  gap: string;
}> = {
  sm: {
    container: 'w-12 h-12 sm:w-14 sm:h-14',
    square: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    gap: 'gap-0.5'
  },
  md: {
    container: 'w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20',
    square: 'w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4',
    gap: 'gap-0.5 sm:gap-1'
  },
  lg: {
    container: 'w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24',
    square: 'w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5',
    gap: 'gap-1 md:gap-1.5'
  },
  xl: {
    container: 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32',
    square: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7',
    gap: 'gap-1 sm:gap-1.5 md:gap-2'
  }
};

// Default color schemes
export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  default: {
    primary: [
      'rgba(59, 130, 246, 0.3)',   // blue-500/30
      'rgba(59, 130, 246, 0.5)',   // blue-500/50
      'rgba(59, 130, 246, 0.7)',   // blue-500/70
      'rgba(59, 130, 246, 0.5)',   // blue-500/50
      'rgba(59, 130, 246, 0.7)',   // blue-500/70
      'rgba(59, 130, 246, 0.9)',   // blue-500/90
      'rgba(59, 130, 246, 0.7)',   // blue-500/70
      'rgba(59, 130, 246, 0.9)',   // blue-500/90
      'rgba(59, 130, 246, 1.0)'    // blue-500
    ],
    accent: '#3b82f6',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    border: '#1e40af'
  },
  highContrast: {
    primary: [
      '#000000', '#333333', '#666666',
      '#333333', '#666666', '#999999',
      '#666666', '#999999', '#ffffff'
    ],
    accent: '#000000',
    background: '#ffffff',
    border: '#000000'
  },
  celebrating: {
    primary: [
      'rgba(34, 197, 94, 0.3)',    // green-500/30
      'rgba(234, 179, 8, 0.5)',    // yellow-500/50
      'rgba(168, 85, 247, 0.7)',   // purple-500/70
      'rgba(234, 179, 8, 0.5)',    // yellow-500/50
      'rgba(34, 197, 94, 0.7)',    // green-500/70
      'rgba(168, 85, 247, 0.9)',   // purple-500/90
      'rgba(168, 85, 247, 0.7)',   // purple-500/70
      'rgba(34, 197, 94, 0.9)',    // green-500/90
      'rgba(234, 179, 8, 1.0)'     // yellow-500
    ],
    accent: '#22c55e',
    background: 'linear-gradient(135deg, #22c55e, #eab308, #a855f7)',
    border: '#16a34a'
  },
  error: {
    primary: [
      'rgba(239, 68, 68, 0.3)',    // red-500/30
      'rgba(239, 68, 68, 0.5)',    // red-500/50
      'rgba(239, 68, 68, 0.7)',    // red-500/70
      'rgba(239, 68, 68, 0.5)',    // red-500/50
      'rgba(239, 68, 68, 0.7)',    // red-500/70
      'rgba(239, 68, 68, 0.9)',    // red-500/90
      'rgba(239, 68, 68, 0.7)',    // red-500/70
      'rgba(239, 68, 68, 0.9)',    // red-500/90
      'rgba(239, 68, 68, 1.0)'     // red-500
    ],
    accent: '#ef4444',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: '#dc2626'
  }
};

// Animation pattern definitions
export const ANIMATION_PATTERNS: Record<AvatarState, AnimationPattern> = {
  idle: {
    name: 'gentle-pulse',
    keyframes: [
      {
        time: 0,
        squares: [
          { opacity: 0.7 }, { opacity: 0.8 }, { opacity: 0.7 },
          { opacity: 0.8 }, { opacity: 0.9 }, { opacity: 0.8 },
          { opacity: 0.7 }, { opacity: 0.8 }, { opacity: 0.7 }
        ]
      },
      {
        time: 0.5,
        squares: [
          { opacity: 0.9 }, { opacity: 1.0 }, { opacity: 0.9 },
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 },
          { opacity: 0.9 }, { opacity: 1.0 }, { opacity: 0.9 }
        ]
      },
      {
        time: 1,
        squares: [
          { opacity: 0.7 }, { opacity: 0.8 }, { opacity: 0.7 },
          { opacity: 0.8 }, { opacity: 0.9 }, { opacity: 0.8 },
          { opacity: 0.7 }, { opacity: 0.8 }, { opacity: 0.7 }
        ]
      }
    ],
    duration: 3000,
    easing: 'ease-in-out',
    loop: true,
    priority: 1
  },
  thinking: {
    name: 'wave-pattern',
    keyframes: [
      {
        time: 0,
        squares: [
          { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' },
          { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' },
          { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }
        ]
      },
      {
        time: 0.25,
        squares: [
          { scale: 1.1, borderRadius: '50%' }, { scale: 0.9, borderRadius: '12px' }, { scale: 1.0, borderRadius: '4px' },
          { scale: 0.9, borderRadius: '12px' }, { scale: 1.2, borderRadius: '50%' }, { scale: 0.9, borderRadius: '12px' },
          { scale: 1.0, borderRadius: '4px' }, { scale: 0.9, borderRadius: '12px' }, { scale: 1.1, borderRadius: '50%' }
        ]
      },
      {
        time: 0.5,
        squares: [
          { scale: 0.9, borderRadius: '12px' }, { scale: 1.0, borderRadius: '4px' }, { scale: 1.1, borderRadius: '50%' },
          { scale: 1.0, borderRadius: '4px' }, { scale: 0.8, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' },
          { scale: 1.1, borderRadius: '50%' }, { scale: 1.0, borderRadius: '4px' }, { scale: 0.9, borderRadius: '12px' }
        ]
      },
      {
        time: 0.75,
        squares: [
          { scale: 1.0, borderRadius: '4px' }, { scale: 1.1, borderRadius: '50%' }, { scale: 0.9, borderRadius: '12px' },
          { scale: 1.1, borderRadius: '50%' }, { scale: 1.2, borderRadius: '50%' }, { scale: 1.1, borderRadius: '50%' },
          { scale: 0.9, borderRadius: '12px' }, { scale: 1.1, borderRadius: '50%' }, { scale: 1.0, borderRadius: '4px' }
        ]
      },
      {
        time: 1,
        squares: [
          { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' },
          { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' },
          { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }, { scale: 1.0, borderRadius: '4px' }
        ]
      }
    ],
    duration: 2000,
    easing: 'ease-in-out',
    loop: true,
    priority: 3
  },
  speaking: {
    name: 'speaking-pulse',
    keyframes: [
      {
        time: 0,
        squares: [
          { opacity: 0.6, scale: 0.9 }, { opacity: 0.8, scale: 1.0 }, { opacity: 0.6, scale: 0.9 },
          { opacity: 0.8, scale: 1.0 }, { opacity: 1.0, scale: 1.1 }, { opacity: 0.8, scale: 1.0 },
          { opacity: 0.6, scale: 0.9 }, { opacity: 0.8, scale: 1.0 }, { opacity: 0.6, scale: 0.9 }
        ]
      },
      {
        time: 0.5,
        squares: [
          { opacity: 0.9, scale: 1.0 }, { opacity: 1.0, scale: 1.1 }, { opacity: 0.9, scale: 1.0 },
          { opacity: 1.0, scale: 1.1 }, { opacity: 1.0, scale: 1.2 }, { opacity: 1.0, scale: 1.1 },
          { opacity: 0.9, scale: 1.0 }, { opacity: 1.0, scale: 1.1 }, { opacity: 0.9, scale: 1.0 }
        ]
      }
    ],
    duration: 800,
    easing: 'ease-in-out',
    loop: true,
    priority: 4
  },
  listening: {
    name: 'attentive-glow',
    keyframes: [
      {
        time: 0,
        squares: [
          { opacity: 0.8 }, { opacity: 0.9 }, { opacity: 0.8 },
          { opacity: 0.9 }, { opacity: 1.0 }, { opacity: 0.9 },
          { opacity: 0.8 }, { opacity: 0.9 }, { opacity: 0.8 }
        ]
      },
      {
        time: 1,
        squares: [
          { opacity: 0.9 }, { opacity: 1.0 }, { opacity: 0.9 },
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 },
          { opacity: 0.9 }, { opacity: 1.0 }, { opacity: 0.9 }
        ]
      }
    ],
    duration: 2000,
    easing: 'ease-in-out',
    loop: true,
    priority: 2
  },
  celebrating: {
    name: 'celebration-burst',
    keyframes: [
      {
        time: 0,
        squares: [
          { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 },
          { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 },
          { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }
        ]
      },
      {
        time: 0.3,
        squares: [
          { scale: 1.3, opacity: 0.8 }, { scale: 1.2, opacity: 0.9 }, { scale: 1.3, opacity: 0.8 },
          { scale: 1.2, opacity: 0.9 }, { scale: 1.4, opacity: 1.0 }, { scale: 1.2, opacity: 0.9 },
          { scale: 1.3, opacity: 0.8 }, { scale: 1.2, opacity: 0.9 }, { scale: 1.3, opacity: 0.8 }
        ]
      },
      {
        time: 0.6,
        squares: [
          { scale: 0.8, opacity: 0.6 }, { scale: 0.9, opacity: 0.7 }, { scale: 0.8, opacity: 0.6 },
          { scale: 0.9, opacity: 0.7 }, { scale: 1.0, opacity: 0.8 }, { scale: 0.9, opacity: 0.7 },
          { scale: 0.8, opacity: 0.6 }, { scale: 0.9, opacity: 0.7 }, { scale: 0.8, opacity: 0.6 }
        ]
      },
      {
        time: 1,
        squares: [
          { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 },
          { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 },
          { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }, { scale: 1.0, opacity: 1.0 }
        ]
      }
    ],
    duration: 1200,
    easing: 'ease-out',
    loop: false,
    priority: 5
  },
  error: {
    name: 'error-shake',
    keyframes: [
      {
        time: 0,
        squares: [
          { scale: 1.0 }, { scale: 1.0 }, { scale: 1.0 },
          { scale: 1.0 }, { scale: 1.0 }, { scale: 1.0 },
          { scale: 1.0 }, { scale: 1.0 }, { scale: 1.0 }
        ]
      },
      {
        time: 0.2,
        squares: [
          { scale: 1.1 }, { scale: 0.9 }, { scale: 1.1 },
          { scale: 0.9 }, { scale: 1.1 }, { scale: 0.9 },
          { scale: 1.1 }, { scale: 0.9 }, { scale: 1.1 }
        ]
      },
      {
        time: 0.4,
        squares: [
          { scale: 0.9 }, { scale: 1.1 }, { scale: 0.9 },
          { scale: 1.1 }, { scale: 0.9 }, { scale: 1.1 },
          { scale: 0.9 }, { scale: 1.1 }, { scale: 0.9 }
        ]
      },
      {
        time: 1,
        squares: [
          { scale: 1.0 }, { scale: 1.0 }, { scale: 1.0 },
          { scale: 1.0 }, { scale: 1.0 }, { scale: 1.0 },
          { scale: 1.0 }, { scale: 1.0 }, { scale: 1.0 }
        ]
      }
    ],
    duration: 600,
    easing: 'ease-in-out',
    loop: false,
    priority: 4
  },
  transitioning: {
    name: 'smooth-transition',
    keyframes: [
      {
        time: 0,
        squares: [
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 },
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 },
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 }
        ]
      },
      {
        time: 0.5,
        squares: [
          { opacity: 0.5 }, { opacity: 0.5 }, { opacity: 0.5 },
          { opacity: 0.5 }, { opacity: 0.5 }, { opacity: 0.5 },
          { opacity: 0.5 }, { opacity: 0.5 }, { opacity: 0.5 }
        ]
      },
      {
        time: 1,
        squares: [
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 },
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 },
          { opacity: 1.0 }, { opacity: 1.0 }, { opacity: 1.0 }
        ]
      }
    ],
    duration: 400,
    easing: 'ease-in-out',
    loop: false,
    priority: 2
  }
};