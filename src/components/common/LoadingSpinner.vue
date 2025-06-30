<template>
  <div class="flex items-center justify-center p-4">
    <div class="loading-dots flex space-x-1">
      <span class="dot w-2 h-2 bg-blue-600 rounded-full"></span>
      <span class="dot w-2 h-2 bg-blue-600 rounded-full"></span>
      <span class="dot w-2 h-2 bg-blue-600 rounded-full"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for this simple component
</script>

<style scoped>
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.dot {
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0;
}
</style>