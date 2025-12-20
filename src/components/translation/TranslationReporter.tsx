import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translationValidationService } from '../../services/translationValidation';
import { SUPPORTED_LANGUAGES } from '../../i18n';

interface TranslationReporterProps {
  translationKey?: string;
  currentValue?: string;
  onClose?: () => void;
}

export const TranslationReporter: React.FC<TranslationReporterProps> = ({
  translationKey = '',
  currentValue = '',
  onClose
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState<'missing' | 'empty' | 'quality' | 'cultural'>('quality');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentLanguage = i18n.language;
  const languageInfo = SUPPORTED_LANGUAGES[currentLanguage as keyof typeof SUPPORTED_LANGUAGES];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    
    try {
      translationValidationService.reportTranslationIssue({
        language: currentLanguage,
        key: translationKey,
        issue: issueType,
        description: description.trim(),
        reportedBy: 'user'
      });

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setDescription('');
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit translation report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        aria-label={t('translation.reportIssue', 'Report translation issue')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {t('translation.reportIssue', 'Report Issue')}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('translation.reportIssueTitle', 'Report Translation Issue')}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={t('common.close', 'Close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">
              {t('translation.issueReported', 'Thank you! Your report has been submitted.')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('translation.language', 'Language')}
              </label>
              <p className="text-sm text-gray-600">
                {languageInfo?.nativeName} ({languageInfo?.name})
              </p>
            </div>

            {translationKey && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('translation.translationKey', 'Translation Key')}
                </label>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {translationKey}
                </p>
              </div>
            )}

            {currentValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('translation.currentValue', 'Current Translation')}
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {currentValue}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('translation.issueType', 'Issue Type')}
              </label>
              <div className="space-y-2">
                {[
                  { value: 'quality', label: t('translation.qualityIssue', 'Translation quality issue') },
                  { value: 'cultural', label: t('translation.culturalIssue', 'Cultural appropriateness issue') },
                  { value: 'missing', label: t('translation.missingTranslation', 'Missing translation') },
                  { value: 'empty', label: t('translation.emptyTranslation', 'Empty translation') }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="issueType"
                      value={option.value}
                      checked={issueType === option.value}
                      onChange={(e) => setIssueType(e.target.value as any)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('translation.description', 'Description')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('translation.descriptionPlaceholder', 'Please describe the issue...')}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? t('translation.submitting', 'Submitting...') 
                  : t('translation.submit', 'Submit Report')
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TranslationReporter;