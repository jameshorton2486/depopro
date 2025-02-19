
import { useState } from "react";
import { toast } from "sonner";
import FileUploader from "@/components/upload/FileUploader";
import { type TrainingRules } from '@/services/openai';
import { analyzeText } from '@/utils/textAnalysis';

const UploadPage = () => {
  const [trainingRules, setTrainingRules] = useState<TrainingRules | null>(null);

  const handleGenerateRules = async (text: string) => {
    try {
      const rules = analyzeText(text);
      setTrainingRules(rules);
      toast.success("Successfully extracted entities from document");
    } catch (error) {
      console.error("Error generating rules:", error);
      toast.error("Failed to process document");
      throw error;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="flex flex-col items-center mb-16 animate-fade-down">
          <div className="text-6xl font-semibold text-center mb-4 text-blue-500">
            Document Analysis
          </div>
          <p className="text-muted-foreground text-center max-w-2xl">
            Upload Word documents, Google Docs, or text files to extract proper names, 
            company names, and other important entities using AI analysis.
          </p>
        </nav>

        <div className="space-y-8">
          <FileUploader onGenerateRules={handleGenerateRules} />
          
          {trainingRules && (
            <div className="mt-8 p-6 border rounded-lg bg-background">
              <h2 className="text-xl font-semibold mb-4">Extracted Entities</h2>
              <div className="space-y-4">
                {trainingRules.rules.map((rule, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <p className="font-medium">{rule.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Found: {rule.correction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
