import React, { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { useTranslation } from '../../hooks/useTranslation';
import { NotificationPreferences } from '../../services/pwaService';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { subscribeToNotifications, notificationPermission } = usePWA();
  const { t } = useTranslation();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    learningReminders: true,
    progressUpdates: false,
    supportMessages: true,
    frequency: 'daily',
  });
  
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    
    try {
      const success = await subscribeToNotifications(preferences);
      if (success) {
        setIsSubscribed(true);
        setTimeout(() => {
          onClose?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (notificationPermission === 'denied') {
    return (
      <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <BellOff className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h3 className="font-semibold text-orange-900 dark:text-orange-100">
            {t('pwa.notifications.blocked.title', 'Notifications Blocked')}
          </h3>
        </div>
        <p className="text-sm text-orange-700 dark:text-orange-200 mb-3">
          {t('pwa.notifications.blocked.description', 'Notifications are currently blocked. To enable them, please allow notifications in your browser settings.')}
        </p>
        <p className="text-xs text-orange-600 dark:text-orange-300">
          {t('pwa.notifications.blocked.instructions', 'Look for the notification icon in your address bar or check your browser\'s site settings.')}
        </p>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-green-900 dark:text-green-100">
            {t('pwa.notifications.success.title', 'Notifications Enabled!')}
          </h3>
        </div>
        <p className="text-sm text-green-700 dark:text-green-200">
          {t('pwa.notifications.success.description', 'You\'ll receive helpful reminders and updates based on your preferences.')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('pwa.notifications.title', 'Learning Reminders')}
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        {t('pwa.notifications.description', 'Get gentle reminders to help you stay on track with your learning journey.')}
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {t('pwa.notifications.learning_reminders', 'Learning Reminders')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('pwa.notifications.learning_reminders_desc', 'Gentle nudges to continue your lessons')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.learningReminders}
              onChange={(e) => updatePreference('learningReminders', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {t('pwa.notifications.progress_updates', 'Progress Updates')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('pwa.notifications.progress_updates_desc', 'Celebrate your achievements')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.progressUpdates}
              onChange={(e) => updatePreference('progressUpdates', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {t('pwa.notifications.support_messages', 'Support Messages')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('pwa.notifications.support_messages_desc', 'Helpful tips and assistance')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.supportMessages}
              onChange={(e) => updatePreference('supportMessages', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            {t('pwa.notifications.frequency', 'Frequency')}
          </label>
          <select
            value={preferences.frequency}
            onChange={(e) => updatePreference('frequency', e.target.value as 'daily' | 'weekly' | 'never')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">{t('pwa.notifications.frequency.daily', 'Daily')}</option>
            <option value="weekly">{t('pwa.notifications.frequency.weekly', 'Weekly')}</option>
            <option value="never">{t('pwa.notifications.frequency.never', 'Never')}</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={isSubscribing || preferences.frequency === 'never'}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubscribing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('pwa.notifications.subscribing', 'Setting up...')}
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            {t('pwa.notifications.enable', 'Enable Notifications')}
          </>
        )}
      </button>
    </div>
  );
}