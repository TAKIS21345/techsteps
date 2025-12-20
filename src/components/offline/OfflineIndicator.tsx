import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useTranslation } from '../../hooks/useTranslation';
import { cn } from '../../utils/cn';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className, showDetails = false }: OfflineIndicatorProps) {
  const { 
    isOnline, 
    isSyncing, 
    pendingOperations, 
    lastSyncTime, 
    syncError 
  } = useOfflineSync();
  const { t } = useTranslation();

  const getStatusColor = () => {
    if (syncError) return 'text-red-600 bg-red-50 border-red-200';
    if (!isOnline) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (isSyncing) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (syncError) return <AlertCircle className="w-4 h-4" />;
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (isSyncing) return <Loader2 className="w-4 h-4 animate-spin" />;
    return isOnline ? <Wifi className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (syncError) return t('offline.error', 'Sync Error');
    if (!isOnline) return t('offline.offline', 'Offline');
    if (isSyncing) return t('offline.syncing', 'Syncing...');
    return t('offline.online', 'Online');
  };

  const getStatusDescription = () => {
    if (syncError) return syncError;
    if (!isOnline) return t('offline.offline_desc', 'Changes will sync when connected');
    if (isSyncing) return t('offline.syncing_desc', 'Updating your data');
    return t('offline.online_desc', 'All changes are saved');
  };

  // Don't show indicator if online and no pending operations
  if (isOnline && !isSyncing && !syncError && pendingOperations === 0 && !showDetails) {
    return null;
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all duration-200',
      getStatusColor(),
      className
    )}>
      {getStatusIcon()}
      
      <div className="flex flex-col">
        <span className="font-medium">{getStatusText()}</span>
        
        {showDetails && (
          <div className="text-xs opacity-75">
            {getStatusDescription()}
            
            {pendingOperations > 0 && (
              <div className="mt-1">
                {t('offline.pending_operations', '{{count}} pending changes', { 
                  count: pendingOperations 
                })}
              </div>
            )}
            
            {lastSyncTime && (
              <div className="mt-1">
                {t('offline.last_sync', 'Last sync: {{time}}', {
                  time: lastSyncTime.toLocaleTimeString()
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}