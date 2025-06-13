import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  onClick,
  disabled = false
}) => {
  const colorVariants = {
    blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
    orange: 'bg-orange-100 text-orange-600 group-hover:bg-orange-200',
    red: 'bg-red-100 text-red-600 group-hover:bg-red-200',
    yellow: 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200'
  };

  const baseClasses = "card p-6 text-center transition-all duration-300 group";
  const interactiveClasses = onClick && !disabled 
    ? "cursor-pointer hover:shadow-2xl hover:-translate-y-2" 
    : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${disabledClasses}`}
      onClick={onClick && !disabled ? onClick : undefined}
    >
      <div className={`w-16 h-16 ${colorVariants[color as keyof typeof colorVariants]} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-8 h-8" />
      </div>
      
      <h3 className="text-xl font-semibold mb-4 text-gray-800 group-hover:text-gray-900">
        {title}
      </h3>
      
      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;