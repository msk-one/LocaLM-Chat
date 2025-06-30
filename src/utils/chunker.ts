import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export class DocumentChunker {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });
  }

  async chunkText(text: string): Promise<string[]> {
    return await this.textSplitter.splitText(text);
  }

  async chunkDocument(text: string, metadata?: any): Promise<Array<{
    content: string;
    metadata: any;
  }>> {
    const chunks = await this.textSplitter.createDocuments([text], metadata ? [metadata] : undefined);
    return chunks.map(chunk => ({
      content: chunk.pageContent,
      metadata: chunk.metadata
    }));
  }

  // Get relevant chunks based on a query (simple keyword matching)
  getRelevantChunks(chunks: string[], query: string, maxChunks: number = 3): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Score each chunk based on keyword matches
    const scoredChunks = chunks.map(chunk => {
      const chunkLower = chunk.toLowerCase();
      const score = queryWords.reduce((acc, word) => {
        return acc + (chunkLower.includes(word) ? 1 : 0);
      }, 0);
      return { chunk, score };
    });

    // Sort by score and return top chunks
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks)
      .filter(item => item.score > 0)
      .map(item => item.chunk);
  }
}

export function generateChunkId(documentId: string, index: number): string {
  return `${documentId}-chunk-${index}`;
}