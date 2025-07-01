import React, { useState } from 'react';
import { X, Upload, Camera, Brain, Loader2 } from 'lucide-react';
import { ttsService } from '../utils/ttsService';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';

interface AIToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIToolsModal: React.FC<AIToolsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'photo' | 'jargon'>('photo');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [photoQuestion, setPhotoQuestion] = useState('');
  const [photoResponse, setPhotoResponse] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  
  const [jargonTerm, setJargonTerm] = useState('');
  const [jargonResponse, setJargonResponse] = useState('');
  const [jargonLoading, setJargonLoading] = useState(false);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCiWRaYRxRJJ9BGuJ37eAe-nDKS8YF5nD4';

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setPhotoResponse('');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const explainPhoto = async () => {
    if (!photoFile || !GEMINI_API_KEY) {
      alert(t('aiToolsModal.photoExplainer.alertNoPhoto'));
      return;
    }

    setPhotoLoading(true);
    setPhotoResponse('');

    try {
      const base64Data = await convertToBase64(photoFile);
      const base64Content = base64Data.split(',')[1];
      const mimeType = photoFile.type;

      const userQuestion = photoQuestion.trim() || t('aiToolsModal.photoExplainer.questionPlaceholder'); // Default question if none provided

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                // The prompt itself should ideally be configurable or managed carefully if it needs translation.
                // For now, keeping the core instruction in English but using the translated userQuestion.
                text: `You are a friendly tech helper for seniors. Examine the provided image carefully. ${userQuestion}. Explain in simple, easy-to-understand terms using basic HTML formatting like <p> and <strong>.`
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Content
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      const data = await response.json();
      const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (explanation) {
        setPhotoResponse(explanation);
      } else {
        throw new Error(t('aiToolsModal.apiErrorNoExplanation'));
      }
    } catch (error) {
      console.error('Error explaining photo:', error);
      setPhotoResponse(t('aiToolsModal.photoExplainer.errorResponse'));
    } finally {
      setPhotoLoading(false);
    }
  };

  const explainJargon = async () => {
    if (!jargonTerm.trim() || !GEMINI_API_KEY) {
      alert(t('aiToolsModal.techWordBuster.alertNoTerm'));
      return;
    }

    setJargonLoading(true);
    setJargonResponse('');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              // Similar to above, core prompt instruction remains, dynamic term is used.
              text: `Explain the tech term "${jargonTerm}" to a senior citizen who is not tech-savvy. Use very simple language and a real-world analogy to make it easy to understand. Format your response using basic HTML tags like <p> and <strong>.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      const data = await response.json();
      const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (explanation) {
        setJargonResponse(explanation);
      } else {
        throw new Error(t('aiToolsModal.apiErrorNoExplanation'));
      }
    } catch (error) {
      console.error('Error explaining jargon:', error);
      setJargonResponse(t('aiToolsModal.techWordBuster.errorResponse'));
    } finally {
      setJargonLoading(false);
    }
  };

  const resetModal = () => {
    setActiveTab('photo');
    setPhotoFile(null);
    setPhotoPreviewUrl('');
    setPhotoQuestion('');
    setPhotoResponse('');
    setJargonTerm('');
    setJargonResponse('');
    // Stop any playing TTS
    ttsService.stop();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{t('aiToolsModal.header')}</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'photo'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Camera className="w-5 h-5 inline mr-2" />
            {t('aiToolsModal.tabs.photoExplainer')}
          </button>
          <button
            onClick={() => setActiveTab('jargon')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'jargon'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Brain className="w-5 h-5 inline mr-2" />
            {t('aiToolsModal.tabs.techWordBuster')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'photo' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('aiToolsModal.photoExplainer.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('aiToolsModal.photoExplainer.description')}
                </p>
              </div>

              <div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="btn-secondary w-full cursor-pointer inline-flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {t('aiToolsModal.photoExplainer.uploadButton')}
                </label>
              </div>

              {photoPreviewUrl && (
                <div className="text-center">
                  <img
                    src={photoPreviewUrl}
                    alt={t('aiToolsModal.photoExplainer.previewAlt')}
                    className="max-h-48 mx-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}

              <div>
                <label htmlFor="photo-question" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('aiToolsModal.photoExplainer.questionLabel')}
                </label>
                <input
                  type="text"
                  id="photo-question"
                  value={photoQuestion}
                  onChange={(e) => setPhotoQuestion(e.target.value)}
                  className="input-field"
                  placeholder={t('aiToolsModal.photoExplainer.questionPlaceholder')}
                />
              </div>

              <button
                onClick={explainPhoto}
                disabled={!photoFile || photoLoading}
                className="btn-primary w-full"
              >
                {photoLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('aiToolsModal.photoExplainer.analyzingButton')}
                  </>
                ) : (
                  t('aiToolsModal.photoExplainer.explainButton')
                )}
              </button>

              {photoResponse && (
                <div 
                  className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(photoResponse) }}
                />
              )}
              
              {photoResponse && (
                <button
                  onClick={() => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = photoResponse;
                    const text = tempDiv.textContent || tempDiv.innerText || '';
                    ttsService.speak(text, { speed: 0.85 });
                  }}
                  className="mt-2 btn-secondary text-sm"
                >
                  {t('aiToolsModal.photoExplainer.readResponseButton')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('aiToolsModal.techWordBuster.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('aiToolsModal.techWordBuster.description')}
                </p>
              </div>

              <div>
                <label htmlFor="jargon-input" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('aiToolsModal.techWordBuster.inputLabel')}
                </label>
                <input
                  type="text"
                  id="jargon-input"
                  value={jargonTerm}
                  onChange={(e) => setJargonTerm(e.target.value)}
                  className="input-field"
                  placeholder={t('aiToolsModal.techWordBuster.inputPlaceholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !jargonLoading) {
                      explainJargon();
                    }
                  }}
                />
              </div>

              <button
                onClick={explainJargon}
                disabled={!jargonTerm.trim() || jargonLoading}
                className="btn-primary w-full"
              >
                {jargonLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('aiToolsModal.techWordBuster.explainingButton')}
                  </>
                ) : (
                  t('aiToolsModal.techWordBuster.explainButton')
                )}
              </button>

              {jargonResponse && (
                <div 
                  className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(jargonResponse) }}
                />
              )}
              
              {jargonResponse && (
                <button
                  onClick={() => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = jargonResponse;
                    const text = tempDiv.textContent || tempDiv.innerText || '';
                    ttsService.speak(text, { speed: 0.85 });
                  }}
                  className="mt-2 btn-secondary text-sm"
                >
                  {t('aiToolsModal.techWordBuster.readExplanationButton')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIToolsModal;