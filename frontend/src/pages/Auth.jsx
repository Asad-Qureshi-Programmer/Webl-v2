// src/pages/Auth.jsx
import React, { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth, useUser } from '@clerk/clerk-react';

export default function Auth() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGetToken = async () => {
    try {
      const jwt = await getToken();
      setToken(jwt || '');
    } catch (err) {
      console.error("Failed to fetch token:", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Bearer ${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <h1 className="text-3xl font-black mb-2 tracking-tight text-white">WebL Auth</h1>
        <p className="text-sm text-slate-400 mb-8">Sign in to generate JWT token for Postman</p>

        <SignedOut>
          <div className="flex flex-col gap-4">
            <SignInButton mode="modal">
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 rounded-xl transition-all">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <UserButton afterSignOutUrl="/auth" />
            </div>

            <p className="text-xs text-slate-400 font-medium mb-6">
              Logged in as: <span className="text-blue-400 font-bold">{user?.primaryEmailAddress?.emailAddress}</span>
            </p>

            <button 
              onClick={handleGetToken}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all mb-4 shadow-lg shadow-emerald-900/20"
            >
              🔑 Generate Postman Token
            </button>

            {token && (
              <div className="w-full mt-4 text-left">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Postman Authorization Header Value:
                </label>
                <textarea 
                  readOnly 
                  rows={4} 
                  value={`Bearer ${token}`}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none break-all resize-none"
                />
                <button 
                  onClick={handleCopy}
                  className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-lg transition-colors border border-slate-700"
                >
                  {copied ? '✅ Copied to Clipboard!' : '📋 Copy Bearer Token'}
                </button>
              </div>
            )}
          </div>
        </SignedIn>
      </div>
    </div>
  );
}