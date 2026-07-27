import React, { useEffect, useState } from 'react';
import * as parser from "@babel/parser";
import traverseModule from "@babel/traverse";
const traverse = traverseModule.default;
import generateModule from "@babel/generator";
const generate = generateModule.default;

const LivePreview = ({ multiFiles, onElementClick, activeFilePath }) => {
  const [blobUrl, setBlobUrl] = useState('');
  const [openTabs, setOpenTabs] = useState(['src/App.jsx']);
  const [activeTab, setActiveTab] = useState('src/App.jsx');

  // Sync sidebar clicks with preview tabs
  useEffect(() => {
    if (!activeFilePath) return;
    const cleanPath = activeFilePath.startsWith('/') ? activeFilePath.slice(1) : activeFilePath;

    // Only open tabs for component/page files or main entry points
    if (cleanPath.endsWith('.jsx') || cleanPath.endsWith('.js')) {
      if (!openTabs.includes(cleanPath)) {
        setOpenTabs(prev => [...prev, cleanPath]);
      }
      setActiveTab(cleanPath);
    }
  }, [activeFilePath]);

  const handleCloseTab = (e, tabToClose) => {
    e.stopPropagation();
    if (openTabs.length === 1) return; // Keep at least one tab open

    const updatedTabs = openTabs.filter(t => t !== tabToClose);
    setOpenTabs(updatedTabs);
    if (activeTab === tabToClose) {
      setActiveTab(updatedTabs[updatedTabs.length - 1]);
    }
  };

  useEffect(() => {
    if (!multiFiles) return;

    let normalizedWorkspace = null;
    
    // 🛡️ STREAM GUARD GATE
    try {
      let raw = typeof multiFiles === 'string' ? JSON.parse(multiFiles) : multiFiles;
      if (raw.webfiles) {
        raw = typeof raw.webfiles === 'string' ? JSON.parse(raw.webfiles) : raw.webfiles;
      }
      normalizedWorkspace = raw.fileSystem || raw;
    } catch (e) {
      return;
    }

    if (!normalizedWorkspace || typeof normalizedWorkspace !== 'object') return;

    const instrumentedFilesMap = {};
    let globalCss = "html { scroll-behavior: smooth; }\n";

    // 🚀 ELEMENT CLICK TRACKING INSTRUMENTATION ENGINE
    const instrumentCode = (filePath, codeString) => {
      try {
        const ast = parser.parse(codeString, {
          sourceType: "module",
          plugins: ["jsx"],
        });

        const tagCounters = {};

        traverse(ast, {
          JSXOpeningElement(path) {
            const tagName = path.node.name?.name;
            if (!tagName) return;

            if (tagName[0] === tagName[0].toLowerCase()) {
              if (!tagCounters[tagName]) tagCounters[tagName] = 0;
              const currentIdx = tagCounters[tagName]++;
              const elementId = filePath;

              path.node.attributes.push({
                type: "JSXAttribute",
                name: { type: "JSXIdentifier", name: "data-webl-id" },
                value: { type: "StringLiteral", value: elementId }
              });

              path.node.attributes.push({
                type: "JSXAttribute",
                name: { type: "JSXIdentifier", name: "onClick" },
                value: {
                  type: "JSXExpressionContainer",
                  expression: parser.parseExpression(`(e) => { 
                    e.stopPropagation(); 
                    const textVal = e.currentTarget.textContent || e.currentTarget.innerText || '';
                    if (window.onElementClick) {
                      window.onElementClick('${elementId}', '${tagName}', ${currentIdx}, textVal.trim().substring(0, 20)); 
                    }
                  }`)
                }
              });
            }
          }
        });

        return generate(ast, {}, codeString).code;
      } catch (err) {
        return codeString; 
      }
    };

    Object.entries(normalizedWorkspace).forEach(([path, fileContent]) => {
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const rawText = typeof fileContent === 'object' ? fileContent.content : fileContent;
      const fileString = rawText || "";

      if (cleanPath.endsWith('.jsx') || cleanPath.endsWith('.js')) {
        instrumentedFilesMap[cleanPath] = instrumentCode(cleanPath, fileString);
      } else if (cleanPath.endsWith('.css')) {
        globalCss += fileString;
      }
    });

    // 🚀 MOUNT THE SPECIFIC ACTIVE TAB FILE
    let targetMountFile = activeTab;
    if (!instrumentedFilesMap[targetMountFile]) {
      targetMountFile = Object.keys(instrumentedFilesMap).find(k => k.endsWith('App.jsx')) || Object.keys(instrumentedFilesMap)[0];
    }

    const assembledHtml = `
      <!DOCTYPE html>
      <html class="scroll-smooth">
        <head>
          <meta charset="UTF-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
          <style>${globalCss}</style>
        </head>
        <body class="bg-white min-h-screen">
          <div id="root"></div>

          <script type="text/babel">
            if (window.React) {
              const hooks = ['useState', 'useEffect', 'useContext', 'useRef', 'useMemo', 'useCallback', 'createContext'];
              hooks.forEach(hook => { window[hook] = window.React[hook]; });
            }

            window.onElementClick = (filePath, tagName, elementIdx, textContext) => {
              window.parent.postMessage({ type: 'AI_CLICK', filePath, tagName, elementIdx, textContext }, '*');
            };

            const virtualFiles = ${JSON.stringify(instrumentedFilesMap)};
            const modulesCache = {};

            window.requireModule = (filePath) => {
              let targetPath = filePath;

              if (targetPath.startsWith('.')) {
                targetPath = targetPath.replace(/^\\.\\//, 'src/').replace(/^\\.\\.\\//, 'src/');
              } else if (!targetPath.startsWith('src/')) {
                targetPath = 'src/' + targetPath;
              }

              if (!targetPath.endsWith('.jsx') && !targetPath.endsWith('.js')) {
                targetPath = virtualFiles[targetPath + '.jsx'] ? targetPath + '.jsx' : targetPath + '.js';
              }

              if (modulesCache[targetPath]) return modulesCache[targetPath].exports;
              
              if (!virtualFiles[targetPath]) {
                if (targetPath.includes('react')) return window.React;
                
                const cleanName = filePath.split('/').pop().replace(/\\.(jsx|js)$/, '');
                const foundKey = Object.keys(virtualFiles).find(k => k.endsWith(cleanName + '.jsx') || k.endsWith(cleanName + '.js'));
                if (foundKey) {
                  targetPath = foundKey;
                } else {
                  return {};
                }
              }

              const module = { exports: {} };
              modulesCache[targetPath] = module;

              let rawCode = virtualFiles[targetPath];

              rawCode = rawCode
                .replace(/import\\s+.*?\\s+from\\s+['\"].*?['\"];?/g, '')
                .replace(/export\\s+default\\s+/g, 'module.exports.default = ')
                .replace(/export\\s+(const|let|var|function|class)\\s+(\\w+)/g, (match, type, name) => {
                  return type + " " + name + "; module.exports." + name + " = " + name;
                });

              try {
                const compiled = Babel.transform(rawCode, { presets: ['react'] }).code;
                const runModule = new Function('module', 'exports', 'require', compiled);
                runModule(module, module.exports, window.requireModule);

                const fileName = targetPath.split('/').pop().replace(/\\.(jsx|js)$/, '');
                if (module.exports.default) {
                  window[fileName] = module.exports.default;
                }
                
                Object.entries(module.exports).forEach(([key, val]) => {
                  if (key !== 'default') window[key] = val;
                });
              } catch (err) {
                throw new Error("Syntax Compile Blocker inside [" + targetPath + "]: " + err.message);
              }

              return module.exports;
            };

            try {
              const entryFile = '${targetMountFile}';

              // Pre-require all workspace components into virtual memory
              Object.keys(virtualFiles).forEach(path => {
                if (path !== entryFile) {
                  try { window.requireModule(path); } catch(e) {}
                }
              });

              const TargetModule = window.requireModule(entryFile);
              const ActiveComponent = TargetModule.default || TargetModule || window.App;

              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(<ActiveComponent onNavigate={() => {}} onElementClick={window.onElementClick} />);
            } catch (err) {
              document.getElementById('root').innerHTML = \`
                <div style="color: #ef4444; padding: 16px; font-family: monospace; font-size: 12px; background: #fef2f2; border: 1px solid #fca5a5; margin: 12px; border-radius: 6px;">
                  <strong>Viewport Render Error in [${targetMountFile}]:</strong> \${err.message}
                </div>
              \`;
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([assembledHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [multiFiles, activeTab]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'AI_CLICK') {
        if (typeof onElementClick === 'function') {
          onElementClick(event.data);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementClick]);

  if (!blobUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 font-mono text-xs text-orange-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mb-3"></div>
        <div>Assembling isolated layout viewports...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* 🚀 PREVIEW TABS HEADER */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800 px-2 pt-2 space-x-1 overflow-x-auto no-scrollbar">
        {openTabs.map(tab => {
          const label = tab.split('/').pop();
          const isActive = tab === activeTab;
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono rounded-t-md cursor-pointer transition-colors border-t border-x ${
                isActive
                  ? 'bg-white text-slate-900 font-bold border-slate-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span>{label}</span>
              {openTabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(e, tab)}
                  className="ml-1 text-slate-400 hover:text-red-500 font-bold"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 🚀 IFRAME VIEWPORT */}
      <div className="grow w-full h-full bg-white relative">
        <iframe
          src={blobUrl}
          className="w-full h-full border-0 bg-white"
          title="WebL Engine Viewport"
          sandbox="allow-scripts allow-popups allow-same-origin"
        />
      </div>
    </div>
  );
};

export default LivePreview;