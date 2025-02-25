
import { Routes, Route, Outlet } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Deepgram from "@/pages/Deepgram";
import ModelTraining from "@/pages/ModelTraining";

function App() {
  return (
    <Routes>
      <Route element={<Layout><Outlet /></Layout>}>
        <Route path="/" element={
          <div className="space-y-12">
            <Deepgram />
          </div>
        } />
        <Route path="/training" element={<ModelTraining />} />
      </Route>
    </Routes>
  );
}

export default App;
