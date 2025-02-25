
import { TranscriptFormatting, DeepgramParagraph } from "@/types/deepgram";

export function formatTranscriptText(
  text: string, 
  options?: TranscriptFormatting,
  paragraphs?: DeepgramParagraph[]
): string {
  let formattedText = text;

  // Only process diarization if enabled and paragraphs data is available
  if (paragraphs?.length) {
    // Create a map to assign sequential numbers starting from 0
    const speakerMap = new Map<number, number>();
    let nextSpeakerNumber = 0;

    // Build a formatted version using the paragraphs data
    formattedText = paragraphs.map(paragraph => {
      // Handle undefined speaker numbers
      const validSpeaker = isNaN(paragraph.speaker) ? 0 : paragraph.speaker;
      
      // Get or assign a sequential number for this speaker
      if (!speakerMap.has(validSpeaker)) {
        speakerMap.set(validSpeaker, nextSpeakerNumber++);
      }
      const speakerNumber = speakerMap.get(validSpeaker) ?? 0;
      
      // Format speaker label and content
      const speakerLabel = `Speaker ${speakerNumber}:`;
      const content = paragraph.sentences.map(s => s.text).join(' ').trim();
      
      return `\n${speakerLabel} ${content}`;
    }).join('\n');
  }

  if (options?.removeExtraSpaces) {
    // Collapse multiple spaces (but preserve newlines)
    formattedText = formattedText.replace(/[ \t]+/g, ' ');
    formattedText = formattedText.replace(/([.?!])\s{2,}(\n|$)/g, '$1\n');
  }

  if (options?.standardizePunctuation) {
    // Ensure consistent spacing after punctuation
    formattedText = formattedText.replace(/([.?!,;])\s*/g, '$1 ');
    formattedText = formattedText.replace(/\s+([.?!,;])/g, '$1');
    formattedText = formattedText.replace(/([.?!])\s*(?=[A-Z])/g, '$1 ');
  }

  // Final cleanup
  formattedText = formattedText.trim();
  
  // Ensure document starts with a newline if it begins with a speaker label
  if (formattedText.startsWith('Speaker')) {
    formattedText = '\n' + formattedText;
  }

  return formattedText;
}
