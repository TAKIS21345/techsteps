import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  Monitor, 
  Cpu, 
  MemoryStick, 
  Zap, 
  Eye, 
  EyeOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Info
} from 'lucide-react';
import { PerformanceMonitor, PerformanceMetrics } from '../../../services/avatar/PerformanceMonitor';

interface AvatarControlPanelProps {
  isVisible: boolean;
  onClose: () => void;
  performanceMode: 'high' | 'medium' | 'low' | 'off';
  onPerformanceModeChange: (mode: 'high' | 'medium' | 'low' | 'off') => void;
  isAvatarEnabled: boolean;
  onToggleAvatar: (enabled: boolean) => void;
  isMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  isFullscreen: boolean;
  onToggleFullscreen: (fullscreen: boolean) => void;
  emotionalState: {
    primary: 'neutral' | 'happy' | 'concerned' | 'encouraging' | 'thinking';
    intensity: number;
  };
  onEmotionalStateChange: (state: any) => void;
}

const AvatarControlPanel: React.FC<AvatarControlPanelProps> = ({
  isVisible,
  onClose,
  performanceMode,
  onPerformanceModeChange,
  isAvatarEnabled,
  onToggleAvatar,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  emotionalState,
  onEmotionalStateChange
}) => {
  const { t } = useTranslation();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    cpuUsage: 0,
    memoryUsage: 0,
    renderTime: 0,
    audioLatency: 0
  });
  const [performanceMonitor] = useState(() => new PerformanceMonitor());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);

  // Monitor performance metrics
  useEffect(() => {
    if (isAvatarEnabled && isVisible) {
      const updateMetrics = () => {
        const metrics = performanceMonitor.getMetrics();
        setPerformanceMetrics(metrics);

        // Auto-optimize performance if enabled
        if (autoOptimize) {
          const recommendedMode = performanceMonitor.getRecommendedPerformanceMode();
          if (recommendedMode !== performanceMode) {
            onPerformanceModeChange(recommendedMode);
          }
        }
      };

      const interval = setInterval(updateMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [isAvatarEnabled, isVisible, performanceMonitor, autoOptimize, performanceMode, onPerformanceModeChange]);

  const handleResetAvatar = () => {
    // Reset avatar to default state
    onEmotionalStateChange({
      primary: 'neutral',
      intensity: 0.5,
      duration: 1000
    });
    onPerformanceModeChange('medium');
    performanceMonitor.reset();
  };

  const getPerformanceColor = (value: number, type: 'fps' | 'usage') => {
    if (type === 'fps') {
      if (value >= 45) return 'text-green-600';
      if (value >= 25) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value <= 50) return 'text-green-600';
      if (value <= 75) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const expressionPresets = [
    { key: 'neutral', label: 'Neutral', icon: '😐' },
    { key: 'happy', label: 'Happy', icon: '😊' },
    { key: 'encouraging', label: 'Encouraging', icon: '👍' },
    { key: 'thinking', label: 'Thinking', icon: '🤔' },
    { key: 'concerned', label: 'Concerned', icon: '😟' }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {t('avatar.settings')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">Avatar System</h3>
              <p className="text-sm text-gray-600">Enable or disable the 3D avatar</p>
            </div>
            <button
              onClick={() => onToggleAvatar(!isAvatarEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isAvatarEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  isAvatarEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isAvatarEnabled && (
            <>
              {/* Performance Mode */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Performance Mode
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['high', 'medium', 'low', 'off'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onPerformanceModeChange(mode)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        performanceMode === mode
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium capitalize">{mode}</div>
                      <div className="text-xs text-gray-500">
                        {mode === 'high' && 'Best quality'}
                        {mode === 'medium' && 'Balanced'}
                        {mode === 'low' && 'Performance'}
                        {mode === 'off' && 'Disabled'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Performance Metrics
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Auto-optimize</label>
                    <button
                      onClick={() => setAutoOptimize(!autoOptimize)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                        autoOptimize ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                          autoOptimize ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Monitor className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">FPS</span>
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.fps, 'fps')}`}>
                      {Math.round(performanceMetrics.fps)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">CPU</span>
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.cpuUsage, 'usage')}`}>
                      {Math.round(performanceMetrics.cpuUsage)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MemoryStick className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Memory</span>
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.memoryUsage, 'usage')}`}>
                      {Math.round(performanceMetrics.memoryUsage)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Render</span>
                    </div>
                    <div className="text-lg font-bold text-gray-700">
                      {performanceMetrics.renderTime.toFixed(1)}ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Expression Presets */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Expression Presets</h3>
                <div className="grid grid-cols-3 gap-2">
                  {expressionPresets.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => onEmotionalStateChange({
                        primary: preset.key,
                        intensity: 0.7,
                        duration: 2000
                      })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        emotionalState.primary === preset.key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{preset.icon}</div>
                      <div className="text-xs font-medium">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Expression Intensity</h3>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={emotionalState.intensity}
                    onChange={(e) => onEmotionalStateChange({
                      ...emotionalState,
                      intensity: parseFloat(e.target.value)
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Subtle</span>
                    <span>Intense</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onToggleMute(!isMuted)}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>
                  
                  <button
                    onClick={() => onToggleFullscreen(!isFullscreen)}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    <span className="text-sm">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
                  </button>
                  
                  <button
                    onClick={handleResetAvatar}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm">Reset</span>
                  </button>
                  
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Advanced</span>
                  </button>
                </div>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800">Advanced Settings</h3>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Performance Recommendations</h4>
                    <div className="space-y-1 text-sm text-yellow-700">
                      {performanceMonitor.getOptimizationSuggestions().map((suggestion, index) => (
                        <div key={index}>• {suggestion}</div>
                      ))}
                      {performanceMonitor.getOptimizationSuggestions().length === 0 && (
                        <div>Performance is optimal!</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Recommended Mode:</span>
                      <div className="font-medium capitalize">
                        {performanceMonitor.getRecommendedPerformanceMode()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Device Capabilities:</span>
                      <div className="font-medium">
                        {performanceMonitor.detectDeviceCapabilities().hardwareConcurrency} cores
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarControlPanel;