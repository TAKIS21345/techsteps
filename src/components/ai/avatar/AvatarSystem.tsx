import React, { Suspense, lazy, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, User, Volume2, VolumeX } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import AvatarControlPanel from './AvatarControlPanel';

// Lazy load the 3D avatar component to optimize bundle size
const Avatar3D = lazy(() => import('./Avatar3D'));

interface AvatarSystemProps {
  isActive: boolean;
  audioStream?: MediaStream;
  emotionalState: EmotionalState;
  performanceMode: 'high' | 'medium' | 'low' | 'off';
  onPerformanceChange: (mode: string) => void;
  onToggleAvatar: (enabled: boolean) => void;
  textToSpeak?: string;
  onSpeechComplete?: () => void;
  className?: string;
}

interface EmotionalState {
  primary: 'neutral' | 'happy' | 'concerned' | 'encouraging' | 'thinking';
  intensity: number;
  duration: number;
}

const AvatarSystem: React.FC<AvatarSystemProps> = ({
  isActive,
  audioStream,
  emotionalState,
  performanceMode,
  onPerformanceChange,
  onToggleAvatar,
  textToSpeak,
  onSpeechComplete,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleToggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  // Don't render anything if avatar is disabled
  if (!isActive) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => onToggleAvatar(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('avatar.enable')}
        >
          <User size={24} />
        </button>
      </div>
    );
  }

  const avatarContainerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'
    : `fixed bottom-4 right-4 z-50 w-64 h-64 ${className}`;

  const avatarClass = isFullscreen
    ? 'w-96 h-96 bg-white rounded-lg shadow-2xl'
    : 'w-full h-full bg-white rounded-lg shadow-lg';

  return (
    <div className={avatarContainerClass}>
      <div className={avatarClass}>
        {/* Avatar Controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={handleToggleMute}
            className="bg-gray-800 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label={isMuted ? t('avatar.unmute') : t('avatar.mute')}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          <button
            onClick={handleToggleControls}
            className="bg-gray-800 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label={t('avatar.settings')}
          >
            <Settings size={16} />
          </button>
          
          <button
            onClick={() => onToggleAvatar(false)}
            className="bg-red-600 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600"
            aria-label={t('avatar.disable')}
          >
            ×
          </button>
        </div>

        {/* Fullscreen Toggle */}
        {!isFullscreen && (
          <button
            onClick={handleToggleFullscreen}
            className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label={t('avatar.fullscreen')}
          >
            ⛶
          </button>
        )}

        {/* 3D Avatar Component */}
        <Suspense 
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner size="large" />
              <span className="ml-2 text-gray-600">{t('avatar.loading')}</span>
            </div>
          }
        >
          <Avatar3D
            audioStream={audioStream}
            emotionalState={emotionalState}
            performanceMode={performanceMode}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            textToSpeak={textToSpeak}
            onSpeechComplete={onSpeechComplete}
          />
        </Suspense>

        {/* Avatar Control Panel */}
        <AvatarControlPanel
          isVisible={showControls}
          onClose={handleToggleControls}
          performanceMode={performanceMode}
          onPerformanceModeChange={onPerformanceChange}
          isAvatarEnabled={true}
          onToggleAvatar={onToggleAvatar}
          isMuted={isMuted}
          onToggleMute={setIsMuted}
          isFullscreen={isFullscreen}
          onToggleFullscreen={setIsFullscreen}
          emotionalState={emotionalState}
          onEmotionalStateChange={(state) => {
            // This would be passed from parent component
            console.log('Emotional state change:', state);
          }}
        />

        {/* Close fullscreen overlay */}
        {isFullscreen && (
          <button
            onClick={handleToggleFullscreen}
            className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label={t('avatar.exitFullscreen')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default AvatarSystem;