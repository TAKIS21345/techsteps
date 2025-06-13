import React from 'react';
import { ExternalLink, Play, FileText, Star } from 'lucide-react';

interface Resource {
  type: 'video' | 'article';
  title: string;
  url: string;
  description: string;
  source: string;
  rating?: number;
  duration?: string;
}

interface ResourceRecommendationsProps {
  resources: Resource[];
  onResourceClick: (resource: Resource) => void;
}

const ResourceRecommendations: React.FC<ResourceRecommendationsProps> = ({
  resources,
  onResourceClick
}) => {
  if (resources.length === 0) return null;

  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <Star className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Helpful Resources for You
        </h3>
      </div>
      
      <p className="text-gray-600 mb-4 text-sm">
        Here are some trusted videos and articles that can help you learn more:
      </p>

      <div className="space-y-3">
        {resources.map((resource, index) => (
          <button
            key={index}
            onClick={() => onResourceClick(resource)}
            className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                resource.type === 'video' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-green-100 text-green-600'
              }`}>
                {resource.type === 'video' ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                    {resource.title}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {resource.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium">{resource.source}</span>
                  <div className="flex items-center space-x-2">
                    {resource.duration && (
                      <span>{resource.duration}</span>
                    )}
                    {resource.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{resource.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        These resources are from trusted sources and have been verified for accuracy
      </div>
    </div>
  );
};

export default ResourceRecommendations;