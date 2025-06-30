<template>
  <div class="border-t border-gray-200 bg-white p-4">
    <!-- Attached documents -->
    <div v-if="attachedDocuments.length > 0" class="mb-4">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="doc in attachedDocuments"
          :key="doc.id"
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200 transition-all hover:bg-blue-100"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="font-medium">{{ doc.name }}</span>
          <button
            @click="removeDocument(doc.id)"
            class="ml-1 hover:text-red-600 transition-colors p-0.5 rounded-full hover:bg-red-100"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Input area -->
    <div class="flex gap-3 items-end">
      <div class="flex-1 relative">
        <div class="relative">
          <textarea
            ref="textareaRef"
            v-model="message"
            @keydown.enter.prevent="handleEnter"
            @input="adjustHeight"
            :disabled="isStreaming"
            placeholder="Type your message... (Shift + Enter for new line)"
            class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            :style="{ height: 40 }"
            rows="1"
          ></textarea>
          
          <!-- Document upload button -->
          <button
            @click="triggerFileInput"
            :disabled="isStreaming"
            class="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-blue-50"
            title="Attach document (PDF, DOCX, TXT, MD)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
        
      </div>
      
      <!-- Send/Cancel button -->
      <button
        @click="handleSend"
        :disabled="!canSend"
        :class="[
          'px-5 py-3 rounded-xl font-medium transition-all duration-200 min-h-[52px] flex items-center justify-center gap-2',
          isStreaming
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : canSend
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        ]"
      >
        <div class="flex items-center gap-2">
          <svg
            v-if="isStreaming"
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg
            v-else-if="canSend"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          {{ isStreaming ? 'Cancel' : 'Send' }}
        </div>
      </button>
    </div>
    
    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      @change="handleFileSelect"
      accept=".pdf,.docx,.txt,.md"
      multiple
      class="hidden"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { validateFile } from '@/utils/sanitizer';
import type { Document } from '@/types';

const chatStore = useChatStore();

const message = ref('');
const textareaRef = ref<HTMLTextAreaElement>();
const fileInputRef = ref<HTMLInputElement>();
const textareaHeight = ref('auto');
const attachedDocuments = ref<Document[]>([]);

const isStreaming = computed(() => chatStore.isStreaming);
const canSend = computed(() => message.value.trim().length > 0 && !isStreaming.value);

function adjustHeight() {
  if (!textareaRef.value) return;
  
  textareaHeight.value = 'auto';
  nextTick(() => {
    if (!textareaRef.value) return;
    const scrollHeight = textareaRef.value.scrollHeight;
    textareaHeight.value = `${Math.min(scrollHeight, 200)}px`;
  });
}

function handleEnter(event: KeyboardEvent) {
  if (event.shiftKey) {
    // Allow new line with Shift+Enter
    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    message.value = value.substring(0, start) + '\n' + value.substring(end);
    
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      adjustHeight();
    });
  } else {
    // Send message with Enter
    handleSend();
  }
}

async function handleSend() {
  if (isStreaming.value) {
    // Cancel streaming
    chatStore.cancelStream();
    return;
  }
  
  if (!canSend.value) return;
  
  const messageText = message.value.trim();
  const docIds = attachedDocuments.value.map(doc => doc.id);
  
  console.log(`Sending message with ${docIds.length} documents:`, docIds);
  
  // Clear input
  message.value = '';
  attachedDocuments.value = [];
  adjustHeight();
  
  try {
    await chatStore.sendMessage(messageText, docIds);
  } catch (error) {
    console.error('Failed to send message:', error);
    // Message will be shown in the chat with error
  }
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  
  if (!files || files.length === 0) return;
  
  console.log(`Selected ${files.length} files:`, Array.from(files).map(f => f.name));
  
  const errors: string[] = [];
  const successfulUploads: Document[] = [];
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
    
    try {
      validateFile(file);
      
      // Check if already attached
      if (attachedDocuments.value.some(doc => doc.name === file.name)) {
        errors.push(`${file.name} is already attached`);
        continue;
      }
      
      // Upload and process the document
      const document = await chatStore.uploadDocument(file);
      console.log(`Successfully uploaded: ${file.name}`, document);
      successfulUploads.push(document);
      
    } catch (error: any) {
      console.error(`Failed to process ${file.name}:`, error);
      errors.push(`${file.name}: ${error.message || 'Failed to process'}`);
    }
  }
  
  console.log(`Successful uploads: ${successfulUploads.length}`, successfulUploads);
  
  // Add all successful uploads
  attachedDocuments.value.push(...successfulUploads);
  
  console.log(`Total attached documents: ${attachedDocuments.value.length}`, attachedDocuments.value);
  
  // Show errors if any
  if (errors.length > 0) {
    alert('Some files could not be processed:\n\n' + errors.join('\n'));
  }
  
  // Clear the input
  input.value = '';
}

function removeDocument(docId: string) {
  const index = attachedDocuments.value.findIndex(doc => doc.id === docId);
  if (index !== -1) {
    attachedDocuments.value.splice(index, 1);
  }
}

onMounted(() => {
  adjustHeight();
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>