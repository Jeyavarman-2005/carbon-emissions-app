import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InputPage from './pages/InputPage/InputPage';
import supabase from './backend/config/supabase';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Direct routes without any layout or protection */}
          <Route path="/input" element={<InputPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Default route redirects to input page */}
          <Route path="/" element={<Navigate to="/input" replace />} />
          
          {/* 404 fallback redirects to input page */}
          <Route path="*" element={<Navigate to="/input" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;