// Simple stub for chatMemoryService to prevent ReferenceError
// Replace with real implementation as needed

export const chatMemoryService = {
  async getRelevantMemories(userId: string, question: string, userData: any) {
    // Return empty array or mock data
    return [];
  },
  formatMemoriesForContext(memories: any[]) {
    // Return empty string or mock context
    return '';
  },
  async analyzeAndSaveMemory(userId: string, question: string, steps: any[], userData: any) {
    // No-op for now
    return;
  }
};
