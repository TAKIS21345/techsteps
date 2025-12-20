import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema for offline sync
interface OfflineSyncDB extends DBSchema {
  'sync-queue': {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      resource: string;
      data: any;
      timestamp: number;
      retryCount: number;
      priority: 'low' | 'medium' | 'high';
      userId?: string;
    };
  };
  'cached-data': {
    key: string;
    value: {
      id: string;
      resource: string;
      data: any;
      timestamp: number;
      expiresAt: number;
      version: number;
      synced: boolean;
    };
  };
  'user-progress': {
    key: string;
    value: {
      id: string;
      userId: string;
      courseId: string;
      lessonId?: string;
      progress: number;
      completed: boolean;
      timeSpent: number;
      lastAccessed: number;
      synced: boolean;
    };
  };
  'offline-content': {
    key: string;
    value: {
      id: string;
      type: 'course' | 'lesson' | 'tutorial' | 'media';
      title: string;
      content: any;
      downloadedAt: number;
      size: number;
      priority: number;
    };
  };
}

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'medium' | 'high';
  userId?: string;
}

interface CachedDataItem {
  id: string;
  resource: string;
  data: any;
  timestamp: number;
  expiresAt: number;
  version: number;
  synced: boolean;
}

class OfflineSyncService {
  private db: IDBPDatabase<OfflineSyncDB> | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictResolver: Map<string, (local: any, remote: any) => any> = new Map();

  async init(): Promise<void> {
    try {
      this.db = await openDB<OfflineSyncDB>('techstep-offline-sync', 1, {
        upgrade(db) {
          // Sync queue store
          if (!db.objectStoreNames.contains('sync-queue')) {
            const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
            syncStore.createIndex('priority', 'priority');
            syncStore.createIndex('timestamp', 'timestamp');
            syncStore.createIndex('resource', 'resource');
          }

          // Cached data store
          if (!db.objectStoreNames.contains('cached-data')) {
            const cacheStore = db.createObjectStore('cached-data', { keyPath: 'id' });
            cacheStore.createIndex('resource', 'resource');
            cacheStore.createIndex('expiresAt', 'expiresAt');
            cacheStore.createIndex('synced', 'synced');
          }

          // User progress store
          if (!db.objectStoreNames.contains('user-progress')) {
            const progressStore = db.createObjectStore('user-progress', { keyPath: 'id' });
            progressStore.createIndex('userId', 'userId');
            progressStore.createIndex('courseId', 'courseId');
            progressStore.createIndex('synced', 'synced');
          }

          // Offline content store
          if (!db.objectStoreNames.contains('offline-content')) {
            const contentStore = db.createObjectStore('offline-content', { keyPath: 'id' });
            contentStore.createIndex('type', 'type');
            contentStore.createIndex('priority', 'priority');
          }
        },
      });

      this.setupNetworkListeners();
      this.startPeriodicSync();
      
      console.log('Offline Sync Service initialized');
    } catch (error) {
      console.error('Failed to initialize Offline Sync Service:', error);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.triggerSync();
      }
    }, 30000);
  }

  // Queue operations for offline sync
  async queueOperation(
    action: 'create' | 'update' | 'delete',
    resource: string,
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium',
    userId?: string
  ): Promise<void> {
    if (!this.db) return;

    const operation: SyncQueueItem = {
      id: `${resource}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      resource,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
      userId,
    };

    try {
      await this.db.add('sync-queue', operation);
      
      // If online, try to sync immediately for high priority items
      if (this.isOnline && priority === 'high') {
        this.triggerSync();
      }
    } catch (error) {
      console.error('Failed to queue operation:', error);
    }
  }

  // Cache data for offline access
  async cacheData(
    resource: string,
    data: any,
    ttl: number = 24 * 60 * 60 * 1000, // 24 hours default
    version: number = 1
  ): Promise<void> {
    if (!this.db) return;

    const cachedItem: CachedDataItem = {
      id: `${resource}-${Date.now()}`,
      resource,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      version,
      synced: this.isOnline,
    };

    try {
      await this.db.put('cached-data', cachedItem);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  // Get cached data
  async getCachedData(resource: string): Promise<any | null> {
    if (!this.db) return null;

    try {
      const tx = this.db.transaction('cached-data', 'readonly');
      const index = tx.store.index('resource');
      const items = await index.getAll(resource);
      
      if (items.length === 0) return null;
      
      // Get the most recent non-expired item
      const validItems = items.filter(item => Date.now() < item.expiresAt);
      if (validItems.length === 0) return null;
      
      const mostRecent = validItems.sort((a, b) => b.timestamp - a.timestamp)[0];
      return mostRecent.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Save user progress offline
  async saveProgressOffline(
    userId: string,
    courseId: string,
    lessonId: string | undefined,
    progress: number,
    completed: boolean,
    timeSpent: number
  ): Promise<void> {
    if (!this.db) return;

    const progressId = `${userId}-${courseId}${lessonId ? `-${lessonId}` : ''}`;
    const progressData = {
      id: progressId,
      userId,
      courseId,
      lessonId,
      progress,
      completed,
      timeSpent,
      lastAccessed: Date.now(),
      synced: false,
    };

    try {
      await this.db.put('user-progress', progressData);
      
      // Queue for sync
      await this.queueOperation('update', 'user-progress', progressData, 'high', userId);
    } catch (error) {
      console.error('Failed to save progress offline:', error);
    }
  }

  // Get user progress
  async getUserProgress(userId: string, courseId?: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction('user-progress', 'readonly');
      const index = tx.store.index('userId');
      const allProgress = await index.getAll(userId);
      
      if (courseId) {
        return allProgress.filter(p => p.courseId === courseId);
      }
      
      return allProgress;
    } catch (error) {
      console.error('Failed to get user progress:', error);
      return [];
    }
  }

  // Download content for offline access
  async downloadContentForOffline(
    contentId: string,
    type: 'course' | 'lesson' | 'tutorial' | 'media',
    title: string,
    content: any,
    priority: number = 1
  ): Promise<void> {
    if (!this.db) return;

    const contentSize = new Blob([JSON.stringify(content)]).size;
    
    const offlineContent = {
      id: contentId,
      type,
      title,
      content,
      downloadedAt: Date.now(),
      size: contentSize,
      priority,
    };

    try {
      await this.db.put('offline-content', offlineContent);
      console.log(`Downloaded ${type} "${title}" for offline access`);
    } catch (error) {
      console.error('Failed to download content for offline:', error);
    }
  }

  // Get offline content
  async getOfflineContent(contentId: string): Promise<any | null> {
    if (!this.db) return null;

    try {
      const content = await this.db.get('offline-content', contentId);
      return content?.content || null;
    } catch (error) {
      console.error('Failed to get offline content:', error);
      return null;
    }
  }

  // List available offline content
  async listOfflineContent(type?: 'course' | 'lesson' | 'tutorial' | 'media'): Promise<any[]> {
    if (!this.db) return [];

    try {
      if (type) {
        const tx = this.db.transaction('offline-content', 'readonly');
        const index = tx.store.index('type');
        return await index.getAll(type);
      } else {
        return await this.db.getAll('offline-content');
      }
    } catch (error) {
      console.error('Failed to list offline content:', error);
      return [];
    }
  }

  // Trigger sync process
  async triggerSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || !this.db) return;

    this.syncInProgress = true;

    try {
      // Get all pending sync operations, prioritized
      const tx = this.db.transaction('sync-queue', 'readonly');
      const index = tx.store.index('priority');
      const operations = await index.getAll();
      
      // Sort by priority (high first) then by timestamp
      const sortedOps = operations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      for (const operation of sortedOps) {
        try {
          await this.processOperation(operation);
          await this.db.delete('sync-queue', operation.id);
        } catch (error) {
          console.error('Failed to process operation:', operation, error);
          
          // Increment retry count
          operation.retryCount++;
          
          // Remove if max retries reached
          if (operation.retryCount >= 3) {
            await this.db.delete('sync-queue', operation.id);
            console.warn('Operation removed after max retries:', operation);
          } else {
            await this.db.put('sync-queue', operation);
          }
        }
      }

      // Sync user progress
      await this.syncUserProgress();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processOperation(operation: SyncQueueItem): Promise<void> {
    // This would integrate with your actual API
    console.log('Processing operation:', operation);
    
    switch (operation.resource) {
      case 'user-progress':
        await this.syncProgressToServer(operation.data);
        break;
      case 'user-preferences':
        await this.syncPreferencesToServer(operation.data);
        break;
      case 'feedback':
        await this.syncFeedbackToServer(operation.data);
        break;
      default:
        console.warn('Unknown resource type:', operation.resource);
    }
  }

  private async syncUserProgress(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('user-progress', 'readwrite');
      const index = tx.store.index('synced');
      const unsyncedProgress = await index.getAll(false);

      for (const progress of unsyncedProgress) {
        try {
          await this.syncProgressToServer(progress);
          progress.synced = true;
          await tx.store.put(progress);
        } catch (error) {
          console.error('Failed to sync progress:', progress, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync user progress:', error);
    }
  }

  private async syncProgressToServer(progress: any): Promise<void> {
    // Mock API call - replace with actual implementation
    console.log('Syncing progress to server:', progress);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async syncPreferencesToServer(preferences: any): Promise<void> {
    // Mock API call - replace with actual implementation
    console.log('Syncing preferences to server:', preferences);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async syncFeedbackToServer(feedback: any): Promise<void> {
    // Mock API call - replace with actual implementation
    console.log('Syncing feedback to server:', feedback);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Conflict resolution
  registerConflictResolver(resource: string, resolver: (local: any, remote: any) => any): void {
    this.conflictResolver.set(resource, resolver);
  }

  private resolveConflict(resource: string, local: any, remote: any): any {
    const resolver = this.conflictResolver.get(resource);
    
    if (resolver) {
      return resolver(local, remote);
    }
    
    // Default: use the most recent timestamp
    return local.timestamp > remote.timestamp ? local : remote;
  }

  // Cleanup expired data
  async cleanup(): Promise<void> {
    if (!this.db) return;

    try {
      // Clean up expired cached data
      const tx = this.db.transaction('cached-data', 'readwrite');
      const index = tx.store.index('expiresAt');
      const expiredItems = await index.getAll(IDBKeyRange.upperBound(Date.now()));
      
      for (const item of expiredItems) {
        await tx.store.delete(item.id);
      }
      
      console.log(`Cleaned up ${expiredItems.length} expired cache items`);
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    pendingOperations: number;
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
      pendingOperations: 0, // Would need to query the database
    };
  }

  // Destroy service
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.db) {
      this.db.close();
    }
  }
}

export const offlineSyncService = new OfflineSyncService();