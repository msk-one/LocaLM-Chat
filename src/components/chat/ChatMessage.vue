<template>
  <div
    :class="[
      'flex gap-4 p-4 animate-message-in',
      message.role === 'user' ? 'bg-white' : 'bg-gray-50'
    ]"
  >
    <div class="flex-shrink-0">
      <div
        :class="[
          'w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs',
          message.role === 'user' ? 'bg-blue-600' : getModelColor()
        ]"
      >
        {{ message.role === 'user' ? 'U' : getModelIcon() }}
      </div>
    </div>
    
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-medium text-sm text-gray-700">
          {{ message.role === 'user' ? 'You' : getModelName() }}
        </span>
        <span class="text-xs text-gray-500">
          {{ formatTime(message.timestamp) }}
        </span>
      </div>
      
      <div v-if="message.documents && message.documents.length > 0" class="mb-2">
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="docId in message.documents" 
            :key="docId"
            class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ getDocumentName(docId) }}
          </span>
        </div>
      </div>
      
      <div v-if="message.role === 'user'" class="text-gray-800 whitespace-pre-wrap">
        {{ message.content }}
      </div>
      
      <div v-else>
        <template v-if="!message.isStreaming || message.content">
          <!-- Handle thinking content -->
          <div v-if="parsedContent.thinking" class="mb-3">
            <button
              @click="showThinking = !showThinking"
              class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg
                :class="['w-4 h-4 transition-transform', showThinking ? 'rotate-90' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>
                {{ showThinking ? 'Hide' : 'Show' }} thinking process
                <span v-if="!parsedContent.isComplete" class="text-xs text-gray-500">(streaming...)</span>
              </span>
            </button>
            
            <div
              v-show="showThinking"
              class="mt-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-700 whitespace-pre-wrap"
            >
              {{ parsedContent.thinking }}
              <span v-if="!parsedContent.isComplete" class="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></span>
            </div>
          </div>
          
          <!-- Main response content -->
          <div v-if="parsedContent.isComplete || !parsedContent.thinking">
            <MarkdownRenderer :content="parsedContent.response" />
          </div>
          <div v-else class="text-gray-500 italic flex items-center gap-2">
            <div class="loading-dots flex space-x-1">
              <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </div>
            <span>Generating response...</span>
          </div>
        </template>
        <LoadingSpinner v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Message } from '@/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useChatStore } from '@/stores/chat';
import { getModelInfo } from '@/config/models';

const props = defineProps<{
  message: Message;
}>();

const chatStore = useChatStore();
const showThinking = ref(false);

// Get model info based on conversation's model
const modelInfo = computed(() => {
  const conversation = chatStore.activeConversation;
  const model = conversation?.model || chatStore.selectedModel;
  return getModelInfo(model);
});

function getModelName(): string {
  return modelInfo.value?.name || 'Assistant';
}

function getModelIcon(): string {
  return modelInfo.value?.icon || 'AI';
}

function getModelColor(): string {
  return modelInfo.value?.color || 'bg-gray-600';
}

// Parse content to separate thinking and response
const parsedContent = computed(() => {
  const content = props.message.content || '';
  
  // Check for complete <think> tags
  const completeThinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  
  if (completeThinkMatch) {
    const thinking = completeThinkMatch[1].trim();
    const response = content.replace(completeThinkMatch[0], '').trim();
    
    return {
      thinking,
      response: response || 'I understand. How can I help you?',
      isComplete: true
    };
  }
  
  // Check for incomplete <think> tag (still streaming)
  const incompleteThinkMatch = content.match(/<think>([\s\S]*)/);
  
  if (incompleteThinkMatch && props.message.isStreaming) {
    // If still streaming and we have an opening <think> tag,
    // show everything after <think> as thinking content
    const thinking = incompleteThinkMatch[1].trim();
    
    return {
      thinking,
      response: 'Thinking...',
      isComplete: false
    };
  }
  
  return {
    thinking: null,
    response: content,
    isComplete: true
  };
});

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return new Date(date).toLocaleString();
}

function getDocumentName(docId: string): string {
  const doc = chatStore.documents.find(d => d.id === docId);
  return doc?.name || 'Unknown document';
}
</script>

<style scoped>
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-message-in {
  animation: message-in 0.3s ease-out;
}
</style>