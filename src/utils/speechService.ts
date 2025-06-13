import { AssemblyAI } from 'assemblyai';

export class SpeechService {
  private client: AssemblyAI;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  constructor() {
    const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY || 'f93a0567aa4d4bb48b873fd759c0c43f';
    this.client = new AssemblyAI({
      apiKey: apiKey,
    });
  }

  async startRecording(
    onTranscript: (text: string) => void,
    onError: (error: string) => void,
    onStatusChange: (status: 'recording' | 'processing' | 'complete' | 'error') => void
  ): Promise<void> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        onStatusChange('processing');
        
        try {
          // Create audio blob
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Convert to base64 for AssemblyAI
          const base64Audio = await this.blobToBase64(audioBlob);
          
          // Transcribe with AssemblyAI
          const transcript = await this.client.transcripts.transcribe({
            audio: base64Audio,
            speech_model: 'universal',
            language_detection: true,
            punctuate: true,
            format_text: true
          });

          if (transcript.status === 'completed' && transcript.text) {
            onTranscript(transcript.text);
            onStatusChange('complete');
          } else {
            throw new Error('Transcription failed or returned empty text');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          onError('Failed to transcribe audio. Please try again.');
          onStatusChange('error');
        }

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError('Recording failed. Please check your microphone.');
        onStatusChange('error');
        this.isRecording = false;
      };

      // Start recording
      this.mediaRecorder.start();
      onStatusChange('recording');

    } catch (error) {
      console.error('Failed to start recording:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        onError('Microphone access denied. Please enable microphone permissions.');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        onError('No microphone found. Please connect a microphone.');
      } else {
        onError('Failed to start recording. Please try again.');
      }
      onStatusChange('error');
      this.isRecording = false;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(`data:audio/webm;base64,${base64}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Fallback to browser speech recognition if AssemblyAI fails
  async startBrowserSpeechRecognition(
    onTranscript: (text: string) => void,
    onError: (error: string) => void,
    onStatusChange: (status: 'recording' | 'processing' | 'complete' | 'error') => void,
    language: string = 'en-US'
  ): Promise<void> {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError('Speech recognition is not supported in your browser.');
      onStatusChange('error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      onStatusChange('recording');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      onStatusChange('complete');
    };

    recognition.onend = () => {
      if (this.isRecording) {
        onStatusChange('complete');
        this.isRecording = false;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        onError('Microphone access was denied. Please enable it in your browser settings.');
      } else if (event.error === 'language-not-supported') {
        onError(`Speech recognition for ${language} is not supported. Please try English.`);
      } else {
        onError('Speech recognition failed. Please try again.');
      }
      onStatusChange('error');
      this.isRecording = false;
    };

    this.isRecording = true;
    recognition.start();
  }
}

// Global speech service instance
export const speechService = new SpeechService();