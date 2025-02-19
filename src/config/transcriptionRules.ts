import { type TrainingRule } from '@/services/openai';

export const transcriptionRules: TrainingRule[] = [
  {
    type: "formatting",
    pattern: "^.{0,8}Q\\.\\s",
    correction: "Q. should be no more than 10 spaces from left margin",
    description: "Q and A designations at left margin OR no more than 5 spaces from left margin"
  },
  {
    type: "formatting",
    pattern: "^.{0,8}A\\.\\s",
    correction: "A. should be no more than 10 spaces from left margin",
    description: "Q and A designations at left margin OR no more than 5 spaces from left margin"
  },
  {
    type: "formatting",
    pattern: "^\\s{0,15}[A-Z][^:]+:\\s",
    correction: "Colloquy material 15 spaces from left margin",
    description: "Proper formatting for speaker identification"
  },
  {
    type: "formatting",
    pattern: "^.{56,}$",
    correction: "55-60 characters per line",
    description: "Left margin at 1 3/4 inches, with minimum 55 characters per line"
  },
  {
    type: "formatting",
    pattern: "^.{1,25}$",
    correction: "25 lines per page",
    description: "Each page should contain 25 lines"
  },
  {
    type: "punctuation",
    pattern: "\\.{3,}",
    correction: "...",
    description: "Use three dots for ellipses to show trailing off"
  },
  {
    type: "formatting",
    pattern: "\\[.*?\\]",
    correction: "[proper annotation]",
    description: "Use brackets for reporter's comments or clarifications"
  },
  {
    type: "grammar",
    pattern: "(?<=\\b)(?:um|uh|er)(?=\\b)",
    correction: "[verbal pause]",
    description: "Handle verbal pauses consistently"
  },
  {
    type: "formatting",
    pattern: "\\(.*?\\)",
    correction: "(parenthetical)",
    description: "Format parentheticals 10 spaces from left margin"
  },
  {
    type: "formatting",
    pattern: "Exhibit\\s+\\d+",
    correction: "Exhibit [number] properly marked and identified",
    description: "Proper marking and identification of exhibits"
  },
  {
    type: "formatting",
    pattern: "\\(Pause.*?\\)",
    correction: "(Pause in proceedings)",
    description: "Indicate pauses in proceedings"
  },
  {
    type: "punctuation",
    pattern: "—|--",
    correction: "—",
    description: "Use dash to show interruptions"
  },
  {
    type: "punctuation",
    pattern: '"[^"]*"',
    correction: "Properly formatted quote",
    description: "Use quotation marks for direct quotes"
  },
  {
    type: "formatting",
    pattern: "\\((?:nods?|shakes?|moves?).*?\\)",
    correction: "(Witness moves head up and down/side to side)",
    description: "Properly format non-verbal responses"
  },
  {
    type: "formatting",
    pattern: "\\(Discussion.*?record.*?\\)",
    correction: "(Discussion off the record)",
    description: "Indicate off-record discussions"
  },
  {
    type: "formatting",
    pattern: "certify.*?question",
    correction: "Properly format certified questions",
    description: "Format certification of questions according to standards"
  },
  {
    type: "formatting",
    pattern: "\\*{3,}",
    correction: "*** or blacked out",
    description: "Properly format redacted material"
  },
  {
    type: "formatting",
    pattern: "Do you solemnly swear|affirm",
    correction: "Standard oath format",
    description: "Proper formatting for administering oaths"
  },
  {
    type: "formatting",
    pattern: "translate from.*?to",
    correction: "Standard interpreter oath format",
    description: "Proper formatting for interpreter oath"
  },
  {
    type: "formatting",
    pattern: "^\\s{5,}\\w+",
    correction: "Carry-over lines begin at 5 spaces from left margin",
    description: "Proper formatting for carry-over lines"
  },
  {
    type: "formatting",
    pattern: "^Page\\s+\\d+$",
    correction: "All pages after title page should be numbered",
    description: "Proper page numbering format"
  },
  {
    type: "formatting",
    pattern: "IN THE.*?COURT",
    correction: "Standard title page format",
    description: "Proper formatting for transcript title page"
  },
  {
    type: "formatting",
    pattern: "I N D E X",
    correction: "Standard index format",
    description: "Proper formatting for transcript index"
  },
  {
    type: "formatting",
    pattern: "REPORTER'S CERTIFICATION",
    correction: "Standard certificate format",
    description: "Proper formatting for reporter's certificate"
  },
  {
    type: "formatting",
    pattern: "Prospective Juror",
    correction: "Standard voir dire format",
    description: "Proper formatting for voir dire proceedings"
  },
  {
    type: "formatting",
    pattern: "ERRATA SHEET",
    correction: "Standard errata sheet format",
    description: "Proper formatting for errata sheet"
  },
  {
    type: "formatting",
    pattern: "THE WITNESS:|THE COURT:",
    correction: "Standard speaker identification format",
    description: "Proper formatting for speaker identification"
  },
  {
    type: "formatting",
    pattern: "^\\s{15}[\"']",
    correction: "Quoted material begins 15 spaces from left margin",
    description: "Proper formatting for quoted material"
  },
  {
    type: "formatting",
    pattern: "\\(Witness.*?\\)",
    correction: "(Witness complies) or (Witness indicates)",
    description: "Proper formatting for witness actions"
  },
  {
    type: "grammar",
    pattern: "\\balright\\b",
    correction: "All right",
    description: "Change 'Alright' to 'All right'"
  },
  {
    type: "formatting",
    pattern: "\\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,\\s*\\d{4})?\\b",
    correction: "Month Day, Year",
    description: "Format dates as 'Month Day, Year' (e.g., July 15, 2024)"
  },
  {
    type: "formatting",
    pattern: "\\b\\d{1,2}:\\d{2}\\s*(?:am|pm|AM|PM)\\b",
    correction: "HH:MM AM/PM",
    description: "Format times in 12-hour format with AM/PM (e.g., 10:04 AM)"
  },
  {
    type: "grammar",
    pattern: "\\bK\\b(?=\\s|$)",
    correction: "Okay",
    description: "Change 'K' at the beginning of a sentence to 'Okay'"
  },
  {
    type: "formatting",
    pattern: "\\bMister\\s+([A-Z][a-z]+)",
    correction: "Mr. $1",
    description: "Change 'Mister' to 'Mr.'"
  },
  {
    type: "formatting",
    pattern: "\\b(?:Misses|Missus)\\s+([A-Z][a-z]+)",
    correction: "Mrs. $1",
    description: "Change 'Misses' or 'Missus' to 'Mrs.'"
  },
  {
    type: "formatting",
    pattern: "\\bMiss\\s+([A-Z][a-z]+)",
    correction: "Ms. $1",
    description: "Change 'Miss' to 'Ms.' unless context indicates otherwise"
  },
  {
    type: "punctuation",
    pattern: "(?<=\\w)\\s+(?=\\w)",
    correction: " ",
    description: "Ensure single space between words"
  },
  {
    type: "punctuation",
    pattern: "\\b(?:LLC|Inc|Ltd)\\b",
    correction: "LLC/Inc./Ltd.",
    description: "Capitalize all letters in business abbreviations"
  },
  {
    type: "punctuation",
    pattern: "(?<=\\w);(?=\\w)",
    correction: "; ",
    description: "Use semicolons to separate independent clauses"
  },
  {
    type: "punctuation",
    pattern: "(?<=\\w):(?=\\w)",
    correction: ": ",
    description: "Use colons to introduce lists or explanations"
  },
  {
    type: "formatting",
    pattern: "\\b(?:[A-Z][a-z]+ )+(?:LLC|Inc|Ltd)\\b",
    correction: "Proper Company Name Format",
    description: "Ensure proper capitalization for company names"
  },
  {
    type: "punctuation",
    pattern: "\\s*--\\s*",
    correction: "—",
    description: "Use em dashes for abrupt changes in thought"
  },
  {
    type: "formatting",
    pattern: "^\\s*Q\\s*\\.",
    correction: "Q.",
    description: "Format Q&A with proper spacing"
  },
  {
    type: "formatting",
    pattern: "^\\s*A\\s*\\.",
    correction: "A.",
    description: "Format Q&A with proper spacing"
  }
];

export const generalInstructions = {
  capitalization: "Follow standard legal transcript capitalization rules. Capitalize the first word of each sentence and all proper nouns.",
  formatting: "Maintain original formatting for speaker labels. Do not add or remove line breaks. Format dates and times consistently.",
  punctuation: "Use proper punctuation marks with correct spacing. Use em dashes for abrupt changes, semicolons for independent clauses, and colons for lists or explanations."
};
