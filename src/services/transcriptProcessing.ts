
export const LEGAL_ABBREVIATIONS = {
  A: {
    "aff.": "Affidavit",
    "amend.": "Amendment",
    "app.": "Appendix/Appeal",
    "arg.": "Argument"
  },
  B: {
    "bankr.": "Bankruptcy",
    "br.": "Brief",
    "BIA": "Board of Immigration Appeals"
  },
  C: {
    "CA": "Court of Appeals",
    "cert.": "Certiorari",
    "cf.": "Compare",
    "Ch.": "Chapter",
    "CJ": "Chief Judge/Justice",
    "Cl.": "Clause",
    "Co.": "Company",
    "Comm.": "Commission",
    "comp.": "Compiler",
    "contra": "Contrary authority",
    "Corp.": "Corporation",
    "Crim.": "Criminal"
  },
  // ... add more letters
};

export const EXHIBIT_MARKING_RULES = {
  federal: {
    format: "Sequential numbers (1, 2, 3)",
    multiParty: "Party prefix + number (P1, D1)",
    confidential: "SEALED - prefix",
    digitalNaming: "LASTNAME_EXH_001"
  },
  state: {
    format: "Letters or numbers based on jurisdiction",
    multiParty: "Varies by state",
    confidential: "Check local rules",
    digitalNaming: "Follow court guidelines"
  },
  deposition: {
    format: "Sequential with deponent name",
    multiParty: "Party designations allowed",
    confidential: "CONF prefix required",
    digitalNaming: "DEPONENT_DATE_001"
  }
};

export const RECOMMENDED_RESOURCES = {
  styleGuides: [
    {
      name: "The Gregg Reference Manual",
      description: "Industry standard for punctuation and grammar",
      latest: "11th Edition"
    },
    {
      name: "The Bluebook",
      description: "Legal citation system",
      latest: "21st Edition"
    },
    {
      name: "NCRA's Court Reporter Reference Guide",
      description: "Professional standards and guidelines",
      latest: "2024 Edition"
    }
  ],
  software: [
    {
      name: "CaseCATalyst",
      type: "CAT Software",
      website: "stenograph.com"
    },
    {
      name: "Eclipse",
      type: "CAT Software",
      website: "eclipsecat.com"
    }
  ],
  onlineResources: [
    {
      name: "NCRA Learning Center",
      url: "learning.ncra.org",
      description: "Continuing education and certification"
    },
    {
      name: "Court Reporting Forums",
      url: "courtreportingforums.com",
      description: "Professional community discussions"
    }
  ]
};

export const PUNCTUATION_EXAMPLES = {
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
        correct: "The witness stated, "I saw nothing unusual that night."",
        incorrect: "The witness stated I saw nothing unusual that night"
      }
    ]
  }
};

export const DEPOSITION_EXHIBIT_FLOWCHART = {
  steps: [
    {
      step: 1,
      action: "Identify Exhibit Type",
      options: ["Document", "Physical Object", "Digital Media"]
    },
    {
      step: 2,
      action: "Apply Proper Marking",
      format: {
        documents: "Sequential number/letter + description",
        physical: "Tag or label with exhibit number",
        digital: "Electronic stamp or watermark"
      }
    },
    {
      step: 3,
      action: "Record in Exhibit Log",
      details: [
        "Exhibit number/letter",
        "Brief description",
        "Date marked",
        "Offering party"
      ]
    },
    {
      step: 4,
      action: "Chain of Custody",
      tracking: [
        "Who handled the exhibit",
        "When it was handled",
        "Purpose of handling"
      ]
    }
  ]
};
