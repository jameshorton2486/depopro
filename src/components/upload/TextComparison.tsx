
import { toast } from "sonner";

type TextComparisonProps = {
  originalText: string;
  correctedText: string;
  onOriginalTextChange: (text: string) => void;
  onCorrectedTextChange: (text: string) => void;
  onGenerateRules: () => void;
};

const TextComparison = ({
  originalText,
  correctedText,
  onOriginalTextChange,
  onCorrectedTextChange,
  onGenerateRules
}: TextComparisonProps) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Original Text</h3>
          <textarea
            className="w-full h-[280px] p-3 border rounded-lg bg-background resize-none"
            placeholder="Paste the original incorrect text here..."
            value={originalText}
            onChange={(e) => onOriginalTextChange(e.target.value)}
          />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Corrected Text</h3>
          <textarea
            className="w-full h-[280px] p-3 border rounded-lg bg-background resize-none"
            placeholder="Paste the corrected version here..."
            value={correctedText}
            onChange={(e) => onCorrectedTextChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={onGenerateRules}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Generate Rules from Text
        </button>
      </div>
    </div>
  );
};

export default TextComparison;
