import axios from 'axios';

const CHAT_API_URL = 'http://localhost:4000/api';

const createAxiosInstance = (baseURL) => {
  return axios.create({
    baseURL,
    timeout: 120000, // Increased to 120 seconds (2 minutes) for automation operations
    headers: {
      'Content-Type': 'application/json',
    }
  });
};

export const sendMessageToAgent = async (userId, sessionId, message) => {
  try {
    const client = createAxiosInstance(CHAT_API_URL);
    const response = await client.post('/chat/message', {
      userId,
      sessionId,
      message,
    });
    return response.data;
  } catch (error) {
    console.error('Send Message Error:', error.response?.data || error.message);
    
    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    // Handle network errors
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
};

export const getConversationHistory = async (userId) => {
  try {
    const client = createAxiosInstance(CHAT_API_URL);
    const response = await client.get(`/chat/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get History Error:', error.response?.data || error.message);
    return { conversations: [] };
  }
};

export const clearHistory = async (userId) => {
  try {
    const client = createAxiosInstance(CHAT_API_URL);
    const response = await client.post('/chat/clear', { userId });
    return response.data;
  } catch (error) {
    console.error('Clear History Error:', error.response?.data || error.message);
    throw error;
  }
};

const apiService = {
  sendMessageToAgent,
  getConversationHistory,
  clearHistory
};

export default apiService;