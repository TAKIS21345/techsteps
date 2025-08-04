import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface GLBAvatarProps {
    isVisible: boolean;
    textToSpeak?: string;
    onSpeechComplete?: () => void;
    className?: string;
}

const GLBAvatar: React.FC<GLBAvatarProps> = ({
    isVisible,
    textToSpeak,
    onSpeechComplete,
    className = ''
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const avatarRef = useRef<THREE.Group | null>(null);
    const animationIdRef = useRef<number | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Initialize Three.js scene and load GLB
    useEffect(() => {
        if (isVisible && !isLoaded && !isError) {
            initializeAvatar();
        } else if (!isVisible) {
            cleanup();
        }

        return () => cleanup();
    }, [isVisible]);

    // Handle text-to-speech
    useEffect(() => {
        if (textToSpeak && isVisible && !isSpeaking) {
            speakText(textToSpeak);
        }
    }, [textToSpeak, isVisible, isSpeaking]);

    const initializeAvatar = async () => {
        if (!mountRef.current) return;

        console.log('🎭 Initializing GLB Avatar...');

        try {
            // Setup Three.js scene
            const width = 200;
            const height = 200;

            // Scene
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            // Camera - positioned to show head/shoulders
            const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            camera.position.set(0, 1.7, 0.5); // Position to see head
            camera.lookAt(0, 1.7, 0); // Look at head level
            cameraRef.current = camera;

            // Renderer
            const renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setSize(width, height);
            renderer.setClearColor(0x000000, 0); // Transparent background
            rendererRef.current = renderer;

            mountRef.current.appendChild(renderer.domElement);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);

            // Load GLB file
            console.log('📦 Loading GLB file from: /models/688acf39a70fe61ff012fe38.glb');
            const loader = new GLTFLoader();

            // Test if file is accessible first
            try {
                const testResponse = await fetch('/models/688acf39a70fe61ff012fe38.glb', { method: 'HEAD' });
                console.log('📡 GLB file accessibility test:', testResponse.status, testResponse.statusText);
            } catch (fetchError) {
                console.warn('⚠️ GLB file accessibility test failed:', fetchError);
            }

            const gltf = await new Promise<any>((resolve, reject) => {
                loader.load(
                    '/models/688acf39a70fe61ff012fe38.glb', // Local file path in public directory
                    (gltf) => {
                        console.log('✅ GLB file loaded successfully');
                        resolve(gltf);
                    },
                    (progress) => {
                        if (progress.total > 0) {
                            console.log('📥 Loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
                        }
                    },
                    (error) => {
                        console.error('❌ GLB loading failed:', error);
                        reject(error);
                    }
                );
            });

            console.log('✅ GLB loaded successfully');

            // Add avatar to scene
            const avatar = gltf.scene;
            avatarRef.current = avatar;

            // Center and scale the avatar to show head
            const box = new THREE.Box3().setFromObject(avatar);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Position avatar so head is centered
            avatar.position.x = -center.x;
            avatar.position.y = -center.y + size.y * 0.3; // Show upper portion (head/shoulders)
            avatar.position.z = -center.z;

            // Scale to fit nicely in the container
            const maxDimension = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDimension; // Adjust scale as needed
            avatar.scale.setScalar(scale);

            scene.add(avatar);

            console.log('🎯 Avatar positioned and scaled');
            console.log('📏 Avatar size:', size);
            console.log('📍 Avatar center:', center);

            setIsLoaded(true);
            startRenderLoop();

        } catch (error) {
            console.error('❌ Failed to load GLB avatar:', error);
            setIsError(true);
        }
    };

    const startRenderLoop = () => {
        const animate = () => {
            if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !isVisible) {
                return;
            }

            // Simple idle animation - slight head movement
            if (avatarRef.current && !isSpeaking) {
                const time = Date.now() * 0.001;
                avatarRef.current.rotation.y = Math.sin(time * 0.5) * 0.05; // Subtle head turn
            }

            // Render scene
            rendererRef.current.render(sceneRef.current, cameraRef.current);

            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();
    };

    const speakText = async (text: string) => {
        if (!('speechSynthesis' in window)) return;

        setIsSpeaking(true);

        // Simple mouth animation while speaking
        if (avatarRef.current) {
            const speakingAnimation = () => {
                if (isSpeaking && avatarRef.current) {
                    const time = Date.now() * 0.01;
                    // Simple head bob while speaking
                    avatarRef.current.rotation.x = Math.sin(time) * 0.02;
                    avatarRef.current.rotation.z = Math.sin(time * 0.7) * 0.01;
                }
            };

            const speakingInterval = setInterval(speakingAnimation, 50);

            // Clear animation when done
            setTimeout(() => {
                clearInterval(speakingInterval);
                if (avatarRef.current) {
                    avatarRef.current.rotation.x = 0;
                    avatarRef.current.rotation.z = 0;
                }
            }, text.length * 100); // Rough estimate of speech duration
        }

        // Use browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
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
    };

    const cleanup = () => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }

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
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
            <div className="relative">
                {/* 3D Avatar Container */}
                {isLoaded && !isError && (
                    <div
                        ref={mountRef}
                        className="w-50 h-50 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-blue-100 to-purple-100"
                        style={{ width: '200px', height: '200px' }}
                    />
                )}

                {/* Loading State */}
                {!isLoaded && !isError && (
                    <div className="w-50 h-50 rounded-full bg-gray-200 flex flex-col items-center justify-center shadow-lg text-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <div className="text-xs text-gray-600">Loading Avatar...</div>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="w-50 h-50 rounded-full bg-red-100 flex items-center justify-center shadow-lg">
                        <span className="text-red-600 text-sm">Avatar Error</span>
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

export default GLBAvatar;