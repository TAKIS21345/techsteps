import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Typography } from '../design-system/Typography';
import { Button } from '../design-system/Button';
import { X, HelpCircle } from 'lucide-react';

export interface OnboardingTooltipProps {
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetElement?: string;
  visible: boolean;
  onClose?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  className?: string;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  content,
  position = 'bottom',
  targetElement,
  visible,
  onClose,
  onNext,
  onSkip,
  showSkip = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const { settings, announceToScreenReader } = useAccessibility();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Calculate tooltip position based on target element
  useEffect(() => {
    if (visible && targetElement) {
      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Announce tooltip appearance to screen readers
        announceToScreenReader(
          t('onboarding.accessibility.tooltipAppeared', { content })
        );
      }
    }
  }, [visible, targetElement, content, announceToScreenReader, t]);

  // Handle escape key to close tooltip
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible && onClose) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [visible, onClose]);

  // Focus management
  useEffect(() => {
    if (visible && tooltipRef.current) {
      const firstFocusable = tooltipRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [visible]);

  if (!visible) return null;

  const getTooltipStyles = () => {
    if (!targetRect) return {};

    const tooltipOffset = 16; // Distance from target element
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'top':
        styles.bottom = window.innerHeight - targetRect.top + tooltipOffset;
        styles.left = targetRect.left + targetRect.width / 2;
        styles.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        styles.top = targetRect.bottom + tooltipOffset;
        styles.left = targetRect.left + targetRect.width / 2;
        styles.transform = 'translateX(-50%)';
        break;
      case 'left':
        styles.right = window.innerWidth - targetRect.left + tooltipOffset;
        styles.top = targetRect.top + targetRect.height / 2;
        styles.transform = 'translateY(-50%)';
        break;
      case 'right':
        styles.left = targetRect.right + tooltipOffset;
        styles.top = targetRect.top + targetRect.height / 2;
        styles.transform = 'translateY(-50%)';
        break;
    }

    return styles;
  };

  const getArrowStyles = () => {
    const arrowSize = 8;
    const arrowStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    const borderColor = settings.highContrast ? '#1f2937' : '#ffffff';

    switch (position) {
      case 'top':
        arrowStyles.top = '100%';
        arrowStyles.left = '50%';
        arrowStyles.transform = 'translateX(-50%)';
        arrowStyles.borderLeft = `${arrowSize}px solid transparent`;
        arrowStyles.borderRight = `${arrowSize}px solid transparent`;
        arrowStyles.borderTop = `${arrowSize}px solid ${borderColor}`;
        break;
      case 'bottom':
        arrowStyles.bottom = '100%';
        arrowStyles.left = '50%';
        arrowStyles.transform = 'translateX(-50%)';
        arrowStyles.borderLeft = `${arrowSize}px solid transparent`;
        arrowStyles.borderRight = `${arrowSize}px solid transparent`;
        arrowStyles.borderBottom = `${arrowSize}px solid ${borderColor}`;
        break;
      case 'left':
        arrowStyles.left = '100%';
        arrowStyles.top = '50%';
        arrowStyles.transform = 'translateY(-50%)';
        arrowStyles.borderTop = `${arrowSize}px solid transparent`;
        arrowStyles.borderBottom = `${arrowSize}px solid transparent`;
        arrowStyles.borderLeft = `${arrowSize}px solid ${borderColor}`;
        break;
      case 'right':
        arrowStyles.right = '100%';
        arrowStyles.top = '50%';
        arrowStyles.transform = 'translateY(-50%)';
        arrowStyles.borderTop = `${arrowSize}px solid transparent`;
        arrowStyles.borderBottom = `${arrowSize}px solid transparent`;
        arrowStyles.borderRight = `${arrowSize}px solid ${borderColor}`;
        break;
    }

    return arrowStyles;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={getTooltipStyles()}
        className={`
          max-w-sm p-6 rounded-xl shadow-2xl border-2 z-50
          ${settings.highContrast 
            ? 'bg-gray-900 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
          }
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tooltip-content"
        data-testid="onboarding-tooltip"
      >
        {/* Arrow */}
        <div style={getArrowStyles()} aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <HelpCircle 
              className={`
                w-5 h-5 flex-shrink-0
                ${settings.highContrast ? 'text-blue-400' : 'text-blue-600'}
              `}
              aria-hidden="true"
            />
            <Typography 
              variant="body-sm" 
              className={`
                font-semibold
                ${settings.highContrast ? 'text-blue-400' : 'text-blue-600'}
              `}
            >
              {t('onboarding.tooltip.helpfulTip')}
            </Typography>
          </div>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={t('onboarding.accessibility.closeTooltip')}
              className="p-1 -mr-1 -mt-1"
              data-testid="close-tooltip"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          <Typography 
            variant="body"
            id="tooltip-content"
            className="leading-relaxed"
          >
            {content}
          </Typography>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          {showSkip && onSkip && (
            <Button
              variant="outline"
              size="md"
              onClick={onSkip}
              aria-label={t('onboarding.accessibility.skipTooltip')}
              data-testid="skip-tooltip"
            >
              {t('onboarding.buttons.skip')}
            </Button>
          )}
          
          {onNext && (
            <Button
              variant="primary"
              size="md"
              onClick={onNext}
              aria-label={t('onboarding.accessibility.continueFromTooltip')}
              data-testid="next-from-tooltip"
            >
              {t('onboarding.buttons.gotIt')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};