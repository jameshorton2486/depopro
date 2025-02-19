
import { useState } from "react";
import { toast } from "sonner";

type SingleTextInputProps = {
  onRulesGenerated: (rules: any) => void;
};

const SingleTextInput = ({ onRulesGenerated }: SingleTextInputProps) => {
  const [singleText, setSingleText] = useState("");

  const generateRulesFromText = async () => {
    if (!singleText) {
      toast.error("Please enter some text first");
      return;
    }

    console.log("Generating rules from single text input");
    
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
              content: `You are a transcript analysis expert. Analyze the text and identify correction patterns. Format your response as a JSON array of rules with the following structure:
              {
                "rules": [
                  {
                    "type": "spelling|grammar|punctuation|formatting",
                    "pattern": "identified pattern",
                    "correction": "how to correct it",
                    "description": "explanation of the rule"
                  }
                ]
              }`
            },
            {
              role: "user",
              content: `Text content:\n${singleText}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const newRules = JSON.parse(data.choices[0].message.content);
      onRulesGenerated(newRules);
      
      setSingleText(""); // Clear the input after successful generation
      toast.success("New rules generated from text");
    } catch (error) {
      console.error("Error generating rules from text:", error);
      toast.error("Failed to generate rules from text");
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Generate Rules from Text</h3>
      <textarea
        className="w-full h-[280px] p-3 border rounded-lg bg-background resize-none"
        placeholder="Paste your text here to generate rules..."
        value={singleText}
        onChange={(e) => setSingleText(e.target.value)}
      />
      <div className="flex justify-end mt-4">
        <button
          onClick={generateRulesFromText}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Generate Rules from Text
        </button>
      </div>
    </div>
  );
};

export default SingleTextInput;
