
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type KeytermRow = Database['public']['Tables']['keyterms']['Row'];

interface KeytermFormProps {
  onKeytermAdded: (keyterm: Keyterm) => void;
}

export interface Keyterm {
  id: string;
  term: string;
  boost: number;
  category: 'legal' | 'medical' | 'other';
}

export const mapDatabaseRowToKeyterm = (row: KeytermRow): Keyterm => ({
  id: row.id,
  term: row.term,
  boost: Number(row.boost) || 1.5,
  category: row.category as 'legal' | 'medical' | 'other'
});

export const KeytermForm = ({ onKeytermAdded }: KeytermFormProps) => {
  const [newTerm, setNewTerm] = useState("");
  const [newBoost, setNewBoost] = useState("1.5");
  const [category, setCategory] = useState<'legal' | 'medical' | 'other'>('legal');

  const handleAddKeyterm = async () => {
    if (!newTerm.trim()) return;

    try {
      const { data, error } = await supabase
        .from('keyterms')
        .insert({
          term: newTerm.trim(),
          boost: parseFloat(newBoost),
          category
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      const newKeyterm = mapDatabaseRowToKeyterm(data);
      onKeytermAdded(newKeyterm);
      setNewTerm("");
      toast.success("Keyterm added successfully");
    } catch (error: any) {
      toast.error(`Error adding keyterm: ${error.message}`);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Add New Keyterm</Label>
      <div className="flex gap-2">
        <Input
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          placeholder="Enter term"
          className="flex-1"
        />
        <Input
          type="number"
          value={newBoost}
          onChange={(e) => setNewBoost(e.target.value)}
          placeholder="Boost"
          className="w-24"
          min="0.1"
          max="5"
          step="0.1"
        />
        <Select 
          value={category} 
          onValueChange={(value: 'legal' | 'medical' | 'other') => setCategory(value)}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddKeyterm} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
