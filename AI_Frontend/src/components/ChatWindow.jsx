import React, { useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import InputBox from './InputBox';
import WelcomeScreen from './WelcomeScreen';
import { useChatStore } from '../store/chatStore';
import { sendMessageToAgent } from '../services/api';

const ChatWindow = ({ user }) => {
  const { 
    messages, 
    addMessage, 
    sessionId, 
    isLoading, 
    setLoading 
  } = useChatStore();
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    const userMessage = { role: 'user', content };
    addMessage(userMessage);
    setLoading(true);

    try {
      const response = await sendMessageToAgent(
        user.id,
        sessionId,
        content
      );

      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.message,
        };
        addMessage(assistantMessage);
      } else {
        toast.error(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      let errText = 'Failed to get response from AI agent';
      
      if (error.response?.data?.message) {
        errText = error.response.data.message;
      } else if (error.message) {
        errText = error.message;
      }
      
      toast.error(errText);
      
      addMessage({ 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${errText}. Please try again.` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <WelcomeScreen onSendMessage={handleSendMessage} />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isUser={message.role === 'user'}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>
      
      <InputBox onSend={handleSendMessage} loading={isLoading} />
    </div>
  );
};

export default ChatWindow;