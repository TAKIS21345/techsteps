import { ttsService } from './ttsService';

export const testBasicTTS = async (text: string = "Hello, this is a test of the text-to-speech system.") => {
  console.log('🧪 Testing basic TTS functionality...');
  
  try {
    await new Promise<void>((resolve, reject) => {
      ttsService.speak(
        text,
        { speed: 0.85, language: 'en-US' },
        () => {
          console.log('✅ TTS started successfully');
        },
        () => {
          console.log('✅ TTS completed successfully');
          resolve();
        },
        (error) => {
          console.error('❌ TTS failed:', error);
          reject(new Error(error));
        }
      );
    });
    
    console.log('🎉 Basic TTS test passed!');
    return true;
  } catch (error) {
    console.error('💥 Basic TTS test failed:', error);
    return false;
  }
};

// Test Google TTS API directly
export const testGoogleTTSAPI = async () => {
  console.log('🧪 Testing Google TTS API directly...');
  
  try {
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyCGnrz2QNBKLCsqwzDESePSfNEcq0m24JY', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: 'Hello, this is a test.' },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Neural2-F',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.85,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Google TTS API response received');
      console.log('📊 Audio content length:', data.audioContent?.length || 0);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Google TTS API error:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('💥 Google TTS API test failed:', error);
    return false;
  }
};

// Test browser speech synthesis fallback
export const testBrowserTTS = async (text: string = "Hello, this is a test of browser speech synthesis.") => {
  console.log('🧪 Testing browser TTS fallback...');
  
  if (!('speechSynthesis' in window)) {
    console.error('❌ Browser speech synthesis not supported');
    return false;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        console.log('✅ Browser TTS completed successfully');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('❌ Browser TTS failed:', event.error);
        reject(new Error(event.error));
      };

      speechSynthesis.speak(utterance);
      console.log('✅ Browser TTS started successfully');
    });

    console.log('🎉 Browser TTS test passed!');
    return true;
  } catch (error) {
    console.error('💥 Browser TTS test failed:', error);
    return false;
  }
};

// Run all TTS tests
export const runAllTTSTests = async () => {
  console.log('🚀 Running comprehensive TTS tests...');
  
  const results = {
    browserTTS: await testBrowserTTS(),
    googleTTSAPI: await testGoogleTTSAPI(),
    basicTTS: await testBasicTTS()
  };
  
  console.log('📊 TTS Test Results:', results);
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(allPassed ? '🎉 All TTS tests passed!' : '⚠️ Some TTS tests failed');
  
  return results;
};