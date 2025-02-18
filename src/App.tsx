
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Upload from '@/pages/Upload';
import Ebook from '@/pages/Ebook';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/ebook" element={<Ebook />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
