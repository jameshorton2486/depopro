
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

    // First pass: clean up and standardize speaker labels
    formattedText = formattedText.replace(/\n?Speaker(?:\s+(?:NaN|\d+))(?:\s*:)(?:\s*[^]*?)(?=\n?Speaker|\n?$)/gi, (match) => {
      const labelMatch = match.match(/Speaker\s+(?:NaN|\d+)/i);
      const label = labelMatch ? labelMatch[0].trim() : '';
      const content = match.slice(label.length).trim();
      
      // Ensure we have a valid speaker number
      let speakerNumber: number;
      if (!speakerMap.has(label)) {
        speakerNumber = speakerCount++;
        speakerMap.set(label, speakerNumber);
      } else {
        speakerNumber = speakerMap.get(label)!;
      }

      // Format with exactly two spaces after the colon
      return `\nSpeaker ${speakerNumber}:  ${content}`;
    });

    if (options?.boldSpeakerNames) {
      // Add bold formatting to speaker labels (including the colon and spaces)
      formattedText = formattedText.replace(/\n?(Speaker \d+:  )/g, '\n**$1**');
    }

    // Ensure proper spacing around speaker labels and their text
    formattedText = formattedText.replace(/\n\s*(Speaker \d+:  )\s*/g, '\n$1');

    // Log speaker mappings for debugging
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
