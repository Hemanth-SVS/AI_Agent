import React from 'react';
import AIThinkingIcon from './AIThinkingIcon';

const TypingIndicator = () => {
  return (
    <div className="flex gap-3 animate-slideUp">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
        <AIThinkingIcon size={32} />
      </div>
      
      <div className="bg-gray-800 rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;