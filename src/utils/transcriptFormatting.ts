
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
    const prefix = "Speaker ";
    const suffix = ":  ";

    // First pass: clean up and standardize speaker labels
    formattedText = formattedText.replace(/\n?Speaker\s+(NaN|\d+)\s*:/gi, (match, p1) => {
      let speakerNumber;
      if (p1.toLowerCase() === "nan") {
        // For "NaN" labels, assign a new number each time
        speakerNumber = speakerCount++;
      } else {
        // For valid numbers, reuse the same mapping if it exists
        if (!speakerMap.has(p1)) {
          speakerMap.set(p1, speakerCount++);
        }
        speakerNumber = speakerMap.get(p1);
      }
      return `\n${prefix}${speakerNumber}${suffix}`;
    });

    if (options?.boldSpeakerNames) {
      // Add bold formatting to speaker labels
      formattedText = formattedText.replace(/\n?(Speaker \d+:  )/g, '\n**$1**');
    }

    // Debug output: log the speaker mapping
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
