<template>
  <div class="space-y-6">
    <!-- API Configuration -->
    <div class="bg-white rounded-lg shadow-sm p-6 animate-slide-up" style="animation-delay: 0.1s">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">API configuration</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            API URL
          </label>
          <input
            v-model="apiUrl"
            type="text"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="http://localhost:3001"
          />
          <p class="mt-1 text-sm text-gray-500">
            The URL of your proxy server
          </p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Default Model
          </label>
          <select
            v-model="defaultModel"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            :disabled="availableModels.length === 0"
          >
            <option v-if="availableModels.length === 0" value="">Loading models...</option>
            <option
              v-for="model in availableModels"
              :key="model"
              :value="model"
            >
              {{ getModelDisplayName(model) }}
            </option>
          </select>
        </div>
        
        <div class="flex items-center gap-3">
          <button
            @click="testConnection"
            :disabled="isTesting"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 hover:scale-105"
          >
            {{ isTesting ? 'Testing...' : 'Test connection' }}
          </button>
          
          <button
            @click="refreshModels"
            :disabled="isRefreshing"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 hover:scale-105"
            title="Refresh available models"
          >
            <svg v-if="!isRefreshing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <span v-if="connectionStatus" :class="[
            'text-sm transition-all',
            connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'
          ]">
            {{ connectionStatus === 'success' ? '✓ Connected' : '✗ Connection failed' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Chat Settings -->
    <div class="bg-white rounded-lg shadow-sm p-6 animate-slide-up" style="animation-delay: 0.2s">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Chat settings</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Auto-refresh interval
          </label>
          <select
            v-model="autoRefreshInterval"
            @change="updateAutoRefresh"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="0">Disabled</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
          </select>
          <p class="mt-1 text-sm text-gray-500">
            Automatically refresh model availability
          </p>
        </div>
        
        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="showThinkingByDefault"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700">
              Show thinking process by default
            </span>
          </label>
          <p class="mt-1 text-sm text-gray-500 ml-6">
            Expand thinking content in responses automatically
          </p>
        </div>
      </div>
    </div>
    
    <!-- Data Management -->
    <div class="bg-white rounded-lg shadow-sm p-6 animate-slide-up" style="animation-delay: 0.3s">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Data management</h2>
      
      <div class="space-y-4">
        <div>
          <h3 class="font-medium text-gray-700 mb-2">Conversation history</h3>
          <p class="text-sm text-gray-500 mb-3">
            You have {{ conversationCount }} conversations stored locally
          </p>
          <div class="flex gap-3">
            <button
              @click="exportConversations"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105"
            >
              Export all
            </button>
            <button
              @click="importConversations"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:scale-105"
            >
              Import
            </button>
            <button
              @click="clearAllConversations"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:scale-105"
            >
              Clear all
            </button>
          </div>
        </div>
        
        <div>
          <h3 class="font-medium text-gray-700 mb-2">Documents</h3>
          <p class="text-sm text-gray-500 mb-3">
            You have {{ documentCount }} documents uploaded
          </p>
          <button
            @click="clearAllDocuments"
            :disabled="documentCount === 0"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 hover:scale-105"
          >
            Clear all documents
          </button>
        </div>
      </div>
    </div>
    
    <!-- About -->
    <div class="bg-white rounded-lg shadow-sm p-6 animate-slide-up" style="animation-delay: 0.4s">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">About</h2>
      <div class="text-sm text-gray-600 space-y-2">
        <p class="font-semibold text-lg text-gray-800">LocalLM Chat app</p>
        <p>Version: 0.6.5, mskRed</p>
            <p>Built with: Vue 3, TypeScript, Tailwind CSS, and Vite</p>
            <p class="pt-2">
              A modern chat interface for interacting with locally-hosted Large Language Models (LLMs) through Docker Model Runner feature.
            </p>
        <div class="pt-4 flex gap-4">
          <a href="https://github.com" target="_blank" class="text-blue-600 hover:text-blue-700 transition-colors">
            GitHub
          </a>
          <a href="#" class="text-blue-600 hover:text-blue-700 transition-colors">
            Documentation
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useChatStore } from '@/stores/chat';
import { llmService } from '@/services/api';
import { getModelInfo } from '@/config/models';

const chatStore = useChatStore();

const apiUrl = ref(import.meta.env.VITE_API_URL || 'http://localhost:3001');
const defaultModel = ref(chatStore.selectedModel);
const isTesting = ref(false);
const isRefreshing = ref(false);
const connectionStatus = ref<'success' | 'failed' | null>(null);
const autoRefreshInterval = ref('0');
const showThinkingByDefault = ref(false);
const availableModels = ref<string[]>([]);
let refreshTimer: number | null = null;

const conversationCount = computed(() => chatStore.conversations.size);
const documentCount = computed(() => chatStore.documents.length);

async function testConnection() {
  isTesting.value = true;
  connectionStatus.value = null;
  
  try {
    const isConnected = await llmService.testConnection();
    connectionStatus.value = isConnected ? 'success' : 'failed';
  } catch (error) {
    connectionStatus.value = 'failed';
  } finally {
    isTesting.value = false;
  }
}

async function refreshModels() {
  isRefreshing.value = true;
  try {
    const models = await llmService.getAvailableModels();
    availableModels.value = models;
    
    // Update default model if current one is not available
    if (models.length > 0 && !models.includes(defaultModel.value)) {
      defaultModel.value = models[0];
    }
    
    connectionStatus.value = 'success';
  } catch (error) {
    console.error('Failed to fetch models:', error);
    connectionStatus.value = 'failed';
    // Fallback to some default models
    availableModels.value = [
      'ai/qwen3:30B-A3B-Q4_K_M',
      'ai/deepseek-r1-distill-llama:latest',
      'ai/mistral:latest'
    ];
  } finally {
    isRefreshing.value = false;
  }
}

function getModelDisplayName(modelId: string): string {
  const modelInfo = getModelInfo(modelId);
  return modelInfo ? `${modelInfo.name} (${modelInfo.provider})` : modelId;
}

function updateAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  const interval = parseInt(autoRefreshInterval.value);
  if (interval > 0) {
    refreshTimer = window.setInterval(() => {
      refreshModels();
    }, interval * 1000);
  }
}

function exportConversations() {
  const data = Array.from(chatStore.conversations.values());
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `locallm-chat-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importConversations() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // Validate and import conversations
      if (Array.isArray(data)) {
        // Add validation and import logic here
        alert('Import functionality coming soon!');
      }
    } catch (error) {
      alert('Failed to import conversations. Please check the file format.');
    }
  };
  input.click();
}

function clearAllConversations() {
  if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
    chatStore.conversations.clear();
    chatStore.activeConversationId = null;
    chatStore.saveConversations();
  }
}

function clearAllDocuments() {
  if (confirm('Are you sure you want to delete all documents?')) {
    chatStore.clearDocuments();
  }
}

// Save settings when they change
function saveSettings() {
  localStorage.setItem('autoRefreshInterval', autoRefreshInterval.value);
  localStorage.setItem('showThinkingByDefault', showThinkingByDefault.value.toString());
  chatStore.selectedModel = defaultModel.value;
}

// Watch for changes and save
watch(autoRefreshInterval, () => {
  saveSettings();
  updateAutoRefresh();
});

watch(showThinkingByDefault, saveSettings);
watch(defaultModel, saveSettings);

onMounted(async () => {
  // Load saved settings
  const savedInterval = localStorage.getItem('autoRefreshInterval');
  if (savedInterval) {
    autoRefreshInterval.value = savedInterval;
    updateAutoRefresh();
  }
  
  const savedShowThinking = localStorage.getItem('showThinkingByDefault');
  if (savedShowThinking) {
    showThinkingByDefault.value = savedShowThinking === 'true';
  }
  
  // Load available models and set default
  await refreshModels();
  
  // Make sure the default model is set correctly
  defaultModel.value = chatStore.selectedModel;
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
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

.animate-slide-up {
  animation: slide-up 0.4s ease-out both;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>