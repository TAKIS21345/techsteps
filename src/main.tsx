import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/design-system';
import { TranslationAnimationProvider } from './contexts/TranslationAnimationContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
// import { errorLogger } from './utils/errorLogger';
// import { initializeSecurityServices } from './services/security';

// Initialize security services
// Temporarily disabled to fix React hooks issue
// initializeSecurityServices().catch(error => {
//   console.error('Failed to initialize security services:', error);
//   errorLogger.logError(error, 'Security services initialization failed');
// });

// Optimized loading component for faster initial render
const Loading = () => (
  <div className="loading-fallback min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">Loading TechStep...</p>
    </div>
  </div>
);

// Initialize performance monitoring before app starts
const appStartTime = performance.now();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary onError={(error, errorInfo) => console.error('React Error:', error, errorInfo)}>
      <Suspense fallback={<Loading />}>
        <AccessibilityProvider>
          <TranslationAnimationProvider>
            <AuthProvider>
              <UserProvider>
                <App />
              </UserProvider>
            </AuthProvider>
          </TranslationAnimationProvider>
        </AccessibilityProvider>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);

// Log app initialization time
window.addEventListener('load', () => {
  const appLoadTime = performance.now() - appStartTime;
  console.log(`App initialized in ${appLoadTime.toFixed(2)}ms`);
  
  if (appLoadTime > 3000) {
    console.warn('Slow app initialization detected, consider optimizations for senior users');
  }
});
