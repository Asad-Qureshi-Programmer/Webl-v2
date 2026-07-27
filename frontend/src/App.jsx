// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Project from './pages/Project';
import Auth from './pages/Auth';
import './App.css';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-900 text-white font-sans">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Project />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;