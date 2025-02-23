
import { formatTranscriptText } from './transcriptFormatting';
import { TranscriptFormatting } from '@/types/deepgram';

export const createAndDownloadWordDoc = (content: string, formatting?: TranscriptFormatting) => {
  // Format the content before creating the document
  const formattedContent = formatTranscriptText(content, {
    removeExtraSpaces: true,
    standardizePunctuation: true,
    boldSpeakerNames: true,
    highlightFillerWords: true,
    ...formatting
  });
  
  // Create a Blob with the formatted content
  // Use .doc extension for better compatibility with word processors
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
