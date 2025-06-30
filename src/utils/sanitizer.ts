import DOMPurify from 'dompurify';


export function sanitizeMarkdown(markdown: string): string {
  return DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 
                   'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 
                   'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 
                   'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id']
  });
}

export function validateFile(file: File): void {
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Check file extension if MIME type is not recognized
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  
  console.log(`Validating file: ${file.name}, type: ${file.type}, extension: ${fileExtension}`);
  
  // Allow if either MIME type or extension is valid
  const isValidType = ALLOWED_FILE_TYPES.includes(file.type) ||
                      (file.type === '' && ALLOWED_EXTENSIONS.includes(fileExtension));
  
  if (!isValidType && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Invalid file type: ${file.type || 'unknown'} (${fileExtension}). Allowed types: PDF, DOCX, TXT, MD`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
}