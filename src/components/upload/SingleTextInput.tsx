
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
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
                correction: "Q./A. with proper spacing",
                description: "Format Q&A with proper spacing"
              },
              {
                type: "punctuation",
                pattern: "(?<=\\w),(?=\\w)",
                correction: ", ",
                description: styleGuide.punctuation_rules.comma.series_rule
              },
              {
                type: "formatting",
                pattern: "\\d{1,2}:\\d{2}(?::\\d{2})?",
                correction: "HH:MM:SS",
                description: styleGuide.core_principles.timestamp_format
              },
              {
                type: "formatting",
                pattern: "\\b[A-Z][a-z]+ [A-Z][a-z]+\\b",
                correction: "[FULL_NAME]",
                description: styleGuide.core_principles.speaker_identification
              },
              {
                type: "punctuation",
                pattern: "\\.{3,}",
                correction: "...",
                description: styleGuide.punctuation_rules.ellipses.pause_indication
              },
              {
                type: "formatting",
                pattern: "\\[(?:inaudible|crosstalk|pause)\\]",
                correction: "[proper_annotation]",
                description: styleGuide.punctuation_rules.brackets.non_verbal
              },
              {
                type: "spelling",
                pattern: "\\d+(?:st|nd|rd|th)",
                correction: "[ordinal]",
                description: styleGuide.formatting_standards.numerical_formatting.general_rule
              },
              {
                type: "grammar",
                pattern: "(?<=\\b)(?:um|uh|er)(?=\\b)",
                correction: "[verbal_pause]",
                description: styleGuide.core_principles.verbatim_accuracy
              }
            ],
            general_instructions: {
              capitalization: "Follow standard legal transcript capitalization rules",
              formatting: styleGuide.formatting_standards.paragraphs.speaker_change,
              punctuation: "Follow standard court reporting punctuation guidelines"
            }
          };
          onRulesGenerated(newRules);
          setText('');
          return;
        }
      } catch (jsonError) {
        // Not valid JSON, continue with regular text analysis
        console.log("Not a valid court reporting JSON, processing as regular text");
      }
      
      // Process as regular text if not court reporting JSON
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }
      
      const rules = await response.json();
      onRulesGenerated(rules);
      setText('');
    } catch (error) {
      console.error('Error in text analysis:', error);
      throw error;
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
