// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait until Clerk resolves session state before deciding to redirect
  if (!isLoaded) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center text-zinc-400">
        Loading session...
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}