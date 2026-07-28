// src/pages/AuthPage.jsx
import React, { useEffect, useState } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';

export default function AuthPage({ initialMode = 'login' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const mode = searchParams.get('mode') || initialMode;

  // Sync user with MongoDB before navigating to dashboard
  useEffect(() => {
    const syncAndNavigate = async () => {
      if (isLoaded && isSignedIn && !isSyncing) {
        try {
          setIsSyncing(true);
          const token = await getToken();
          
          // 1. Ensure user record exists in MongoDB FIRST
          await api.post(
            '/api/users/sync',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // 2. Safely navigate to projects dashboard
          navigate('/projects', { replace: true });
        } catch (err) {
          console.error('Failed to sync user with DB:', err);
          setIsSyncing(false);
        }
      }
    };

    syncAndNavigate();
  }, [isSignedIn, isLoaded, navigate, getToken]);

  if (!isLoaded || isSyncing) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>{isSyncing ? "Synchronizing workspace..." : "Loading session..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] flex flex-col justify-between items-center py-8 px-4 font-sans text-white relative overflow-y-auto">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header / Brand */}
      <div className="z-10 flex flex-col items-center mt-2 mb-4 shrink-0">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group select-none mb-1"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            W
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">WebL</span>
        </div>
        <p className="text-slate-400 text-xs font-medium">Build React Apps with AI</p>
      </div>

      {/* Mode Switcher */}
      <div className="z-10 mb-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 flex gap-1 shadow-inner shrink-0">
        <button
          type="button"
          onClick={() => setSearchParams({ mode: 'login' })}
          className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'login'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ mode: 'signup' })}
          className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'signup'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Clerk Component Container */}
      <div className="z-10 w-full max-w-md flex justify-center my-auto py-4">
        {mode === 'signup' ? (
          <SignUp 
            routing="virtual"
            forceRedirectUrl="/projects"
            fallbackRedirectUrl="/projects"
            appearance={{
              variables: { 
                colorPrimary: '#3b82f6',
                colorBackground: '#0f172a',
                colorText: '#f8fafc',
                colorTextSecondary: '#94a3b8',
                colorInputBackground: '#020617',
                colorInputText: '#ffffff',
              },
              elements: {
                card: 'border border-slate-800/80 shadow-2xl rounded-2xl backdrop-blur-xl max-h-none',
                footerAction: 'hidden',
              }
            }}
          />
        ) : (
          <SignIn 
            routing="virtual"
            forceRedirectUrl="/projects"
            fallbackRedirectUrl="/projects"
            appearance={{
              variables: { 
                colorPrimary: '#3b82f6',
                colorBackground: '#0f172a',
                colorText: '#f8fafc',
                colorTextSecondary: '#94a3b8',
                colorInputBackground: '#020617',
                colorInputText: '#ffffff',
              },
              elements: {
                card: 'border border-slate-800/80 shadow-2xl rounded-2xl backdrop-blur-xl max-h-none',
                footerAction: 'hidden',
              }
            }}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="z-10 text-xs text-slate-500 font-medium pt-4 shrink-0">
        &copy; {new Date().getFullYear()} WebL Studio. All rights reserved.
      </footer>
    </div>
  );
}