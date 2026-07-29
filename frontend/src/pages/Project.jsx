import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from "../api/axios.js";
import Editor from "@monaco-editor/react";
import LivePreview from '../components/LivePreview';
import { injectIds } from "../utils/injectIds";
import { formatCode } from "../utils/formatCode";
import { stripIds } from '../utils/stripIds.js';

// Import your raw seed file layout
import { testResponse } from '../components/testResponse'; 
import { injectImageFallbacks } from '../utils/injectImageFallbacks.js';
import { useAuth } from '@clerk/clerk-react';

function Project() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState({}); 
  const [previewFiles, setPreviewFiles] = useState({}); // 👈 Debounced copy for LivePreview
  const [activeFile, setActiveFile] = useState(""); 
  const [selectedTreeFile, setSelectedTreeFile] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // 📱 Mobile-only UI toggles (desktop layout/logic below is completely untouched)
  const [isTreeOpen, setIsTreeOpen] = useState(false); // slide-over file tree drawer
  const [mobileView, setMobileView] = useState('code'); // 'code' | 'preview' — which single pane shows on phones
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  const decorationsRef = useRef([]);
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const editorPanelRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startWidth: 0, containerWidth: 1 });

  const { getToken } = useAuth();
  // Timers for 2-second debouncing
  const saveTimeoutRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Centralized processing engine for both live and mock operations
  const processWorkspacePayload = async (payload) => {
    if (!payload) return {};

    let rawData = payload;

    if (typeof payload === 'string') {
      try {
        rawData = JSON.parse(payload);
      } catch (e) {
        console.error("Failed parsing base workspace string parameter:", e);
        return {};
      }
    }

    let sourceFileSystem = null;
    if (rawData.fileSystem) {
      sourceFileSystem = rawData.fileSystem;
    } else if (rawData.webfiles) {
      try {
        const nested = typeof rawData.webfiles === 'string' ? JSON.parse(rawData.webfiles) : rawData.webfiles;
        sourceFileSystem = nested.fileSystem || nested;
      } catch (e) {
        console.error("Failed handling nested webfiles container parameters:", e);
      }
    } else {
      sourceFileSystem = rawData;
    }

    if (!sourceFileSystem || typeof sourceFileSystem !== 'object') {
      sourceFileSystem = rawData;
    }

    const normalizedFiles = {};

    Object.entries(sourceFileSystem).forEach(([filePath, fileContent]) => {
      if (!filePath || fileContent === undefined || fileContent === null) return;

      let formattedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      
      if (formattedPath === 'html') {
        formattedPath = 'src/App.jsx';
      }

      let pureCodeString = typeof fileContent === 'object' && fileContent !== null
        ? (fileContent.content || JSON.stringify(fileContent, null, 2))
        : String(fileContent);

      if (formattedPath.endsWith('.jsx') || formattedPath.endsWith('.js')) {
        try {
          pureCodeString = formatCode(pureCodeString, formattedPath);
        } catch (e) {
          console.warn(`[WebL Formatter] Skipping ${formattedPath}:`, e);
        }
      }

      normalizedFiles[formattedPath] = pureCodeString;
    });

    if (!normalizedFiles['package.json']) {
      normalizedFiles['package.json'] = JSON.stringify({
        name: "sandbox-project",
        version: "1.0.0",
        private: true,
        dependencies: { "react": "^18.2.0", "react-dom": "^18.2.0" }
      }, null, 2);
    }

    if (!normalizedFiles['src/App.jsx'] && normalizedFiles['App.jsx']) {
      normalizedFiles['src/App.jsx'] = normalizedFiles['App.jsx'];
      delete normalizedFiles['App.jsx'];
    }

    // 🛡️ MISSING FILE STUB GUARD
    if (normalizedFiles['src/App.jsx']) {
      const appCode = normalizedFiles['src/App.jsx'];
      const importRegex = /import\s+(\w+)\s+from\s+['"]\.\/(pages|components)\/([^'"]+)['"]/g;
      let match;
    
      while ((match = importRegex.exec(appCode)) !== null) {
        const [, componentName, folder, fileName] = match;
        const cleanFileName = fileName.replace(/\.(jsx|js)$/, '');
        const fullPath = `src/${folder}/${cleanFileName}.jsx`;
      
        if (!normalizedFiles[fullPath]) {
          console.warn(`[WebL Engine] Injecting stub placeholder for missing file: ${fullPath}`);
          normalizedFiles[fullPath] = `import React from 'react';
        
export default function ${componentName}({ onNavigate }) {
  return (
    <div className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-xl shadow-md text-center font-sans">
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
        ${componentName.charAt(0)}
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">${componentName} Page</h2>
      <p className="text-slate-500 mb-6 text-sm">This page placeholder was created automatically.</p>
      <button 
        onClick={() => onNavigate && onNavigate('home')} 
        className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
      >
        Back to Home
      </button>
    </div>
  );
};`;
        }
      }
    }

    return normalizedFiles;
  };

  // 1. Initial Load: Fetch from Backend if ID present, or load seed fallback
  useEffect(() => {
  const loadWorkspace = async () => {
    if (!projectId) {
      // Unsaved sandbox mode
      const processed = await processWorkspacePayload(blankTemplate);
      setFiles(processed);
      setPreviewFiles(processed);
      setActiveFile("src/App.jsx");
      setSelectedTreeFile("src/App.jsx");
      setHasGenerated(false); // 👈 Force Create Mode for Sandbox
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/api/projects/${projectId}`);
      const projectData = res.data;

      // 1. Process files
      const rawFS = projectData.fileSystem;
      const sourcePayload = (rawFS && Object.keys(rawFS).length > 0) ? rawFS : blankTemplate;
      const processed = await processWorkspacePayload(sourcePayload);

      setFiles(processed);
      setPreviewFiles(processed);

      const initialEntry = "src/App.jsx" in processed ? "src/App.jsx" : (Object.keys(processed)[0] || "");
      setActiveFile(initialEntry);
      setSelectedTreeFile(initialEntry);

      // 2. 🎯 EXACT FIX: Trust projectData.hasGenerated from backend!
      // If backend explicitly says false, OR if App.jsx contains starter text -> setHasGenerated(false)
      const appContent = processed["src/App.jsx"] || "";
      const isBlankCanvas = appContent.includes("WebL Studio Canvas") || appContent.includes("Your Blank Canvas");

      if (projectData.hasGenerated === false || isBlankCanvas) {
        setHasGenerated(false); // 🚀 Force Create Mode (`/api/gemini`)
      } else {
        setHasGenerated(true);  // ⚡ Enable Update Mode (`/api/gemini/update-workspace`)
      }

    } catch (err) {
      console.error("Failed to fetch project, falling back to blank starter:", err);
      const processed = await processWorkspacePayload(blankTemplate);
      setFiles(processed);
      setPreviewFiles(processed);
      setActiveFile("src/App.jsx");
      setSelectedTreeFile("src/App.jsx");
      setHasGenerated(false); // Fallback to Create Mode
    } finally {
      setLoading(false);
    }
  };

  loadWorkspace();
}, [projectId]);

  // 2. 2-Second Debounced Auto-Save & Live Preview Update
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (Object.keys(files).length === 0) return;

    setSaveStatus('Unsaved...');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);

    // Update Live Preview after 2s pause
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewFiles(files);
    }, 2000);

    // Save to Backend after 2s pause
    if (projectId) {
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setSaveStatus('Saving...');
          await api.put(`/api/projects/${projectId}`, { fileSystem: files });
          setSaveStatus('Saved');
        } catch (err) {
          console.error("Auto-save error:", err);
          setSaveStatus('Save Failed');
        }
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [files, projectId]);

  // 🛠️ DRAGGABLE SEPARATION BAR LOGIC
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const { startX, startWidth, trackWidth } = dragStartRef.current;
      if (!trackWidth) return;

      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / trackWidth) * 100;

      const newWidth = Math.max(15, Math.min(85, startWidth + deltaPercent));
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 📱 Watches viewport width so the editor/preview panes know when to stack
  // full-width on phones instead of using the desktop drag-resize percentage.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mq); // sync immediately on mount
    if (mq.addEventListener) mq.addEventListener('change', handleChange);
    else mq.addListener(handleChange); // Safari <14 fallback
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handleChange);
      else mq.removeListener(handleChange);
    };
  }, []);

  const handleElementClick = (clickData) => {
    jumpToElement(clickData);
  };

  const handleTreeFileClick = (filePath) => {
    setActiveFile(filePath);
    setSelectedTreeFile(filePath);
  };

  // Same as handleTreeFileClick, but also closes the mobile drawer and flips
  // the mobile view to "Code" so picking a file actually shows it on phones.
  const handleMobileTreeSelect = (filePath) => {
    handleTreeFileClick(filePath);
    setMobileView('code');
    setIsTreeOpen(false);
  };

  const generateGeminiSite = async () => {
  if (!prompt.trim()) return;
  if (!projectId) {
    alert("Please save or open a project before generating.");
    return;
  }

  setLoading(true);
  
  try {
    const token = await getToken();

    console.log(
      hasGenerated 
        ? "⚡ Executing Incremental Component/Page Patch Operation..." 
        : "✨ Executing Foundational Site Generation Operation..."
    );

    // 🎯 Hits your backend route: router.post('/:id/generate', generateAIWorkspace)
    const response = await api.post(
      `/api/projects/${projectId}/generate`,
      {
        prompt: prompt,
        currentFileSystem: files,
        hasGenerated: hasGenerated,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.data) {
      throw new Error("No network data returned from core API endpoint.");
    }

    const updatedFilesSource = response.data.fileSystem || response.data;
    const processed = await processWorkspacePayload(updatedFilesSource);

    if (!processed || Object.keys(processed).length === 0) {
      throw new Error("Resolved data could not be compiled into a valid file layout map.");
    }

    setFiles(processed);
    setPreviewFiles(processed); // Immediate live preview update
    setPrompt(""); 
    setHasGenerated(true); // 🚀 Flips to Update Mode for all future prompts!

    if (!processed[activeFile]) {
      const defaultEntry = "src/App.jsx" in processed ? "src/App.jsx" : (Object.keys(processed)[0] || "");
      setActiveFile(defaultEntry);
      setSelectedTreeFile(defaultEntry);
    }

  } catch (error) {
    console.error("Workspace generation failed:", error);
    alert("Error building workspace: " + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};

  const copyToClipboard = async () => {
    const activeFileObj = files[activeFile];
    if (!activeFileObj) return;

    let codeToCopy = typeof activeFileObj === 'object' ? activeFileObj.content : activeFileObj;

    if (activeFile.endsWith('.jsx') || activeFile.endsWith('.js')) {
      codeToCopy = codeToCopy
        .replace(/import\s*\{([^}]*)\}\s*from\s*['"][./]*router(?:\.jsx)?['"];?/g, (match, p1) => {
          let imports = [];
          if (p1.includes('CustomRouter')) imports.push('BrowserRouter as Router');
          if (p1.includes('CustomRoutes')) imports.push('Routes');
          if (p1.includes('CustomRoute')) imports.push('Route');
          if (p1.includes('CustomLink')) imports.push('Link');
          return imports.length > 0 ? `import { ${imports.join(', ')} } from 'react-router-dom';` : '';
        })
        .replace(/<CustomRouter>/g, '<Router>')
        .replace(/<\/CustomRouter>/g, '</Router>')
        .replace(/<CustomRoutes>/g, '<Routes>')
        .replace(/<\/CustomRoutes>/g, '</Routes>')
        .replace(/<CustomRoute\s+/g, '<Route ')
        .replace(/<CustomLink\s+/g, '<Link ')
        .replace(/<\/CustomLink>/g, '</Link>');
    }

    if (activeFile === 'package.json') {
      try {
        const pkg = JSON.parse(codeToCopy);
        if (pkg.dependencies && !pkg.dependencies['react-router-dom']) {
          pkg.dependencies['react-router-dom'] = '^6.22.0';
          codeToCopy = JSON.stringify(pkg, null, 2);
        }
      } catch (e) {
        console.error("package.json parse error during clipboard translation:", e);
      }
    }

    try {
      await navigator.clipboard.writeText(codeToCopy);
      alert(`Code copied for: ${activeFile}`);
    } catch (error) {
      console.error("Clipboard write blocked:", error);
      navigator.clipboard.writeText(codeToCopy);
    }
  };

  const clearHighlight = () => {
    const editor = editorRef.current;
    if (!editor) return;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
  };

  const jumpToElement = (clickData) => {
    const { filePath, tagName, elementIdx, textContext } = clickData;
    if (!filePath || !tagName) return;

    setActiveFile(filePath);

    setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      if (!model) return;

      let targetLine = 0;
      const searchRegex = `<${tagName}\\b`;
      const tagMatches = model.findMatches(searchRegex, true, true, false, null, true);

      if (tagMatches.length > 0) {
        if (textContext && textContext.length > 1) {
          const escapedText = textContext.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const contextualRegex = `<${tagName}[^>]*>\\s*[\\s\\S]*?${escapedText}`;
          const contextMatches = model.findMatches(contextualRegex, true, true, false, null, true);

          if (contextMatches.length > 0) {
            const closestMatch = contextMatches.find(m => {
              const lineNum = m.range.startLineNumber;
              return tagMatches.findIndex(tm => tm.range.startLineNumber === lineNum) === elementIdx;
            }) || contextMatches[0];

            targetLine = closestMatch.range.startLineNumber;
          }
        }

        if (targetLine === 0) {
          const matchedInstance = tagMatches[elementIdx] || tagMatches[tagMatches.length - 1];
          targetLine = matchedInstance.range.startLineNumber;
        }
      }

      if (targetLine > 0) {
        editor.revealLineInCenter(targetLine);
        
        editor.setSelection({
          startLineNumber: targetLine,
          startColumn: 1,
          endLineNumber: targetLine,
          endColumn: model.getLineMaxColumn(targetLine)
        });
        
        editor.focus();
      }
    }, 100);
  };

  const handleEditorChange = (value) => {
    if (!activeFile) return;
    setFiles(prev => ({ ...prev, [activeFile]: value }));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-900 text-white font-sans">
      {/* Top Controls Header */}
      <header className="border-b border-gray-800 bg-gray-900 flex flex-wrap items-center px-3 sm:px-6 py-2 sm:py-0 sm:h-16 justify-between shrink-0 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 order-1">
          <button
            onClick={() => navigate('/projects')}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
            title="Return to Projects Dashboard"
          >
            ← Projects
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-bold tracking-tight text-xl hidden sm:inline">WebL Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-3 ml-auto sm:ml-0">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            saveStatus === 'Saved' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : saveStatus === 'Saving...' 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' 
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}>
            {saveStatus}
          </span>

          <button onClick={copyToClipboard} className="text-xs bg-gray-800 border border-gray-700 px-3 py-2 rounded-md hover:bg-gray-700 hidden sm:block">
            Copy File Context
          </button>
        </div>

        <div className="w-full sm:flex-1 sm:max-w-2xl sm:mx-4 flex gap-2 order-3 sm:order-2">
          <input
            type="text"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:border-blue-500 text-white text-sm min-w-0"
            placeholder={hasGenerated ? "Add a new page, insert a section, change styles..." : "Describe a new site layout blueprint..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateGeminiSite()}
          />
          <button
            onClick={generateGeminiSite}
            disabled={loading}
            className={`px-5 py-2 rounded-md font-bold text-sm shrink-0 ${
              loading ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? 'Processing...' : hasGenerated ? 'Patch App' : 'Build'}
          </button>
        </div>
      </header>

      {/* 📱 Mobile-only toolbar: file-tree drawer toggle + Code/Preview switch.
          Hidden entirely on md+ where both panes already sit side by side. */}
      <div className="flex md:hidden items-center gap-2 px-3 py-2 bg-gray-950 border-b border-gray-800 shrink-0">
        <button
          onClick={() => setIsTreeOpen(true)}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-xs font-semibold text-gray-200 flex items-center gap-1.5 shrink-0"
          title="Browse workspace files"
        >
          <span aria-hidden="true">☰</span> Files
        </button>
        <div className="flex-1 flex bg-gray-800 rounded-md p-0.5 gap-0.5">
          <button
            onClick={() => setMobileView('code')}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
              mobileView === 'code' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
              mobileView === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* 📱 Mobile file-tree drawer (slide-over). Desktop sidebar below is untouched. */}
      {isTreeOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsTreeOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-gray-950 border-r border-gray-800 flex flex-col shadow-2xl">
            <div className="px-4 py-3 bg-gray-900 flex items-center justify-between border-b border-gray-800 shrink-0">
              <span className="text-[10px] uppercase text-gray-500 font-black tracking-wider">Workspace Tree</span>
              <button
                onClick={() => setIsTreeOpen(false)}
                className="text-gray-400 hover:text-white text-xl leading-none px-2"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
              {Object.keys(files).map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => handleMobileTreeSelect(filePath)}
                  className={`w-full text-left px-2 py-1.5 rounded truncate flex items-center gap-1.5 transition-colors ${
                    activeFile === filePath ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <span>{filePath.includes('components/') ? '🧩' : filePath.includes('pages/') ? '📂' : filePath.endsWith('.json') ? '⚙️' : '📄'}</span>
                  {filePath}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <main ref={containerRef} className={`flex flex-1 w-full overflow-hidden relative ${isDragging ? 'select-none' : ''}`}>
        
        {/* Workspace Tree Sidebar (desktop/tablet only — phones use the drawer above) */}
        <div className="hidden md:flex w-52 bg-gray-950 border-r border-gray-800 flex-col shrink-0">
          <div className="px-4 py-3 bg-gray-900 text-[10px] uppercase text-gray-500 font-black tracking-wider border-b border-gray-800">Workspace Tree</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
            {Object.keys(files).map((filePath) => (
              <button
                key={filePath}
                onClick={() => handleTreeFileClick(filePath)}
                className={`w-full text-left px-2 py-1.5 rounded truncate flex items-center gap-1.5 transition-colors ${
                  activeFile === filePath ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <span>{filePath.includes('components/') ? '🧩' : filePath.includes('pages/') ? '📂' : filePath.endsWith('.json') ? '⚙️' : '📄'}</span>
                {filePath}
              </button>
            ))}
          </div>
        </div>

        {/* Monaco Editor Panel — full width "Code" pane on phones, resizable side pane on md+ */}
        <div
          ref={editorPanelRef}
          style={{ width: isMobile ? '100%' : `${leftWidth}%` }}
          className={`${mobileView === 'code' ? 'flex' : 'hidden'} md:flex flex-col border-r border-gray-800 bg-[#011117] min-w-0 overflow-hidden shrink-0`}
        >
          <div className="h-9 px-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between shrink-0 select-none">
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Editor Buffer</span>
            <span className="text-blue-500 lowercase font-mono text-[11px] truncate max-w-50">{activeFile}</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              path={activeFile}
              value={files[activeFile] ? stripIds(typeof files[activeFile] === 'object' ? files[activeFile].content : files[activeFile]) : ""}
              onChange={handleEditorChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;

                setTimeout(() => {
                  editor.getAction('editor.action.formatDocument')?.run();
                }, 200);

                editor.onDidChangeModelContent(() => clearHighlight?.());
                editor.onDidChangeCursorPosition(() => clearHighlight?.());
                editor.onDidChangeCursorSelection(() => clearHighlight?.());
              }}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                wordWrap: "on",
                automaticLayout: true,
                fixedOverflowWidgets: true
              }}
            />
          </div>
        </div>

        {/* 🛠️ DRAGGABLE SEPARATOR BAR — desktop/tablet only, since phones show one full-width pane at a time */}
        <div 
          onMouseDown={(e) => {
            e.preventDefault();
            if (containerRef.current && editorPanelRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect();
              const editorRect = editorPanelRef.current.getBoundingClientRect();
              
              const trackWidth = containerRect.right - editorRect.left;

              dragStartRef.current = {
                startX: e.clientX,
                startWidth: leftWidth,
                trackWidth: trackWidth
              };
              setIsDragging(true);
            }
          }} 
          className={`hidden md:block w-1.5 cursor-col-resize z-50 shrink-0 ${
            isDragging ? 'bg-blue-600' : 'bg-gray-800 hover:bg-blue-500'
          }`} 
        />

        {/* Live Preview Panel (Receives debounced previewFiles) — full width "Preview" pane on phones */}
        <div className={`${mobileView === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-gray-100 relative min-w-0 overflow-hidden w-full md:w-auto`}>
          <div className="px-4 py-2 bg-white text-[10px] uppercase text-gray-400 font-bold border-b border-gray-200 shrink-0 flex justify-between items-center">
            <span>Live Preview Output</span>
            <span className="text-gray-400 text-[9px] lowercase font-normal hidden sm:inline">Auto-updates 2s after typing</span>
          </div>
          
          {isDragging && <div className="absolute inset-0 z-40 cursor-col-resize bg-transparent" />}
          
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <LivePreview 
              multiFiles={previewFiles} 
              onElementClick={handleElementClick} 
              activeFilePath={selectedTreeFile} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Project;