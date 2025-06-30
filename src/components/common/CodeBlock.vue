<template>
  <div class="code-block-wrapper relative group">
    <!-- Code block toolbar -->
    <div class="code-toolbar flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 text-sm border-b border-gray-700">
      <div class="flex items-center gap-2">
        <!-- Language indicator -->
        <div v-if="language" class="language-badge">
          <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {{ getLanguageDisplayName(language) }}
          </span>
        </div>
        <div v-else class="text-gray-400 text-xs">
          Plain text
        </div>
      </div>
      
      <!-- Toolbar actions -->
      <div class="flex items-center gap-2">
        <!-- Copy button -->
        <button
          @click="copyCode"
          :class="[
            'copy-button flex items-center gap-1 px-2 py-1 rounded text-xs',
            'transition-all duration-200 hover:bg-gray-700',
            copied ? 'text-green-400' : 'text-gray-300 hover:text-white'
          ]"
          :title="copied ? 'Copied!' : 'Copy code'"
        >
          <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Code content -->
    <div class="code-content relative">
      <pre class="code-pre"><code 
        :class="language ? `hljs language-${language}` : 'hljs'"
        v-html="highlightedCode"
      ></code></pre>
      
      <!-- Line numbers (optional) -->
      <div v-if="showLineNumbers" class="line-numbers absolute left-0 top-0 h-full bg-gray-850 border-r border-gray-700 px-2 py-4 text-gray-500 text-sm font-mono select-none">
        <div v-for="lineNumber in lineCount" :key="lineNumber" class="line-number">
          {{ lineNumber }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import hljs from 'highlight.js';

const props = defineProps<{
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}>();

const copied = ref(false);

// Language display mapping for better UX
const languageDisplayMap: Record<string, string> = {
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'py': 'Python',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'c': 'C',
  'cs': 'C#',
  'php': 'PHP',
  'rb': 'Ruby',
  'ruby': 'Ruby',
  'go': 'Go',
  'rs': 'Rust',
  'rust': 'Rust',
  'sh': 'Shell',
  'bash': 'Bash',
  'sql': 'SQL',
  'html': 'HTML',
  'xml': 'XML',
  'css': 'CSS',
  'scss': 'SCSS',
  'json': 'JSON',
  'yaml': 'YAML',
  'yml': 'YAML',
  'dockerfile': 'Dockerfile',
  'md': 'Markdown',
  'markdown': 'Markdown'
};

// Computed properties
const highlightedCode = computed(() => {
  if (!props.code) return '';
  
  try {
    if (props.language && hljs.getLanguage(props.language)) {
      return hljs.highlight(props.code, { language: props.language }).value;
    } else {
      return hljs.highlightAuto(props.code).value;
    }
  } catch (error) {
    console.error('Syntax highlighting error:', error);
    return escapeHtml(props.code);
  }
});

const lineCount = computed(() => {
  return props.code.split('\n').length;
});

// Helper functions
function getLanguageDisplayName(lang: string): string {
  return languageDisplayMap[lang.toLowerCase()] || lang.toUpperCase();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy code:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = props.code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

onMounted(() => {
  // Ensure highlight.js is loaded
  if (!hljs.listLanguages().length) {
    console.warn('No languages loaded for highlight.js');
  }
});
</script>

<style scoped>
.code-block-wrapper {
  @apply rounded-lg overflow-hidden bg-gray-900 shadow-lg;
  margin: 1rem 0;
}

.code-toolbar {
  background: linear-gradient(to right, #1f2937, #111827);
}

.code-content {
  position: relative;
  padding: 15px;
}

.code-pre {
  @apply m-0 overflow-x-auto bg-gray-900;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre;
  tab-size: 4;
}

.code-pre code {
  @apply block text-gray-100;
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  white-space: pre;
  tab-size: 4;
}

.line-numbers {
  background: #0f172a;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  width: 3rem;
  text-align: right;
}

.line-number {
  height: 1.3125rem; /* Match line height */
}

.copy-button:hover {
  transform: translateY(-1px);
}

.language-badge {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Enhanced syntax highlighting styles */
:deep(.hljs) {
  background: transparent !important;
  color: #e5e7eb !important;
}

:deep(.hljs-keyword) {
  color: #c084fc !important;
  font-weight: 600;
}

:deep(.hljs-string) {
  color: #34d399 !important;
}

:deep(.hljs-number) {
  color: #fbbf24 !important;
}

:deep(.hljs-comment) {
  color: #6b7280 !important;
  font-style: italic;
}

:deep(.hljs-function) {
  color: #60a5fa !important;
}

:deep(.hljs-variable) {
  color: #f87171 !important;
}

:deep(.hljs-type) {
  color: #a78bfa !important;
}

:deep(.hljs-built_in) {
  color: #f59e0b !important;
}

:deep(.hljs-literal) {
  color: #10b981 !important;
}

:deep(.hljs-operator) {
  color: #fb7185 !important;
}

:deep(.hljs-punctuation) {
  color: #9ca3af !important;
}

:deep(.hljs-tag) {
  color: #fb7185 !important;
}

:deep(.hljs-attr) {
  color: #fbbf24 !important;
}

:deep(.hljs-attribute) {
  color: #fbbf24 !important;
}

:deep(.hljs-title) {
  color: #60a5fa !important;
  font-weight: 600;
}
</style>