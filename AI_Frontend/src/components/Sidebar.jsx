import React, { useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

const Sidebar = ({ user }) => {
  const { 
    newSession, 
    conversationHistory, 
    fetchConversationHistory, 
    clearConversationHistory,
    loadSession,
    sessionId
  } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      fetchConversationHistory(user.id);
    }
  }, [user]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all conversations?')) {
      clearConversationHistory(user.id);
    }
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 p-4 flex flex-col">
      <button 
        onClick={newSession}
        className="w-full px-4 py-2 mb-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center font-semibold"
      >
        <Plus size={20} /> New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-2">
        {conversationHistory.length === 0 && (
          <p className="text-xs text-gray-500 px-2">No conversations yet</p>
        )}
        {conversationHistory.map((convo) => (
          <button 
            key={convo._id}
            onClick={() => loadSession(convo)}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
              convo.sessionId === sessionId
                ? 'bg-gray-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <MessageSquare size={16} className="text-gray-400" />
            <span className="text-sm text-gray-200 truncate">{convo.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-700">
        <button
          onClick={handleClearHistory}
          className="w-full px-3 py-2 mb-3 rounded-lg flex items-center gap-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-red-400"
        >
          <Trash2 size={16} /> Clear Conversations
        </button>
        <div className="p-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">User ID:</p>
          <p className="text-sm font-semibold text-white truncate">{user.id}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;