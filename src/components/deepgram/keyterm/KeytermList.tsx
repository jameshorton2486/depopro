
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Keyterm } from "./KeytermForm";

interface KeytermListProps {
  keyterms: Keyterm[];
  isLoading: boolean;
  onKeytermDeleted: (id: string) => void;
}

export const KeytermList = ({ keyterms, isLoading, onKeytermDeleted }: KeytermListProps) => {
  const handleDeleteKeyterm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('keyterms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onKeytermDeleted(id);
      toast.success("Keyterm deleted successfully");
    } catch (error: any) {
      toast.error(`Error deleting keyterm: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {keyterms.map((term) => (
        <div
          key={term.id}
          className="flex items-center justify-between p-2 rounded-md bg-secondary"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{term.term}</span>
            <span className="text-sm text-muted-foreground">
              (Boost: {term.boost})
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10">
              {term.category}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteKeyterm(term.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
