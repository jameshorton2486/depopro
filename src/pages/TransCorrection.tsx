
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Book, ClipboardCheck, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const TransCorrection = () => {
  const [originalText, setOriginalText] = useState("");
  const [correctedText, setCorrectedText] = useState("");

  const handleCorrection = () => {
    if (!originalText.trim()) {
      toast.error("Please enter some text to correct");
      return;
    }
    // In a real application, this would call an API to process the text
    toast.info("Processing text...");
    // For now, just copy the text to demonstrate the UI
    setCorrectedText(originalText);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/upload" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </Link>
          <h1 className="text-2xl font-bold">Transcript Correction</h1>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: <Edit className="w-6 h-6" />,
              title: "Smart Correction",
              description: "Intelligent transcript correction with legal standards"
            },
            {
              icon: <Book className="w-6 h-6" />,
              title: "Style Guide",
              description: "Follows court reporting style guidelines"
            },
            {
              icon: <ClipboardCheck className="w-6 h-6" />,
              title: "Quality Check",
              description: "Ensures accuracy and proper formatting"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-primary">{feature.icon}</div>
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Text Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Original Text</label>
            <Textarea
              placeholder="Paste your original transcript here..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              className="min-h-[300px] resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Corrected Text</label>
            <Textarea
              placeholder="Corrected text will appear here..."
              value={correctedText}
              readOnly
              className="min-h-[300px] resize-none bg-muted/50"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleCorrection}
            className="px-8"
            size="lg"
          >
            Correct Transcript
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransCorrection;
