
import { TranscriptFormatting } from "@/types/deepgram";

/**
 * Formats transcript text according to standardized rules
 */
export function formatTranscriptText(text: string, options?: TranscriptFormatting): string {
  let formattedText = text;

  // Only process diarization if enabled
  if (options?.enableDiarization) {
    // Fix NaN speaker labels and ensure proper numbering
    let speakerCount = 0;
    const speakerMap = new Map<string, number>();

    // First pass: clean up and standardize speaker labels
    formattedText = formattedText.replace(/\n?Speaker(?:\s+(?:NaN|\d+))(?=:)?/g, (match) => {
      // Extract the entire speaker label
      const speakerLabel = match.trim();
      
      // If we haven't seen this speaker before, assign them a number
      if (!speakerMap.has(speakerLabel)) {
        speakerMap.set(speakerLabel, speakerCount++);
      }
      
      const speakerNumber = speakerMap.get(speakerLabel);
      return `\nSpeaker ${speakerNumber}`;
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

    // Log speaker mapping for debugging
    console.log('Speaker mapping:', Object.fromEntries(speakerMap));
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
