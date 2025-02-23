
/**
 * Formats transcript text according to standardized rules
 */
export function formatTranscriptText(text: string): string {
  let formattedText = text;

  // Remove double spaces at end of sentences
  formattedText = formattedText.replace(/([.?!])\s{2,}(\n|$)/g, '$1\n');

  // Clean up speaker labels formatting
  formattedText = formattedText.replace(/Speaker \d+:\s*\n\n/g, (match) => {
    return match.replace(/\n\n/, '\n');
  });

  // Remove multiple consecutive blank lines
  formattedText = formattedText.replace(/\n{3,}/g, '\n\n');

  // Ensure consistent spacing after punctuation
  formattedText = formattedText.replace(/([.?!])\s{2,}/g, '$1 ');

  // Clean up spacing around speaker labels
  formattedText = formattedText.replace(/\n\s*(Speaker \d+:)\s*/g, '\n$1 ');

  return formattedText;
}

