// src/pages/ProjectsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';
import { api } from '../api/axios';

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Project Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // Fetch projects on mount or when Clerk authentication becomes ready
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');

      const token = await getToken();
      const res = await api.get('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProjects(Array.isArray(res.data) ? res.data : res.data.projects || []);
    } catch (err) {
      // 🚀 Auto-Recovery: If 401 occurs, attempt user sync fallback once and retry
      if (err.response?.status === 401) {
        try {
          console.warn("[WebL] 401 received — initiating auto-sync recovery...");
          const token = await getToken();
          await api.post('/api/users/sync', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Retry fetching projects
          const retryRes = await api.get('/api/projects', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProjects(Array.isArray(retryRes.data) ? retryRes.data : retryRes.data.projects || []);
          return;
        } catch (syncErr) {
          console.error("Auto-sync fallback recovery failed:", syncErr);
        }
      }

      console.error('Failed to fetch projects:', err);
      setError('Could not load your projects. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreating(true);
      const token = await getToken();
      const res = await api.post(
        '/api/projects', 
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newProj = res.data;
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      
      // Navigate to the editor for the created project
      navigate(`/project/${newProj._id || newProj.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Error creating project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation(); // Stop click from triggering card navigation
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const token = await getToken();
      await api.delete(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects(prev => prev.filter(p => (p._id || p.id) !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project.');
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-zinc-950 text-white font-sans flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="min-h-20 border-b border-zinc-800/80 px-4 sm:px-8 py-3 sm:py-0 flex flex-wrap items-center justify-between gap-3 max-w-7xl w-full mx-auto shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/30 shrink-0">
            W
          </div>
          <span className="font-bold text-xl sm:text-2xl tracking-tight text-white">WebL</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-sm font-medium text-zinc-400 hidden lg:inline">
            {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Developer'}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-lg shadow-blue-600/30 active:scale-95 whitespace-nowrap"
          >
            + New Project
          </button>
          <button
            onClick={() => signOut(() => navigate('/'))}
            className="px-2.5 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Projects</h1>
            <p className="text-zinc-400 text-sm mt-1">Manage and edit your AI-generated React applications</p>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        {loading || !isLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl animate-pulse p-6 flex flex-col justify-between">
                <div className="h-5 bg-zinc-800 rounded w-1/2"></div>
                <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-6 sm:p-8">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              🚀
            </div>
            <h3 className="text-xl font-bold mb-2">No projects created yet</h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
              Create your first project to start building full-stack React applications with live AI code generation and Monaco editor.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30"
            >
              Create New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const id = proj._id || proj.id;
              return (
                <div
                  key={id}
                  onClick={() => navigate(`/project/${id}`)}
                  className="group p-6 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-blue-500/40 rounded-2xl transition-all cursor-pointer flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {proj.title || 'Untitled Project'}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteProject(e, id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors text-xs"
                        title="Delete Project"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-6">
                      {proj.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4 text-xs text-zinc-500 font-medium">
                    <span>
                      {proj.updatedAt
                        ? `Updated ${new Date(proj.updatedAt).toLocaleDateString()}`
                        : 'Recently'}
                    </span>
                    <span className="text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">
                      Open Studio →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-1">Create New Project</h2>
            <p className="text-zinc-400 text-xs mb-6">Give your project a name to get started.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CineGear E-Commerce Store"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Description (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Short summary of what you are building..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-blue-600/30"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 shrink-0">
        &copy; {new Date().getFullYear()} WebL Studio. All rights reserved.
      </footer>
    </div>
  );
}