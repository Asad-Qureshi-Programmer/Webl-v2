// src/pages/Landing.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  return (
    <div className="h-full w-full overflow-y-auto bg-zinc-950 text-white font-sans flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="h-20 border-b border-zinc-800/80 px-8 flex items-center justify-between max-w-7xl w-full mx-auto shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/30">
            W
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">WebL</span>
        </div>

        <div className="flex items-center gap-4">
          {token ? (
            <Link
              to="/projects"
              className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-lg shadow-blue-600/30"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth?mode=login"
                className="px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-lg shadow-blue-600/30 active:scale-95"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-blue-400 font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          AI-Powered Full-Stack Web Builder
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Turn Prompts Into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
            Live React Applications
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-normal">
          Describe your application concept, hit generate, and watch WebL build production React apps with Monaco Editor live previews and auto-saving.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            to={token ? "/projects" : "/auth?mode=signup"}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base transition-all shadow-xl shadow-blue-600/25 active:scale-95 text-center"
          >
            Start Building Free
          </Link>
          {!token && (
            <Link
              to="/auth?mode=login"
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold rounded-xl text-base transition-all active:scale-95 text-center"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left">
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-bold mb-4">⚡</div>
            <h3 className="font-bold text-lg text-white mb-2">Live Generation</h3>
            <p className="text-zinc-400 text-sm">Full React component structures generated dynamically from natural prompts.</p>
          </div>
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center font-bold mb-4">🛠️</div>
            <h3 className="font-bold text-lg text-white mb-2">Monaco Sandbox</h3>
            <p className="text-zinc-400 text-sm">Edit code live with auto-debounced database saving and error fallback previewing.</p>
          </div>
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
            <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center font-bold mb-4">🎯</div>
            <h3 className="font-bold text-lg text-white mb-2">Incremental Patching</h3>
            <p className="text-zinc-400 text-sm">Update specific pages or components without overwriting existing files in your project.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 shrink-0">
        &copy; {new Date().getFullYear()} WebL Studio. All rights reserved.
      </footer>
    </div>
  );
}