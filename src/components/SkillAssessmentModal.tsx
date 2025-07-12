import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, ChevronRight, HelpCircle } from 'lucide-react';
import { SkillAssessmentResult } from '../types/learning';

interface SkillAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: SkillAssessmentResult) => void;
}

type AnswerQ1 = 'new' | 'basics' | 'confident';
type AnswerQ2 = 'yes' | 'no';
type AnswerQ3 = 'yes' | 'no';

const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<SkillAssessmentResult>>({});

  const questions = [
    {
      id: 'q1',
      textKey: 'assessment.q1.text',
      options: [
        { value: 'new', textKey: 'assessment.q1.options.new' },
        { value: 'basics', textKey: 'assessment.q1.options.basics' },
        { value: 'confident', textKey: 'assessment.q1.options.confident' },
      ],
      answerKey: 'q1ComfortLevel',
    },
    {
      id: 'q2',
      textKey: 'assessment.q2.text',
      options: [
        { value: 'yes', textKey: 'assessment.q2.options.yes' },
        { value: 'no', textKey: 'assessment.q2.options.no' },
      ],
      answerKey: 'q2EmailSent',
    },
    {
      id: 'q3',
      textKey: 'assessment.q3.text',
      options: [
        { value: 'yes', textKey: 'assessment.q3.options.yes' },
        { value: 'no', textKey: 'assessment.q3.options.no' },
      ],
      answerKey: 'q3SmartphoneUsed',
    },
  ];

  const handleOptionSelect = (questionKey: keyof SkillAssessmentResult, value: string) => {
    setAnswers(prev => ({ ...prev, [questionKey]: questionKey === 'q1ComfortLevel' ? value : value === 'yes' }));
    // Automatically move to next question or finish if it's the last one
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit if all questions are answered
      // This assumes value is the last answer for the last question.
      const finalAnswers = { ...answers, [questionKey]: questionKey === 'q1ComfortLevel' ? value : value === 'yes' } as SkillAssessmentResult;
       if (isAssessmentComplete(finalAnswers)) {
        onSubmit(finalAnswers);
      }
    }
  };

  const isAssessmentComplete = (currentAnswers: Partial<SkillAssessmentResult>): currentAnswers is SkillAssessmentResult => {
    return currentAnswers.q1ComfortLevel !== undefined &&
           currentAnswers.q2EmailSent !== undefined &&
           currentAnswers.q3SmartphoneUsed !== undefined;
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('skillAssessmentModal.title')}</h2>
          </div>
          <button
            onClick={onClose} // Allow closing, but progress might be lost or should be saved
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-center text-gray-600 mb-2 text-sm sm:text-base">{t('skillAssessmentModal.introduction')}</p>
          <p className="text-center text-xs sm:text-sm text-blue-600 font-medium mb-4 sm:mb-6">
            {t('skillAssessmentModal.questionProgress', { current: currentQuestionIndex + 1, total: questions.length })}
          </p>

          <div className="min-h-[120px] sm:min-h-[150px]"> {/* Fixed height to prevent layout shifts */}
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 sm:mb-8 text-center">
              {t(currentQuestion.textKey)}
            </h3>
            <div className="space-y-3">
              {currentQuestion.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(currentQuestion.answerKey as keyof SkillAssessmentResult, option.value)}
                  className={`w-full p-3 text-base sm:text-lg sm:p-4 rounded-xl border-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                    ${answers[currentQuestion.answerKey as keyof SkillAssessmentResult] === (currentQuestion.answerKey === 'q1ComfortLevel' ? option.value : option.value === 'yes')
                      ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-lg scale-[1.02]'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {t(option.textKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mt-8 mb-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300
                  ${index === currentQuestionIndex ? 'bg-blue-600 scale-125' :
                   answers[questions[index].answerKey as keyof SkillAssessmentResult] !== undefined ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillAssessmentModal;
