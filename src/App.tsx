import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { seedDatabase } from './db/db';

import Landing from './pages/Landing';
import StudentAuth from './pages/student/StudentAuth';
import StudentDashboard from './pages/student/StudentDashboard';
import LearningEnvironment from './pages/student/LearningEnvironment';
import NGODashboard from './pages/ngo/NGODashboard';

export default function App() {
  useEffect(() => {
    // Initialize offline database with default modules
    seedDatabase().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Student App Routes */}
        <Route path="/student" element={<StudentAuth />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/learn/:moduleId" element={<LearningEnvironment />} />
        
        {/* NGO Dashboard Routes */}
        <Route path="/ngo" element={<NGODashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

