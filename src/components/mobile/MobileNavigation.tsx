import React, { useState } from 'react';
import { Home, BookOpen, Settings, HelpCircle, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { useTranslation } from '../../hooks/useTranslation';
import { cn } from '../../utils/cn';

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const navigationItems = [
    {
      to: '/dashboard',
      icon: Home,
      label: t('nav.dashboard', 'Dashboard'),
      description: t('nav.dashboard_desc', 'Your learning home'),
    },
    {
      to: '/learning',
      icon: BookOpen,
      label: t('nav.learning', 'Learning'),
      description: t('nav.learning_desc', 'Courses and tutorials'),
    },
    {
      to: '/settings',
      icon: Settings,
      label: t('nav.settings', 'Settings'),
      description: t('nav.settings_desc', 'Customize your experience'),
    },
    {
      to: '/help',
      icon: HelpCircle,
      label: t('nav.help', 'Help'),
      description: t('nav.help_desc', 'Get support and assistance'),
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <div className={cn('md:hidden', className)}>
        <TouchOptimizedButton
          variant="ghost"
          size="lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          icon={isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          aria-label={isMenuOpen ? t('nav.close_menu', 'Close menu') : t('nav.open_menu', 'Open menu')}
          className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200"
        />
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <nav className={cn(
        'fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-transform duration-300 ease-in-out md:hidden',
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="p-6 pt-20">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg transition-all duration-200',
                    'min-h-[60px]', // Larger touch target
                    'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
                    active 
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <div className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                    active 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  )}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base">
                      {item.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 md:hidden">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200',
                  'min-w-[60px] min-h-[60px]', // Large touch target
                  'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
                  active 
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-medium truncate max-w-[50px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}