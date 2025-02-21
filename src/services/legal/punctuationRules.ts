
import type { PunctuationExamples } from './types';

export const PUNCTUATION_EXAMPLES: PunctuationExamples = {
  period: {
    rule: "Use periods to end complete statements and mark abbreviations.",
    examples: [
      {
        correct: "The witness entered the courtroom. She was sworn in.",
        incorrect: "The witness entered the courtroom She was sworn in"
      }
    ]
  },
  comma: {
    rule: "Use commas to separate elements in a series and set off nonessential clauses.",
    examples: [
      {
        correct: "The evidence included a gun, a knife, and DNA samples.",
        incorrect: "The evidence included a gun a knife and DNA samples"
      }
    ]
  },
  semicolon: {
    rule: "Use semicolons to join related independent clauses.",
    examples: [
      {
        correct: "The witness testified for three hours; the jury remained attentive.",
        incorrect: "The witness testified for three hours, the jury remained attentive"
      }
    ]
  },
  colon: {
    rule: "Use colons to introduce lists or explanations.",
    examples: [
      {
        correct: "The following items were entered into evidence: the murder weapon, surveillance footage, and DNA results.",
        incorrect: "The following items were entered into evidence, the murder weapon, surveillance footage, and DNA results"
      }
    ]
  },
  dash: {
    rule: "Use em dashes to indicate interruptions or abrupt changes.",
    examples: [
      {
        correct: "I saw the defendant—",
        note: "Speaker interrupted"
      }
    ]
  },
  quotes: {
    rule: "Use quotation marks for direct speech and quoted material.",
    examples: [
      {
        correct: "The witness stated, \"I saw nothing unusual that night.\"",
        incorrect: "The witness stated I saw nothing unusual that night"
      }
    ]
  }
};
