import React from 'react';
import AudioPlaybackDemo from '../components/ai/AudioPlaybackDemo';

const AudioTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <AudioPlaybackDemo />
      </div>
    </div>
  );
};

export default AudioTestPage;