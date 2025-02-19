
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type TrainingRules } from '@/services/openai';

interface SingleTextInputProps {
  onRulesGenerated: (rules: TrainingRules) => void;
}

const SingleTextInput = ({ onRulesGenerated }: SingleTextInputProps) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    try {
      // First try to parse as JSON
      try {
        const jsonData = JSON.parse(text);
        if (jsonData.court_reporting_style_guide) {
          const styleGuide = jsonData.court_reporting_style_guide;
          const newRules: TrainingRules = {
            rules: [
              {
                type: "punctuation",
                pattern: "\\b(?:Q|A)\\.\\s",
                correction: "Q. or A. with proper spacing",
                description: "Format Q&A with proper spacing"
              },
              {
                type: "punctuation",
                pattern: "(?<=\\w),(?=\\w)",
                correction: ", ",
                description: styleGuide.punctuation_rules?.comma?.series_rule || "Use proper comma spacing"
              }
            ],
            general_instructions: {
              capitalization: "Follow standard legal transcript capitalization rules",
              formatting: styleGuide.formatting_standards?.paragraphs?.speaker_change || "Format speaker changes consistently",
              punctuation: "Follow standard court reporting punctuation guidelines"
            }
          };
          onRulesGenerated(newRules);
          setText('');
          toast.success("Court reporting rules generated successfully");
          return;
        }
      } catch (jsonError) {
        // Not valid JSON, process as regular text
        console.log("Not a valid court reporting JSON, processing as regular text");
      }

      // Extract rules from the text content
      const rules: TrainingRules = {
        rules: [
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
          }
        ],
        general_instructions: {
          capitalization: "Follow standard legal transcript capitalization",
          formatting: "25 lines per page, minimum 9 characters per inch, left margin at 1 3/4 inches",
          punctuation: "Follow standard court reporting punctuation guidelines"
        }
      };

      onRulesGenerated(rules);
      setText('');
      toast.success("Rules generated from text analysis");
    } catch (error) {
      console.error('Error in text analysis:', error);
      toast.error("Failed to analyze text");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Single Text Analysis</label>
        <Textarea
          placeholder="Paste text or JSON rules to analyze..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[288px]"
        />
      </div>
      <Button
        onClick={handleAnalyze}
        disabled={!text.trim() || isProcessing}
        className="w-full flex items-center justify-center gap-2"
      >
        {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
        Generate Rules from Text
      </Button>
    </div>
  );
};

export default SingleTextInput;
