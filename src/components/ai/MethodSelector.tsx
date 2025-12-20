import React from 'react';
import { Smartphone, Laptop, Tablet } from 'lucide-react';

interface MethodSelectorProps {
  selectedMethod?: string;
  onMethodSelect?: (method: string) => void;
  className?: string;
}

const MethodSelector: React.FC<MethodSelectorProps> = ({
  selectedMethod = 'general',
  onMethodSelect,
  className = ''
}) => {
  const methods = [
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'computer', label: 'Computer', icon: Laptop },
    { id: 'tablet', label: 'Tablet', icon: Tablet }
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;
        
        return (
          <button
            key={method.id}
            onClick={() => onMethodSelect?.(method.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{method.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MethodSelector;
