
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeytermForm, type Keyterm, mapDatabaseRowToKeyterm } from "./keyterm/KeytermForm";
import { KeytermList } from "./keyterm/KeytermList";
import { DocumentUploader } from "./keyterm/DocumentUploader";

interface KeytermManagementProps {
  onKeytermsChange: (keyterms: Keyterm[]) => void;
}

export const KeytermManagement = ({ onKeytermsChange }: KeytermManagementProps) => {
  const [keyterms, setKeyterms] = useState<Keyterm[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      const mappedKeyterms = (data || []).map(mapDatabaseRowToKeyterm);
      setKeyterms(mappedKeyterms);
      onKeytermsChange(mappedKeyterms);
    } catch (error: any) {
      toast.error(`Error loading keyterms: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeytermAdded = (newKeyterm: Keyterm) => {
    const updatedKeyterms = [...keyterms, newKeyterm];
    setKeyterms(updatedKeyterms);
    onKeytermsChange(updatedKeyterms);
  };

  const handleKeytermDeleted = (id: string) => {
    const updatedKeyterms = keyterms.filter(term => term.id !== id);
    setKeyterms(updatedKeyterms);
    onKeytermsChange(updatedKeyterms);
  };

  const handleTermsExtracted = (newTerms: Keyterm[]) => {
    setKeyterms(prev => [...prev, ...newTerms]);
    onKeytermsChange([...keyterms, ...newTerms]);
  };

  return (
    <div className="space-y-4">
      <KeytermForm onKeytermAdded={handleKeytermAdded} />
      
      <div className="space-y-2">
        <Label>Upload Documents</Label>
        <DocumentUploader onTermsExtracted={handleTermsExtracted} />
      </div>

      <KeytermList 
        keyterms={keyterms}
        isLoading={isLoading}
        onKeytermDeleted={handleKeytermDeleted}
      />
    </div>
  );
};
