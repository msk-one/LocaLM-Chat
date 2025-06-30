import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Conversation, Message, Document } from '@/types';
import { llmService } from '@/services/api';
import { documentParser } from '@/services/documentParser';
import { DocumentChunker } from '@/utils/chunker';

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Map<string, Conversation>>(new Map());
  const activeConversationId = ref<string | null>(null);
  const isStreaming = ref(false);
  const streamingMessage = ref('');
  const documents = ref<Document[]>([]);
  const documentChunks = ref<Map<string, string[]>>(new Map());
  const selectedModel = ref('ai/qwen3:30B-A3B-Q4_K_M');

  // Computed
  const activeConversation = computed(() => {
    if (!activeConversationId.value) return null;
    return conversations.value.get(activeConversationId.value) || null;
  });

  const activeMessages = computed(() => {
    return activeConversation.value?.messages || [];
  });

  const hasConversations = computed(() => {
    return conversations.value.size > 0;
  });

  // Load conversations from localStorage
  function loadConversations() {
    try {
      const saved = localStorage.getItem('llm-chat-conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        conversations.value = new Map(
          parsed.map((conv: any) => [
            conv.id,
            {
              ...conv,
              model: conv.model || selectedModel.value, // Fallback for old conversations
              createdAt: new Date(conv.createdAt),
              updatedAt: new Date(conv.updatedAt),
              messages: conv.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            }
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  // Save conversations to localStorage
  function saveConversations() {
    try {
      // Get all conversations
      const allConversations = Array.from(conversations.value.values());
      const conversationsWithMessages = allConversations.filter(conv => conv.messages.length > 0);
      
      // Only filter out empty conversations if there are other conversations with messages
      // This allows keeping the active empty conversation for the current session
      if (conversationsWithMessages.length > 0) {
        // Save only conversations with messages
        localStorage.setItem('llm-chat-conversations', JSON.stringify(conversationsWithMessages));
        
        // Remove empty conversations except the active one
        for (const [id, conv] of conversations.value.entries()) {
          if (conv.messages.length === 0 && id !== activeConversationId.value) {
            conversations.value.delete(id);
          }
        }
      } else {
        // If all conversations are empty, save them all (to preserve the active conversation)
        localStorage.setItem('llm-chat-conversations', JSON.stringify(allConversations));
      }
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  // Create a new conversation
  function createConversation(title?: string): Conversation {
    const conversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'New Conversation',
      messages: [],
      model: selectedModel.value,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // conversations.value.set() below already stores; removed verbose log
    conversations.value.set(conversation.id, conversation);
    activeConversationId.value = conversation.id;
    saveConversations();
    
    return conversation;
  }

  // Delete a conversation
  function deleteConversation(id: string) {
    conversations.value.delete(id);
    
    if (activeConversationId.value === id) {
      // Switch to another conversation or null
      const remaining = Array.from(conversations.value.keys());
      activeConversationId.value = remaining[0] || null;
    }
    
    saveConversations();
  }

  // Add a message to the active conversation
  function addMessage(role: 'user' | 'assistant', content: string, documents?: string[]) {
    if (!activeConversation.value) {
      createConversation();
    }
    
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      documents,
      timestamp: new Date()
    };
    
    activeConversation.value!.messages.push(message);
    activeConversation.value!.updatedAt = new Date();
    
    // Update title if it's the first user message
    if (role === 'user' && activeConversation.value!.messages.filter(m => m.role === 'user').length === 1) {
      activeConversation.value!.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }
    
    saveConversations();
    return message;
  }

  // Send a message to the LLM
  async function sendMessage(content: string, attachedDocumentIds?: string[]) {
    if (!content.trim()) return;
    
    // removed debug log
    
    // Add user message
    addMessage('user', content, attachedDocumentIds);
    
    // Prepare context from attached documents
    let context: string[] = [];
    if (attachedDocumentIds && attachedDocumentIds.length > 0) {
      const chunker = new DocumentChunker();
      
      // removed debug logs about context processing
      
      for (const docId of attachedDocumentIds) {
        const doc = documents.value.find(d => d.id === docId);
        const chunks = documentChunks.value.get(docId);
        
        if (chunks && chunks.length > 0) {
          // Get relevant chunks based on the user's message
          const relevantChunks = chunker.getRelevantChunks(chunks, content, 3);
          
          // Add document name as context
          if (doc && relevantChunks.length > 0) {
            context.push(`From document "${doc.name}":\n${relevantChunks.join('\n\n')}`);
          }
        } else if (doc) {
          // If no chunks, try to use the full content
          if (doc.content) {
            context.push(`From document "${doc.name}":\n${doc.content.substring(0, 2000)}...`);
          }
        }
      }
    }
    
    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    activeConversation.value!.messages.push(assistantMessage);
    
    // Start streaming
    isStreaming.value = true;
    streamingMessage.value = '';
    
    try {
      // Prepare conversation history (excluding the current assistant message placeholder)
      const conversationHistory = activeConversation.value!.messages
        .filter(msg => msg.id !== assistantMessage.id)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // removed debug log
      
      await llmService.sendMessage(
        content,
        context,
        (chunk) => {
          streamingMessage.value += chunk;
          // Find the message in the array and update it to ensure reactivity
          const messageIndex = activeConversation.value!.messages.findIndex(m => m.id === assistantMessage.id);
          if (messageIndex !== -1) {
            activeConversation.value!.messages[messageIndex].content = streamingMessage.value;
          }
        },
        selectedModel.value,
        conversationHistory
      );
      
      // Finalize the message
      const finalMessageIndex = activeConversation.value!.messages.findIndex(m => m.id === assistantMessage.id);
      if (finalMessageIndex !== -1) {
        activeConversation.value!.messages[finalMessageIndex].isStreaming = false;
      }
      activeConversation.value!.updatedAt = new Date();
      saveConversations();
      
    } catch (error: any) {
      // Update message with error
      const errorMessageIndex = activeConversation.value!.messages.findIndex(m => m.id === assistantMessage.id);
      if (errorMessageIndex !== -1) {
        activeConversation.value!.messages[errorMessageIndex].content = `Error: ${error.message || 'Failed to get response from LLM'}`;
        activeConversation.value!.messages[errorMessageIndex].isStreaming = false;
      }
      saveConversations();
      throw error;
    } finally {
      isStreaming.value = false;
      streamingMessage.value = '';
    }
  }

  // Cancel streaming
  function cancelStream() {
    llmService.cancelStream();
    isStreaming.value = false;
    streamingMessage.value = '';
  }

  // Upload and process a document
  async function uploadDocument(file: File): Promise<Document> {
    const { content, chunks } = await documentParser.parseAndChunkFile(file);
    const document = documentParser.createDocument(file, content, chunks);
    
    documents.value.push(document);
    documentChunks.value.set(document.id, chunks);
    
    return document;
  }

  // Remove a document
  function removeDocument(id: string) {
    const index = documents.value.findIndex(doc => doc.id === id);
    if (index !== -1) {
      documents.value.splice(index, 1);
      documentChunks.value.delete(id);
    }
  }

  // Clear all documents
  function clearDocuments() {
    documents.value = [];
    documentChunks.value.clear();
  }

  // Switch to a conversation and update the selected model
  function switchConversation(conversationId: string) {
    const conversation = conversations.value.get(conversationId);
    if (conversation) {
      activeConversationId.value = conversationId;
      // Update the selected model to match the conversation's model
      selectedModel.value = conversation.model;
    } else {
      console.error(`Conversation ${conversationId} not found`);
    }
  }

  // Update the model for the active conversation
  function updateActiveConversationModel(model: string) {
    if (activeConversation.value) {
      activeConversation.value.model = model;
      saveConversations();
    }
  }

  // Initialize store
  loadConversations();

  return {
    // State
    conversations,
    activeConversationId,
    isStreaming,
    streamingMessage,
    documents,
    documentChunks,
    selectedModel,
    
    // Computed
    activeConversation,
    activeMessages,
    hasConversations,
    
    // Actions
    createConversation,
    deleteConversation,
    addMessage,
    sendMessage,
    cancelStream,
    uploadDocument,
    removeDocument,
    clearDocuments,
    switchConversation,
    updateActiveConversationModel,
    loadConversations,
    saveConversations
  };
});