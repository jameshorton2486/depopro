
import { useState } from "react";
import { toast } from "sonner";
import { openAIService, type TrainingRules } from "@/services/openai";

type SingleTextInputProps = {
  onRulesGenerated: (rules: TrainingRules) => void;
};

const SingleTextInput = ({ onRulesGenerated }: SingleTextInputProps) => {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRules = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text first");
      return;
    }

    setIsGenerating(true);
    try {
      const newRules = await openAIService.generateRulesFromSingleText(text);
      onRulesGenerated(newRules);
      setText("");
      toast.success("New rules generated from text");
    } catch (error) {
      // Error already handled by the service
      console.error("Error in single text flow:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Single Text Analysis</h3>
      <textarea
        className="w-full h-[200px] p-3 border rounded-lg bg-background resize-none"
        placeholder="Enter text to analyze..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end">
        <button
          onClick={handleGenerateRules}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating..." : "Generate Rules from Text"}
        </button>
      </div>
    </div>
  );
};

export default SingleTextInput;
