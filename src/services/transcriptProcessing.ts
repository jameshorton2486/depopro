
import { openAIService } from "@/services/openai";
import { supabase } from "@/integrations/supabase/client";

export const processTranscript = async (text: string, useRules: boolean = true) => {
  try {
    const rules = useRules ? await openAIService.generateRulesFromSingleText(text) : {
      rules: [
        {
          type: "formatting",
          pattern: "spacing",
          correction: "Ensure proper spacing around punctuation"
        },
        {
          type: "capitalization",
          pattern: "sentence",
          correction: "Capitalize first word of sentences"
        },
        {
          type: "formatting",
          pattern: "linebreaks",
          correction: "Maintain consistent line breaks"
        }
      ]
    };
    
    const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
    let processedText = '';
    let failedChunks = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('process-transcript', {
          body: { text: chunks[i], rules }
        });

        if (error) throw error;
        processedText += data.correctedText + ' ';
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        failedChunks++;
        
        if (failedChunks > 3) {
          throw new Error('Too many chunk processing failures');
        }
        
        processedText += chunks[i] + ' ';
      }
    }

    if (processedText.length < text.length * 0.9) {
      throw new Error('Significant content loss detected during processing');
    }

    return processedText.trim();
  } catch (error) {
    console.error('Error processing transcript:', error);
    throw error;
  }
};
