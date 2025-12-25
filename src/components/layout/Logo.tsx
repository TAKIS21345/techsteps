import React from 'react';
import EnhancedAvatarCompanion from '../ai/EnhancedAvatarCompanion';

// Logo component

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center space-x-3">
      <div>
        <EnhancedAvatarCompanion size={size} />
      </div>
      {showText && (
        <span className={`font-bold text-gray-800 ${textSizeClasses[size]}`}>
          TechStep
        </span>
      )}
    </div>
  );
};

export default Logo;