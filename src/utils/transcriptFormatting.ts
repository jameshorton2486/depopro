
import { TranscriptFormatting } from "@/types/deepgram";

/**
 * Formats transcript text according to standardized rules
 */
export function formatTranscriptText(text: string, options?: TranscriptFormatting): string {
  let formattedText = text;

  // Only process diarization if enabled
  if (options?.enableDiarization) {
    let speakerCount = 0;
    const speakerMap = new Map<string, number>();

    // First pass: clean up and standardize speaker labels.
    // Add two spaces after colon and ensure consistent numbering
    formattedText = formattedText.replace(/\n?Speaker(?:\s+(?:NaN|\d+))(?=:)?/gi, (match) => {
      const trimmedLabel = match.trim();
      
      // Check if the label contains "nan" (case-insensitive)
      if (trimmedLabel.toLowerCase().includes("nan")) {
        // Always assign a new number if the label is "NaN"
        return `\nSpeaker ${speakerCount++}:  `; // Note the two spaces after colon
      } else {
        // For valid numbers, maintain consistent numbering
        if (!speakerMap.has(trimmedLabel)) {
          speakerMap.set(trimmedLabel, speakerCount++);
        }
        const speakerNumber = speakerMap.get(trimmedLabel);
        return `\nSpeaker ${speakerNumber}:  `; // Note the two spaces after colon
      }
    });

    // Ensure single newline after each speaker label
    formattedText = formattedText.replace(/(Speaker \d+:  )\s*\n+/g, '$1');

    if (options?.boldSpeakerNames) {
      // Add bold formatting to speaker labels (including the colon and spaces)
      formattedText = formattedText.replace(/\n?(Speaker \d+:  )/g, '\n**$1**');
    }

    // Ensure proper spacing around speaker labels and their text
    formattedText = formattedText.replace(/\n\s*(Speaker \d+:  )\s*/g, '\n$1');

    // Log speaker mapping for debugging (only valid for non-NaN speakers)
    console.log('Speaker mapping:', Object.fromEntries(speakerMap));
  }

  // Handle paragraph formatting if enabled
  if (options?.enableParagraphs) {
    // Add an extra line break before new speakers to separate paragraphs
    formattedText = formattedText.replace(/(\n\*\*Speaker \d+:  \*\*)/g, '\n\n$1');
    
    // Ensure consistent paragraph spacing
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
  }

  if (options?.removeExtraSpaces) {
    // Collapse multiple spaces (but preserve newlines)
    formattedText = formattedText.replace(/[ \t]+/g, ' ');
    
    // Remove extra spaces at end of sentences
    formattedText = formattedText.replace(/([.?!])\s{2,}(\n|$)/g, '$1\n');
  }

  if (options?.standardizePunctuation) {
    // Ensure consistent spacing after punctuation
    formattedText = formattedText.replace(/([.?!,;])\s*/g, '$1 ');
    formattedText = formattedText.replace(/\s+([.?!,;])/g, '$1');
    
    // Ensure proper spacing after sentences when next character is uppercase
    formattedText = formattedText.replace(/([.?!])\s*(?=[A-Z])/g, '$1 ');
  }

  if (options?.highlightFillerWords) {
    // Highlight common filler words by wrapping them in underscores
    const fillerWords = ['um', 'uh', 'ah', 'er', 'like', 'you know'];
    const fillerRegex = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
    formattedText = formattedText.replace(fillerRegex, '_$1_');
  }

  // Final cleanup: trim any leading/trailing whitespace
  formattedText = formattedText.trim();
  
  // Ensure document starts with a newline if it begins with a speaker label
  if (formattedText.startsWith('Speaker') || formattedText.startsWith('**Speaker')) {
    formattedText = '\n' + formattedText;
  }

  return formattedText;
}

