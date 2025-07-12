import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LearningCenterPage from './pages/LearningCenterPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { CookieManager } from './utils/cookieManager';
import { useTranslationAnimation } from './contexts/TranslationAnimationContext';
import { useUser } from './contexts/UserContext';
import i18n from './i18n'; // Import i18n instance
import './styles/globals.css';

function App() {
  const { setIsTranslating } = useTranslationAnimation();
  // Get onboarding status from user context
  const { hasCompletedOnboarding, loading: userLoading } = useUser();

  useEffect(() => {
    // Apply saved preferences on app load
    const preferences = CookieManager.getPreferences();
    if (preferences) {
      CookieManager.applyPreferences(preferences);
    }

    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    const handleLanguageChanged = () => {
      // Delay hiding the animation to allow it to complete its fade-out
      setTimeout(() => {
        setIsTranslating(false);
      }, 300); // This should match or exceed the fade-out duration in TranslationAnimationOverlay
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [setIsTranslating]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        {/* TranslationAnimationOverlay will be rendered here */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/auth" 
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute requiresOnboarding={false}>
                {/* If onboarding is already completed, redirect to dashboard */}
                {userLoading ? null : hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <OnboardingPage />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learning" 
            element={
              <ProtectedRoute>
                <LearningCenterPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;