
import { UploadIcon, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { type TrainingRule, type TrainingRules } from "@/services/openai";

interface TrainingRulesProps {
  trainingRules: TrainingRules | null;
  onTrainingRulesChange: (rules: TrainingRules | null) => void;
}

const TrainingRulesComponent = ({ trainingRules, onTrainingRulesChange }: TrainingRulesProps) => {
  const handleTrainingRulesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rules = JSON.parse(e.target?.result as string);
        onTrainingRulesChange(rules);
        toast.success("Training rules uploaded successfully");
      } catch (error) {
        console.error("Error parsing training rules:", error);
        toast.error("Error parsing training rules JSON");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Training Rules</label>
        <div className={`p-4 rounded-lg border border-dashed ${
          trainingRules ? 'border-green-500 bg-green-50/10' : 'border-border'
        }`}>
          <div className="flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Training Rules JSON</p>
              <p className="text-sm text-muted-foreground">
                {trainingRules 
                  ? `${trainingRules.rules.length} rules loaded` 
                  : 'Upload a JSON file with training rules'}
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleTrainingRulesUpload}
              className="hidden"
              id="training-rules-upload"
            />
            <label
              htmlFor="training-rules-upload"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground 
                flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <UploadIcon className="w-4 h-4" />
              Upload Rules
            </label>
          </div>
        </div>
      </div>

      {trainingRules && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Loaded Rules</h3>
          <div className="space-y-2">
            {trainingRules.rules.map((rule, index) => (
              <div key={index} className="p-3 rounded-lg bg-secondary/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{rule.type}</p>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      onTrainingRulesChange(trainingRules ? {
                        ...trainingRules,
                        rules: trainingRules.rules.filter((_, i) => i !== index)
                      } : null);
                      toast.info("Rule removed");
                    }}
                    className="p-1 hover:bg-secondary rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-background">
                    <span className="text-muted-foreground">Pattern: </span>
                    {rule.pattern}
                  </div>
                  <div className="p-2 rounded bg-background">
                    <span className="text-muted-foreground">Correction: </span>
                    {rule.correction}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-primary/5 space-y-2">
            <h4 className="font-medium">General Instructions</h4>
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted-foreground">Capitalization: </span>
                {trainingRules.general_instructions.capitalization}</p>
              <p><span className="text-muted-foreground">Formatting: </span>
                {trainingRules.general_instructions.formatting}</p>
              <p><span className="text-muted-foreground">Punctuation: </span>
                {trainingRules.general_instructions.punctuation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingRulesComponent;
