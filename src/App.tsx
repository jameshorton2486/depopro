
import { Routes, Route, Outlet } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Deepgram from "@/pages/Deepgram";
import TransCorrection from "@/pages/TransCorrection";
import ModelTraining from "@/pages/ModelTraining";

function App() {
  return (
    <Routes>
      <Route element={<Layout><Outlet /></Layout>}>
        <Route path="/" element={<Deepgram />} />
        <Route path="/correction" element={<TransCorrection />} />
        <Route path="/training" element={<ModelTraining />} />
      </Route>
    </Routes>
  );
}

export default App;
