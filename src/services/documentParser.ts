import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { DocumentChunker } from '@/utils/chunker';
import type { Document } from '@/types';

// Configure PDF.js worker
// Use local worker file to avoid CORS issues
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
if (isElectron) {
  // In Electron, use the file from the dist folder
  pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
} else {
  // In web, use the public path
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// Log the worker configuration
console.log(`PDF.js worker configured: version ${pdfjsLib.version}`, pdfjsLib.GlobalWorkerOptions.workerSrc);

export class DocumentParser {
  private chunker: DocumentChunker;
  
  constructor() {
    this.chunker = new DocumentChunker(1000, 200);
  }
  
  async parseFile(file: File): Promise<string> {
    const fileType = file.type;
    console.log(`Parsing file: ${file.name}, type: ${fileType}, size: ${file.size}`);
    
    try {
      switch (fileType) {
        case 'application/pdf':
          return await this.parsePDF(file);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseDOCX(file);
        case 'text/plain':
        case 'text/markdown':
          return await this.parseText(file);
        default:
          // Try to parse as text if it's a text-like file
          if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            return await this.parseText(file);
          }
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
      throw error;
    }
  }
  
  async parseAndChunkFile(file: File): Promise<{
    content: string;
    chunks: string[];
  }> {
    const content = await this.parseFile(file);
    const chunks = await this.chunker.chunkText(content);
    return { content, chunks };
  }
  
  private async parsePDF(file: File): Promise<string> {
    try {
      console.log(`Starting PDF parsing for: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      console.log(`PDF array buffer size: ${arrayBuffer.byteLength}`);
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded, pages: ${pdf.numPages}`);
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
          console.log(`Parsed page ${i}/${pdf.numPages}`);
        } catch (pageError) {
          console.error(`Error parsing page ${i}:`, pageError);
          // Continue with other pages even if one fails
        }
      }
      
      console.log(`PDF parsing complete, text length: ${fullText.length}`);
      return fullText.trim() || 'Unable to extract text from PDF';
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error?.message || 'Unknown error'}`);
    }
  }
  
  private async parseDOCX(file: File): Promise<string> {
    try {
      console.log(`Starting DOCX parsing for: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      console.log(`DOCX array buffer size: ${arrayBuffer.byteLength}`);
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log(`DOCX parsing complete, text length: ${result.value.length}`);
      
      return result.value || 'Unable to extract text from DOCX';
    } catch (error: any) {
      console.error('DOCX parsing error:', error);
      throw new Error(`Failed to parse DOCX: ${error?.message || 'Unknown error'}`);
    }
  }
  
  private async parseText(file: File): Promise<string> {
    try {
      console.log(`Starting text parsing for: ${file.name}`);
      const text = await file.text();
      console.log(`Text parsing complete, length: ${text.length}`);
      return text || 'Empty file';
    } catch (error: any) {
      console.error('Text parsing error:', error);
      throw new Error(`Failed to parse text file: ${error?.message || 'Unknown error'}`);
    }
  }
  
  createDocument(file: File, content: string, chunks: string[]): Document {
    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      content,
      chunks,
      uploadedAt: new Date()
    };
  }
}

// Singleton instance
export const documentParser = new DocumentParser();