import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Camera, Send, Upload, MicOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface MultiModalInputProps {
  onTextSubmit: (text: string) => void;
  onVoiceSubmit: (audioBlob: Blob) => void;
  onImageSubmit: (imageFile: File, context?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

type InputMode = 'chat' | 'voice' | 'image';

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  transcript: string;
  error: string | null;
}

interface ImageState {
  preview: string | null;
  file: File | null;
  isCapturing: boolean;
  hasCamera: boolean;
  context: string;
}

export const MultiModalInput: React.FC<MultiModalInputProps> = ({
  onTextSubmit,
  onVoiceSubmit,
  onImageSubmit,
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const { settings } = useAccessibility();
  
  // State management
  const [activeMode, setActiveMode] = useState<InputMode>('chat');
  const [textInput, setTextInput] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    audioLevel: 0,
    transcript: '',
    error: null
  });
  const [imageState, setImageState] = useState<ImageState>({
    preview: null,
    file: null,
    isCapturing: false,
    hasCamera: false,
    context: ''
  });

  // Refs
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Check camera availability on mount
  useEffect(() => {
    checkCameraAvailability();
  }, []);

  // Focus text input when switching to chat mode
  useEffect(() => {
    if (activeMode === 'chat' && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [activeMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      setImageState(prev => ({ ...prev, hasCamera }));
    } catch (error) {
      console.warn('Could not check camera availability:', error);
      setImageState(prev => ({ ...prev, hasCamera: false }));
    }
  };

  // Text Input Handlers
  const handleTextSubmit = () => {
    if (!textInput.trim() || isLoading || disabled) return;
    
    onTextSubmit(textInput.trim());
    setTextInput('');
  };

  const handleTextKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  // Voice Input Handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start level monitoring
      monitorAudioLevel();

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const audioChunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        onVoiceSubmit(audioBlob);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorderRef.current.start();
      setVoiceState(prev => ({ 
        ...prev, 
        isRecording: true, 
        error: null,
        transcript: ''
      }));

    } catch (error) {
      console.error('Error starting voice recording:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Could not access microphone. Please check permissions.',
        isRecording: false
      }));
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
      setVoiceState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isProcessing: true,
        audioLevel: 0
      }));
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      
      setVoiceState(prev => ({ ...prev, audioLevel: normalizedLevel }));
      
      if (voiceState.isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Image Input Handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('multimodal.image.invalidType', 'Please select a valid image file.'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('multimodal.image.tooLarge', 'Image file is too large. Please select a file under 10MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageState(prev => ({
        ...prev,
        preview: e.target?.result as string,
        file
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      setImageState(prev => ({ ...prev, isCapturing: true }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // In a real implementation, you'd show a camera preview here
      // For now, we'll just trigger the file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => handleImageUpload(e as any);
      input.click();
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(t('multimodal.image.cameraError', 'Could not access camera. Please check permissions.'));
    } finally {
      setImageState(prev => ({ ...prev, isCapturing: false }));
    }
  };

  const handleImageSubmit = () => {
    if (!imageState.file) return;
    
    onImageSubmit(imageState.file, imageState.context || undefined);
    
    // Reset image state
    setImageState({
      preview: null,
      file: null,
      isCapturing: false,
      hasCamera: imageState.hasCamera,
      context: ''
    });
  };

  const clearImagePreview = () => {
    setImageState(prev => ({
      ...prev,
      preview: null,
      file: null,
      context: ''
    }));
  };

  // Tab configuration
  const tabs = [
    {
      id: 'chat' as const,
      label: t('multimodal.tabs.chat', 'Chat'),
      icon: MessageSquare,
      ariaLabel: t('multimodal.tabs.chatAria', 'Text chat input')
    },
    {
      id: 'voice' as const,
      label: t('multimodal.tabs.voice', 'Voice'),
      icon: Mic,
      ariaLabel: t('multimodal.tabs.voiceAria', 'Voice input')
    },
    {
      id: 'image' as const,
      label: t('multimodal.tabs.image', 'Image'),
      icon: Camera,
      ariaLabel: t('multimodal.tabs.imageAria', 'Image input')
    }
  ];

  return (
    <div className={`multimodal-input bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200" role="tablist" aria-label={t('multimodal.tabsLabel', 'Input methods')}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveMode(tab.id)}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-4 px-6
                text-lg font-medium transition-all duration-200
                min-h-[60px] touch-target
                focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-offset-3
                ${isActive 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={disabled}
              aria-label={tab.ariaLabel}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="p-6">
        {/* Chat Panel */}
        {activeMode === 'chat' && (
          <div
            id="chat-panel"
            role="tabpanel"
            aria-labelledby="chat-tab"
            className="space-y-4"
          >
            <div className="relative">
              <textarea
                ref={textInputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleTextKeyPress}
                placeholder={t('multimodal.chat.placeholder', 'Type your question here... Press Enter to send')}
                className={`
                  w-full px-4 py-3 text-lg border border-gray-300 rounded-lg
                  resize-none min-h-[120px] max-h-[200px]
                  focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-transparent
                  ${settings.highContrast ? 'high-contrast-text high-contrast-bg' : ''}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={disabled || isLoading}
                rows={4}
                aria-label={t('multimodal.chat.ariaLabel', 'Type your question')}
              />
              
              {/* Character count for accessibility */}
              <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                {textInput.length}/1000
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isLoading || disabled}
                className={`
                  btn-primary flex items-center space-x-2 px-6 py-3
                  min-w-[120px] button-target
                  ${(!textInput.trim() || isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={t('multimodal.chat.sendButton', 'Send message')}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-5 h-5" aria-hidden="true" />
                )}
                <span>{t('multimodal.chat.send', 'Send')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Voice Panel */}
        {activeMode === 'voice' && (
          <div
            id="voice-panel"
            role="tabpanel"
            aria-labelledby="voice-tab"
            className="space-y-6 text-center"
          >
            {/* Voice Recording Button */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={voiceState.isRecording ? stopVoiceRecording : startVoiceRecording}
                disabled={disabled || isLoading || voiceState.isProcessing}
                className={`
                  w-24 h-24 rounded-full flex items-center justify-center
                  transition-all duration-200 touch-target
                  focus:outline-none focus:ring-4 focus:ring-offset-4
                  ${voiceState.isRecording 
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                  }
                  ${(disabled || isLoading || voiceState.isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={
                  voiceState.isRecording 
                    ? t('multimodal.voice.stopRecording', 'Stop recording')
                    : t('multimodal.voice.startRecording', 'Start recording')
                }
              >
                {voiceState.isProcessing ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : voiceState.isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>

              {/* Audio Level Visualization */}
              {voiceState.isRecording && (
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-100"
                    style={{ width: `${voiceState.audioLevel * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              )}

              {/* Status Text */}
              <div className="text-center">
                {voiceState.isRecording && (
                  <p className="text-lg font-medium text-blue-600">
                    {t('multimodal.voice.recording', 'Recording... Tap to stop')}
                  </p>
                )}
                {voiceState.isProcessing && (
                  <p className="text-lg font-medium text-gray-600">
                    {t('multimodal.voice.processing', 'Processing your voice...')}
                  </p>
                )}
                {!voiceState.isRecording && !voiceState.isProcessing && (
                  <p className="text-lg text-gray-600">
                    {t('multimodal.voice.instructions', 'Tap the microphone to start recording')}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {voiceState.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{voiceState.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Panel */}
        {activeMode === 'image' && (
          <div
            id="image-panel"
            role="tabpanel"
            aria-labelledby="image-tab"
            className="space-y-6"
          >
            {!imageState.preview ? (
              <div className="space-y-4">
                {/* Upload Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Camera Capture */}
                  {imageState.hasCamera && (
                    <button
                      onClick={handleCameraCapture}
                      disabled={disabled || isLoading || imageState.isCapturing}
                      className={`
                        btn-secondary flex items-center justify-center space-x-3 p-6
                        min-h-[80px] button-target
                        ${(disabled || isLoading || imageState.isCapturing) ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      aria-label={t('multimodal.image.takePhoto', 'Take a photo')}
                    >
                      {imageState.isCapturing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                      <span className="text-lg">
                        {t('multimodal.image.camera', 'Take Photo')}
                      </span>
                    </button>
                  )}

                  {/* File Upload */}
                  <label
                    className={`
                      btn-secondary flex items-center justify-center space-x-3 p-6
                      min-h-[80px] button-target cursor-pointer
                      ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-lg">
                      {t('multimodal.image.upload', 'Upload Image')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={disabled || isLoading}
                      className="hidden"
                      aria-label={t('multimodal.image.uploadAria', 'Select image file')}
                    />
                  </label>
                </div>

                {/* Instructions */}
                <div className="text-center text-gray-600">
                  <p className="text-lg">
                    {t('multimodal.image.instructions', 'Share a photo and I\'ll help explain what you see')}
                  </p>
                  <p className="text-sm mt-2">
                    {t('multimodal.image.formats', 'Supports JPG, PNG, GIF (max 10MB)')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative">
                  <img
                    src={imageState.preview}
                    alt={t('multimodal.image.previewAlt', 'Selected image preview')}
                    className="w-full max-w-md mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={clearImagePreview}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    aria-label={t('multimodal.image.remove', 'Remove image')}
                  >
                    ×
                  </button>
                </div>

                {/* Context Input */}
                <div>
                  <label htmlFor="image-context" className="block text-lg font-medium text-gray-700 mb-2">
                    {t('multimodal.image.contextLabel', 'What would you like to know about this image?')}
                  </label>
                  <textarea
                    id="image-context"
                    value={imageState.context}
                    onChange={(e) => setImageState(prev => ({ ...prev, context: e.target.value }))}
                    placeholder={t('multimodal.image.contextPlaceholder', 'Optional: Ask a specific question about the image')}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg resize-none min-h-[80px] focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={clearImagePreview}
                    className="btn-secondary px-6 py-3 button-target"
                  >
                    {t('multimodal.image.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleImageSubmit}
                    disabled={disabled || isLoading}
                    className={`
                      btn-primary flex items-center space-x-2 px-6 py-3 button-target
                      ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    aria-label={t('multimodal.image.submit', 'Submit image')}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span>{t('multimodal.image.send', 'Send')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiModalInput;