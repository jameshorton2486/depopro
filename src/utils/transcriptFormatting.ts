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

    // First pass: clean up and standardize speaker labels.
    // If the matched label contains "NaN", assign a new number every time.
    // Otherwise, use a mapping to keep the same speaker label across multiple occurrences.
    formattedText = formattedText.replace(/\n?Speaker(?:\s+(?:NaN|\d+))(?=:)?/gi, (match) => {
      const trimmedLabel = match.trim();
      // Check if the label contains "nan" (case-insensitive)
      if (trimmedLabel.toLowerCase().includes("nan")) {
        // Always assign a new number if the label is "NaN"
        return `\nSpeaker ${speakerCount++}:`;
      } else {
        // For valid numbers, assign or reuse the mapping.
        if (!speakerMap.has(trimmedLabel)) {
          speakerMap.set(trimmedLabel, speakerCount++);
        }
        const speakerNumber = speakerMap.get(trimmedLabel);
        return `\nSpeaker ${speakerNumber}:`;
      }
    });

    // Remove extra newlines after speaker labels; capture the label and ensure only one newline
    formattedText = formattedText.replace(/(Speaker \d+:)\s*\n\n/g, '$1\n');

    if (options?.boldSpeakerNames) {
      // Add bold formatting to speaker labels (including the colon)
      formattedText = formattedText.replace(/\n?(Speaker \d+:)/g, '\n**$1**');
    }

    // Ensure proper spacing around speaker labels
    formattedText = formattedText.replace(/\n\s*(Speaker \d+:)\s*/g, '\n$1 ');

    // Log speaker mapping for debugging (only valid for non-NaN speakers)
    console.log('Speaker mapping:', Object.fromEntries(speakerMap));
  }

  // Handle paragraph formatting if enabled
  if (options?.enableParagraphs) {
    // Add an extra line break before bolded speaker labels to separate paragraphs
    formattedText = formattedText.replace(/(\n\*\*Speaker \d+:\*\*)/g, '\n\n$1');
    
    // Ensure consistent paragraph spacing
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
  }

  if (options?.removeExtraSpaces) {
    // Collapse multiple spaces (but preserve newlines)
    formattedText = formattedText.replace(/[ \t]+/g, ' ');
    
    // Remove extra spaces at end of sentences: convert two or more spaces after punctuation into a newline
    formattedText = formattedText.replace(/([.?!])\s{2,}(\n|$)/g, '$1\n');
  }

  if (options?.standardizePunctuation) {
    // Ensure consistent spacing after punctuation
    formattedText = formattedText.replace(/([.?!,;])\s*/g, '$1 ');
    formattedText = formattedText.replace(/\s+([.?!,;])/g, '$1');
    
    // Ensure proper spacing after sentences when the next character is uppercase
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
