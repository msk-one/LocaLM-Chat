<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a @click="goToHome" class="flex items-center gap-2 text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">
          <img src="/logo.png" alt="LocalLM Chat Logo" class="w-8 h-8" />
          Local chat
        </a>
        <div v-if="activeConversation && currentView === 'chat'" class="text-sm text-gray-500 animate-fade-in">
          {{ activeConversation.title }}
        </div>
        <div v-if="currentView === 'history'" class="text-sm text-gray-500 animate-fade-in">
          › History
        </div>
        <div v-if="currentView === 'settings'" class="text-sm text-gray-500 animate-fade-in">
          › Settings
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Model selector -->
        <div class="relative">
          <button
            @click="showModelSelector = !showModelSelector"
            class="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 transition-all"
          >
            <div
              v-if="currentModelInfo"
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
                currentModelInfo.color
              ]"
            >
              {{ currentModelInfo.icon }}
            </div>
            <span>{{ currentModelInfo?.name || 'Select Model' }}</span>
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <!-- Model dropdown -->
          <div
            v-if="showModelSelector"
            class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border overflow-hidden z-50 animate-fade-in"
          >
            <div v-if="loadingModels" class="p-4 text-center text-gray-500">
              Loading available models...
            </div>
            <div v-else-if="availableModels.length === 0" class="p-4 text-center text-gray-500">
              No models available
            </div>
            <div v-else class="max-h-96 overflow-y-auto">
              <div v-for="[category, models] in modelsByCategory" :key="category" class="border-b last:border-b-0">
                <div class="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600">
                  {{ category }}
                </div>
                <div class="py-1">
                  <button
                    v-for="model in models"
                    :key="model.id"
                    @click="selectModel(model.id)"
                    :class="[
                      'w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-all text-left',
                      selectedModel === model.id ? 'bg-blue-50' : ''
                    ]"
                  >
                    <div
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                        model.color
                      ]"
                    >
                      {{ model.icon }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm text-gray-800">{{ model.name }}</div>
                      <div v-if="model.description" class="text-xs text-gray-500 truncate">
                        {{ model.description }}
                      </div>
                    </div>
                    <svg
                      v-if="selectedModel === model.id"
                      class="w-5 h-5 text-blue-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- New conversation button -->
        <button
          @click="createNewConversation"
          class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
          title="New conversation"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <!-- History button -->
        <button
          @click="setCurrentView('history')"
          :class="[
            'p-2 rounded-lg transition-all hover:scale-105',
            currentView === 'history'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          ]"
          title="Conversation history"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        <!-- Settings button -->
        <button
          @click="setCurrentView('settings')"
          :class="[
            'p-2 rounded-lg transition-all hover:scale-105',
            currentView === 'settings'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          ]"
          title="Settings"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
    
    <!-- Main content area -->
    <div class="flex-1 flex">
      <!-- Previous chats sidebar (shown when no active conversation and in chat view) -->
      <div v-if="currentView === 'chat' && !activeConversation && hasConversations" class="w-80 bg-gray-50 border-r p-4 overflow-y-auto animate-slide-in">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Recent Conversations</h2>
        <div class="space-y-2">
          <div
            v-for="conversation in recentConversations"
            :key="conversation.id"
            @click="selectConversation(conversation.id)"
            class="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-800 truncate flex-1">{{ conversation.title }}</h3>
              <div
                v-if="getModelInfo(conversation.model)"
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ml-2',
                  getModelInfo(conversation.model)?.color || 'bg-gray-600'
                ]"
                :title="getModelInfo(conversation.model)?.name"
              >
                {{ getModelInfo(conversation.model)?.icon || '?' }}
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              {{ formatDate(conversation.updatedAt) }}
            </p>
            <p v-if="conversation.messages.length > 0" class="text-sm text-gray-600 mt-2 line-clamp-2">
              {{ getLastMessage(conversation) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Main content area -->
      <div class="flex-1 flex flex-col">
        <!-- Chat container -->
        <ChatContainer v-if="currentView === 'chat' && activeConversation" class="flex-1" />
        
        <!-- Welcome screen when no conversation -->
        <div v-else-if="currentView === 'chat'" class="flex-1 flex items-center justify-center p-8">
          <div class="text-center max-w-2xl animate-fade-in">
            <img src="/logo.png" alt="LocalLM Chat Logo" class="w-32 h-32 mx-auto mb-6" />
            <h1 class="text-4xl font-bold text-gray-800 mb-4">Welcome to LocalLM Chat</h1>
            <p class="text-lg text-gray-600 mb-8">
              Start a conversation with your locally-hosted Large Language Models
            </p>
            <button
              @click="createNewConversation"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start New Conversation
            </button>
            
            <div v-if="!hasConversations" class="mt-12">
              <p class="text-gray-500 mb-4">Features:</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div class="p-4 bg-white rounded-lg shadow-sm">
                  <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 class="font-semibold text-gray-800">Real-time Chat</h3>
                  <p class="text-sm text-gray-600 mt-1">Stream responses from your LLMs</p>
                </div>
                <div class="p-4 bg-white rounded-lg shadow-sm">
                  <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 class="font-semibold text-gray-800">Document Support</h3>
                  <p class="text-sm text-gray-600 mt-1">Upload and chat about documents</p>
                </div>
                <div class="p-4 bg-white rounded-lg shadow-sm">
                  <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 class="font-semibold text-gray-800">History</h3>
                  <p class="text-sm text-gray-600 mt-1">Save and revisit conversations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- History View -->
        <HistoryPanel
          v-else-if="currentView === 'history'"
          class="flex-1"
          @load-conversation="loadConversation"
          @start-chatting="() => setCurrentView('chat')"
        />
        
        <!-- Settings View -->
        <SettingsPanel v-else-if="currentView === 'settings'" class="flex-1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import ChatContainer from '@/components/chat/ChatContainer.vue';
import HistoryPanel from '@/components/history/HistoryPanel.vue';
import SettingsPanel from '@/components/settings/SettingsPanel.vue';
import type { Conversation } from '@/types';
import { getModelInfo, getModelsByCategory } from '@/config/models';
import { llmService } from '@/services/api';

const chatStore = useChatStore();
const showModelSelector = ref(false);
const availableModels = ref<string[]>([]);
const loadingModels = ref(false);
const currentView = ref<'chat' | 'history' | 'settings'>('chat');

const activeConversation = computed(() => chatStore.activeConversation);
const currentModelInfo = computed(() => getModelInfo(chatStore.selectedModel));
const modelsByCategory = computed(() => getModelsByCategory(availableModels.value));
const selectedModel = computed({
  get: () => chatStore.selectedModel,
  set: (value) => {
    chatStore.selectedModel = value;
    
    // If model changes during active conversation with messages, create new conversation
    if (chatStore.activeConversation && chatStore.activeConversation.messages.length > 0) {
      chatStore.createConversation(`New ${getModelNameFromId(value)} Chat`);
    } else if (chatStore.activeConversation) {
      // Only update the conversation's model if it's empty (no messages)
      chatStore.updateActiveConversationModel(value);
    }
  }
});
const hasConversations = computed(() => chatStore.hasConversations);

const recentConversations = computed(() => {
  return Array.from(chatStore.conversations.values())
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10);
});

function createNewConversation() {
  chatStore.createConversation();
}

function goToHome() {
  currentView.value = 'chat';
  if (chatStore.activeConversationId) {
    chatStore.activeConversationId = null;
  }
}

function setCurrentView(view: 'chat' | 'history' | 'settings') {
  currentView.value = view;
  // When switching to chat view, clear active conversation to show welcome screen
  if (view === 'chat') {
    chatStore.activeConversationId = null;
  }
}

function loadConversation(conversationId: string) {
  chatStore.switchConversation(conversationId);
  currentView.value = 'chat';
}

function getModelNameFromId(modelId: string): string {
  const modelInfo = getModelInfo(modelId);
  return modelInfo?.name || 'AI';
}

function selectModel(modelId: string) {
  selectedModel.value = modelId;
  showModelSelector.value = false;
}

// Close model selector when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showModelSelector.value = false;
  }
}

async function fetchAvailableModels() {
  loadingModels.value = true;
  try {
    const models = await llmService.getAvailableModels();
    availableModels.value = models;
    
    // If current selected model is not in the available models, select the first one
    if (models.length > 0 && !models.includes(chatStore.selectedModel)) {
      chatStore.selectedModel = models[0];
    }
  } catch (error) {
    console.error('Failed to fetch models:', error);
    // Fallback to some default models if fetch fails
    availableModels.value = [
      'ai/qwen3:30B-A3B-Q4_K_M',
      'ai/deepseek-r1-distill-llama:latest',
      'ai/mistral:latest'
    ];
  } finally {
    loadingModels.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchAvailableModels();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function selectConversation(id: string) {
  chatStore.switchConversation(id);
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function getLastMessage(conversation: Conversation): string {
  const lastMessage = conversation.messages
    .filter(m => m.role === 'assistant')
    .pop();
  
  if (!lastMessage?.content) return 'No messages yet';
  
  // Remove <think> tags and their content
  const content = lastMessage.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return content || 'No messages yet';
}
</script>

<style scoped>
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

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>