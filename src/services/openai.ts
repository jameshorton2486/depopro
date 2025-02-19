
import { toast } from "sonner";

export type TrainingRule = {
  type: "spelling" | "grammar" | "punctuation" | "formatting";
  pattern: string;
  correction: string;
  description: string;
};

export type TrainingRules = {
  rules: TrainingRule[];
  general_instructions: {
    capitalization: string;
    formatting: string;
    punctuation: string;
  };
};

const DEFAULT_GENERAL_INSTRUCTIONS = {
  capitalization: "Follow standard capitalization rules",
  formatting: "Maintain consistent formatting",
  punctuation: "Use appropriate punctuation"
};

class OpenAIService {
  private static instance: OpenAIService;
  private requestQueue: Promise<any>[] = [];
  private MAX_CONCURRENT_REQUESTS = 3;
  private REQUEST_TIMEOUT = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  private async makeOpenAIRequest(prompt: string): Promise<TrainingRules> {
    console.log(`[${new Date().toISOString()}] Making OpenAI request with prompt length:`, prompt.length);

    // Remove older requests if we exceed the limit
    while (this.requestQueue.length >= this.MAX_CONCURRENT_REQUESTS) {
      this.requestQueue.shift();
    }

    const requestPromise = new Promise<TrainingRules>(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, this.REQUEST_TIMEOUT);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a transcript analysis expert. Analyze the provided text and identify correction patterns. Format your response as a JSON array of rules.`
              },
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const newRules = JSON.parse(data.choices[0].message.content);

        resolve({
          rules: this.validateRules(newRules.rules),
          general_instructions: DEFAULT_GENERAL_INSTRUCTIONS
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });

    this.requestQueue.push(requestPromise);
    return requestPromise;
  }

  private validateRules(rules: TrainingRule[]): TrainingRule[] {
    return rules.filter(rule => {
      const isValid = 
        rule.type && 
        rule.pattern && 
        rule.correction && 
        ['spelling', 'grammar', 'punctuation', 'formatting'].includes(rule.type);
      
      if (!isValid) {
        console.warn('Invalid rule detected:', rule);
      }
      
      return isValid;
    });
  }

  public async generateRulesFromComparison(originalText: string, correctedText: string): Promise<TrainingRules> {
    try {
      return await this.makeOpenAIRequest(
        `Compare these texts and identify correction patterns:\n\nOriginal:\n${originalText}\n\nCorrected:\n${correctedText}`
      );
    } catch (error) {
      console.error('Error generating rules from comparison:', error);
      toast.error('Failed to generate rules from text comparison');
      throw error;
    }
  }

  public async generateRulesFromDocument(documentText: string): Promise<TrainingRules> {
    try {
      return await this.makeOpenAIRequest(
        `Analyze this document and identify correction patterns:\n\n${documentText}`
      );
    } catch (error) {
      console.error('Error generating rules from document:', error);
      toast.error('Failed to generate rules from document');
      throw error;
    }
  }

  public async generateRulesFromSingleText(text: string): Promise<TrainingRules> {
    try {
      return await this.makeOpenAIRequest(
        `Analyze this text and identify potential correction patterns:\n\n${text}`
      );
    } catch (error) {
      console.error('Error generating rules from single text:', error);
      toast.error('Failed to generate rules from text');
      throw error;
    }
  }
}

export const openAIService = OpenAIService.getInstance();
