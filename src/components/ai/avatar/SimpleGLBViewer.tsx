import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ttsService } from '../../../utils/ttsService';
import { PreciseLipSyncEngine, LipSyncState, MorphTargetWeights } from '../../../services/avatar/PreciseLipSyncEngine';
import { PhonemeData } from '../../../services/avatar/PhonemePreprocessor';
import { GoogleTTSService } from '../../../services/tts/GoogleTTSService';
import { useTranslation } from '../../../hooks/useTranslation';

interface SimpleGLBViewerProps {
    isVisible: boolean;
    textToSpeak?: string;
    onSpeechComplete?: () => void;
    className?: string;
}

const SimpleGLBViewer: React.FC<SimpleGLBViewerProps> = ({
    isVisible,
    textToSpeak,
    onSpeechComplete,
    className = ''
}) => {
    const { currentLanguage } = useTranslation();
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Helper function to map language codes to Google TTS language codes
    const getGoogleTTSLanguageCode = (lang: string): string => {
        const languageMap: Record<string, string> = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-BR',
            'ru': 'ru-RU',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'zh': 'zh-CN',
            'ar': 'ar-XA',
            'hi': 'hi-IN',
            'th': 'th-TH',
            'vi': 'vi-VN',
            'tr': 'tr-TR',
            'pl': 'pl-PL',
            'nl': 'nl-NL',
            'sv': 'sv-SE',
            'da': 'da-DK',
            'no': 'nb-NO',
            'fi': 'fi-FI',
            'cs': 'cs-CZ',
            'sk': 'sk-SK',
            'hu': 'hu-HU',
            'ro': 'ro-RO',
            'bg': 'bg-BG',
            'hr': 'hr-HR',
            'sl': 'sl-SI',
            'et': 'et-EE',
            'lv': 'lv-LV',
            'lt': 'lt-LT',
            'he': 'he-IL',
            'uk': 'uk-UA'
        };
        
        return languageMap[lang] || 'en-US';
    };

    const lipSyncEngineRef = useRef<PreciseLipSyncEngine | null>(null);
    const googleTTSRef = useRef<GoogleTTSService | null>(null);
    const avatarRef = useRef<THREE.Group | null>(null);
    const morphTargetsRef = useRef<{ [key: string]: number }>({});

    useEffect(() => {
        if (!isVisible || !mountRef.current) return;

        let scene: THREE.Scene;
        let camera: THREE.PerspectiveCamera;
        let renderer: THREE.WebGLRenderer;
        let animationId: number;

        const init = async () => {
            try {
                // High-quality Three.js setup (now that basic works)
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(60, 250 / 300, 0.1, 1000);
                renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: true,
                    powerPreference: 'high-performance'
                });
                renderer.setSize(250, 300);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setClearColor(0x000000, 0);

                // Enable shadows and better rendering
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.0;

                mountRef.current!.appendChild(renderer.domElement);
                console.log('✅ High-quality renderer initialized');

                // Enhanced lighting for better quality
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
                scene.add(ambientLight);

                // Key light with shadows
                const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
                keyLight.position.set(2, 2, 1);
                keyLight.castShadow = true;
                keyLight.shadow.mapSize.width = 1024;
                keyLight.shadow.mapSize.height = 1024;
                keyLight.shadow.camera.near = 0.1;
                keyLight.shadow.camera.far = 10;
                scene.add(keyLight);

                // Fill light
                const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
                fillLight.position.set(-1, 1, 0.5);
                scene.add(fillLight);

                // Face light
                const faceLight = new THREE.DirectionalLight(0xffffff, 0.4);
                faceLight.position.set(0, 0, 1);
                scene.add(faceLight);

                // Remove test cube since avatar is working
                console.log('✅ Lighting setup complete');

                // Load GLB with detailed logging
                console.log('🔄 Loading GLB from: /models/688acf39a70fe61ff012fe38.glb');
                const loader = new GLTFLoader();
                const gltf = await new Promise<any>((resolve, reject) => {
                    loader.load(
                        '/models/688acf39a70fe61ff012fe38.glb',
                        (gltf) => {
                            console.log('✅ GLB loaded successfully!', gltf);
                            console.log('📊 Scene children:', gltf.scene.children.length);
                            resolve(gltf);
                        },
                        (progress) => {
                            const percent = Math.round((progress.loaded / progress.total) * 100);
                            console.log('📈 Loading progress:', percent + '%');
                        },
                        (error) => {
                            console.error('❌ GLB loading failed:', error);
                            reject(error);
                        }
                    );
                });

                // Add model to scene with enhancements
                const model = gltf.scene;

                // Enable shadows and enhance materials
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material && child.material instanceof THREE.MeshStandardMaterial) {
                            // Enhance skin materials
                            if (child.material.name.toLowerCase().includes('skin') ||
                                child.material.name.toLowerCase().includes('face')) {
                                child.material.roughness = 0.6;
                                child.material.metalness = 0.0;
                            }
                            // Enhance eye materials
                            else if (child.material.name.toLowerCase().includes('eye')) {
                                child.material.roughness = 0.1;
                                child.material.metalness = 0.0;
                            }
                            // Default enhancement
                            else {
                                child.material.roughness = 0.7;
                                child.material.metalness = 0.0;
                            }
                        }
                    }
                });

                scene.add(model);
                console.log('✅ Model added with enhanced materials');

                // Initialize morph targets for lip sync
                let morphTargetsFound = false;
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh && child.morphTargetInfluences && !morphTargetsFound) {
                        console.log('✅ Morph targets ready for lip sync:', Object.keys(child.morphTargetDictionary || {}));
                        morphTargetsFound = true;
                    }
                });

                // Initialize precise lip sync engine
                lipSyncEngineRef.current = new PreciseLipSyncEngine();
                
                // Store avatar reference for morph target access
                avatarRef.current = model;

                // Initialize Google TTS service
                googleTTSRef.current = new GoogleTTSService('AIzaSyCGnrz2QNBKLCsqwzDESePSfNEcq0m24JY');

                // Basic model positioning
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                model.position.sub(center);
                model.position.y += size.y * 0.15;

                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 1.4 / maxDim; // Smaller scale to show more of the avatar
                model.scale.setScalar(scale);

                console.log('✅ Model positioned and scaled');

                // Position camera - zoomed out to show more of avatar
                camera.position.set(0, 0.6, 0.4);
                camera.lookAt(0, 0.6, 0);

                setIsLoaded(true);
                console.log('✅ Everything ready, starting render loop');

                // Render loop
                const animate = () => {
                    animationId = requestAnimationFrame(animate);
                    renderer.render(scene, camera);
                };
                animate();

            } catch (err) {
                console.error('GLB loading error:', err);
                setError('Failed to load avatar');
            }
        };

        init();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (lipSyncEngineRef.current) {
                lipSyncEngineRef.current.stop();
                lipSyncEngineRef.current = null;
            }
            // Basic cleanup
            if (renderer && mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
                renderer.dispose();
            }
        };
    }, [isVisible]);

    // Handle text-to-speech with precise lip sync
    useEffect(() => {
        if (textToSpeak && isVisible && !isSpeaking && isLoaded) {
            setIsSpeaking(true);

            const speakWithPreciseLipSync = async () => {
                try {
                    if (googleTTSRef.current && lipSyncEngineRef.current && avatarRef.current) {
                        console.log('🎭 Using Google TTS with precise lip sync');

                        // Get current language code for TTS
                        const ttsLanguageCode = getGoogleTTSLanguageCode(currentLanguage);
                        
                        // Get lip sync data with preprocessed phonemes using language-optimized settings
                        const lipSyncData = await googleTTSRef.current.synthesizeForLipSync(textToSpeak, {
                            voice: {
                                languageCode: ttsLanguageCode,
                                ssmlGender: 'MALE'
                            },
                            audioConfig: {
                                audioEncoding: 'MP3',
                                speakingRate: 0.85, // Will be adjusted by service based on language
                                pitch: -1.5,        // Will be adjusted by service based on language
                                volumeGainDb: 2.0
                            }
                        });

                        // Convert phoneme data to include proper visemes
                        const { PhonemePreprocessor } = await import('../../../services/avatar/PhonemePreprocessor');
                        const preprocessor = new PhonemePreprocessor();
                        const phonemeData = preprocessor.convertPhonemesToVisemes(lipSyncData.phonemes);

                        lipSyncEngineRef.current.initialize(phonemeData);

                        // Set up morph target update callback
                        const updateMorphTargets = (state: LipSyncState, morphWeights: MorphTargetWeights) => {
                            if (!avatarRef.current) return;

                            // Apply morph targets to all meshes
                            avatarRef.current.traverse((child) => {
                                if (child instanceof THREE.Mesh && child.morphTargetInfluences) {
                                    // Update morph targets based on lip sync state
                                    Object.keys(morphWeights).forEach((targetName) => {
                                        if (child.morphTargetDictionary && child.morphTargetDictionary[targetName] !== undefined) {
                                            const targetIndex = child.morphTargetDictionary[targetName];
                                            if (child.morphTargetInfluences && targetIndex < child.morphTargetInfluences.length) {
                                                child.morphTargetInfluences[targetIndex] = morphWeights[targetName];
                                            }
                                        }
                                    });
                                }
                            });
                        };

                        // Start lip sync animation
                        console.log('🎭 Starting precise lip sync with', phonemeData.length, 'phonemes');
                        lipSyncEngineRef.current.start(updateMorphTargets);

                        // Start Google TTS playback with language-optimized settings
                        await googleTTSRef.current.speak(textToSpeak, {
                            voice: {
                                languageCode: ttsLanguageCode,
                                ssmlGender: 'MALE'
                            },
                            audioConfig: {
                                audioEncoding: 'MP3',
                                speakingRate: 0.85, // Will be adjusted by service based on language
                                pitch: -1.5,        // Will be adjusted by service based on language
                                volumeGainDb: 2.0
                            }
                        }, {
                            onStart: () => {
                                console.log('🗣️ Google TTS started speaking with precise lip sync');
                            },
                            onEnd: () => {
                                console.log('✅ Google TTS finished speaking');
                                lipSyncEngineRef.current?.stop();
                                setIsSpeaking(false);
                                onSpeechComplete?.();
                            },
                            onError: (error) => {
                                console.error('❌ Google TTS error:', error);
                                lipSyncEngineRef.current?.stop();
                                fallbackToBrowserTTS();
                            }
                        });
                    } else {
                        fallbackToBrowserTTS();
                    }
                } catch (error) {
                    console.error('❌ Precise lip sync failed:', error);
                    fallbackToBrowserTTS();
                }
            };

            const fallbackToBrowserTTS = () => {
                console.log('🗣️ Using browser TTS fallback');
                
                ttsService.speak(
                    textToSpeak,
                    { speed: 0.85, language: 'en-US' },
                    () => console.log('🗣️ Browser TTS started'),
                    () => {
                        console.log('✅ Browser TTS finished');
                        setIsSpeaking(false);
                        onSpeechComplete?.();
                    },
                    (error) => {
                        console.error('❌ Browser TTS error:', error);
                        setIsSpeaking(false);
                        onSpeechComplete?.();
                    }
                );
            };

            speakWithPreciseLipSync();
        }
    }, [textToSpeak, isVisible, isSpeaking, isLoaded, onSpeechComplete]);

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
            {!isLoaded && !error && (
                <div className="w-20 h-24 flex items-center justify-center bg-black/10 rounded-lg backdrop-blur-sm">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <div className="text-xs text-gray-600">Loading HD Avatar...</div>
                    </div>
                </div>
            )}

            {error && (
                <div className="w-48 h-16 flex items-center justify-center text-red-500 text-sm bg-white/90 rounded-lg shadow-lg border border-red-200">
                    <div className="text-center">
                        <div className="font-semibold">Avatar Error</div>
                        <div className="text-xs">{error}</div>
                    </div>
                </div>
            )}

            {/* High-quality avatar container */}
            <div
                ref={mountRef}
                className="pointer-events-none rounded-lg overflow-hidden shadow-2xl"
                style={{
                    width: '250px',
                    height: '300px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
            />

            {/* Enhanced Speaking Indicator */}
            {isSpeaking && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
                </div>
            )}

            {/* Enhanced Lip Sync Indicator */}
            {lipSyncEngineRef.current?.isAnimationPlaying() && (
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    <div className="text-white text-sm">👄</div>
                </div>
            )}
        </div>
    );
};

export default SimpleGLBViewer;