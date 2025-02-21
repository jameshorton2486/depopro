
export interface PunctuationExample {
  correct?: string;
  incorrect?: string;
  note?: string;
}

export interface PunctuationRule {
  rule: string;
  examples: PunctuationExample[];
}

export type PunctuationExamples = {
  [key: string]: PunctuationRule;
};
