
import { formatTranscriptText } from './transcriptFormatting';

export const createAndDownloadWordDoc = (content: string) => {
  // Format the content before creating the document
  const formattedContent = formatTranscriptText(content);
  
  // Create a Blob with the formatted content
  const blob = new Blob([formattedContent], { type: 'application/msword' });
  
  // Create download link
  const element = document.createElement('a');
  element.href = URL.createObjectURL(blob);
  
  // Set filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  element.download = `transcript-${timestamp}.doc`;
  
  // Append to document, trigger download, and cleanup
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

