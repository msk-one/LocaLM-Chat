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

const parsedBlocks = computed(() => {
  // This local array will store code blocks for the current render pass.
  const localCodeBlocks: Array<{ code:string; language: string; placeholder: string }> = [];
  const renderer = new marked.Renderer();

  // Custom renderer that extracts code blocks for separate handling
  renderer.code = function(code: string, language: string | undefined) {
    const lang = language || '';
    const placeholder = `__CODE_BLOCK_${localCodeBlocks.length}__`;
    localCodeBlocks.push({ code, language: lang, placeholder });
    return placeholder;
  };

  // Use a local marked instance to avoid global state modification
  const localMarked = new marked.Marked({
    renderer,
    breaks: true,
    gfm: true,
  });

  try {
    const html = localMarked.parse(props.content) as string;
    const sanitizedHtml = sanitizeMarkdown(html);
    
    const blocks: ContentBlock[] = [];
    let currentHtml = sanitizedHtml;
    
    // Replace code block placeholders with actual CodeBlock components
    localCodeBlocks.forEach((codeBlock) => {
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