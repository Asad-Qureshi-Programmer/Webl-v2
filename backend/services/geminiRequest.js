import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function sendGeminiRequest(userPrompt) {
  try {
    const prompt = userPrompt || "Create a simple landing page";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        // 🔥 FAST GENERATION LAYER:
        // We drop the heavy responseSchema parameter object completely to avoid network latency timeouts.
        // Keeping responseMimeType ensures it responds in a valid stringified JSON format.
        responseMimeType: "application/json",
        temperature: 0.2,
        systemInstruction: `Role: Senior Frontend Software Architect.
        
Goal: Generate a professional, production-ready frontend multi-file project workspace structured in a flat JSON map.

Rules:
SYSTEM RULE: Your response MUST be valid JSON fitting strictly within output limits. Do NOT output partial files or cut off in the middle of code. Ensure every imported file inside src/App.jsx (like src/pages/Donate.jsx) is fully defined inside the fileSystem object.
PERFORMANCE & TOKEN CONSTRAINTS:
1. Conciseness Over Bloat: Keep components clean, well-styled, and direct. Avoid giant repetitive arrays or 100+ lines of dummy list items in JSX.
2. Complete Every File: It is CRITICAL that every file declared in "fileSystem" is completely closed and syntactically valid JSON. NEVER cut off mid-file.
3. Essential Files Only: Output only the core entry point (src/App.jsx), common layout components (Navbar, Footer), and necessary page components.

1. OUTPUT FORMAT: The response MUST be a strict, valid JSON object wrapped in a single root key called "fileSystem" (or "webfiles").
2. FILE MAP: The values inside "fileSystem" must map relative file paths directly to raw text string contents.
3. MANDATORY CORE FILES: You MUST ALWAYS include "package.json", "index.html", "src/main.jsx", and "src/App.jsx" in the file map.
4. NO SEPARATE ANIMATION OR EXPENSIVE EXTERNAL UI LIBRARIES (No framer-motion). Icons must use pure inline <svg> definitions natively.
5. All layout code components must use Tailwind CSS utility classes and include responsive utilities (sm:, md:, lg:).
6. STRICT MODULAR FILE STRUCTURE & EXPORT RULES:
   - EVERY COMPONENT MUST LIVE IN ITS OWN SEPARATE FILE (e.g., "src/components/Navbar.jsx", "src/pages/Home.jsx", "src/pages/Donate.jsx").
   - NEVER group multiple components into a single file.
   - EVERY component file MUST use a single DEFAULT EXPORT (e.g., export default function Home() { ... }). NEVER use named exports.
7. CLEAN NATIVE NAVIGATION & IMAGE FALLBACKS:
   - For vertical section scrolling, use standard HTML anchors: <a href="#section-id">.
   - For page switching, pass an onNavigate callback prop (e.g., const [activePage, setActivePage] = useState('home')).
   - NEVER write inline SVG data URIs inside img onError handlers. Use clean Unsplash fallback URLs (e.g., e.target.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800';).
8. MULTI-PAGE APPLICATION ARCHITECTURE:
   - Place full page views inside "src/pages/" (e.g., "src/pages/Home.jsx", "src/pages/Donate.jsx").
   - In "src/App.jsx", import page components and toggle them with state: {activePage === 'home' ? <Home onNavigate={setActivePage} /> : <Donate onNavigate={setActivePage} />}.
9. Write clean, production-ready, standard React code. EXPLICITLY import any React hooks used.
10. EXPLICIT COMPLETION RULE: Keep files succinct and fully complete.
11. In src/App.jsx, ALWAYS include a window postMessage listener inside useEffect to handle external navigation:
useEffect(() => {
  const handleMsg = (e) => {
    if (e.data?.type === 'NAVIGATE_PAGE' && e.data?.page) {
      setActivePage(e.data.page);
    }
  };
  window.addEventListener('message', handleMsg);
  return () => window.removeEventListener('message', handleMsg);
}, []);

Example Output Target JSON Format:
{
  "fileSystem": {
    "package.json": "{\\"dependencies\\":{\\"react\\":\\"^18.2.0\\",\\"react-dom\\":\\"^18.2.0\\"}}",
    "index.html": "<!DOCTYPE html><html><head><script src=\\"https://cdn.tailwindcss.com\\"></script></head><body><div id=\\"root\\"></div><script type=\\"module\\" src=\\"/src/main.jsx\\"></script></body></html>",
    "src/main.jsx": "import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; ReactDOM.createRoot(document.getElementById('root')).render(<App />);",
    "src/App.jsx": "import React, { useState } from 'react'; import Home from './pages/Home'; import Donate from './pages/Donate'; export default function App() { const [activePage, setActivePage] = useState('home'); return (<div className=\\"min-h-screen\\">{activePage === 'home' ? <Home onNavigate={setActivePage} /> : <Donate onNavigate={setActivePage} />}</div>); }",
    "src/pages/Home.jsx": "import React from 'react'; export default function Home({ onNavigate }) { return (<div><h1>Home</h1><button onClick={() => onNavigate('donate')}>Donate</button></div>); }",
    "src/pages/Donate.jsx": "import React from 'react'; export default function Donate({ onNavigate }) { return (<div><h1>Donate</h1><button onClick={() => onNavigate('home')}>Back</button></div>); }"
  }
}`,
      }
    });

    return response.text; 
    
  } catch (error) {
    console.error("Gemini Multi-file Generation Error:", error);
    throw error;
  }
}


export async function sendWorkspaceUpdateRequest(fileTreeSummary, targetedFilesContent, modificationPrompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Modification Request: "${modificationPrompt}"
      
Existing Project Directory Map:
${JSON.stringify(fileTreeSummary, null, 2)}

Target Code files Context for Modification:
${targetedFilesContent}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        systemInstruction: `Role: Senior Frontend Workspace Patch Engineer.
        
Goal: Professionally update an existing React code tree structure by adding a new modular component, section, or utility file based on user request.

Rules:
1. Output a strict, valid JSON object matching the target structure below.
2. Maintain clean separation of concerns: Global reusable UI components go into "src/components/ui/", feature-specific sections go into descriptive directories (e.g., "src/components/sections/"), and page containers reside in "src/pages/".
3. Use Tailwind CSS with absolute responsive configurations. Use inline native <svg> blocks for all vector icons.
4. You can update existing files (e.g., adding an import statement and rendering a new component inside a page) and create brand new files as needed.
5. Keep your response scoped strictly to the requested feature. Do not append unrelated changes. Ensure all code blocks are completely syntactically closed.

6. ROUTING & STATE ARCHITECTURE PARITY:
   - To build multi-page applications without external npm dependencies, use state-driven page switching with an activePage state string and an onNavigate callback prop passed to page components (e.g., <Home onNavigate={setActivePage} />).
   - DO NOT import or use custom router wrappers like CustomRouter, CustomRoutes, or react-router-dom.
   - If modifying "src/App.jsx", always preserve or include the window postMessage listener for iframe page synchronization:
     useEffect(() => {
       const handleMsg = (e) => {
         if (e.data?.type === 'NAVIGATE_PAGE' && e.data?.page) {
           setActivePage(e.data.page);
         }
       };
       window.addEventListener('message', handleMsg);
       return () => window.removeEventListener('message', handleMsg);
     }, []);
   - CRITICAL COMPONENT STRUCTURE RULE: Every view file or page layout module (e.g., src/pages/Home.jsx, src/pages/Donate.jsx) MUST export its primary interface element as an isolated default export (e.g., export default function Home() { ... }).
   - Always use clean, professional destructured React hook imports at the top of your files (e.g., import React, { useState, useEffect } from 'react';).

7. MULTI-SECTION SCROLLING ANCHOR RULES:
   - For vertical scrolling navigation down to specific modules rendered within the same page display view, equip target container structures with individual, descriptive, lowercase identification elements (e.g., id="features").
   - Action headers, interactive cards, or navigation button arrays targeting these local modules must intercept standard clicks using an operational click handler to perform smooth scrolling (e.g., element.scrollIntoView({ behavior: 'smooth' })).

8. IMAGE FALLBACKS:
   - Never write inline SVG data URIs inside img onError handlers. Use clean Unsplash fallback URLs (e.g., e.target.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800';).

Target JSON Output Format:
{
  "updatedFiles": {
    "src/pages/Home.jsx": "The entire modified code text containing the newly injected section component import and element call..."
  },
  "newFiles": [
    {
      "path": "src/components/sections/PricingSection.jsx",
      "content": "import React from 'react';\\nexport default function PricingSection() { ... }"
    }
  ]
}`
      }
    });

    return response.text;
  } catch (error) {
    console.error("Workspace Incremental Patch Error:", error);
    throw error;
  }
}


export default sendGeminiRequest;