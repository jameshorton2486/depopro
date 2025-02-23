
import { TranscriptFormatting } from "@/types/deepgram";

/**
 * Formats transcript text according to standardized rules
 */
export function formatTranscriptText(text: string, options?: TranscriptFormatting): string {
  let formattedText = text;

  // Only process diarization if enabled
  if (options?.enableDiarization) {
    // Clean up and standardize speaker labels
    formattedText = formattedText.replace(/\n?Speaker \d+(?=:)?/g, (match) => {
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

    // Ensure proper spacing around speaker labels
    formattedText = formattedText.replace(/\n\s*(Speaker \d+:)\s*/g, '\n$1 ');
  }

  // Handle paragraph formatting if enabled
  if (options?.enableParagraphs) {
    // Add line breaks between different speakers
    formattedText = formattedText.replace(/(\n\*\*Speaker \d+:\*\*)/g, '\n\n$1');
    
    // Ensure consistent paragraph spacing
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
  }

  if (options?.removeExtraSpaces) {
    // Remove multiple spaces
    formattedText = formattedText.replace(/\s+/g, ' ');
    
    // Remove double spaces at end of sentences
    formattedText = formattedText.replace(/([.?!])\s{2,}(\n|$)/g, '$1\n');
  }

  if (options?.standardizePunctuation) {
    // Ensure consistent spacing after punctuation
    formattedText = formattedText.replace(/([.?!,;])\s*/g, '$1 ');
    formattedText = formattedText.replace(/\s+([.?!,;])/g, '$1');
    
    // Ensure proper spacing after sentences
    formattedText = formattedText.replace(/([.?!])\s*(?=[A-Z])/g, '$1 ');
  }

  if (options?.highlightFillerWords) {
    // Highlight common filler words
    const fillerWords = ['um', 'uh', 'ah', 'er', 'like', 'you know'];
    const fillerRegex = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
    formattedText = formattedText.replace(fillerRegex, '_$1_');
  }

  // Final cleanup
  formattedText = formattedText.trim();
  
  // Ensure document starts with a newline if it begins with a speaker
  if (formattedText.startsWith('Speaker') || formattedText.startsWith('**Speaker')) {
    formattedText = '\n' + formattedText;
  }

  return formattedText;
}
