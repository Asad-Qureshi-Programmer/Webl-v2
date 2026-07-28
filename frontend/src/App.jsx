// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ProjectsDashboard from './pages/ProjectsDashboard';
import Project from './pages/Project';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import AuthPage from './pages/AuthPage.jsx';

function App() {
  return (
    <div className="w-screen h-screen overflow-auto bg-gray-900 text-white font-sans">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes (Require JWT Token) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<ProjectsDashboard />} />
            <Route path="/project/:id" element={<Project />} />
            <Route path="/project" element={<Project />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;