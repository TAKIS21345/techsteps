import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;