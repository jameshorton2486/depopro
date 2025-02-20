
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CorrectedTextDisplayProps {
  text: string;
}

const CorrectedTextDisplay = ({ text }: CorrectedTextDisplayProps) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Corrected Transcript</h3>
      <div className="p-4 bg-muted rounded-lg">
        <pre className="whitespace-pre-wrap text-sm">{text}</pre>
      </div>
      <div className="flex justify-center mt-4">
        <Button
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
          }}
        >
          Copy to Clipboard
        </Button>
      </div>
    </div>
  );
};

export default CorrectedTextDisplay;
