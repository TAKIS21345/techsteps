import React from 'react';
import { ArrowUp } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg`}>
        {/* Step blocks representing progress */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-0.5 w-3/5 h-3/5">
            <div className="bg-white/30 rounded-sm"></div>
            <div className="bg-white/50 rounded-sm"></div>
            <div className="bg-white/70 rounded-sm"></div>
            <div className="bg-white/50 rounded-sm"></div>
            <div className="bg-white/70 rounded-sm"></div>
            <div className="bg-white/90 rounded-sm"></div>
            <div className="bg-white/70 rounded-sm"></div>
            <div className="bg-white/90 rounded-sm"></div>
            <div className="bg-white rounded-sm"></div>
          </div>
        </div>
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