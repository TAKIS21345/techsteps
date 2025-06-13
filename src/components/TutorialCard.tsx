import React from 'react';
import { Clock, Users, Star, ChevronRight } from 'lucide-react';

interface TutorialCardProps {
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  completedBy: number;
  rating: number;
  image?: string;
  onClick: () => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  title,
  description,
  duration,
  difficulty,
  completedBy,
  rating,
  image,
  onClick
}) => {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  };

  return (
    <div 
      onClick={onClick}
      className="card p-6 cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
    >
      {image && (
        <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-4 overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
          {difficulty}
        </span>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm text-gray-600">{rating}</span>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {description}
      </p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{completedBy.toLocaleString()}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

export default TutorialCard;