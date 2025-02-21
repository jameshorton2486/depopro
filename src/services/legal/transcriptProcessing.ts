
import { PUNCTUATION_EXAMPLES } from './punctuationRules';

export const processTranscript = async (text: string, useRules: boolean = false): Promise<string> => {
  let processedText = text;

  if (useRules) {
    // Apply formatting rules based on PUNCTUATION_EXAMPLES
    Object.entries(PUNCTUATION_EXAMPLES).forEach(([type, data]) => {
      data.examples.forEach(example => {
        if (example.incorrect && example.correct) {
          // Replace incorrect patterns with correct ones
          const incorrectPattern = new RegExp(example.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          processedText = processedText.replace(incorrectPattern, example.correct);
        }
      });
    });
  }

  // Basic formatting improvements
  processedText = processedText
    // Fix spacing after periods
    .replace(/\.(?! |\n|$)/g, '. ')
    // Fix spacing after commas
    .replace(/,(?! |\n|$)/g, ', ')
    // Fix multiple spaces
    .replace(/ +/g, ' ')
    // Fix multiple newlines
    .replace(/\n{3,}/g, '\n\n');

  return processedText;
};

// Export everything from the separate files for backwards compatibility
export * from './legalAbbreviations';
export * from './exhibitRules';
export * from './resources';
export * from './punctuationRules';
