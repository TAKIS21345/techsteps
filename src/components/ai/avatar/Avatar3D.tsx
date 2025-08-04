import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useTranslation } from 'react-i18next';
import { AvatarLoader } from '../../../services/avatar/AvatarLoader';
import { LipSyncEngine } from '../../../services/avatar/LipSyncEngine';
import { PerformanceMonitor } from '../../../services/avatar/PerformanceMonitor';
import { AutoOptimizer, OptimizationAction } from '../../../services/avatar/AutoOptimizer';

interface Avatar3DProps {
  audioStream?: MediaStream;
  emotionalState: EmotionalState;
  performanceMode: 'high' | 'medium' | 'low' | 'off';
  isMuted: boolean;
  isFullscreen: boolean;
  textToSpeak?: string; // Text for TTS with lip sync
  onSpeechComplete?: () => void;
}

interface EmotionalState {
  primary: 'neutral' | 'happy' | 'concerned' | 'encouraging' | 'thinking';
  intensity: number;
  duration: number;
}

const Avatar3D: React.FC<Avatar3DProps> = ({
  audioStream,
  emotionalState,
  performanceMode,
  isMuted,
  isFullscreen,
  textToSpeak,
  onSpeechComplete
}) => {
  const { t } = useTranslation();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lipSyncEngine, setLipSyncEngine] = useState<LipSyncEngine | null>(null);
  const [performanceMonitor] = useState(() => new PerformanceMonitor());
  const [autoOptimizer] = useState(() => new AutoOptimizer(performanceMonitor, {
    enableAutoOptimization: true,
    targetFPS: performanceMode === 'high' ? 60 : performanceMode === 'medium' ? 30 : 15,
    aggressiveOptimization: false
  }));

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 1);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: performanceMode === 'high',
      alpha: true,
      powerPreference: performanceMode === 'high' ? 'high-performance' : 'low-power'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(
      performanceMode === 'high' ? window.devicePixelRatio : 
      performanceMode === 'medium' ? Math.min(window.devicePixelRatio, 2) : 1
    );
    renderer.shadowMap.enabled = performanceMode !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = performanceMode !== 'low';
    scene.add(directionalLight);

    return { scene, camera, renderer };
  }, [performanceMode]);

  // Load VRM avatar
  const loadAvatar = useCallback(async () => {
    if (!sceneRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const avatarLoader = new AvatarLoader();
      const vrm = await avatarLoader.loadDefaultAvatar();
      
      if (vrm) {
        // Remove previous avatar if exists
        if (vrmRef.current) {
          VRMUtils.deepDispose(vrmRef.current.scene);
          sceneRef.current.remove(vrmRef.current.scene);
        }

        vrmRef.current = vrm;
        sceneRef.current.add(vrm.scene);

        // Position avatar
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.set(0, 0, 0);

        // Initialize lip sync engine
        const lipSync = new LipSyncEngine(vrm);
        await lipSync.initialize();
        setLipSyncEngine(lipSync);
        
        // Set audio stream if available
        if (audioStream && !isMuted) {
          lipSync.setAudioStream(audioStream);
        }

        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load avatar:', err);
      setError(t('avatar.error.loadFailed'));
      setIsLoading(false);
    }
  }, [audioStream, isMuted, t]);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Update performance monitoring
    performanceMonitor.startFrame();

    // Update VRM
    if (vrmRef.current) {
      vrmRef.current.update(0.016); // Assume 60fps for delta time
      
      // Update emotional state
      updateEmotionalState(vrmRef.current, emotionalState);
    }

    // Update lip sync
    if (lipSyncEngine && !isMuted) {
      lipSyncEngine.update();
    }

    // Render
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Performance monitoring
    performanceMonitor.endFrame();

    // Continue animation loop based on performance mode
    const targetFPS = performanceMode === 'high' ? 60 : performanceMode === 'medium' ? 30 : 15;
    const delay = 1000 / targetFPS;
    
    animationIdRef.current = window.setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay);
  }, [emotionalState, lipSyncEngine, isMuted, performanceMode, performanceMonitor]);

  // Update emotional state
  const updateEmotionalState = useCallback((vrm: VRM, state: EmotionalState) => {
    if (!vrm.expressionManager) return;

    // Reset all expressions
    vrm.expressionManager.setValue('happy', 0);
    vrm.expressionManager.setValue('sad', 0);
    vrm.expressionManager.setValue('surprised', 0);
    vrm.expressionManager.setValue('angry', 0);

    // Apply current emotional state
    const intensity = Math.min(1, Math.max(0, state.intensity));
    
    switch (state.primary) {
      case 'happy':
      case 'encouraging':
        vrm.expressionManager.setValue('happy', intensity);
        break;
      case 'concerned':
        vrm.expressionManager.setValue('sad', intensity * 0.5);
        break;
      case 'thinking':
        // Subtle expression for thinking
        vrm.expressionManager.setValue('surprised', intensity * 0.3);
        break;
      case 'neutral':
      default:
        // Keep neutral expression
        break;
    }
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Initialize scene and load avatar
  useEffect(() => {
    initializeScene();
    loadAvatar();

    window.addEventListener('resize', handleResize);

    // Set up auto-optimizer
    autoOptimizer.onOptimization((action: OptimizationAction) => {
      console.log('Auto-optimization applied:', action);
      // Handle optimization actions here
      // This could trigger performance mode changes, feature toggles, etc.
    });
    
    autoOptimizer.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        clearTimeout(animationIdRef.current);
      }
      
      autoOptimizer.dispose();
      
      if (lipSyncEngine) {
        lipSyncEngine.cleanup();
      }
      
      if (vrmRef.current) {
        VRMUtils.deepDispose(vrmRef.current.scene);
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initializeScene, loadAvatar, handleResize, autoOptimizer]);

  // Start animation loop
  useEffect(() => {
    if (!isLoading && !error) {
      animate();
    }

    return () => {
      if (animationIdRef.current) {
        clearTimeout(animationIdRef.current);
      }
    };
  }, [isLoading, error, animate]);

  // Update lip sync when audio stream changes
  useEffect(() => {
    if (lipSyncEngine && audioStream && !isMuted) {
      lipSyncEngine.setAudioStream(audioStream);
    } else if (lipSyncEngine && (isMuted || !audioStream)) {
      lipSyncEngine.setAudioStream(null);
    }
  }, [audioStream, isMuted, lipSyncEngine]);

  // Handle text-to-speech with lip sync
  useEffect(() => {
    if (textToSpeak && lipSyncEngine && !isMuted) {
      const speakText = async () => {
        try {
          await lipSyncEngine.syncWithTTS(textToSpeak);
          if (onSpeechComplete) {
            // Estimate speech duration and call completion callback
            const estimatedDuration = textToSpeak.length * 100; // Rough estimate
            setTimeout(onSpeechComplete, estimatedDuration);
          }
        } catch (error) {
          console.error('Failed to speak text with lip sync:', error);
          if (onSpeechComplete) {
            onSpeechComplete();
          }
        }
      };
      
      speakText();
    }
  }, [textToSpeak, lipSyncEngine, isMuted, onSpeechComplete]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-700 text-sm">{error}</p>
          <button
            onClick={loadAvatar}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">{t('avatar.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '200px' }}
    />
  );
};

export default Avatar3D;