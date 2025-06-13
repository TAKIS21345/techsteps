import React, { useState, useEffect } from 'react';
import { X, Globe, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Cookies from 'js-cookie';

const LanguageNotificationBanner: React.FC = () => {
  const { userData } = useUser();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has incomplete language setup
    const hasIncompleteSetup = !userData?.selectedLanguages || userData.selectedLanguages.length === 0;
    const hasBeenDismissed = Cookies.get('languageSetupDismissed') === 'true';
    
    if (hasIncompleteSetup && !hasBeenDismissed && !dismissed) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [userData, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    Cookies.set('languageSetupDismissed', 'true', { expires: 7 }); // Dismiss for 7 days
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Globe className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-amber-800">Complete Your Language Setup</h4>
              <p className="text-sm text-amber-700">
                Configure your preferred languages for better voice input and text interactions.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              to="/settings"
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Complete Setup
            </Link>
            <button
              onClick={handleDismiss}
              className="p-2 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageNotificationBanner;