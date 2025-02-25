
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Keyterm } from "./KeytermForm";

interface DocumentUploaderProps {
  onTermsExtracted: (terms: Keyterm[]) => void;
}

export const DocumentUploader = ({ onTermsExtracted }: DocumentUploaderProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [filesProcessed, setFilesProcessed] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsAnalyzing(true);
    setTotalFiles(acceptedFiles.length);
    setFilesProcessed(0);
    
    try {
      const processedTerms: Keyterm[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
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

        if (insertedTerms) {
          processedTerms.push(...insertedTerms.map(mapDatabaseRowToKeyterm));
        }
        
        setFilesProcessed(i + 1);
        setAnalyzingProgress(((i + 1) / acceptedFiles.length) * 100);
      }

      onTermsExtracted(processedTerms);
      toast.success(`Added terms from ${acceptedFiles.length} document${acceptedFiles.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error('Error analyzing documents:', error);
      toast.error(error.message);
    } finally {
      setIsAnalyzing(false);
      setAnalyzingProgress(0);
      setFilesProcessed(0);
      setTotalFiles(0);
    }
  }, [onTermsExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing documents... ({filesProcessed}/{totalFiles})</span>
            </div>
            <Progress value={analyzingProgress} className="w-64 mx-auto" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Drop the documents here..."
              : "Upload documents to extract terms (.txt, .pdf, .docx)"}
          </p>
        )}
      </div>
    </div>
  );
};
