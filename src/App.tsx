
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import ModelTraining from '@/pages/ModelTraining';
import Ebook from '@/pages/Ebook';
import TransCorrection from '@/pages/TransCorrection';
import Deepgram from '@/pages/Deepgram';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/model_training" element={<ModelTraining />} />
        <Route path="/ebook" element={<Ebook />} />
        <Route path="/transcorrection" element={<TransCorrection />} />
        <Route path="/deepgram" element={<Deepgram />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
