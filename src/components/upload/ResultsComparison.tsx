
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ResultsComparisonProps {
  originalText: string;
  correctedText?: string;
  status: string;
  onApprove: () => void;
  audioUrl?: string;
  words?: Array<{
    start_time: string;
    end_time: string;
    word: string;
    confidence: number;
  }>;
  currentWordIndex: number;
}

const ResultsComparison = ({
  originalText,
  correctedText,
  status,
  onApprove,
  audioUrl,
  words,
  currentWordIndex
}: ResultsComparisonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-background border rounded-lg p-6 space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Text Comparison</h3>
        {status === 'corrected' && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
              title="Approve changes"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Original Text</h4>
          <div className="p-4 rounded-lg bg-secondary/50 text-sm">
            {words ? (
              <div className="space-y-1">
                {words.map((word, index) => (
                  <span
                    key={index}
                    className={`inline-block mr-1 ${
                      index === currentWordIndex ? 'bg-primary/20' : ''
                    } ${
                      word.confidence < 0.9 ? 'bg-yellow-200/50' : ''
                    }`}
                    title={`Confidence: ${(word.confidence * 100).toFixed(1)}%`}
                  >
                    {word.word}
                  </span>
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{originalText}</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Corrected Text</h4>
          <div className={`p-4 rounded-lg ${status === 'corrected' ? 'bg-primary/5' : 'bg-secondary/50'} text-sm`}>
            <div className="whitespace-pre-wrap">
              {correctedText || 'Waiting for processing...'}
            </div>
          </div>
        </div>
      </div>

      {status === 'pending' && (
        <div className="flex justify-end">
          <button
            onClick={() => toast.info("Processing will start when you click 'Process Files'")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Waiting to process...
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsComparison;
