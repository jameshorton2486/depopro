import { useState, useEffect, useCallback } from "react";
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
import { useDropzone } from "react-dropzone";
import { Plus, X, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Keyterm {
  id: string;
  term: string;
  boost: number;
  category: 'legal' | 'medical' | 'other';
}

interface KeytermManagementProps {
  onKeytermsChange: (keyterms: Keyterm[]) => void;
}

export const KeytermManagement = ({ onKeytermsChange }: KeytermManagementProps) => {
  const [keyterms, setKeyterms] = useState<Keyterm[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [newBoost, setNewBoost] = useState("1.5");
  const [category, setCategory] = useState<'legal' | 'medical' | 'other'>('legal');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsAnalyzing(true);
    
    try {
      const text = await file.text();
      
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { text }
      });

      if (error) throw error;

      const { terms } = data;
      
      const { data: insertedTerms, error: insertError } = await supabase
        .from('keyterms')
        .insert(terms.map((t: any) => ({
          term: t.term,
          boost: t.boost,
          category: t.category
        })))
        .select();

      if (insertError) throw insertError;

      setKeyterms(prev => [...prev, ...insertedTerms]);
      onKeytermsChange([...keyterms, ...insertedTerms]);
      toast.success(`Added ${terms.length} terms from document`);
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast.error(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [keyterms, onKeytermsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  useEffect(() => {
    loadKeyterms();
  }, []);

  const loadKeyterms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('keyterms')
        .select('*');

      if (error) throw error;

      setKeyterms(data || []);
      onKeytermsChange(data || []);
    } catch (error: any) {
      toast.error(`Error loading keyterms: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyterm = async () => {
    if (!newTerm.trim()) return;

    try {
      const { data, error } = await supabase
        .from('keyterms')
        .insert([{
          term: newTerm.trim(),
          boost: parseFloat(newBoost),
          category
        }])
        .select()
        .single();

      if (error) throw error;

      setKeyterms([...keyterms, data]);
      onKeytermsChange([...keyterms, data]);
      setNewTerm("");
      toast.success("Keyterm added successfully");
    } catch (error: any) {
      toast.error(`Error adding keyterm: ${error.message}`);
    }
  };

  const handleDeleteKeyterm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('keyterms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedKeyterms = keyterms.filter(term => term.id !== id);
      setKeyterms(updatedKeyterms);
      onKeytermsChange(updatedKeyterms);
      toast.success("Keyterm deleted successfully");
    } catch (error: any) {
      toast.error(`Error deleting keyterm: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
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

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
          ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing document...</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? "Drop the document here..."
                : "Upload a document to extract terms (.txt, .pdf, .docx)"}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
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
      )}
    </div>
  );
};
