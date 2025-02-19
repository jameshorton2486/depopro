
import { type TrainingRules } from '@/services/openai';
import { transcriptionRules, generalInstructions } from '@/config/transcriptionRules';

export const analyzeText = (text: string): TrainingRules => {
  // First try to parse as JSON
  try {
    const jsonData = JSON.parse(text);
    if (jsonData.court_reporting_style_guide) {
      const styleGuide = jsonData.court_reporting_style_guide;
      return {
        rules: [
          {
            type: "punctuation",
            pattern: "\\b(?:Q|A)\\.\\s",
            correction: "Q. or A. with proper spacing",
            description: "Format Q&A with proper spacing"
          },
          {
            type: "punctuation",
            pattern: "(?<=\\w),(?=\\w)",
            correction: ", ",
            description: styleGuide.punctuation_rules?.comma?.series_rule || "Use proper comma spacing"
          }
        ],
        general_instructions: {
          capitalization: "Follow standard legal transcript capitalization rules",
          formatting: styleGuide.formatting_standards?.paragraphs?.speaker_change || "Format speaker changes consistently",
          punctuation: "Follow standard court reporting punctuation guidelines"
        }
      };
    }
  } catch (jsonError) {
    console.log("Processing as regular text");
  }

  // Return default rules if not JSON
  return {
    rules: transcriptionRules,
    general_instructions: generalInstructions
  };
};
