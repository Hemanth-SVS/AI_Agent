import React, { useState, useRef } from 'react';
import { Send, Loader } from 'lucide-react';

const InputBox = ({ onSend, loading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${e.target.scrollHeight}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 bg-gray-900">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50 resize-none max-h-40 scrollbar-thin"
          rows="1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-12 w-12 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center max-w-4xl mx-auto">
        AI can make mistakes. Verify important info.
      </p>
    </form>
  );
};

export default InputBox;