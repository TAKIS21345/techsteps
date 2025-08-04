# Ready Player Me Avatar Integration

This directory contains the implementation of the Ready Player Me avatar system with EchoMimicV3 lip sync for the senior learning platform.

## Components

### FlashcardAvatar.tsx
The main avatar component that appears in the bottom-right corner during flashcard sessions.

**Features:**
- Only visible when flashcards are shown
- Automatically unloaded when not visible to save performance
- WebGL/WebGPU compatible with mobile browser support
- Graceful degradation to static image on low-end devices
- Real-time lip sync with EchoMimicV3

**Props:**
- `isVisible`: Controls avatar visibility
- `textToSpeak`: Text for TTS with lip sync
- `onSpeechComplete`: Callback when speech finishes
- `onUserInteraction`: Callback for user interactions

### AvatarDemo.tsx
Demo component for testing avatar functionality.

### AvatarControlPanel.tsx
Advanced control panel for avatar settings and performance monitoring.

## Services

### ReadyPlayerMeLoader.ts
Handles loading and optimization of Ready Player Me avatars.

**Features:**
- Loads specific avatar: `688acf39a70fe61ff012fe38.glb`
- Mobile performance optimization
- Automatic fallback image generation
- Device capability detection
- WebGL support checking

### EchoMimicV3.ts
Phoneme-based lip sync engine for realistic mouth movement.

**Features:**
- Real-time phoneme mapping
- Smooth animation transitions
- 30 FPS lip sync animation
- Morph target optimization
- Text-to-phoneme conversion

### GeminiTTSService.ts
Text-to-speech service optimized for avatar integration.

### LipSyncEngine.ts
Legacy lip sync engine (kept for compatibility).

### PerformanceMonitor.ts
Performance monitoring and optimization system.

### AutoOptimizer.ts
Automatic performance optimization based on device capabilities.

## Hooks

### useFlashcardAvatar.ts
React hook for managing avatar state and actions.

**Usage:**
```typescript
const { state, actions } = useFlashcardAvatar(true);

// Show avatar when flashcards appear
actions.showAvatar();

// Hide avatar when flashcards disappear
actions.hideAvatar();

// Make avatar speak with lip sync
actions.speakText("Hello, let's learn together!");

// Trigger reaction animation
actions.onUserInteraction();
```

## Integration

### StepsView Integration
The avatar is integrated into the StepsView component:

1. Avatar appears when steps are displayed
2. TTS uses avatar lip sync instead of plain audio
3. Avatar reacts when user completes steps
4. Avatar disappears when leaving steps view

### Performance Optimization

**High-end devices:**
- Full 3D avatar with real-time rendering
- 60 FPS animation
- High-quality textures
- Real-time lip sync

**Medium-end devices:**
- Optimized 3D avatar
- 30 FPS animation
- Compressed textures
- Simplified lip sync

**Low-end devices:**
- Static fallback image
- No 3D rendering
- Minimal resource usage
- TTS without visual lip sync

## Browser Compatibility

- **Chrome/Edge**: Full WebGL support
- **Firefox**: Full WebGL support
- **Safari (iOS)**: WebGL with optimizations
- **Mobile browsers**: Automatic optimization

## Fallback Strategy

1. **WebGL not supported**: Show static avatar image
2. **Avatar model fails to load**: Generate geometric fallback
3. **Performance issues**: Auto-reduce quality
4. **Memory constraints**: Unload avatar when not visible

## Testing

Visit `/avatar-test` to test the avatar system:

1. Show/hide avatar controls
2. Speech testing with sample texts
3. Performance monitoring
4. Device capability detection
5. Fallback testing

## File Structure

```
src/components/ai/avatar/
├── FlashcardAvatar.tsx      # Main avatar component
├── AvatarDemo.tsx           # Demo/testing component
├── AvatarControlPanel.tsx   # Advanced controls
├── Avatar3D.tsx             # Legacy 3D avatar
├── AvatarSystem.tsx         # Legacy avatar system
└── README.md                # This file

src/services/avatar/
├── ReadyPlayerMeLoader.ts   # Avatar loading
├── EchoMimicV3.ts          # Lip sync engine
├── GeminiTTSService.ts     # TTS integration
├── LipSyncEngine.ts        # Legacy lip sync
├── PerformanceMonitor.ts   # Performance tracking
└── AutoOptimizer.ts        # Auto optimization

src/hooks/
└── useFlashcardAvatar.ts   # Avatar state management
```

## Requirements Met

✅ **Positioning & Visibility**: Bottom-right corner, only visible with flashcards
✅ **Performance**: Optimized for low-end mobile devices
✅ **Compatibility**: Works across all major mobile browsers
✅ **Interactivity**: EchoMimicV3 lip sync with user reactions
✅ **Simplicity**: Non-intrusive, minimal UI
✅ **Fail-safe**: Multiple fallback strategies
✅ **Client-side**: All processing done locally

## Usage Example

```typescript
import FlashcardAvatar from './components/ai/avatar/FlashcardAvatar';
import { useFlashcardAvatar } from './hooks/useFlashcardAvatar';

function MyComponent() {
  const { state, actions } = useFlashcardAvatar();

  // Show avatar when flashcards start
  useEffect(() => {
    if (showingFlashcards) {
      actions.showAvatar();
    } else {
      actions.hideAvatar();
    }
  }, [showingFlashcards]);

  return (
    <div>
      {/* Your flashcard content */}
      
      <FlashcardAvatar
        isVisible={state.isVisible}
        textToSpeak={state.textToSpeak}
        onSpeechComplete={() => console.log('Done speaking')}
        onUserInteraction={actions.onUserInteraction}
      />
    </div>
  );
}
```