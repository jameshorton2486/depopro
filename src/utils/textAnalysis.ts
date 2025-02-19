
import { type TrainingRules } from '@/services/openai';

export const analyzeText = (text: string): TrainingRules => {
  // First try to parse as JSON
  try {
    const jsonData = JSON.parse(text);
    if (jsonData.entities) {
      return {
        rules: jsonData.entities.map((entity: any) => ({
          type: "entity",
          pattern: entity.name,
          correction: entity.type,
          description: `Found ${entity.type}: ${entity.name}`
        })),
        general_instructions: {
          capitalization: "Maintain proper capitalization for extracted entities",
          formatting: "Preserve original entity formatting",
          punctuation: "Maintain original punctuation around entities"
        }
      };
    }
  } catch (jsonError) {
    console.log("Processing as regular text");
  }

  // Return default empty rules if not JSON
  return {
    rules: [],
    general_instructions: {
      capitalization: "Extract and maintain proper capitalization for entities",
      formatting: "Preserve original entity formatting",
      punctuation: "Maintain original punctuation around entities"
    }
  };
};
