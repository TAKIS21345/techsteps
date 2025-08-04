import React, { useState } from 'react';
import FlashcardAvatar from '../components/ai/avatar/FlashcardAvatar';
import SimpleAvatar from '../components/ai/avatar/SimpleAvatar';
import SimpleGLBViewer from '../components/ai/avatar/SimpleGLBViewer';
import BasicVRMViewer from '../components/ai/avatar/BasicVRMViewer';
import { useFlashcardAvatar } from '../hooks/useFlashcardAvatar';
import { runAllTTSTests, testBasicTTS, testBrowserTTS, testGoogleTTSAPI } from '../utils/testTTS';

const AvatarTestPage: React.FC = () => {
    const { state: avatarState, actions: avatarActions } = useFlashcardAvatar(true);
    const [testText, setTestText] = useState('');
    const [avatarType, setAvatarType] = useState<'glb' | 'vrm' | 'simple' | '3d'>('vrm');
    const [isTestingTTS, setIsTestingTTS] = useState(false);
    const [avatarQuality, setAvatarQuality] = useState<'high' | 'medium' | 'low'>('high');

    const sampleTexts = [
        "Hello! I'm your AI assistant ready to help you learn.",
        "Great job completing that step! Let's move on to the next one.",
        "Don't worry if this seems confusing. We'll take it step by step.",
        "You're doing wonderfully! Technology can be fun when you understand it.",
        "Let me explain this in a simple way that makes sense."
    ];

    const multilingualTexts: Record<string, string> = {
        'en': "Hello! I'm your AI assistant with precise lip sync.",
        'es': "¡Hola! Soy tu asistente de IA con sincronización labial precisa.",
        'fr': "Bonjour! Je suis votre assistant IA avec synchronisation labiale précise.",
        'de': "Hallo! Ich bin Ihr KI-Assistent mit präziser Lippensynchronisation.",
        'it': "Ciao! Sono il tuo assistente IA con sincronizzazione labiale precisa.",
        'pt': "Olá! Sou seu assistente de IA com sincronização labial precisa.",
        'ja': "こんにちは！私は正確なリップシンクを持つAIアシスタントです。",
        'zh': "你好！我是您的AI助手，具有精确的唇同步功能。"
    };

    const handleShowAvatar = () => {
        avatarActions.showAvatar();
    };

    const handleHideAvatar = () => {
        avatarActions.hideAvatar();
    };

    const handleSpeak = (text: string) => {
        avatarActions.speakText(text);
    };

    const handleUserInteraction = () => {
        avatarActions.onUserInteraction();
    };

    const handleRunTTSTests = async () => {
        setIsTestingTTS(true);
        try {
            await runAllTTSTests();
        } finally {
            setIsTestingTTS(false);
        }
    };

    const handleTestBrowserTTS = async () => {
        setIsTestingTTS(true);
        try {
            await testBrowserTTS("Testing browser speech synthesis directly.");
        } finally {
            setIsTestingTTS(false);
        }
    };

    const handleTestGoogleAPI = async () => {
        setIsTestingTTS(true);
        try {
            await testGoogleTTSAPI();
        } finally {
            setIsTestingTTS(false);
        }
    };

    const handleTestLipSync = () => {
        const lipSyncTestText = "Hello! Watch my mouth move as I speak. Peter Piper picked peppers. She sells seashells by the seashore. This tests various phonemes: Ah, Ee, Oh, Oo, and consonants like B, P, M, F, V, S, Z, T, D, K, G.";
        handleSpeak(lipSyncTestText);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Ready Player Me Avatar Test
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Test the Ready Player Me avatar integration with EchoMimicV3 lip sync.
                        The avatar will appear in the bottom-right corner when visible.
                    </p>

                    {/* Avatar Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Avatar Controls</h3>

                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={handleShowAvatar}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                >
                                    Show Avatar
                                </button>
                                <button
                                    onClick={handleHideAvatar}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                >
                                    Hide Avatar
                                </button>
                                <button
                                    onClick={handleUserInteraction}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Trigger Reaction
                                </button>
                                <button
                                    onClick={() => {
                                        const types: Array<'glb' | 'vrm' | 'simple' | '3d'> = ['vrm', 'glb', 'simple', '3d'];
                                        const currentIndex = types.indexOf(avatarType);
                                        const nextIndex = (currentIndex + 1) % types.length;
                                        setAvatarType(types[nextIndex]);
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                                >
                                    Switch to {avatarType === 'vrm' ? 'GLB' : avatarType === 'glb' ? 'Simple' : avatarType === 'simple' ? '3D' : 'VRM'} Avatar
                                </button>
                                <button
                                    onClick={() => setAvatarQuality(avatarQuality === 'high' ? 'medium' : avatarQuality === 'medium' ? 'low' : 'high')}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                                >
                                    Quality: {avatarQuality.toUpperCase()}
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Avatar Status
                                </label>
                                <div className="text-sm space-y-1">
                                    <div>Visible: {avatarState.isVisible ? '✅' : '❌'}</div>
                                    <div>Enabled: {avatarState.isEnabled ? '✅' : '❌'}</div>
                                    <div>Speaking: {avatarState.textToSpeak ? '🗣️' : '🤐'}</div>
                                    <div>Avatar Type: {avatarType.toUpperCase()}</div>
                                    <div>Quality: {avatarQuality.toUpperCase()}</div>
                                    <div>WebGL: {typeof WebGLRenderingContext !== 'undefined' ? '✅' : '❌'}</div>
                                    <div>Speech Synthesis: {'speechSynthesis' in window ? '✅' : '❌'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">Speech Test</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Custom Text
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={testText}
                                        onChange={(e) => setTestText(e.target.value)}
                                        placeholder="Enter text for avatar to speak..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => handleSpeak(testText)}
                                        disabled={!testText.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        Speak
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multilingual Testing */}
                    <div className="space-y-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-700">Multilingual Lip Sync Test</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(multilingualTexts).map(([lang, text]) => (
                                <button
                                    key={lang}
                                    onClick={() => handleSpeak(text)}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm"
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600">
                            Test the avatar's lip sync accuracy across different languages with male voice.
                        </p>
                    </div>

                    {/* TTS Testing */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">TTS Testing</h3>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handleRunTTSTests}
                                disabled={isTestingTTS}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isTestingTTS ? '🧪 Testing...' : '🧪 Run All TTS Tests'}
                            </button>
                            <button
                                onClick={handleTestBrowserTTS}
                                disabled={isTestingTTS}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                🗣️ Test Browser TTS
                            </button>
                            <button
                                onClick={handleTestGoogleAPI}
                                disabled={isTestingTTS}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                🌐 Test Google API
                            </button>
                            <button
                                onClick={handleTestLipSync}
                                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors duration-200"
                            >
                                👄 Test Lip Sync
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            Check the browser console for detailed test results.
                        </div>
                    </div>

                    {/* Sample Texts */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Sample Texts</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {sampleTexts.map((text, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSpeak(text)}
                                    className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-sm"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Technical Info */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Technical Details</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                            <div>• Avatar Model: Ready Player Me HD (688acf39a70fe61ff012fe38.glb)</div>
                            <div>• Lip Sync: Real-time phoneme-based animation (60fps)</div>
                            <div>• Resolution: High-definition 400x500px with post-processing</div>
                            <div>• Rendering: PBR materials, shadows, SSAO, bloom, anti-aliasing</div>
                            <div>• Lighting: Professional 4-point lighting setup</div>
                            <div>• Quality: {avatarQuality.toUpperCase()} mode with adaptive performance</div>
                            <div>• WebGL Support: {typeof WebGLRenderingContext !== 'undefined' ? '✅' : '❌'}</div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Instructions</h4>
                        <div className="text-sm text-yellow-700 space-y-1">
                            <div>1. Click "Show Avatar" to display the 3D avatar in the bottom-right corner</div>
                            <div>2. Use the sample texts or enter custom text to test lip sync</div>
                            <div>3. Click "Trigger Reaction" to see the avatar's response animation</div>
                            <div>4. The avatar will automatically optimize for your device's performance</div>
                            <div>5. On low-end devices, a static fallback image will be shown instead</div>
                        </div>
                    </div>
                </div>

                {/* Avatar Components */}
                {avatarType === 'vrm' && (
                    <BasicVRMViewer
                        isVisible={avatarState.isVisible}
                        textToSpeak={avatarState.textToSpeak || undefined}
                        onSpeechComplete={() => {
                            console.log('VRM avatar speech completed');
                        }}
                    />
                )}

                {avatarType === 'glb' && (
                    <SimpleGLBViewer
                        isVisible={avatarState.isVisible}
                        textToSpeak={avatarState.textToSpeak || undefined}
                        onSpeechComplete={() => {
                            console.log('GLB avatar speech completed');
                        }}
                    />
                )}

                {avatarType === 'simple' && (
                    <SimpleAvatar
                        isVisible={avatarState.isVisible}
                        textToSpeak={avatarState.textToSpeak || undefined}
                        onSpeechComplete={() => {
                            console.log('Simple avatar speech completed');
                        }}
                    />
                )}

                {avatarType === '3d' && (
                    <FlashcardAvatar
                        isVisible={avatarState.isVisible}
                        textToSpeak={avatarState.textToSpeak || undefined}
                        onSpeechComplete={() => {
                            console.log('3D avatar speech completed');
                        }}
                        onUserInteraction={() => {
                            console.log('User interaction detected');
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default AvatarTestPage;