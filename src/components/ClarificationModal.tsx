import React, { useState } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  clarificationQuestions: string[];
  onSubmitClarification: (clarification: string) => void;
  loading?: boolean;
}

const ClarificationModal: React.FC<ClarificationModalProps> = ({
  isOpen,
  onClose,
  question,
  clarificationQuestions,
  onSubmitClarification,
  loading = false
}) => {
  const { t } = useTranslation();
  const [clarification, setClarification] = useState('');

  const handleSubmit = () => {
    if (clarification.trim()) {
      onSubmitClarification(clarification.trim());
      setClarification('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSkip = () => {
    onSubmitClarification('SKIP_CLARIFICATION');
    setClarification('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('clarificationModal.headerTitle')}</h2>
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
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('clarificationModal.yourQuestionLabel')}</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">{question}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              {t('clarificationModal.tellMeMorePrompt')}
            </p>
            {clarificationQuestions.length > 0 && (
              <>
                <p className="text-gray-600 mb-2">{t('clarificationModal.forExampleLabel')}</p>
                <ul className="text-sm text-gray-500 space-y-1 mb-4">
                  {clarificationQuestions.map((q, index) => (
                    <li key={index}>• {q}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="space-y-4">
            <label htmlFor="clarification-textarea" className="sr-only">
              {t('clarificationModal.textareaSrLabel')}
            </label>
            <textarea
              id="clarification-textarea"
              value={clarification}
              onChange={(e) => setClarification(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('clarificationModal.textareaPlaceholder')}
              className="input-field resize-none min-h-[100px]"
              rows={4}
              disabled={loading}
            />

            <div className="flex space-x-3">
              <button
                onClick={handleSkip}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                {t('clarificationModal.skipButton')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!clarification.trim() || loading}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t('clarificationModal.loadingButton')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('clarificationModal.submitButton')}
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

export default ClarificationModal;