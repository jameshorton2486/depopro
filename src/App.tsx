
import { Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Deepgram from "@/pages/Deepgram";
import Ebook from "@/pages/Ebook";
import TransCorrection from "@/pages/TransCorrection";
import ModelTraining from "@/pages/ModelTraining";
import Auth from "@/pages/Auth";

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Deepgram />} />
        <Route path="/ebook" element={<Ebook />} />
        <Route path="/correction" element={<TransCorrection />} />
        <Route path="/training" element={<ModelTraining />} />
      </Route>
    </Routes>
  );
}

export default App;
