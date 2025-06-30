// Chat related types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  documents?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document related types
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  chunks?: string[];
  uploadedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
  metadata?: {
    pageNumber?: number;
    startChar?: number;
    endChar?: number;
  };
}

// API related types
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

// Store related types
export interface ChatState {
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingMessage: string;
  documents: Document[];
  documentChunks: Map<string, string[]>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}