import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ReadyPlayerMeLoader, ReadyPlayerMeAvatar } from '../../../services/avatar/ReadyPlayerMeLoader';
import { EchoMimicV3, PhonemeData } from '../../../services/avatar/EchoMimicV3';
import { ttsService } from '../../../utils/ttsService';

interface FlashcardAvatarProps {
  isVisible: boolean; // Only visible when flashcards are shown
  textToSpeak?: string;
  onSpeechComplete?: () => void;
  onUserInteraction?: () => void; // Called when user completes a flashcard
  className?: string;
}

const FlashcardAvatar: React.FC<FlashcardAvatarProps> = ({
  isVisible,
  textToSpeak,
  onSpeechComplete,
  onUserInteraction,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarRef = useRef<ReadyPlayerMeAvatar | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  const [lipSyncEngine, setLipSyncEngine] = useState<EchoMimicV3 | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [performanceTier, setPerformanceTier] = useState<'high' | 'medium' | 'low'>('medium');

  const avatarLoader = useRef(new ReadyPlayerMeLoader());

  // Create a simple geometric avatar as fallback
  const createSimpleAvatar = useCallback((): ReadyPlayerMeAvatar => {
    const scene = new THREE.Group();
    const mixer = new THREE.AnimationMixer(scene);
    const morphTargets = new Map<string, THREE.Mesh>();

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.6, 0);
    scene.add(head);

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1.0, 0);
    scene.add(body);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.05, 1.65, 0.12);
    scene.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.05, 1.65, 0.12);
    scene.add(rightEye);

    // Mouth (for basic lip sync)
    const mouthGeometry = new THREE.PlaneGeometry(0.06, 0.02);
    const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.55, 0.13);
    scene.add(mouth);

    // Add mouth to morph targets for basic lip sync
    morphTargets.set('mouth', mouth);

    return {
      scene,
      mixer,
      morphTargets,
      cleanup: () => {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  // Initialize avatar when visible
  useEffect(() => {
    if (isVisible && !isLoaded && !isError) {
      // Set a timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        if (!isLoaded && !isError) {
          console.log('⏰ Avatar loading timeout, using fallback');
          setIsError(true);
          loadFallbackImage();
        }
      }, 10000); // 10 second timeout

      initializeAvatar();

      return () => clearTimeout(loadingTimeout);
    } else if (!isVisible && isLoaded) {
      // Unload avatar when not visible to save performance
      cleanup();
    }
  }, [isVisible, isLoaded, isError]);

  // Handle text-to-speech with lip sync
  useEffect(() => {
    if (textToSpeak && isVisible && lipSyncEngine && !isSpeaking) {
      speakWithLipSync(textToSpeak);
    }
  }, [textToSpeak, isVisible, lipSyncEngine, isSpeaking]);

  // Handle user interaction (flashcard completion)
  useEffect(() => {
    if (onUserInteraction && isVisible && avatarRef.current) {
      playReactionAnimation();
    }
  }, [onUserInteraction, isVisible]);

  const initializeAvatar = useCallback(async () => {
    if (!mountRef.current) return;

    console.log('🎭 Initializing avatar...');

    try {
      // Check WebGL support and performance
      if (!avatarLoader.current.isWebGLSupported()) {
        console.log('❌ WebGL not supported, using fallback');
        await loadFallbackImage();
        return;
      }

      const tier = avatarLoader.current.getPerformanceTier();
      setPerformanceTier(tier);
      console.log('📊 Performance tier:', tier);

      // Load fallback image first for immediate display
      console.log('🖼️ Generating fallback image...');
      try {
        const fallback = await avatarLoader.current.generateFallbackImage('688acf39a70fe61ff012fe38');
        setFallbackImage(fallback);
        console.log('✅ Fallback image ready');
      } catch (fallbackError) {
        console.warn('⚠️ Fallback image generation failed, using simple fallback');
        // Create an even simpler fallback
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(100, 100, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI', 100, 105);

        setFallbackImage(canvas.toDataURL('image/png'));
      }

      // For low-end devices, only show fallback
      if (tier === 'low') {
        console.log('📱 Low-end device detected, using fallback only');
        setIsLoaded(true);
        return;
      }

      // Initialize Three.js scene
      console.log('🎬 Initializing Three.js scene...');
      await initializeScene();
      console.log('✅ Scene initialized');

      // First test if the GLB URL is accessible
      console.log('🌐 Testing GLB URL accessibility...');
      try {
        const testResponse = await fetch('https://models.readyplayer.me/688acf39a70fe61ff012fe38.glb', { method: 'HEAD' });
        console.log('📡 GLB URL response:', testResponse.status, testResponse.statusText);
      } catch (fetchError) {
        console.warn('⚠️ GLB URL test failed:', fetchError);
      }

      // Try to load Ready Player Me avatar with timeout
      console.log('👤 Loading Ready Player Me avatar...');
      try {
        // Add a timeout to prevent hanging
        const avatarPromise = avatarLoader.current.loadAvatar('688acf39a70fe61ff012fe38');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Avatar loading timeout after 10 seconds')), 10000)
        );

        const avatar = await Promise.race([avatarPromise, timeoutPromise]) as any;

        if (avatar) {
          console.log('✅ Avatar loaded successfully');
          avatarRef.current = avatar;
          sceneRef.current!.add(avatar.scene);

          // Initialize EchoMimicV3 lip sync
          console.log('🗣️ Initializing lip sync...');
          const lipSync = new EchoMimicV3(avatar.morphTargets);
          setLipSyncEngine(lipSync);
          console.log('✅ Lip sync ready');

          setIsLoaded(true);
          startRenderLoop();
          console.log('🎉 Avatar fully initialized!');
        } else {
          throw new Error('Avatar loading returned null');
        }
      } catch (avatarError) {
        console.warn('⚠️ Ready Player Me avatar failed, creating simple avatar:', avatarError);

        // Create a simple geometric avatar
        const simpleAvatar = createSimpleAvatar();
        avatarRef.current = simpleAvatar;
        sceneRef.current!.add(simpleAvatar.scene);

        // Initialize basic lip sync
        const lipSync = new EchoMimicV3(simpleAvatar.morphTargets);
        setLipSyncEngine(lipSync);

        setIsLoaded(true);
        startRenderLoop();
        console.log('✅ Simple avatar initialized!');
      }

    } catch (error) {
      console.error('❌ Failed to initialize avatar:', error);
      setIsError(true);
      await loadFallbackImage();
    }
  }, []);

  const initializeScene = useCallback(async (): Promise<void> => {
    if (!mountRef.current) return;

    const width = 200; // Fixed size for bottom-right corner
    const height = 200;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera positioned for Ready Player Me avatar (head/shoulders view)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.65, 0.8); // Closer and slightly higher for head shot
    camera.lookAt(0, 1.65, 0); // Look at head level
    cameraRef.current = camera;

    // Renderer optimized for mobile
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: performanceTier === 'high',
      powerPreference: performanceTier === 'high' ? 'high-performance' : 'low-power'
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceTier === 'high' ? 2 : 1));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = performanceTier !== 'low';
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup optimized for Ready Player Me avatars
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Key light (main lighting)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1, 2, 1);
    keyLight.castShadow = performanceTier === 'high';
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 50;
    }
    scene.add(keyLight);

    // Fill light (softer lighting from the other side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-1, 1, 0.5);
    scene.add(fillLight);
  }, [performanceTier]);

  const startRenderLoop = useCallback(() => {
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !isVisible) {
        return;
      }

      // Update avatar mixer
      if (avatarRef.current) {
        avatarRef.current.mixer.update(0.016); // 60fps delta
      }

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // Continue animation loop
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [isVisible]);

  const speakWithLipSync = useCallback(async (text: string) => {
    if (!lipSyncEngine || isSpeaking) return;

    try {
      setIsSpeaking(true);

      // Use streaming lip sync for better quality
      // if (typeof (lipSyncEngine as any).startStreamingLipSync === 'function') {
      //   console.log('🎭 Using streaming lip sync');
      //   await (lipSyncEngine as any).startStreamingLipSync(text);
      //   setIsSpeaking(false);
      //   onSpeechComplete?.();
      //   return;
      // }

      // Fallback to traditional method
      console.log('🎭 Using traditional lip sync');
      
      // Generate phonemes from text
      const phonemes = lipSyncEngine.generatePhonemesFromText(text, 0.85);

      // Generate lip sync animation
      const lipSyncFrames = lipSyncEngine.generateLipSyncAnimation(phonemes);

      // Start lip sync animation
      lipSyncEngine.startAnimation(lipSyncFrames);

      // Start TTS
      await new Promise<void>((resolve, reject) => {
        ttsService.speak(
          text,
          { speed: 0.85 },
          () => { }, // onStart
          () => {
            // onEnd
            lipSyncEngine.stopAnimation();
            setIsSpeaking(false);
            onSpeechComplete?.();
            resolve();
          },
          (error) => {
            // onError
            lipSyncEngine.stopAnimation();
            setIsSpeaking(false);
            reject(new Error(error));
          }
        );
      });

    } catch (error) {
      console.error('Failed to speak with lip sync:', error);
      setIsSpeaking(false);
      onSpeechComplete?.();
    }
  }, [lipSyncEngine, isSpeaking, onSpeechComplete]);

  const playReactionAnimation = useCallback(() => {
    if (!avatarRef.current || !lipSyncEngine) return;

    // Simple nod animation for positive feedback
    const nodPhonemes: PhonemeData[] = [
      { phoneme: 'SIL', timestamp: 0, duration: 200, confidence: 1.0 },
      { phoneme: 'AH', timestamp: 200, duration: 100, confidence: 0.3 }, // Slight mouth movement
      { phoneme: 'SIL', timestamp: 300, duration: 200, confidence: 1.0 }
    ];

    const reactionFrames = lipSyncEngine.generateLipSyncAnimation(nodPhonemes);
    lipSyncEngine.startAnimation(reactionFrames);
  }, [lipSyncEngine]);

  const loadFallbackImage = useCallback(async () => {
    try {
      console.log('🖼️ Loading fallback image...');
      const fallback = await avatarLoader.current.generateFallbackImage('688acf39a70fe61ff012fe38');
      setFallbackImage(fallback);
      setIsLoaded(true);
      console.log('✅ Fallback image loaded');
    } catch (error) {
      console.error('❌ Failed to load fallback image:', error);
      // Create a simple static fallback
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;

      // Draw simple avatar placeholder
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, 200, 200);

      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(100, 80, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(70, 120, 60, 80);

      // Add text
      ctx.fillStyle = '#374151';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('AI Assistant', 100, 180);

      const dataURL = canvas.toDataURL('image/png');
      setFallbackImage(dataURL);
      setIsLoaded(true);
      console.log('✅ Simple fallback created');
    }
  }, []);

  const cleanup = useCallback(() => {
    // Stop animation loop
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Stop lip sync
    if (lipSyncEngine) {
      lipSyncEngine.dispose();
      setLipSyncEngine(null);
    }

    // Cleanup avatar
    if (avatarRef.current) {
      avatarRef.current.cleanup();
      avatarRef.current = null;
    }

    // Cleanup Three.js
    if (rendererRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }

    setIsLoaded(false);
    setIsSpeaking(false);
  }, [lipSyncEngine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      avatarLoader.current.dispose();
    };
  }, [cleanup]);

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
      <div className="relative">
        {/* 3D Avatar Container */}
        {isLoaded && !isError && performanceTier !== 'low' && (
          <div
            ref={mountRef}
            className="w-50 h-50 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-blue-100 to-purple-100"
            style={{ width: '200px', height: '200px' }}
          />
        )}

        {/* Fallback Image */}
        {(isError || performanceTier === 'low' || !isLoaded) && fallbackImage && (
          <div className="w-50 h-50 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-blue-100 to-purple-100">
            <img
              src={fallbackImage}
              alt="AI Assistant Avatar"
              className="w-full h-full object-cover"
              style={{ width: '200px', height: '200px' }}
            />
          </div>
        )}

        {/* Loading State */}
        {!isLoaded && !isError && !fallbackImage && (
          <div className="w-50 h-50 rounded-full bg-gray-200 flex flex-col items-center justify-center shadow-lg text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-xs text-gray-600">Loading Avatar...</div>
            <div className="text-xs text-gray-500 mt-1">Check console for details</div>
          </div>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}

        {/* Error State */}
        {isError && !fallbackImage && (
          <div className="w-50 h-50 rounded-full bg-gray-300 flex items-center justify-center shadow-lg">
            <span className="text-gray-600 text-sm">Avatar</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardAvatar;