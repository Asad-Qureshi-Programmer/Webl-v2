import React, { useState, useEffect, useRef } from 'react';
import { api } from "../api/axios.js";
import Editor from "@monaco-editor/react";
import LivePreview from '../components/LivePreview';
import { injectIds } from "../utils/injectIds";
import { formatCode } from "../utils/formatCode";
import { stripIds } from '../utils/stripIds.js';

// Import your raw seed file layout
import { testResponse } from '../components/testResponse'; 
import { injectImageFallbacks } from '../utils/injectImageFallbacks.js';

function Project() {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState({}); 
  const [activeFile, setActiveFile] = useState(""); 
  const [selectedTreeFile, setSelectedTreeFile] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const decorationsRef = useRef([]);
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const editorPanelRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startWidth: 0, containerWidth: 1 });

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
        pureCodeString = injectImageFallbacks(pureCodeString);
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

    // 🛡️ MISSING FILE STUB GUARD: Prevents missing imports from crashing the preview
    if (normalizedFiles['src/App.jsx']) {
      const appCode = normalizedFiles['src/App.jsx'];
      // Regex to catch imports like: import Donate from './pages/Donate';
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

  useEffect(() => {
    const loadDefaultWorkspace = async () => {
      try {
        const processed = await processWorkspacePayload(testResponse.webfiles);
        setFiles(processed);
        setActiveFile("src/App.jsx");
        setSelectedTreeFile("src/App.jsx"); 
      } catch (err) {
        console.error("Failed to parse test response simulation:", err);
      }
    };
    loadDefaultWorkspace();
  }, []);

  // 🛠️ DRAGGABLE SEPARATION BAR LOGIC (Zero-Jump Pixel Precision)
  // 🛠️ 1:1 PHYSICAL POINTER-LOCKED DRAG LOGIC
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const { startX, startWidth, trackWidth } = dragStartRef.current;
      if (!trackWidth) return;

      // Exact pixel displacement from initial click
      const deltaX = e.clientX - startX;
      
      // Exact percentage conversion based on actual available track width
      const deltaPercent = (deltaX / trackWidth) * 100;

      // Clamp strictly between 15% and 85%
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

  const handleElementClick = (clickData) => {
    jumpToElement(clickData);
  };

  const handleTreeFileClick = (filePath) => {
    setActiveFile(filePath);
    setSelectedTreeFile(filePath);
  };

  const generateGeminiSite = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    
    try {
      let response;

      if (hasGenerated) {
        console.log("⚡ Executing Incremental Component/Page Patch Operation...");
        response = await api.post('/api/gemini/update-workspace', {
          currentFileSystem: files,
          userPrompt: prompt
        });
      } else {
        console.log("✨ Executing Foundational Site Generation Operation...");
        response = await api.post('/api/gemini', { prompt: prompt });
        console.log("Code: ", response);
      }
      
      console.log("=== WEBL DIAGNOSTIC PAYLOAD LOOKUP ===");
      
      if (!response.data) {
        throw new Error("No network data context returned from core API endpoint.");
      }

      const updatedFilesSource = response.data.fileSystem || response.data;
      const processed = await processWorkspacePayload(updatedFilesSource);
      
      if (!processed || Object.keys(processed).length === 0) {
        throw new Error("Resolved data could not be compiled into a valid file layout map.");
      }

      setFiles(processed);
      setPrompt(""); 
      setHasGenerated(true);

      if (!processed[activeFile]) {
        const defaultEntry = processed["src/App.jsx"] || Object.keys(processed)[0];
        setActiveFile(defaultEntry);
        setSelectedTreeFile(defaultEntry);
      }

    } catch (error) {
      console.error("Workspace production construction failed:", error);
      alert("Error compiling directory layout structure: " + error.message);
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
      alert(`Production-grade React Router Dom code copied for: ${activeFile}`);
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
      <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="font-bold tracking-tight text-xl">WebL Studio</span>
        </div>

        <div className="flex-1 max-w-2xl mx-8 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:border-blue-500 text-white text-sm"
            placeholder={hasGenerated ? "Add a new page, insert a section, change styles..." : "Describe a new site layout blueprint..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateGeminiSite()}
          />
          <button
            onClick={generateGeminiSite}
            disabled={loading}
            className={`px-5 py-2 rounded-md font-bold text-sm ${
              loading ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? 'Processing Patch...' : hasGenerated ? 'Patch App' : 'Build'}
          </button>
        </div>

        <button onClick={copyToClipboard} className="text-xs bg-gray-800 border border-gray-700 px-4 py-2 rounded-md hover:bg-gray-700">
          Copy File Context
        </button>
      </header>

      {/* Main Workspace Container */}
      <main ref={containerRef} className={`flex flex-1 w-full overflow-hidden relative ${isDragging ? 'select-none' : ''}`}>
        
        {/* Workspace Tree Sidebar */}
        <div className="w-52 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0">
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

        {/* Monaco Editor Panel (Added min-w-0 and overflow-hidden to prevent flex expansion glitch) */}
        <div ref={editorPanelRef} style={{ width: `${leftWidth}%` }} className="flex flex-col border-r border-gray-800 bg-[#011117] min-w-0 overflow-hidden shrink-0">
          <div className="px-4 py-2 bg-gray-900 text-[10px] uppercase text-gray-400 font-bold border-b border-gray-800 flex justify-between shrink-0">
            <span>Editor Buffer</span>
            <span className="text-blue-500 lowercase font-mono text-[11px] truncate">{activeFile}</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              path={activeFile}
              value={files[activeFile] ? stripIds(typeof files[activeFile] === 'object' ? files[activeFile].content : files[activeFile]) : ""}
              onChange={handleEditorChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
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

        {/* 🛠️ DRAGGABLE SEPARATOR BAR (1:1 Pixel Pinned) */}
        <div 
          onMouseDown={(e) => {
            e.preventDefault(); // Prevents text selection & cursor drift
            if (containerRef.current && editorPanelRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect();
              const editorRect = editorPanelRef.current.getBoundingClientRect();
              
              // Exact available width for Editor + Preview track
              const trackWidth = containerRect.right - editorRect.left;

              dragStartRef.current = {
                startX: e.clientX,
                startWidth: leftWidth,
                trackWidth: trackWidth
              };
              setIsDragging(true);
            }
          }} 
          className={`w-1.5 cursor-col-resize z-50 shrink-0 ${
            isDragging ? 'bg-blue-600' : 'bg-gray-800 hover:bg-blue-500'
          }`} 
        />

        {/* Live Preview Panel (Added flex-1, min-w-0, and overflow-hidden to prevent expanding offscreen) */}
        <div className="flex-1 flex flex-col bg-gray-100 relative min-w-0 overflow-hidden">
          <div className="px-4 py-2 bg-white text-[10px] uppercase text-gray-400 font-bold border-b border-gray-200 shrink-0">Live Preview Output</div>
          
          {/* Iframe mask during dragging */}
          {isDragging && <div className="absolute inset-0 z-40 cursor-col-resize bg-transparent" />}
          
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <LivePreview 
              multiFiles={files} 
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