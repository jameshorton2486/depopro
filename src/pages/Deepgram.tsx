
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DeepgramPage = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="flex flex-col items-center mb-16 animate-fade-down">
          <div className="text-6xl font-semibold text-center mb-4 text-blue-500">
            Deepgram Integration
          </div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="bg-background border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Deepgram Audio Processing</h2>
            <p className="text-muted-foreground">
              Upload your audio files for advanced speech-to-text transcription using Deepgram's AI technology.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeepgramPage;
