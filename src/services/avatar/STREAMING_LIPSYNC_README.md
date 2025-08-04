# Streaming Lip Sync Implementation

## Overview

This implementation provides real-time, high-quality lip sync for 3D avatars using Google Text-to-Speech and advanced audio analysis. The system processes audio streams in real-time to generate accurate viseme data for realistic mouth movements.

## Architecture

### Core Components

1. **StreamingLipSyncEngine** - Main engine for real-time audio processing
2. **GoogleTTSService** - High-quality text-to-speech synthesis
3. **LipSyncEngine** - Integration layer with VRM avatars
4. **Audio Analysis Pipeline** - Real-time frequency and phoneme analysis

### Data Flow

```
Text Input → Google TTS → Audio Stream → Web Audio API → FFT Analysis → 
Phoneme Classification → Viseme Generation → Morph Target Application
```

## Features

### 🎭 Real-time Processing
- **Web Audio API Integration**: Direct audio stream processing
- **FFT Analysis**: Real-time frequency domain analysis
- **60fps Updates**: Smooth viseme transitions at 60 frames per second
- **Low Latency**: <50ms processing delay

### 🗣️ Advanced Phoneme Detection
- **MFCC Features**: Mel-frequency cepstral coefficients for phoneme classification
- **Spectral Analysis**: Frequency centroid and zero-crossing rate analysis
- **Confidence Scoring**: Weighted phoneme confidence based on audio clarity
- **Noise Filtering**: Automatic silence detection and noise reduction

### 👄 Oculus/Meta Viseme Standard
- **15 Viseme Set**: Complete Oculus/Meta viseme mapping
- **Smooth Transitions**: Configurable smoothing between visemes
- **Intensity Control**: Dynamic intensity based on audio amplitude
- **Secondary Visemes**: Subtle additional mouth shapes for realism

### 🎵 Google TTS Integration
- **Neural Voices**: High-quality Google Cloud neural voices
- **Senior Optimization**: Slower speech rate and clear pronunciation
- **Multiple Languages**: Support for various language codes
- **Audio Quality**: 48kHz sample rate for optimal analysis

## Usage

### Basic Implementation

```typescript
import { StreamingLipSyncEngine } from './services/avatar/StreamingLipSyncEngine';
import { GoogleTTSService } from './services/tts/GoogleTTSService';

// Initialize services
const googleTTS = new GoogleTTSService('YOUR_API_KEY');
const morphTargets = extractMorphTargetsFromAvatar(avatar);
const lipSyncEngine = new StreamingLipSyncEngine(morphTargets);

// Start streaming lip sync
await lipSyncEngine.startStreamingLipSync(
  "Hello, this is a test of streaming lip sync!",
  googleTTS,
  (visemes) => {
    // Apply visemes to avatar
    applyVisemesToAvatar(visemes);
  }
);
```

### VRM Integration

```typescript
import { LipSyncEngine } from './services/avatar/LipSyncEngine';

// Initialize with VRM avatar
const lipSyncEngine = new LipSyncEngine(vrmAvatar);
await lipSyncEngine.initialize();

// Start streaming lip sync
await lipSyncEngine.startStreamingLipSync(text);
```

### Configuration Options

```typescript
const config = {
  sampleRate: 48000,           // Audio sample rate
  frameSize: 1024,             // FFT frame size
  smoothingFactor: 0.8,        // Viseme smoothing (0-1)
  intensityMultiplier: 1.5,    // Viseme intensity scaling
  enableRealTimeProcessing: true
};

const engine = new StreamingLipSyncEngine(morphTargets, config);
```

## Viseme Mapping

### Oculus/Meta Standard Visemes

| Viseme | Phonemes | Description |
|--------|----------|-------------|
| `sil` | SIL | Silence/neutral |
| `PP` | P, B, M | Bilabial closure |
| `FF` | F, V | Labiodental |
| `TH` | TH, DH | Dental/interdental |
| `DD` | T, D | Alveolar stops |
| `kk` | K, G | Velar stops |
| `CH` | CH, SH, J | Post-alveolar |
| `SS` | S, Z | Sibilants |
| `nn` | N, L | Alveolar continuants |
| `RR` | R | Retroflex |
| `aa` | AA, AE, AH | Open vowels |
| `E` | EH, ER | Mid vowels |
| `I` | IH, IY | Close front vowels |
| `O` | AO, OW | Back vowels |
| `U` | UH, UW | Close back vowels |

### Phoneme Classification

The system uses audio features to classify phonemes:

- **Amplitude**: Overall volume level
- **Spectral Centroid**: Frequency brightness
- **Zero Crossing Rate**: Signal roughness
- **MFCC**: Mel-frequency cepstral coefficients

## Audio Analysis Pipeline

### 1. Audio Capture
```typescript
// Web Audio API setup
const audioContext = new AudioContext({ sampleRate: 48000 });
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
```

### 2. Feature Extraction
```typescript
// Extract audio features
const features = {
  amplitude: calculateAmplitude(timeData),
  spectralCentroid: calculateSpectralCentroid(frequencyData),
  zeroCrossingRate: calculateZeroCrossingRate(timeData),
  mfcc: calculateMFCC(frequencyData)
};
```

### 3. Phoneme Classification
```typescript
// Classify phoneme from features
const phoneme = classifyPhoneme(features);
const viseme = phonemeToVisemeMapping[phoneme];
```

### 4. Viseme Application
```typescript
// Apply to morph targets
morphTargets.forEach(mesh => {
  if (mesh.morphTargetInfluences) {
    mesh.morphTargetInfluences[visemeIndex] = intensity;
  }
});
```

## Performance Optimization

### Real-time Processing
- **Web Workers**: Offload heavy processing to background threads
- **RequestAnimationFrame**: Sync with browser rendering
- **Efficient FFT**: Optimized frequency analysis
- **Memory Management**: Proper cleanup and resource disposal

### Quality vs Performance
- **High Quality**: 48kHz, 2048 FFT size, full MFCC analysis
- **Medium Quality**: 24kHz, 1024 FFT size, simplified features
- **Low Quality**: 16kHz, 512 FFT size, basic amplitude analysis

## Testing

### Test Pages
- `/google-tts-test` - Google TTS API testing
- `/streaming-lipsync-test` - Streaming lip sync testing
- `/avatar-test` - Complete avatar integration testing

### Test Scenarios
1. **Basic TTS**: Simple text-to-speech with lip sync
2. **Real-time Processing**: Live audio stream analysis
3. **Phoneme Accuracy**: Phoneme detection validation
4. **Performance**: Frame rate and latency testing
5. **Error Handling**: Fallback and recovery testing

## Troubleshooting

### Common Issues

#### Audio Context Issues
```typescript
// Ensure audio context is resumed
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}
```

#### CORS Issues with Google TTS
```typescript
// Ensure proper API key and CORS configuration
const response = await fetch(`${baseUrl}?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody)
});
```

#### Morph Target Mapping
```typescript
// Verify morph target dictionary exists
if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
  const index = mesh.morphTargetDictionary[visemeName];
  if (index !== undefined) {
    mesh.morphTargetInfluences[index] = intensity;
  }
}
```

### Performance Issues
- Reduce FFT size for lower-end devices
- Disable real-time processing on mobile
- Use simplified phoneme mapping
- Implement frame skipping for 30fps targets

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 66+ (Full support)
- ✅ Firefox 60+ (Full support)
- ✅ Safari 14+ (Limited Web Audio API)
- ✅ Edge 79+ (Full support)

### Required APIs
- Web Audio API
- MediaStream API
- RequestAnimationFrame
- Web Workers
- Fetch API

## Future Enhancements

### Planned Features
1. **Machine Learning**: TensorFlow.js phoneme detection model
2. **Emotion Detection**: Facial expression integration
3. **Multi-language**: Enhanced language-specific phoneme sets
4. **WebRTC**: Real-time voice chat lip sync
5. **WebAssembly**: High-performance audio processing

### Research Areas
- Deep learning phoneme detection
- Real-time emotion recognition
- Cross-lingual viseme mapping
- Hardware acceleration
- Predictive lip sync buffering

## API Reference

### StreamingLipSyncEngine

#### Constructor
```typescript
constructor(
  morphTargets: Map<string, THREE.Mesh>,
  config?: Partial<StreamingLipSyncConfig>
)
```

#### Methods
- `startStreamingLipSync(text, googleTTS, onVisemeUpdate)` - Start streaming
- `stopStreamingLipSync()` - Stop processing
- `processPhonemeData(phonemes, duration, callback)` - Process pre-generated data
- `updateConfig(config)` - Update configuration
- `isActive()` - Check processing status
- `dispose()` - Cleanup resources

### GoogleTTSService

#### Methods
- `speak(text, options, callbacks)` - Synthesize and play
- `synthesizeForLipSync(text, options)` - Generate lip sync data
- `testConnection()` - Test API connectivity
- `getAvailableVoices()` - List available voices

## License

This implementation is part of the Senior Learning Platform and follows the project's licensing terms.