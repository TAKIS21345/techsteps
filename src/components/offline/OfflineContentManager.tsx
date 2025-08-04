import React, { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive, CheckCircle, AlertCircle } from 'lucide-react';
import { TouchOptimizedButton } from '../mobile/TouchOptimizedButton';
import { MobileCard } from '../mobile/MobileCard';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useTranslation } from '../../hooks/useTranslation';
import { cn } from '../../utils/cn';

interface OfflineContentManagerProps {
  className?: string;
}

interface OfflineContentItem {
  id: string;
  type: 'course' | 'lesson' | 'tutorial' | 'media';
  title: string;
  content: any;
  downloadedAt: number;
  size: number;
  priority: number;
}

export function OfflineContentManager({ className }: OfflineContentManagerProps) {
  const [offlineContent, setOfflineContent] = useState<OfflineContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
  const { 
    listOfflineContent, 
    downloadContentForOffline, 
    getOfflineContent,
    isOnline 
  } = useOfflineSync();
  const { t } = useTranslation();

  useEffect(() => {
    loadOfflineContent();
  }, []);

  const loadOfflineContent = async () => {
    setIsLoading(true);
    try {
      const content = await listOfflineContent();
      setOfflineContent(content);
    } catch (error) {
      console.error('Failed to load offline content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadContent = async (
    contentId: string,
    type: 'course' | 'lesson' | 'tutorial' | 'media',
    title: string,
    content: any
  ) => {
    setDownloadingItems(prev => new Set(prev).add(contentId));
    
    try {
      await downloadContentForOffline(contentId, type, title, content);
      await loadOfflineContent();
    } catch (error) {
      console.error('Failed to download content:', error);
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    }
  };

  const handleRemoveContent = async (contentId: string) => {
    // This would remove content from offline storage
    console.log('Removing offline content:', contentId);
    await loadOfflineContent();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSize = (): string => {
    const totalBytes = offlineContent.reduce((sum, item) => sum + item.size, 0);
    return formatFileSize(totalBytes);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '📚';
      case 'lesson':
        return '📖';
      case 'tutorial':
        return '🎯';
      case 'media':
        return '🎬';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('offline.content_manager.title', 'Offline Content')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('offline.content_manager.description', 'Download content to access when offline')}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <HardDrive className="w-4 h-4" />
          <span>{getTotalSize()}</span>
        </div>
      </div>

      {/* Network Status */}
      <div className={cn(
        'flex items-center gap-2 p-3 rounded-lg text-sm',
        isOnline 
          ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
          : 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700'
      )}>
        {isOnline ? (
          <>
            <CheckCircle className="w-4 h-4" />
            {t('offline.content_manager.online', 'Connected - You can download new content')}
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            {t('offline.content_manager.offline', 'Offline - Using downloaded content only')}
          </>
        )}
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {offlineContent.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Download className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('offline.content_manager.no_content', 'No Offline Content')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('offline.content_manager.no_content_desc', 'Download courses and lessons to access them offline')}
            </p>
          </div>
        ) : (
          offlineContent.map((item) => (
            <MobileCard
              key={item.id}
              title={item.title}
              description={`${t(`offline.content_manager.type.${item.type}`, item.type)} • ${formatFileSize(item.size)} • ${t('offline.content_manager.downloaded', 'Downloaded')} ${new Date(item.downloadedAt).toLocaleDateString()}`}
              icon={<span className="text-xl">{getTypeIcon(item.type)}</span>}
              interactive={false}
              className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  {t('offline.content_manager.available_offline', 'Available offline')}
                </div>
                
                <TouchOptimizedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveContent(item.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  aria-label={t('offline.content_manager.remove', 'Remove from offline storage')}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                />
              </div>
            </MobileCard>
          ))
        )}
      </div>

      {/* Download Suggestions */}
      {isOnline && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('offline.content_manager.suggestions', 'Recommended Downloads')}
          </h3>
          
          <div className="space-y-3">
            {/* This would be populated with recommended content */}
            <MobileCard
              title={t('offline.content_manager.suggestion_1', 'Computer Basics Course')}
              description={t('offline.content_manager.suggestion_1_desc', 'Essential skills for getting started with technology')}
              icon={<span className="text-xl">📚</span>}
              badge={t('offline.content_manager.popular', 'Popular')}
              onClick={() => handleDownloadContent(
                'course-basics',
                'course',
                'Computer Basics Course',
                { /* course content */ }
              )}
              disabled={downloadingItems.has('course-basics')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ~2.5 MB
                </span>
                
                <TouchOptimizedButton
                  variant="primary"
                  size="sm"
                  loading={downloadingItems.has('course-basics')}
                  onClick={() => handleDownloadContent(
                    'course-basics',
                    'course',
                    'Computer Basics Course',
                    { /* course content */ }
                  )}
                  icon={<Download className="w-4 h-4" />}
                >
                  {t('offline.content_manager.download', 'Download')}
                </TouchOptimizedButton>
              </div>
            </MobileCard>
          </div>
        </div>
      )}
    </div>
  );
}