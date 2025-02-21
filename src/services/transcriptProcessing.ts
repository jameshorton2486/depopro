
import { PUNCTUATION_EXAMPLES } from './legal/punctuationRules';
import type { PunctuationExamples } from './legal/types';

export const processTranscript = async (text: string, useRules: boolean = false): Promise<string> => {
  let processedText = text;

  if (useRules) {
    Object.entries(PUNCTUATION_EXAMPLES as PunctuationExamples).forEach(([type, data]) => {
      data.examples.forEach(example => {
        if (example.incorrect && example.correct) {
          const incorrectPattern = new RegExp(example.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          processedText = processedText.replace(incorrectPattern, example.correct);
        }
      });
    });
  }

  // Basic formatting improvements
  processedText = processedText
    .replace(/\.(?! |\n|$)/g, '. ')
    .replace(/,(?! |\n|$)/g, ', ')
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  return processedText;
};

// Re-export everything from the legal services
export * from './legal/legalAbbreviations';
export * from './legal/exhibitRules';
export * from './legal/resources';
export * from './legal/punctuationRules';
export * from './legal/types';
