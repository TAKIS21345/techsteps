import React from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { MobileNavigation } from './MobileNavigation';
import { cn } from '../../utils/cn';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  className?: string;
}

export function ResponsiveLayout({ 
  children, 
  showNavigation = true, 
  className 
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, orientation } = useMobileDetection();

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100',
      'dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900',
      className
    )}>
      {/* Mobile Navigation */}
      {showNavigation && <MobileNavigation />}
      
      {/* Main Content */}
      <main 
        id="main-content"
        className={cn(
          'transition-all duration-300 ease-in-out',
          // Mobile spacing - account for bottom navigation
          isMobile && showNavigation ? 'pb-20' : '',
          // Tablet spacing
          isTablet ? 'px-6 py-4' : '',
          // Desktop spacing
          !isMobile && !isTablet ? 'px-8 py-6' : '',
          // Mobile padding
          isMobile ? 'px-4 py-4' : '',
          // Orientation-specific adjustments
          isMobile && orientation === 'landscape' ? 'py-2' : ''
        )}
      >
        {children}
      </main>
    </div>
  );
}