import React from 'react';
import { User, Bot } from 'lucide-react';

const MessageBubble = ({ message, isUser }) => {
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
        isUser 
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-100'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs opacity-70 mt-2 block">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;