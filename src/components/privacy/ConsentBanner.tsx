// Consent Banner Component for Minimal Data Collection
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, Settings, Info } from 'lucide-react';
import { getConsentManagementService, ConsentCategory } from '../../services/security/ConsentManagementService';

interface ConsentBannerProps {
  userId?: string;
  onConsentGiven: (preferences: Record<string, boolean>) => void;
  onDismiss: () => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  userId,
  onConsentGiven,
  onDismiss
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [consentPreferences, setConsentPreferences] = useState<Record<string, boolean>>({});
  const [requiredCategories, setRequiredCategories] = useState<ConsentCategory[]>([]);
  const [optionalCategories, setOptionalCategories] = useState<ConsentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const consentService = getConsentManagementService();

  useEffect(() => {
    // Load consent categories
    const required = consentService.getRequiredConsentCategories();
    const optional = consentService.getOptionalConsentCategories();
    
    setRequiredCategories(required);
    setOptionalCategories(optional);

    // Initialize preferences with required categories set to true
    const initialPreferences: Record<string, boolean> = {};
    required.forEach(category => {
      initialPreferences[category.id] = true;
    });
    optional.forEach(category => {
      initialPreferences[category.id] = false;
    });
    
    setConsentPreferences(initialPreferences);
  }, []);

  const handleConsentChange = (categoryId: string, granted: boolean) => {
    setConsentPreferences(prev => ({
      ...prev,
      [categoryId]: granted
    }));
  };

  const handleAcceptAll = async () => {
    setIsLoading(true);
    
    const allAccepted: Record<string, boolean> = {};
    [...requiredCategories, ...optionalCategories].forEach(category => {
      allAccepted[category.id] = true;
    });
    
    await submitConsent(allAccepted);
  };

  const handleAcceptSelected = async () => {
    setIsLoading(true);
    await submitConsent(consentPreferences);
  };

  const handleRejectOptional = async () => {
    setIsLoading(true);
    
    const requiredOnly: Record<string, boolean> = {};
    requiredCategories.forEach(category => {
      requiredOnly[category.id] = true;
    });
    optionalCategories.forEach(category => {
      requiredOnly[category.id] = false;
    });
    
    await submitConsent(requiredOnly);
  };

  const submitConsent = async (preferences: Record<string, boolean>) => {
    try {
      if (userId) {
        await consentService.recordConsentPreferences(
          userId,
          preferences,
          {
            ipAddress: 'client-side', // Would be set by server
            userAgent: navigator.userAgent,
            method: 'explicit'
          }
        );
      }
      
      onConsentGiven(preferences);
      onDismiss();
    } catch (error) {
      console.error('Failed to record consent:', error);
      // Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const ConsentCategoryCard: React.FC<{ category: ConsentCategory }> = ({ category }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h4 className="text-lg font-semibold text-gray-900">
              {category.name}
              {category.required && (
                <span className="ml-2 text-sm text-red-600 font-medium">
                  {t('consent.required')}
                </span>
              )}
            </h4>
          </div>
          
          <p className="text-gray-700 mb-3">
            {category.description}
          </p>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>{t('consent.purpose')}:</strong> {category.purpose}</p>
            <p><strong>{t('consent.legalBasis')}:</strong> {category.legalBasis}</p>
            <p><strong>{t('consent.retention')}:</strong> {Math.floor(category.retention / 365)} {t('consent.years')}</p>
          </div>
          
          {!category.required && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>{t('consent.consequences')}:</strong> {category.consequences}
            </div>
          )}
        </div>
        
        <div className="ml-4">
          {category.required ? (
            <div className="flex items-center text-green-600">
              <Shield className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">{t('consent.required')}</span>
            </div>
          ) : (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={consentPreferences[category.id] || false}
                onChange={(e) => handleConsentChange(category.id, e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">
                {consentPreferences[category.id] ? t('consent.accepted') : t('consent.declined')}
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );

  if (!showDetails) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('consent.banner.title')}
                </h3>
                <p className="text-gray-600">
                  {t('consent.banner.description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDetails(true)}
                className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('consent.banner.customize')}
              </button>
              
              <button
                onClick={handleRejectOptional}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {t('consent.banner.essentialOnly')}
              </button>
              
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? t('consent.banner.processing') : t('consent.banner.acceptAll')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('consent.details.title')}
            </h2>
          </div>
          <button
            onClick={() => setShowDetails(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">{t('consent.details.info.title')}</p>
                <p>{t('consent.details.info.description')}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('consent.details.required.title')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('consent.details.required.description')}
            </p>
            {requiredCategories.map(category => (
              <ConsentCategoryCard key={category.id} category={category} />
            ))}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('consent.details.optional.title')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('consent.details.optional.description')}
            </p>
            {optionalCategories.map(category => (
              <ConsentCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {t('consent.details.footer.info')}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleRejectOptional}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              {t('consent.details.essentialOnly')}
            </button>
            
            <button
              onClick={handleAcceptSelected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? t('consent.details.processing') : t('consent.details.savePreferences')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;