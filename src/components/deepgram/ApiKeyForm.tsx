
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ApiKeyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => Promise<void>;
}

export const ApiKeyForm = ({ isOpen, onClose, onSubmit }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(apiKey);
      setApiKey("");
      onClose();
    } catch (error) {
      console.error("Error submitting API key:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Deepgram API Key</DialogTitle>
          <DialogDescription>
            Please enter your Deepgram API key to enable transcription features.
            You can find your API key in the{" "}
            <a
              href="https://console.deepgram.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Deepgram Console
            </a>
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your Deepgram API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Validating..." : "Save Key"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
