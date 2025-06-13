import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  number: string;
  label: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  number, 
  label, 
  color = 'blue' 
}) => {
  const colorVariants = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`w-12 h-12 ${colorVariants[color as keyof typeof colorVariants]} rounded-xl flex items-center justify-center mx-auto mb-3`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
};

export default StatCard;