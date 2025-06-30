<template>
  <div class="markdown-content prose prose-slate max-w-none">
    <template v-for="(block, index) in parsedBlocks" :key="index">
      <CodeBlock
        v-if="block.type === 'code'"
        :code="block.content"
        :language="(block as any).language || ''"
        :show-line-numbers="false"
      />
      <div
        v-else-if="block.type === 'html'"
        v-html="block.content"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import { sanitizeMarkdown } from '@/utils/sanitizer';
import CodeBlock from './CodeBlock.vue';

const props = defineProps<{
  content: string;
}>();

interface CodeBlock {
  type: 'code';
  content: string;
  language: string;
}

interface HtmlBlock {
  type: 'html';
  content: string;
}

type ContentBlock = CodeBlock | HtmlBlock;

// Custom renderer that extracts code blocks for separate handling
const renderer = new marked.Renderer();
let codeBlocks: Array<{ code: string; language: string; placeholder: string }> = [];

renderer.code = function(code: string, language: string | undefined) {
  const lang = language || '';
  const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
  codeBlocks.push({ code, language: lang, placeholder });
  return placeholder;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

const parsedBlocks = computed(() => {
  // Reset code blocks for each render
  codeBlocks = [];
  
  try {
    const html = marked.parse(props.content) as string;
    const sanitizedHtml = sanitizeMarkdown(html);
    
    const blocks: ContentBlock[] = [];
    let currentHtml = sanitizedHtml;
    
    // Replace code block placeholders with actual CodeBlock components
    codeBlocks.forEach((codeBlock) => {
      const parts = currentHtml.split(codeBlock.placeholder);
      
      if (parts.length > 1) {
        // Add HTML content before the code block
        if (parts[0].trim()) {
          blocks.push({
            type: 'html',
            content: parts[0]
          });
        }
        
        // Add the code block
        blocks.push({
          type: 'code',
          content: codeBlock.code,
          language: codeBlock.language
        });
        
        // Update currentHtml with remaining content
        currentHtml = parts.slice(1).join(codeBlock.placeholder);
      }
    });
    
    // Add any remaining HTML content
    if (currentHtml.trim()) {
      blocks.push({
        type: 'html',
        content: currentHtml
      });
    }
    
    // If no code blocks were found, return the entire content as HTML
    if (blocks.length === 0) {
      blocks.push({
        type: 'html',
        content: sanitizedHtml
      });
    }
    
    return blocks;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return [{
      type: 'html',
      content: sanitizeMarkdown(props.content)
    }];
  }
});
</script>

<style scoped>
/* Keep existing markdown styles but remove highlight.js import since CodeBlock handles it */
.markdown-content {
  @apply max-w-none;
}

/* Remove any conflicting code styles since CodeBlock handles them */
.markdown-content :deep(pre),
.markdown-content :deep(code) {
  margin: 0;
  padding: 0;
  background: transparent;
}
</style>