import type { ChatCompletionRequest, ChatCompletionChunk } from '@/types';

export class LLMService {
  private baseUrl: string;
  private abortController: AbortController | null = null;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }
  
  async sendMessage(
    message: string,
    context?: string[],
    onChunk?: (chunk: string) => void,
    model: string = 'ai/qwen3:30B-A3B-Q4_K_M',
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<void> {
    // Cancel any ongoing request
    this.cancelStream();
    
    this.abortController = new AbortController();
    
    try {
      // Build messages array with conversation history
      const messages = [];
      
      // Add context if available
      if (context && context.length > 0) {
        console.log(`Adding document context to messages: ${context.length} items`);
        const contextMessage = {
          role: 'system',
          content: `You have access to the following document context:\n\n${context.join('\n\n---\n\n')}`
        };
        console.log('Context message preview:', contextMessage.content.substring(0, 300) + '...');
        messages.push(contextMessage);
      } else {
        console.log('No document context to add');
      }
      
      // Add conversation history (which already includes the current user message)
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      } else {
        // Only add the current message if there's no conversation history
        messages.push({ role: 'user', content: message });
      }
      
      console.log('Sending messages to API:', messages);
      console.log('Total messages:', messages.length);
      
      const requestBody = {
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096
      } as ChatCompletionRequest;
      
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      let buffer = ''; // Buffer for incomplete lines
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete lines
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed: ChatCompletionChunk = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content && onChunk) {
                onChunk(content);
              }
            } catch (e) {
              // Enhanced error handling for R1 models
              console.warn('Failed to parse SSE chunk, attempting recovery:', {
                error: e instanceof Error ? e.message : String(e),
                data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
                line: line.substring(0, 200) + (line.length > 200 ? '...' : '')
              });
              
              // Try to extract content even if JSON is malformed
              // This helps with R1 models that may send partial or malformed JSON
              try {
                const contentMatch = data.match(/"content":"([^"\\]*(\\.[^"\\]*)*)"/);
                if (contentMatch && contentMatch[1] && onChunk) {
                  // Unescape JSON string
                  const unescapedContent = contentMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\t/g, '\t')
                    .replace(/\\r/g, '\r')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                  onChunk(unescapedContent);
                }
              } catch (recoveryError) {
                console.error('Content recovery also failed:', recoveryError);
              }
            }
          }
        }
      }
      
      // Process any remaining buffer content
      if (buffer.trim()) {
        console.log('Processing final buffer content:', buffer.substring(0, 100));
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6).trim();
          if (data !== '[DONE]') {
            try {
              const parsed: ChatCompletionChunk = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content && onChunk) {
                onChunk(content);
              }
            } catch (e) {
              console.warn('Failed to parse final buffer content:', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream cancelled');
      } else {
        throw error;
      }
    } finally {
      this.abortController = null;
    }
  }
  
  cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
  
  
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      // The response should have a 'data' array with model objects
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => model.id);
      }
      return [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }
}

// Singleton instance
export const llmService = new LLMService();