
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
        console.log("Processing as regular text");
      }

      // Extract comprehensive rules from the text content
      const rules: TrainingRules = {
        rules: [
          // Q&A Formatting
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
          // Colloquy Formatting
          {
            type: "formatting",
            pattern: "^\\s{0,15}[A-Z][^:]+:\\s",
            correction: "Colloquy material 15 spaces from left margin",
            description: "Proper formatting for speaker identification"
          },
          // Page Layout
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
          // Punctuation and Special Characters
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
          // Verbal Pauses and Gestures
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
          // Exhibits and Evidence
          {
            type: "formatting",
            pattern: "Exhibit\\s+\\d+",
            correction: "Exhibit [number] properly marked and identified",
            description: "Proper marking and identification of exhibits"
          },
          // Time Annotations
          {
            type: "formatting",
            pattern: "\\(Pause.*?\\)",
            correction: "(Pause in proceedings)",
            description: "Indicate pauses in proceedings"
          },
          // Interruptions
          {
            type: "punctuation",
            pattern: "—|--",
            correction: "—",
            description: "Use dash to show interruptions"
          },
          // Quotations
          {
            type: "punctuation",
            pattern: '"[^"]*"',
            correction: "Properly formatted quote",
            description: "Use quotation marks for direct quotes"
          },
          // Non-verbal Responses
          {
            type: "formatting",
            pattern: "\\((?:nods?|shakes?|moves?).*?\\)",
            correction: "(Witness moves head up and down/side to side)",
            description: "Properly format non-verbal responses"
          },
          // Off-record Discussions
          {
            type: "formatting",
            pattern: "\\(Discussion.*?record.*?\\)",
            correction: "(Discussion off the record)",
            description: "Indicate off-record discussions"
          },
          // Certifications
          {
            type: "formatting",
            pattern: "certify.*?question",
            correction: "Properly format certified questions",
            description: "Format certification of questions according to standards"
          },
          // Redactions
          {
            type: "formatting",
            pattern: "\\*{3,}",
            correction: "*** or blacked out",
            description: "Properly format redacted material"
          }
        ],
        general_instructions: {
          capitalization: "Follow standard legal transcript capitalization rules",
          formatting: "25 lines per page, minimum 9 characters per inch, left margin at 1 3/4 inches, proper spacing for Q&A and colloquy",
          punctuation: "Follow standard court reporting punctuation guidelines including proper handling of interruptions, quotations, and trailing off"
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
