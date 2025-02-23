
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { DeepgramOptions } from "@/types/deepgram";

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

  return (
    <div className="space-y-4">
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

        <div className="flex items-center space-x-2">
          <Switch
            id="utterances"
            checked={options.utterances}
            onCheckedChange={(checked) => onOptionsChange({ utterances: checked })}
          />
          <Label htmlFor="utterances">Utterances</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keyterm">Key Term or Phrase</Label>
        <Input
          id="keyterm"
          value={options.keyterm || ""}
          onChange={(e) => onOptionsChange({ keyterm: e.target.value })}
          placeholder="Enter a key term or phrase to search for"
        />
      </div>

      <div className="space-y-2">
        <Label>Keywords</Label>
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
