
import { TranscriptFormatting, DeepgramParagraph } from "@/types/deepgram";

/**
 * Formats transcript text according to standardized rules
 */
export function formatTranscriptText(
  text: string, 
  options?: TranscriptFormatting,
  paragraphs?: DeepgramParagraph[]
): string {
  let formattedText = text;

  // Only process diarization if enabled and paragraphs data is available
  if (options?.enableDiarization && paragraphs?.length) {
    // Build a formatted version using the paragraphs data
    formattedText = paragraphs.map(paragraph => {
      const speakerLabel = `Speaker ${paragraph.speaker}:  `;
      const content = paragraph.sentences.map(s => s.text).join(' ').trim();
      return options?.boldSpeakerNames 
        ? `\n**${speakerLabel}**${content}`
        : `\n${speakerLabel}${content}`;
    }).join('\n');

    // Log paragraph data for debugging
    console.log('Processing paragraphs:', paragraphs.map(p => ({ 
      speaker: p.speaker,
      sentenceCount: p.sentences.length
    })));
  } else {
    // Fallback to regex-based formatting if no paragraph data
    let speakerCount = 0;
    const speakerMap = new Map<string, number>();

    formattedText = formattedText.replace(
      /\n?Speaker\s+(NaN|\d+)\s*:(.*?)(?=\n?Speaker|\n?$)/gi,
      (match, p1, content) => {
        let speakerNumber;
        if (p1.toLowerCase() === "nan") {
          speakerNumber = speakerCount++;
        } else {
          if (!speakerMap.has(p1)) {
            speakerMap.set(p1, speakerCount++);
          }
          speakerNumber = speakerMap.get(p1);
        }
        const speakerLabel = `Speaker ${speakerNumber}:  `;
        return options?.boldSpeakerNames
          ? `\n**${speakerLabel}**${content.trim()}`
          : `\n${speakerLabel}${content.trim()}`;
      }
    );

    // Log fallback processing
    console.log('Using fallback speaker mapping:', Object.fromEntries(speakerMap));
  }

  // Handle paragraph formatting if enabled
  if (options?.enableParagraphs) {
    // Add an extra line break before new speakers to separate paragraphs
    formattedText = formattedText.replace(/(\n\*\*?Speaker \d+:  \*?\*?)/g, '\n\n$1');
    
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
