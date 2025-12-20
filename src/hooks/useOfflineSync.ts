import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService } from '../services/offlineSync';

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: Date | null;
  syncError: string | null;
}

interface OfflineSyncActions {
  triggerSync: () => Promise<void>;
  queueOperation: (
    action: 'create' | 'update' | 'delete',
    resource: string,
    data: any,
    priority?: 'low' | 'medium' | 'high'
  ) => Promise<void>;
  cacheData: (resource: string, data: any, ttl?: number) => Promise<void>;
  getCachedData: (resource: string) => Promise<any | null>;
  saveProgressOffline: (
    userId: string,
    courseId: string,
    lessonId: string | undefined,
    progress: number,
    completed: boolean,
    timeSpent: number
  ) => Promise<void>;
  getUserProgress: (userId: string, courseId?: string) => Promise<any[]>;
  downloadContentForOffline: (
    contentId: string,
    type: 'course' | 'lesson' | 'tutorial' | 'media',
    title: string,
    content: any,
    priority?: number
  ) => Promise<void>;
  getOfflineContent: (contentId: string) => Promise<any | null>;
  listOfflineContent: (type?: 'course' | 'lesson' | 'tutorial' | 'media') => Promise<any[]>;
}

export function useOfflineSync(): OfflineSyncState & OfflineSyncActions {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
    syncError: null,
  });

  useEffect(() => {
    // Initialize offline sync service
    offlineSyncService.init();

    // Update state based on network status
    const updateNetworkStatus = () => {
      const status = offlineSyncService.getSyncStatus();
      setState(prev => ({
        ...prev,
        isOnline: status.isOnline,
        isSyncing: status.isSyncing,
        pendingOperations: status.pendingOperations,
      }));
    };

    // Listen for network changes
    const handleOnline = () => {
      updateNetworkStatus();
      setState(prev => ({ ...prev, syncError: null }));
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    // Listen for sync events
    const handleSyncStart = () => {
      setState(prev => ({ ...prev, isSyncing: true, syncError: null }));
    };

    const handleSyncComplete = () => {
      setState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncTime: new Date(),
        syncError: null 
      }));
    };

    const handleSyncError = (error: string) => {
      setState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncError: error 
      }));
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncstart', handleSyncStart);
    window.addEventListener('synccomplete', handleSyncComplete);
    window.addEventListener('syncerror', handleSyncError as EventListener);

    // Initial status update
    updateNetworkStatus();

    // Periodic status updates
    const statusInterval = setInterval(updateNetworkStatus, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncstart', handleSyncStart);
      window.removeEventListener('synccomplete', handleSyncComplete);
      window.removeEventListener('syncerror', handleSyncError as EventListener);
      clearInterval(statusInterval);
    };
  }, []);

  const triggerSync = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, syncError: null }));
      await offlineSyncService.triggerSync();
      setState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncTime: new Date() 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncError: error instanceof Error ? error.message : 'Sync failed' 
      }));
    }
  }, []);

  const queueOperation = useCallback(async (
    action: 'create' | 'update' | 'delete',
    resource: string,
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> => {
    await offlineSyncService.queueOperation(action, resource, data, priority);
  }, []);

  const cacheData = useCallback(async (
    resource: string,
    data: any,
    ttl?: number
  ): Promise<void> => {
    await offlineSyncService.cacheData(resource, data, ttl);
  }, []);

  const getCachedData = useCallback(async (resource: string): Promise<any | null> => {
    return await offlineSyncService.getCachedData(resource);
  }, []);

  const saveProgressOffline = useCallback(async (
    userId: string,
    courseId: string,
    lessonId: string | undefined,
    progress: number,
    completed: boolean,
    timeSpent: number
  ): Promise<void> => {
    await offlineSyncService.saveProgressOffline(
      userId,
      courseId,
      lessonId,
      progress,
      completed,
      timeSpent
    );
  }, []);

  const getUserProgress = useCallback(async (
    userId: string,
    courseId?: string
  ): Promise<any[]> => {
    return await offlineSyncService.getUserProgress(userId, courseId);
  }, []);

  const downloadContentForOffline = useCallback(async (
    contentId: string,
    type: 'course' | 'lesson' | 'tutorial' | 'media',
    title: string,
    content: any,
    priority: number = 1
  ): Promise<void> => {
    await offlineSyncService.downloadContentForOffline(
      contentId,
      type,
      title,
      content,
      priority
    );
  }, []);

  const getOfflineContent = useCallback(async (contentId: string): Promise<any | null> => {
    return await offlineSyncService.getOfflineContent(contentId);
  }, []);

  const listOfflineContent = useCallback(async (
    type?: 'course' | 'lesson' | 'tutorial' | 'media'
  ): Promise<any[]> => {
    return await offlineSyncService.listOfflineContent(type);
  }, []);

  return {
    ...state,
    triggerSync,
    queueOperation,
    cacheData,
    getCachedData,
    saveProgressOffline,
    getUserProgress,
    downloadContentForOffline,
    getOfflineContent,
    listOfflineContent,
  };
}