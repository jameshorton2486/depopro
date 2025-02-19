
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type TrainingRules } from '@/services/openai';
import { analyzeText } from '@/utils/textAnalysis';

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
      const rules = analyzeText(text);
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
