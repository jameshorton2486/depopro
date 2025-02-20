
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ModelTraining from '@/pages/ModelTraining';
import Ebook from '@/pages/Ebook';
import TransCorrection from '@/pages/TransCorrection';
import Deepgram from '@/pages/Deepgram';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/deepgram" replace />} />
          <Route path="/model_training" element={<ModelTraining />} />
          <Route path="/ebook" element={<Ebook />} />
          <Route path="/transcorrection" element={<TransCorrection />} />
          <Route path="/deepgram" element={<Deepgram />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;
