import React, { useState, useEffect } from 'react';
import { X, Globe, ArrowRight, Loader2, Copy, Check } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

const TranslationModal: React.FC<TranslationModalProps> = ({
  isOpen,
  onClose,
  initialText = ''
}) => {
  const { language, translateText, detectLanguage, getSupportedLanguages, t } = useLanguage();
  const [sourceText, setSourceText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<Language>('en');
  const [targetLanguage, setTargetLanguage] = useState<Language>(language);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const supportedLanguages = getSupportedLanguages();

  useEffect(() => {
    if (initialText) {
      setSourceText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    setTargetLanguage(language);
  }, [language]);

  const handleDetectLanguage = async () => {
    if (!sourceText.trim()) return;

    setIsDetecting(true);
    setError('');

    try {
      const detected = await detectLanguage(sourceText);
      if (detected) {
        setSourceLanguage(detected);
      }
    } catch (err) {
      setError(t('language.error'));
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setError('');

    try {
      const translated = await translateText(sourceText, targetLanguage);
      setTranslatedText(translated);
    } catch (err) {
      setError(t('language.error'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const swapLanguages = () => {
    const newSource = targetLanguage;
    const newTarget = sourceLanguage;
    
    setSourceLanguage(newSource);
    setTargetLanguage(newTarget);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('language.translate')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Language Selection */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value as Language)}
                  className="input-field flex-1"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDetectLanguage}
                  disabled={!sourceText.trim() || isDetecting}
                  className="btn-secondary px-3 py-2 text-sm"
                  title="Auto-detect language"
                >
                  {isDetecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Auto'
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={swapLanguages}
              className="mx-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Swap languages"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as Language)}
                className="input-field"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Translation Areas */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Text
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                className="input-field resize-none h-48"
                rows={8}
              />
            </div>

            {/* Translated Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Translation
                </label>
                {translatedText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={translatedText}
                  readOnly
                  placeholder={isTranslating ? t('language.translating') : 'Translation will appear here...'}
                  className="input-field resize-none h-48 bg-gray-50"
                  rows={8}
                />
                {isTranslating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('language.translating')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              {isDetecting && (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('language.detecting')}</span>
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                {t('common.close')}
              </button>
              <button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isTranslating}
                className="btn-primary flex items-center"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('language.translating')}
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    {t('language.translate')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;