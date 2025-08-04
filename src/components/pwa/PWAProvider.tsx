import React, { useState, useEffect } from 'react';
import { InstallPrompt } from './InstallPrompt';
import { UpdatePrompt } from './UpdatePrompt';
import { NetworkStatus } from './NetworkStatus';
import { usePWA } from '../../hooks/usePWA';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isInstallable, hasUpdate } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Show install prompt after a delay if app is installable
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  useEffect(() => {
    // Show update prompt when update is available
    if (hasUpdate) {
      setShowUpdatePrompt(true);
    }
  }, [hasUpdate]);

  return (
    <>
      {children}
      
      {/* PWA UI Components */}
      <NetworkStatus />
      
      {showInstallPrompt && (
        <InstallPrompt onDismiss={() => setShowInstallPrompt(false)} />
      )}
      
      {showUpdatePrompt && (
        <UpdatePrompt onDismiss={() => setShowUpdatePrompt(false)} />
      )}
    </>
  );
}