// src/apps/coding/CodingWorkspace.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { 
  Play, LogOut, Code2, FileCode2, Terminal, FileJson, 
  TerminalSquare, Braces, Save, Share2, Trophy, FolderTree
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import SEO from '../../components/seo/SEO';

// --- Default Files ---
const defaultFiles = {
  'index.html': { name: 'index.html', language: 'html', icon: <FileCode2 className="w-4 h-4 text-orange-400" />, value: `<!DOCTYPE html>\n<html>\n<body>\n  <h1 style="color: #10b981;">Hello World!</h1>\n</body>\n</html>` },
  'App.jsx': { name: 'App.jsx', language: 'javascript', icon: <FileJson className="w-4 h-4 text-cyan-400" />, value: `const App = () => <h1>React Works!</h1>;\nexport default App;` },
  'script.ts': { name: 'script.ts', language: 'typescript', icon: <Braces className="w-4 h-4 text-blue-500" />, value: `console.log("TypeScript Ready!");` },
  'main.py': { name: 'main.py', language: 'python', icon: <TerminalSquare className="w-4 h-4 text-yellow-400" />, value: `print("Python Ready!")` }
};

// --- Mini Challenges ---
const challenges = [
  {
    id: 1,
    title: "1. Two Sum (Easy)",
    description: "หา index ของตัวเลข 2 ตัวใน Array ที่บวกกันได้เท่ากับ target",
    language: "javascript",
    starter: `function twoSum(nums, target) {\n  // Write your logic here\n  \n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9)); // ควรได้ [0, 1]`
  },
  {
    id: 2,
    title: "2. FizzBuzz (Easy)",
    description: "ปรินต์เลข 1-15 ถ้าหาร 3 ลงตัวพิมพ์ Fizz, 5 ลงตัวพิมพ์ Buzz, ทั้งคู่พิมพ์ FizzBuzz",
    language: "python",
    starter: `def fizzbuzz(n):\n    # Write your logic here\n    pass\n\nfizzbuzz(15)`
  }
];

export default function CodingWorkspace() {
  const navigate = useNavigate();
  const { snippetId } = useParams(); // รับ ID จาก URL ถ้ามีการแชร์ลิงก์มา
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const SESSION_TIMEOUT = 5 * 60 * 60 * 1000; // 5 ชั่วโมง

  // --- States ---
  const [activeTab, setActiveTab] = useState('files'); // 'files' หรือ 'challenges'
  const [activeFileKey, setActiveFileKey] = useState('index.html');
  const [codeValue, setCodeValue] = useState(defaultFiles['index.html'].value);
  const [currentLanguage, setCurrentLanguage] = useState('html');
  
  const [srcDoc, setSrcDoc] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);
  
  // Theme & Resize
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [leftWidth, setLeftWidth] = useState(50); // % width ของ Editor
  
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);

  // --- 1. Auth & Session Check ---
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/code/login'); return; }

      const loginTime = localStorage.getItem('code_login_time');
      if (loginTime && Date.now() - parseInt(loginTime) > SESSION_TIMEOUT) {
        await supabase.auth.signOut();
        localStorage.removeItem('code_login_time');
        alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        navigate('/code/login');
        return;
      }

      setUser(session.user);

      try {
        // 🔧 ใช้ .maybeSingle() แทน .single() เพื่อป้องกัน Error 406 เวลาไม่เจอข้อมูลผู้ใช้ในตารางนี้
        const { data: profileData, error } = await supabase
          .from('coding_profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle(); 

        if (error) throw error;
        
        if (profileData) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Error fetching coding profile:", err.message);
      }
    };

    checkAuthAndProfile();
  }, [navigate]);

  // --- 2. Load Shared Snippet ---
  useEffect(() => {
    if (snippetId) {
      const loadSnippet = async () => {
        try {
          const { data, error } = await supabase
            .from('code_snippets')
            .select('*')
            .eq('id', snippetId)
            .maybeSingle();

          if (data) {
            setCodeValue(data.code);
            setCurrentLanguage(data.language);
            setActiveFileKey('custom'); // ระบุว่าเป็นไฟล์ที่โหลดมา
          } else {
            alert("ไม่พบ Snippet นี้ หรือถูกลบไปแล้ว");
            navigate('/code/workspace');
          }
        } catch (err) {
          console.error("Error loading snippet:", err);
        }
      };
      loadSnippet();
    }
  }, [snippetId, navigate]);

  // --- 3. Console Interceptor ---
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'console') {
        setConsoleLogs(prev => [...prev, `> ${event.data.message}`]);
      } else if (event.data && event.data.type === 'error') {
        setConsoleLogs(prev => [...prev, `[ERROR] ${event.data.message}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('code_login_time');
    navigate('/code/login');
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // --- Resize Panes Logic ---
  const startDrag = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };
  const onDrag = (e) => {
    const newLeftWidth = (e.clientX / window.innerWidth) * 100;
    if (newLeftWidth > 20 && newLeftWidth < 80) setLeftWidth(newLeftWidth); // จำกัดการลาก 20% - 80%
  };
  const stopDrag = () => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  // --- Save & Share Logic ---
  const handleSaveSnippet = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    const title = prompt("ตั้งชื่อ Snippet โค้ดของคุณ:", "My Awesome Code");
    if (!title) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('code_snippets').insert([{
        user_id: user.id,
        title: title,
        code: code,
        language: currentLanguage
      }]).select().single();

      if (error) throw error;

      const shareLink = `${window.location.origin}/code/workspace/${data.id}`;
      navigator.clipboard.writeText(shareLink);
      alert(`บันทึกสำเร็จ! คัดลอกลิงก์ให้เพื่อนได้เลย:\n${shareLink}`);
      navigate(`/code/workspace/${data.id}`); // อัปเดต URL เป็นตัวที่เซฟ
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Runner Logic ---
  const clearConsole = () => setConsoleLogs([]);

  const runCode = () => {
    if (!editorRef.current) return;
    const currentCode = editorRef.current.getValue();
    clearConsole();
    
    const consoleInterceptor = `
      <script>
        const originalLog = console.log; const originalError = console.error;
        console.log = function(...args) { window.parent.postMessage({ type: 'console', message: args.join(' ') }, '*'); originalLog.apply(console, args); };
        console.error = function(...args) { window.parent.postMessage({ type: 'error', message: args.join(' ') }, '*'); originalError.apply(console, args); };
        window.onerror = function(msg, url, line) { window.parent.postMessage({ type: 'error', message: msg + ' (Line: ' + line + ')' }, '*'); };
      </script>
    `;

    if (currentLanguage === 'html') {
      setSrcDoc(`${consoleInterceptor} ${currentCode}`);
    } else if (currentLanguage === 'javascript' || currentLanguage === 'react') {
      const reactEnv = `
        <!DOCTYPE html><html><head><style>body { background: ${editorTheme==='vs-dark'?'#121214':'#fff'}; margin: 0; padding: 20px; color: ${editorTheme==='vs-dark'?'#fff':'#000'}; }</style>
        ${consoleInterceptor}
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        </head><body><div id="root"></div><script type="text/babel">${currentCode.replace(/import .*;/, '')}\nconst root=ReactDOM.createRoot(document.getElementById('root')); if(typeof App !== 'undefined') root.render(<App />);</script></body></html>`;
      setSrcDoc(reactEnv);
    } else if (currentLanguage === 'typescript') {
      setSrcDoc(`<!DOCTYPE html><html><head>${consoleInterceptor}<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head>
        <body style="background:#121214; color:#3b82f6; font-family:monospace; padding:20px;"><div>[System] TS Compiled! Check Console.</div><script type="text/babel" data-presets="typescript">${currentCode}</script></body></html>`);
    } else if (currentLanguage === 'python') {
      setSrcDoc(`<!DOCTYPE html><html><head>${consoleInterceptor}<script src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"></script></head>
        <body style="background:#121214; color:#10b981; font-family:monospace; padding:20px;"><div id="status">[System] Loading Pyodide...</div>
        <script>async function run(){ try{ let pyodide=await loadPyodide(); document.getElementById('status').innerText='[System] Python Executed!'; pyodide.runPython(\`import sys\\nimport io\\nsys.stdout=io.StringIO()\`); const code=decodeURIComponent("${encodeURIComponent(currentCode)}"); await pyodide.runPythonAsync(code); const output=pyodide.runPython("sys.stdout.getvalue()"); if(output) output.split('\\n').forEach(line=>{ if(line.trim()) console.log(line); }); }catch(err){console.error(err.message);} } run();</script></body></html>`);
    } else {
      setSrcDoc(`<!DOCTYPE html><html><head>${consoleInterceptor}</head><body style="background:#121214; color:#10b981; font-family:monospace; padding: 20px;"><script>console.log("Compiling..."); setTimeout(()=>{console.log("Mock Build successful.\\nExecution finished.");},500);</script></body></html>`);
    }
  };

  const selectFile = (key) => {
    setActiveFileKey(key);
    setCodeValue(defaultFiles[key].value);
    setCurrentLanguage(defaultFiles[key].language);
    navigate('/code/workspace'); // Clear snippet ID from URL if any
  };

  const loadChallenge = (ch) => {
    setActiveFileKey(`challenge_${ch.id}`);
    setCodeValue(ch.starter);
    setCurrentLanguage(ch.language);
  };

  if (!user) return <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-emerald-500 font-mono">Initializing Pro Workspace...</div>;

  return (
    <>
      <SEO 
        title={`${activeFileKey !== 'custom' ? activeFileKey : 'Shared Code'} | SE-ONE IDE`}
        description="Coding Workspace Environment for Software Engineering"
        url={snippetId ? `/code/workspace/${snippetId}` : "/code/workspace"}
      />
      <div className="h-screen bg-[#1e1e1e] text-[#cccccc] font-mono flex flex-col overflow-hidden select-none">
        
        {/* Topbar */}
        <div className="h-12 bg-[#18181a] border-b border-[#333] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/code/landing')}>
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
              <Code2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-sm text-white tracking-wide">SE-ONE IDE <span className="text-emerald-500 text-[10px] uppercase ml-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">Pro</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={editorTheme} 
              onChange={(e) => setEditorTheme(e.target.value)}
              className="bg-[#2d2d2d] text-xs text-white border border-[#444] rounded px-2 py-1 outline-none"
            >
              <option value="vs-dark">Dark Theme</option>
              <option value="light">Light Theme</option>
              <option value="hc-black">High Contrast</option>
            </select>

            <button onClick={handleSaveSnippet} disabled={isSaving} className="flex items-center gap-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
              {isSaving ? <Share2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />} Save & Share
            </button>

            <button onClick={runCode} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Play className="w-3 h-3 fill-current" /> Execute
            </button>
            
            <div className="w-px h-6 bg-[#333]"></div>
            <button onClick={handleLogout} title="Logout" className="text-zinc-400 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-60 bg-[#18181a] border-r border-[#333] flex flex-col shrink-0">
            <div className="flex border-b border-[#333]">
              <button onClick={() => setActiveTab('files')} className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 ${activeTab === 'files' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}><FolderTree className="w-3 h-3"/> Files</button>
              <button onClick={() => setActiveTab('challenges')} className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 ${activeTab === 'challenges' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}><Trophy className="w-3 h-3"/> Tasks</button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2">
              {activeTab === 'files' ? (
                Object.keys(defaultFiles).map(key => (
                  <button key={key} onClick={() => selectFile(key)} className={`w-full flex items-center gap-3 px-5 py-2 text-sm transition-colors border-l-2 ${activeFileKey === key ? 'bg-[#2d2d2d] text-white border-[#10b981]' : 'border-transparent hover:bg-[#2d2d2d]/50 text-zinc-400'}`}>
                    {defaultFiles[key].icon} {defaultFiles[key].name}
                  </button>
                ))
              ) : (
                <div className="px-3 space-y-2">
                  {challenges.map(ch => (
                    <div key={ch.id} onClick={() => loadChallenge(ch)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeFileKey === `challenge_${ch.id}` ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-[#2d2d2d] border-[#444] hover:border-emerald-500/30'}`}>
                      <h4 className="text-xs font-bold text-white mb-1">{ch.title}</h4>
                      <p className="text-[10px] text-zinc-400 line-clamp-2">{ch.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resizable Editor Area */}
          <div style={{ width: `${leftWidth}%` }} className="flex flex-col min-w-[20%] bg-[#1e1e1e] relative">
            <div className="h-10 bg-[#1e1e1e] flex items-center px-4 border-b border-[#333] text-xs">
              <span className="px-4 py-2 border-b-2 border-emerald-500 text-white flex items-center gap-2">
                {activeFileKey === 'custom' ? <Share2 className="w-4 h-4 text-purple-400"/> : activeFileKey.includes('challenge') ? <Trophy className="w-4 h-4 text-yellow-400"/> : defaultFiles[activeFileKey]?.icon} 
                {activeFileKey === 'custom' ? 'Shared Snippet' : activeFileKey.includes('challenge') ? 'Code Challenge' : defaultFiles[activeFileKey]?.name}
              </span>
            </div>
            
            <div className="flex-1 pt-4">
              <Editor
                height="100%"
                theme={editorTheme}
                language={currentLanguage}
                value={codeValue}
                onChange={(val) => setCodeValue(val)}
                onMount={handleEditorDidMount}
                options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", wordWrap: 'on', padding: { top: 16 } }}
              />
            </div>
          </div>

          {/* Drag Handle */}
          <div onMouseDown={startDrag} className="w-1 bg-[#333] cursor-col-resize hover:bg-emerald-500 transition-colors z-10 flex flex-col justify-center items-center">
            <div className="w-full h-8 bg-emerald-500/50 rounded-full"></div>
          </div>

          {/* Right Panel (Preview & Terminal) */}
          <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col min-w-[20%] bg-[#18181a]">
            {/* Live Preview */}
            <div className="flex-1 flex flex-col border-b border-[#333]">
              <div className="h-10 bg-[#18181a] flex items-center px-4 border-b border-[#333] text-xs font-bold text-zinc-400 tracking-wider">
                {currentLanguage === 'html' || currentLanguage === 'javascript' || currentLanguage === 'react' ? 'BROWSER PREVIEW' : 'SYSTEM OUTPUT'}
              </div>
              <div className={`flex-1 relative ${editorTheme === 'light' ? 'bg-white' : 'bg-[#121214]'}`}>
                <iframe srcDoc={srcDoc} title="preview" className="w-full h-full border-none bg-transparent" sandbox="allow-scripts allow-modals" />
              </div>
            </div>

            {/* Console */}
            <div className="h-1/3 flex flex-col bg-[#121214]">
              <div className="h-10 bg-[#18181a] flex items-center justify-between px-4 border-b border-[#333] text-xs font-bold text-zinc-400 tracking-wider">
                <div className="flex items-center gap-2"><Terminal className="w-3 h-3"/> CONSOLE</div>
                <button onClick={clearConsole} className="hover:text-white transition-colors">Clear</button>
              </div>
              <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1">
                {consoleLogs.length === 0 ? <span className="text-zinc-600">Waiting for logs...</span> : consoleLogs.map((log, i) => <div key={i} className={log.includes('[ERROR]') ? 'text-red-400' : 'text-emerald-400'}>{log}</div>)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="h-7 bg-[#0071e3] text-white flex items-center justify-between px-4 text-[10px] shrink-0 font-bold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> READY</span>
            <span>{currentLanguage.toUpperCase()}</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-2">
            Logged in as: <span className="bg-white/20 px-2 py-0.5 rounded">{profile?.username || user?.email}</span>
          </div>
        </div>
      </div>
    </>
  );
}