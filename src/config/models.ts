export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  category: string;
  icon: string;
  color: string;
  description?: string;
}

// Map of known Docker Hub models to their display information
const DOCKER_HUB_MODELS: Record<string, Omit<ModelInfo, 'id'>> = {
  'ai/qwen3': {
    name: 'Qwen3',
    provider: 'Alibaba',
    category: 'Qwen',
    icon: 'Q3',
    color: 'bg-purple-600',
    description: 'Latest Qwen model with strong multilingual capabilities'
  },
  'ai/qwen2.5': {
    name: 'Qwen 2.5',
    provider: 'Alibaba',
    category: 'Qwen',
    icon: 'Q2',
    color: 'bg-purple-500',
    description: 'Versatile Qwen update with better language skills'
  },
  'ai/qwq': {
    name: 'QwQ',
    provider: 'Alibaba',
    category: 'Qwen',
    icon: 'QQ',
    color: 'bg-purple-700',
    description: 'Experimental Qwen variant—lean, fast, and mysterious'
  },
  'ai/deepseek-r1-distill-llama': {
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    category: 'DeepSeek',
    icon: 'DS',
    color: 'bg-indigo-600',
    description: 'Distilled LLaMA by DeepSeek, optimized for real-world tasks'
  },
  'ai/mistral': {
    name: 'Mistral',
    provider: 'Mistral AI',
    category: 'Mistral',
    icon: 'M',
    color: 'bg-orange-600',
    description: 'Efficient open model with top-tier performance'
  },
  'ai/mistral-nemo': {
    name: 'Mistral Nemo',
    provider: 'Mistral AI',
    category: 'Mistral',
    icon: 'MN',
    color: 'bg-orange-500',
    description: 'Mistral fine-tuned via NVIDIA NeMo for enterprise use'
  },
  'ai/llama3.3': {
    name: 'LLaMA 3.3',
    provider: 'Meta',
    category: 'Meta',
    icon: 'L3',
    color: 'bg-blue-600',
    description: 'Newest LLaMA 3 with improved reasoning and generation'
  },
  'ai/llama3.2': {
    name: 'LLaMA 3.2',
    provider: 'Meta',
    category: 'Meta',
    icon: 'L2',
    color: 'bg-blue-500',
    description: 'Solid LLaMA 3 update, reliable for coding and chat'
  },
  'ai/llama3.1': {
    name: 'LLaMA 3.1',
    provider: 'Meta',
    category: 'Meta',
    icon: 'L1',
    color: 'bg-blue-400',
    description: 'Chat-focused, benchmark-strong, multilingual-ready'
  },
  'ai/gemma3': {
    name: 'Gemma 3',
    provider: 'Google',
    category: 'Google',
    icon: 'G3',
    color: 'bg-green-600',
    description: 'Google\'s latest Gemma, small yet strong'
  },
  'ai/gemma3-qat': {
    name: 'Gemma 3 QAT',
    provider: 'Google',
    category: 'Google',
    icon: 'GQ',
    color: 'bg-green-500',
    description: 'Quantization-aware trained variant of Gemma 3'
  },
  'ai/phi4': {
    name: 'Phi-4',
    provider: 'Microsoft',
    category: 'Microsoft',
    icon: 'φ4',
    color: 'bg-cyan-600',
    description: 'Microsoft\'s compact model, great at reasoning and code'
  },
  'ai/smollm2': {
    name: 'SmolLM2',
    provider: 'HuggingFace',
    category: 'Community',
    icon: 'S2',
    color: 'bg-yellow-600',
    description: 'Tiny LLM built for speed and edge devices'
  },
  'ai/deepcoder-preview': {
    name: 'DeepCoder Preview',
    provider: 'Community',
    category: 'Community',
    icon: 'DC',
    color: 'bg-gray-600',
    description: 'Specialized coding model in preview'
  },
  'ai/mxbai-embed-large': {
    name: 'MxBai Embed Large',
    provider: 'Community',
    category: 'Community',
    icon: 'MX',
    color: 'bg-pink-600',
    description: 'Large embedding model for semantic search'
  }
};

// Function to get model info from a model ID
export function getModelInfo(modelId: string): ModelInfo | null {
  if (!modelId) return null;
  
  // First, try exact match
  const baseModelId = modelId.split(':')[0];
  if (DOCKER_HUB_MODELS[baseModelId]) {
    return {
      id: modelId,
      ...DOCKER_HUB_MODELS[baseModelId]
    };
  }
  
  // Try to find a match by checking if the modelId contains known model names
  for (const [key, info] of Object.entries(DOCKER_HUB_MODELS)) {
    if (modelId.includes(key.replace('ai/', ''))) {
      return {
        id: modelId,
        ...info
      };
    }
  }
  
  // Default fallback for unknown models
  return {
    id: modelId,
    name: modelId.split('/').pop()?.split(':')[0] || 'Unknown Model',
    provider: 'Unknown',
    category: 'Other',
    icon: '?',
    color: 'bg-gray-500',
    description: 'Custom or unknown model'
  };
}

// Function to get models grouped by category from a list of model IDs
export function getModelsByCategory(modelIds: string[]): Map<string, ModelInfo[]> {
  const categorized = new Map<string, ModelInfo[]>();
  
  for (const modelId of modelIds) {
    const modelInfo = getModelInfo(modelId);
    if (modelInfo) {
      const category = modelInfo.category;
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(modelInfo);
    }
  }
  
  // Sort categories to ensure consistent order
  const sortedCategories = new Map(
    [...categorized.entries()].sort((a, b) => {
      // Define category order
      const order = ['Qwen', 'DeepSeek', 'Mistral', 'Meta', 'Google', 'Microsoft', 'Community', 'Other'];
      const aIndex = order.indexOf(a[0]);
      const bIndex = order.indexOf(b[0]);
      
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
  );
  
  return sortedCategories;
}