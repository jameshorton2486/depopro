
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from './components/layout/Layout';
import Deepgram from './pages/Deepgram';
import TranscriptionComponent from './components/TranscriptionComponent';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TranscriptionComponent />} />
          <Route path="deepgram" element={<Deepgram />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
