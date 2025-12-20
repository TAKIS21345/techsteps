import { useState, useEffect, useCallback } from 'react';
import { pwaService, NotificationPreferences } from '../services/pwaService';

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isSyncing: boolean;
  hasUpdate: boolean;
  notificationPermission: NotificationPermission;
}

interface PWAActions {
  installApp: () => Promise<boolean>;
  updateApp: () => void;
  subscribeToNotifications: (preferences: NotificationPreferences) => Promise<boolean>;
  cacheContent: (id: string, content: any, ttl?: number) => Promise<void>;
  getCachedContent: (id: string) => Promise<any | null>;
  saveProgressOffline: (progressId: string, progress: any) => Promise<void>;
  queueOfflineAction: (action: string, data: any) => Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    isSyncing: false,
    hasUpdate: false,
    notificationPermission: 'default',
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Initialize PWA service
    pwaService.init();

    // Check if app is already installed
    const checkInstallStatus = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');
      
      setState(prev => ({ ...prev, isInstalled }));
    };

    checkInstallStatus();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false 
      }));
      setDeferredPrompt(null);
    };

    // Listen for network status changes
    const handleNetworkChange = (event: CustomEvent) => {
      setState(prev => ({ 
        ...prev, 
        isOnline: event.detail.isOnline 
      }));
    };

    // Listen for app updates
    const handleAppUpdate = () => {
      setState(prev => ({ ...prev, hasUpdate: true }));
    };

    // Listen for sync status
    const updateSyncStatus = () => {
      setState(prev => ({ 
        ...prev, 
        isSyncing: pwaService.isSyncInProgress 
      }));
    };

    // Check notification permission
    const updateNotificationPermission = () => {
      if ('Notification' in window) {
        setState(prev => ({ 
          ...prev, 
          notificationPermission: Notification.permission 
        }));
      }
    };

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('networkStatusChange', handleNetworkChange as EventListener);
    window.addEventListener('appUpdateAvailable', handleAppUpdate);

    // Periodic sync status check
    const syncInterval = setInterval(updateSyncStatus, 1000);

    // Initial permission check
    updateNotificationPermission();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('networkStatusChange', handleNetworkChange as EventListener);
      window.removeEventListener('appUpdateAvailable', handleAppUpdate);
      clearInterval(syncInterval);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstallable: false,
          isInstalled: true 
        }));
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to install app:', error);
      return false;
    }
  }, [deferredPrompt]);

  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
        window.location.reload();
      });
    }
  }, []);

  const subscribeToNotifications = useCallback(async (preferences: NotificationPreferences): Promise<boolean> => {
    const success = await pwaService.subscribeToPushNotifications(preferences);
    
    if (success) {
      setState(prev => ({ 
        ...prev, 
        notificationPermission: 'granted' 
      }));
    }
    
    return success;
  }, []);

  const cacheContent = useCallback(async (id: string, content: any, ttl?: number): Promise<void> => {
    await pwaService.cacheContent(id, content, ttl);
  }, []);

  const getCachedContent = useCallback(async (id: string): Promise<any | null> => {
    return await pwaService.getCachedContent(id);
  }, []);

  const saveProgressOffline = useCallback(async (progressId: string, progress: any): Promise<void> => {
    await pwaService.saveProgressOffline(progressId, progress);
  }, []);

  const queueOfflineAction = useCallback(async (action: string, data: any): Promise<void> => {
    await pwaService.queueOfflineAction(action, data);
  }, []);

  return {
    ...state,
    installApp,
    updateApp,
    subscribeToNotifications,
    cacheContent,
    getCachedContent,
    saveProgressOffline,
    queueOfflineAction,
  };
}