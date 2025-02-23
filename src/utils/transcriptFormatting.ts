
import { TranscriptFormatting } from "@/types/deepgram";

/**
 * Formats transcript text according to standardized rules
 */
export function formatTranscriptText(text: string, options?: TranscriptFormatting): string {
  let formattedText = text;

  // Always perform basic cleaning
  formattedText = formattedText.replace(/\s+/g, ' ').trim();

  if (options?.removeExtraSpaces) {
    // Remove double spaces at end of sentences
    formattedText = formattedText.replace(/([.?!])\s{2,}(\n|$)/g, '$1\n');
    
    // Remove multiple consecutive blank lines
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
  }

  if (options?.standardizePunctuation) {
    // Ensure consistent spacing after punctuation
    formattedText = formattedText.replace(/([.?!])\s{2,}/g, '$1 ');
    formattedText = formattedText.replace(/([.?!])(?=[A-Z])/g, '$1 ');
  }

  // Clean up and standardize speaker labels
  formattedText = formattedText.replace(/\n?Speaker \d+(?=:)?/g, (match) => {
    // Extract the speaker number
    const number = match.match(/\d+/)[0];
    return `\nSpeaker ${number}:`;
  });

  // Remove extra newlines after speaker labels
  formattedText = formattedText.replace(/Speaker \d+:\s*\n\n/g, 'Speaker $1:\n');

  if (options?.boldSpeakerNames) {
    // Add bold formatting to speaker labels (including the colon)
    formattedText = formattedText.replace(
      /\n?(Speaker \d+:)/g, 
      '\n**$1**'
    );
  }

  if (options?.highlightFillerWords) {
    // Highlight common filler words
    const fillerWords = ['um', 'uh', 'ah', 'er', 'like', 'you know'];
    const fillerRegex = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
    formattedText = formattedText.replace(fillerRegex, '_$1_');
  }

  // Ensure proper spacing around speaker labels (do this last)
  formattedText = formattedText.replace(/\n\s*(Speaker \d+:)\s*/g, '\n$1 ');

  return formattedText;
}
