
import { Button } from "@/components/ui/button";

interface FormattingButtonsProps {
  onInitialFormat: () => void;
  onRulesFormat: () => void;
}

const FormattingButtons = ({ onInitialFormat, onRulesFormat }: FormattingButtonsProps) => {
  return (
    <div className="flex justify-center gap-4 mt-4">
      <Button
        onClick={onInitialFormat}
        variant="outline"
      >
        Initial Formatting
      </Button>
      <Button
        onClick={onRulesFormat}
      >
        Rules-Based Formatting
      </Button>
    </div>
  );
};

export default FormattingButtons;
