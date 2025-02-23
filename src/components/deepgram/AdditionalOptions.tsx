
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { DeepgramOptions, DeepgramKeyterm } from "@/types/deepgram";
import { KeytermManagement } from "./KeytermManagement";

interface AdditionalOptionsProps {
  options: DeepgramOptions;
  onOptionsChange: (options: Partial<DeepgramOptions>) => void;
}

export const AdditionalOptions = ({ options, onOptionsChange }: AdditionalOptionsProps) => {
  const [newKeyword, setNewKeyword] = useState("");

  const handleKeywordAdd = () => {
    if (newKeyword.trim()) {
      const updatedKeywords = [...(options.keywords || []), newKeyword.trim()];
      onOptionsChange({ keywords: updatedKeywords });
      setNewKeyword("");
    }
  };

  const handleKeywordRemove = (index: number) => {
    const updatedKeywords = options.keywords?.filter((_, i) => i !== index) || [];
    onOptionsChange({ keywords: updatedKeywords });
  };

  const handleKeytermsChange = (keyterms: DeepgramKeyterm[]) => {
    onOptionsChange({ keyterms });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="diarize"
            checked={options.diarize}
            onCheckedChange={(checked) => onOptionsChange({ diarize: checked })}
          />
          <Label htmlFor="diarize">Speaker Diarization</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="filler-words"
            checked={options.filler_words}
            onCheckedChange={(checked) => onOptionsChange({ filler_words: checked })}
          />
          <Label htmlFor="filler-words">Include Filler Words</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="utterance">Utterance Detection</Label>
        <div className="flex items-center gap-2">
          <Switch
            id="utterances"
            checked={options.utterances}
            onCheckedChange={(checked) => onOptionsChange({ utterances: checked })}
          />
          <Input
            id="utterance"
            type="number"
            min="0"
            max="1"
            step="0.1"
            placeholder="Threshold (0-1)"
            value={options.utteranceThreshold || ""}
            onChange={(e) => onOptionsChange({ 
              utterances: true,
              utteranceThreshold: parseFloat(e.target.value) || 0.5 
            })}
            className="w-32"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Set a threshold between 0 and 1 for utterance detection
        </p>
      </div>

      <div className="space-y-2">
        <Label>Keyterms</Label>
        <KeytermManagement onKeytermsChange={handleKeytermsChange} />
      </div>

      <div className="space-y-2">
        <Label>Additional Keywords</Label>
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add a keyword"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleKeywordAdd();
              }
            }}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={handleKeywordAdd}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {options.keywords && options.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {options.keywords.map((keyword, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md"
              >
                <span className="text-sm">{keyword}</span>
                <button
                  type="button"
                  onClick={() => handleKeywordRemove(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
