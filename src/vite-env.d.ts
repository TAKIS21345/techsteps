/// <reference types="vite/client" />

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_ASSEMBLYAI_API_KEY: string
  readonly VITE_CAMB_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}