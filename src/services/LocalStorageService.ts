import { Message } from './MemoryService';

export const LocalStorageService = {
  saveChatHistory: (userId: string, messages: Message[]) => {
    try {
      const serializedMessages = JSON.stringify(messages);
      localStorage.setItem(`chatHistory_${userId}`, serializedMessages);
    } catch (error) {
      console.error('Error saving chat history to local storage:', error);
    }
  },

  getChatHistory: (userId: string): Message[] | null => {
    try {
      const serializedMessages = localStorage.getItem(`chatHistory_${userId}`);
      if (serializedMessages === null) {
        return null;
      }
      return JSON.parse(serializedMessages);
    } catch (error) {
      console.error('Error getting chat history from local storage:', error);
      return null;
    }
  },
};
