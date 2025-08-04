import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { culturalContentService } from '../../services/culturalContentService';
import { culturalValidationService } from '../../services/culturalValidation';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ValidationResult {
  appropriate: boolean;
  issues: string[];
  suggestions: string[];
  colorIssues?: any[];
  symbolIssues?: any[];
}

interface CulturalContentValidatorProps {
  content: string;
  contentType?: 'tutorial' | 'example' | 'scenario';
  onValidationChange?: (result: ValidationResult) => void;
  showDetails?: boolean;
  className?: string;
}

export const CulturalContentValidator: React.FC<CulturalContentValidatorProps> = ({
  content,
  contentType = 'tutorial',
  onValidationChange,
  showDetails = true,
  className = ''
}) => {
  const { currentLanguage } = useTranslation();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const validateContent = async () => {
      if (!content.trim()) {
        setValidationResult(null);
        onValidationChange?.(null as any);
        return;
      }

      setIsValidating(true);
      try {
        // Validate cultural appropriateness
        const culturalValidation = culturalContentService.validateCulturalAppropriateness(
          content, 
          currentLanguage
        );

        // Validate colors and symbols if present
        const colorValidation = culturalValidationService.validateCulturalAppropriatenesss(currentLanguage);

        const result: ValidationResult = {
          appropriate: culturalValidation.appropriate,
          issues: culturalValidation.issues,
          suggestions: culturalValidation.suggestions,
          colorIssues: colorValidation.colorIssues,
          symbolIssues: colorValidation.symbolIssues
        };

        setValidationResult(result);
        onValidationChange?.(result);
      } catch (error) {
        console.error('Content validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    const debounceTimer = setTimeout(validateContent, 500);
    return () => clearTimeout(debounceTimer);
  }, [content, currentLanguage, contentType, onValidationChange]);

  if (!validationResult && !isValidating) {
    return null;
  }

  if (isValidating) {
    return (
      <div className={`flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 me-2"></div>
        <span className="text-sm text-gray-600">Validating cultural appropriateness...</span>
      </div>
    );
  }

  if (!validationResult) return null;

  const getStatusIcon = () => {
    if (validationResult.appropriate) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (validationResult.issues.length > 0) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    if (validationResult.appropriate) {
      return 'bg-green-50 border-green-200';
    } else if (validationResult.issues.length > 0) {
      return 'bg-red-50 border-red-200';
    } else {
      return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-start">
        {getStatusIcon()}
        <div className="ms-3 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Cultural Appropriateness Check
            </h4>
          </div>
          
          {validationResult.appropriate ? (
            <p className="text-sm text-green-700 mt-1">
              Content appears culturally appropriate for {currentLanguage} speakers.
            </p>
          ) : (
            <p className="text-sm text-red-700 mt-1">
              Content may need cultural adjustments.
            </p>
          )}

          {showDetails && (
            <div className="mt-3 space-y-3">
              {/* Issues */}
              {validationResult.issues.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-800 mb-2">Issues Found:</h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationResult.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <XCircle className="w-4 h-4 text-red-600 me-2 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {validationResult.suggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Suggestions:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <Info className="w-4 h-4 text-blue-600 me-2 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Color Issues */}
              {validationResult.colorIssues && validationResult.colorIssues.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-orange-800 mb-2">Color Considerations:</h5>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {validationResult.colorIssues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-orange-600 me-2 mt-0.5 flex-shrink-0" />
                        <strong>{issue.color}</strong>: {issue.meaning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Symbol Issues */}
              {validationResult.symbolIssues && validationResult.symbolIssues.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-purple-800 mb-2">Symbol Considerations:</h5>
                  <ul className="text-sm text-purple-700 space-y-1">
                    {validationResult.symbolIssues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-purple-600 me-2 mt-0.5 flex-shrink-0" />
                        <strong>{issue.symbol}</strong>: {issue.meaning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CulturalContentValidator;