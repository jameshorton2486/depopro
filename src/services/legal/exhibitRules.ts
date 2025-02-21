
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
