// src/components/Header.jsx or inside your Landing Page / App Navbar
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-slate-900 text-white">
      <h1 className="text-xl font-bold">WebL</h1>
      
      <div>
        {/* Shown when user is logged out */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium">
              Sign In / Register
            </button>
          </SignInButton>
        </SignedOut>

        {/* Shown when user is logged in */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}