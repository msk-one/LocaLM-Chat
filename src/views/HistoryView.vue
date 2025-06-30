<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-4xl mx-auto p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 animate-fade-in">
        <div class="flex items-center gap-4">
          <a @click="goToHome" class="flex items-center gap-2 text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">
            <img src="/logo.png" alt="LocalLM Chat Logo" class="w-8 h-8" />
            Local chat
          </a>
          <span class="text-gray-400">›</span>
          <h1 class="text-2xl font-bold text-gray-600">History</h1>
        </div>
        <router-link
          to="/"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-md hover:shadow-lg"
        >
          Back to Chat
        </router-link>
      </div>
      
      <!-- Conversations list -->
      <div v-if="conversations.length > 0" class="space-y-4">
        <div
          v-for="(conversation, index) in conversations"
          :key="conversation.id"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.01] animate-slide-up"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <div class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <div v-if="getModelInfo(conversation.model)" class="flex items-center gap-1">
                    <span :class="['text-xs px-2 py-0.5 rounded-full', getModelBadgeClass(conversation.model)]">
                      {{ getModelInfo(conversation.model)?.provider }}
                    </span>
                    <span class="text-xs text-gray-500">{{ getModelInfo(conversation.model)?.name }}</span>
                  </div>
                </div>
                <h3 class="font-semibold text-gray-800 mb-1">
                  {{ conversation.title }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ conversation.messages.length }} messages ·
                  Created {{ formatDate(conversation.createdAt) }} ·
                  Updated {{ formatDate(conversation.updatedAt) }}
                </p>
                
                <!-- Preview of last message -->
                <div v-if="getLastUserMessage(conversation)" class="mt-2">
                  <p class="text-sm text-gray-600 line-clamp-2">
                    {{ getLastUserMessage(conversation) }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 ml-4">
                <button
                  @click="loadConversation(conversation.id)"
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105"
                >
                  Load
                </button>
                <button
                  @click="deleteConversation(conversation.id)"
                  class="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:scale-105"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-else class="bg-white rounded-lg shadow-sm p-8 text-center animate-fade-in">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No conversations yet</h3>
        <p class="text-gray-500 mb-4">Start a new conversation to see it here</p>
        <router-link
          to="/"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-md hover:shadow-lg"
        >
          Start chatting
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { getModelInfo } from '@/config/models';
import type { Conversation } from '@/types';

const router = useRouter();
const chatStore = useChatStore();

const conversations = computed(() => {
  return Array.from(chatStore.conversations.values())
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
});

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
  if (diff < 86400000) { // Less than 24 hours
    return new Date(date).toLocaleTimeString();
  } else if (diff < 604800000) { // Less than 7 days
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return new Date(date).toLocaleDateString();
  }
}

function getLastUserMessage(conversation: Conversation): string {
  const userMessages = conversation.messages.filter(m => m.role === 'user');
  return userMessages[userMessages.length - 1]?.content || '';
}

function loadConversation(id: string) {
  chatStore.activeConversationId = id;
  router.push('/');
}

function deleteConversation(id: string) {
  if (confirm('Are you sure you want to delete this conversation?')) {
    chatStore.deleteConversation(id);
  }
}

function goToHome() {
  chatStore.activeConversationId = null;
  router.push('/');
}

function getModelBadgeClass(modelId: string): string {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) return 'bg-gray-100 text-gray-700';
  
  const colorMap: Record<string, string> = {
    'Qwen': 'bg-purple-100 text-purple-700',
    'DeepSeek': 'bg-blue-100 text-blue-700',
    'Mistral': 'bg-orange-100 text-orange-700',
    'Meta': 'bg-green-100 text-green-700',
    'Google': 'bg-red-100 text-red-700'
  };
  
  return colorMap[modelInfo.provider] || 'bg-gray-100 text-gray-700';
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.4s ease-out both;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
</style>