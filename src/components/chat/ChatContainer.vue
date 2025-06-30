<template>
  <div class="flex flex-col h-full bg-gray-100">
    <!-- Messages area -->
    <div 
      ref="messagesContainer"
      class="flex-1 overflow-y-auto scrollbar-thin"
      @scroll="handleScroll"
    >
      <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
        <div class="text-center p-8">
          <h2 class="text-2xl font-semibold text-gray-700 mb-2">Welcome to LocalLM Chat</h2>
          <p class="text-gray-500">Start a conversation by typing a message below</p>
        </div>
      </div>
      
      <div v-else class="pb-4">
        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </div>
    </div>
    
    <!-- Auto-scroll indicator -->
    <transition name="fade">
      <button
        v-if="!isAtBottom && messages.length > 0"
        @click="scrollToBottom"
        class="absolute bottom-24 right-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </transition>
    
    <!-- Input area -->
    <ChatInput />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import ChatMessage from './ChatMessage.vue';
import ChatInput from './ChatInput.vue';

const chatStore = useChatStore();

const messagesContainer = ref<HTMLElement>();
const isAtBottom = ref(true);
const autoScrollEnabled = ref(true);

const messages = computed(() => chatStore.activeMessages);

// Auto-scroll to bottom when new messages arrive
watch(messages, async () => {
  if (autoScrollEnabled.value && isAtBottom.value) {
    await nextTick();
    scrollToBottom();
  }
}, { deep: true });

// Watch for streaming updates
watch(() => chatStore.streamingMessage, async () => {
  if (autoScrollEnabled.value && isAtBottom.value) {
    await nextTick();
    scrollToBottom();
  }
});

function handleScroll() {
  if (!messagesContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const threshold = 100; // pixels from bottom
  
  isAtBottom.value = scrollHeight - scrollTop - clientHeight < threshold;
  
  // Re-enable auto-scroll if user scrolls to bottom
  if (isAtBottom.value) {
    autoScrollEnabled.value = true;
  }
}

function scrollToBottom() {
  if (!messagesContainer.value) return;
  
  messagesContainer.value.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: 'smooth'
  });
  
  autoScrollEnabled.value = true;
  isAtBottom.value = true;
}

// Create initial conversation if none exists
onMounted(() => {
  if (!chatStore.activeConversation) {
    chatStore.createConversation();
  }
  
  // Initial scroll to bottom
  nextTick(() => {
    scrollToBottom();
  });
});

// Cleanup
onUnmounted(() => {
  // Save any pending changes
  chatStore.saveConversations();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>