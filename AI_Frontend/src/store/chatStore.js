import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getConversationHistory, clearHistory } from '../services/api';

export const useChatStore = create((set, get) => ({
  sessionId: uuidv4(),
  messages: [],
  isLoading: false,
  conversationHistory: [],

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, { 
        ...message, 
        id: uuidv4(), 
        timestamp: new Date() 
      }]
    }));
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  newSession: () => {
    console.log('Starting new session...');
    set({
      sessionId: uuidv4(),
      messages: [],
      isLoading: false,
    });
  },
  
  loadSession: (session) => {
    set({
      sessionId: session.sessionId,
      messages: session.messages.map(msg => ({
        ...msg,
        id: uuidv4()
      })),
      isLoading: false,
    });
  },

  fetchConversationHistory: async (userId) => {
    try {
      const data = await getConversationHistory(userId);
      if (data.success) {
        set({ conversationHistory: data.conversations });
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  },

  clearConversationHistory: async (userId) => {
    try {
      await clearHistory(userId);
      set({ 
        conversationHistory: [],
        messages: [],
        sessionId: uuidv4()
      });
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  },
}));