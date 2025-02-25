
import { Routes, Route, Outlet } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Deepgram from "@/pages/Deepgram";
import ModelTraining from "@/pages/ModelTraining";
import TextComparison from "@/components/upload/TextComparison";
import { useState } from "react";
import { toast } from "sonner";

function App() {
  const [originalText, setOriginalText] = useState("");
  const [correctedText, setCorrectedText] = useState("");

  const handleGenerateRules = () => {
    if (!originalText || !correctedText) {
      toast.error("Please provide both original and corrected text");
      return;
    }
    // Handle rule generation logic here
    toast.success("Rules generated successfully");
  };

  return (
    <Routes>
      <Route element={<Layout><Outlet /></Layout>}>
        <Route path="/" element={
          <div className="space-y-12">
            <Deepgram />
            <div className="border-t pt-12">
              <h2 className="text-3xl font-semibold text-center mb-8 text-blue-500">
                Correct Transcript
              </h2>
              <div className="max-w-6xl mx-auto px-4">
                <TextComparison 
                  originalText={originalText}
                  correctedText={correctedText}
                  onOriginalTextChange={setOriginalText}
                  onCorrectedTextChange={setCorrectedText}
                  onGenerateRules={handleGenerateRules}
                />
              </div>
            </div>
          </div>
        } />
        <Route path="/training" element={<ModelTraining />} />
      </Route>
    </Routes>
  );
}

export default App;
