'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getCachedAccessToken } from '@/lib/googleAuth';
import { Folder, Pin, Presentation, FileText, CheckSquare, Mail, RefreshCw, LogIn, LayoutGrid, Save, ChevronLeft, Layers } from 'lucide-react';
import Link from 'next/link';
import { auth, googleProvider, setCachedAccessToken, db } from '@/lib/googleAuth';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * JSDoc: Custom Node Component for Flow Automation
 * รองรับการแสดงผล Node ที่มาจากหน้า Dashboard การ์ด
 */
const CustomGoogleCardNode = ({ data }: { data: any }) => {
  let bgColor = "bg-zinc-900";
  let borderColor = "border-zinc-700";
  
  if (data.service === 'slide') {
    bgColor = "bg-yellow-950/40";
    borderColor = "border-yellow-900/50";
  } else if (data.service === 'sheet') {
    bgColor = "bg-emerald-950/40";
    borderColor = "border-emerald-900/50";
  } else if (data.service === 'doc') {
    bgColor = "bg-blue-950/40";
    borderColor = "border-blue-900/50";
  } else if (data.service === 'keep') {
    bgColor = "bg-amber-950/40";
    borderColor = "border-amber-900/50";
  }

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-4 shadow-xl min-w-[200px] flex flex-col gap-2 relative group`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 rounded-full border-zinc-500 bg-zinc-800" />
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
          {data.icon || <LayoutGrid className="w-4 h-4 text-zinc-400" />}
        </div>
        <div className="truncate flex-grow">
          <p className="text-xs font-semibold text-zinc-200 truncate">{data.label}</p>
          <p className="text-[10px] text-zinc-500 font-mono truncate">{data.subtext}</p>
        </div>
      </div>
      {(data.preview || data.description) && (
        <div className="text-[10px] text-zinc-400 max-h-16 overflow-hidden line-clamp-3 leading-relaxed">
          {data.preview || data.description}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-2 h-2 rounded-full border-zinc-500 bg-zinc-800" />
    </div>
  );
};

const nodeTypes = {
  googleCard: CustomGoogleCardNode,
};

export default function CanvasFlowPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [token, setToken] = useState<string | null>(null);
  
  // Data States
  const [keepNotes, setKeepNotes] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
    []
  );

  // Load Projects from DB
  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const pData = await res.json();
      const lst = pData.data || [];
      setProjects(lst);
      if (lst.length > 0) {
        setSelectedProjectId(lst[0].id);
      }
    } catch(err) {}
  };

  const loadCanvasDataFromFirestore = async (projectId: string) => {
    if (!projectId) return;
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().canvas_data) {
        const layout = docSnap.data().canvas_data;
        if (layout.nodes) setNodes(layout.nodes);
        if (layout.edges) setEdges(layout.edges);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch(err) {
      console.error('Failed to load canvas from firestore', err);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCanvasDataFromFirestore(selectedProjectId);
    }
  }, [selectedProjectId]);

  const saveCanvasToFirestore = async () => {
    if (!selectedProjectId) return;
    setSaveStatus('saving');
    try {
      const docRef = doc(db, 'projects', selectedProjectId);
      await setDoc(docRef, {
        canvas_data: {
          nodes,
          edges,
          updated_at: new Date().toISOString()
        }
      }, { merge: true });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch(err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const fetchIntegrations = async (accessToken: string) => {
    setLoading(true);
    try {
      // 1. Fetch Keep Notes (Enterprise API or simulated via API if available, here we mock it using Drive search or Real Keep API if possible)
      // Since Google Keep doesn't have an easy public API for consumers, we'll try simulating it with Drive or empty array if it fails.
      // Wait, Google Keep Enterprise API exists at 'https://keep.googleapis.com/v1/notes'
      try {
        const keepRes = await fetch('https://keep.googleapis.com/v1/notes', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (keepRes.ok) {
          const keepData = await keepRes.json();
          setKeepNotes(keepData.notes || []);
        }
      } catch (err) {
        console.warn('Keep API not accessible', err);
      }

      // 2. Fetch Slides
      try {
        const slidesRes = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.presentation"&pageSize=10&fields=files(id,name,webViewLink,createdTime)', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (slidesRes.ok) {
          const slidesData = await slidesRes.json();
          setSlides(slidesData.files || []);
        }
      } catch (err) {
        console.warn('Drive Slides API failed', err);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const t = getCachedAccessToken();
    if (t && mounted) {
      setTimeout(() => {
        setToken(t);
        fetchIntegrations(t);
      }, 0);
    }
    return () => { mounted = false; };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
        setCachedAccessToken(credential.accessToken);
        fetchIntegrations(credential.accessToken);
      }
    } catch (err) {
      alert("Login Error: " + err);
    }
  };

  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeDataRaw = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeDataRaw || !reactFlowBounds) return;

      const parsedData = JSON.parse(nodeDataRaw);
      
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      let icon = <LayoutGrid className="w-4 h-4 text-zinc-400" />;
      if (parsedData.service === 'slide') icon = <Presentation className="w-4 h-4 text-yellow-500" />;
      else if (parsedData.service === 'keep') icon = <Pin className="w-4 h-4 text-yellow-400" />;

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'googleCard',
        position,
        data: { 
          ...parsedData,
          icon
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0c0c0c] text-white font-sans flex flex-col pt-safe">
      <header className="border-b border-zinc-900 bg-[#080808]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-zinc-300" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-wider font-display text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Flow Automation
            </h1>
            <span className="text-[9px] text-[#FFD700] tracking-widest font-mono uppercase">Magnetic Workspace</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:border-[#FFD700] hidden md:block"
            >
              <option value="" disabled>Select Space...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={saveCanvasToFirestore}
            disabled={!selectedProjectId || saveStatus === 'saving'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#FFD700]/30 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap disabled:opacity-50"
          >
            {saveStatus === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" /> : <Save className="w-3.5 h-3.5 text-emerald-500" />}
            <span className="hidden sm:inline">
              {saveStatus === 'saved' ? 'Saved' : 'Save Layout'}
            </span>
          </button>

          {!token ? (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD700] hover:bg-yellow-500 text-black rounded-lg text-[10px] font-bold transition-all uppercase"
            >
              <LogIn className="w-3.5 h-3.5" />
              Connect
            </button>
          ) : (
            <button 
              onClick={() => fetchIntegrations(token)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all text-zinc-400 flex items-center justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Workspace Canvas (React Flow) */}
        <main className="flex-1 relative bg-[#080808]" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={() => {}}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              className="bg-[#080808]"
            >
              <Background gap={24} size={1} color="#18181b" />
              <Controls className="bg-zinc-900 border-zinc-800 fill-zinc-400 mb-20 md:mb-0" />
            </ReactFlow>
          </ReactFlowProvider>
        </main>

        {/* Sidebar Tools - Bottom on Mobile, Right on Desktop */}
        <aside className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-900 bg-[#0c0c0c] flex flex-col h-48 md:h-full pb-20 md:pb-0 safe-bottom">
          <div className="p-3 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
            <h2 className="text-[9px] uppercase font-mono tracking-widest text-zinc-500">Google Tools (Drag)</h2>
            <div className="md:hidden">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded px-1.5 py-1 outline-none w-24"
              >
                <option value="" disabled>Select Space</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name.slice(0,10)}...</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto md:overflow-y-auto px-3 py-3 flex flex-row md:flex-col gap-3 scrollbar-hide">
            {/* Mock Keep if empty */}
            {keepNotes.length === 0 && slides.length === 0 && (
               <div 
                 className="shrink-0 w-48 md:w-full p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-grab active:cursor-grabbing hover:border-yellow-500/50 transition-colors"
                 draggable
                 onDragStart={(e) => onDragStart(e, {
                   service: 'keep',
                   label: 'Demo Strategy Keep',
                   subtext: 'Idea / Keep',
                   preview: 'Draft the automated flow logic for the Q3 event marketing launch.'
                 })}
               >
                 <div className="flex items-center gap-1.5 mb-1.5">
                   <Pin className="w-3.5 h-3.5 text-yellow-500" />
                   <p className="text-[11px] font-semibold text-zinc-200 truncate">⚙️ Demo Strategy Keep</p>
                 </div>
                 <p className="text-[9px] text-zinc-500 line-clamp-2">Draft the automated flow logic for the Q3 event marketing launch.</p>
               </div>
            )}

            {/* Google Keep Mock / Real */}
            {keepNotes.map((note, i) => (
              <div 
                key={note.name || i}
                className="shrink-0 w-48 md:w-full p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-grab active:cursor-grabbing hover:border-yellow-500/50 transition-colors"
                draggable
                onDragStart={(e) => onDragStart(e, {
                  service: 'keep',
                  label: note.title || 'Untitled Keep',
                  subtext: note.name || 'External API',
                  preview: note.body?.text?.text || ''
                })}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Pin className="w-3.5 h-3.5 text-yellow-500" />
                  <p className="text-[11px] font-semibold text-zinc-200 truncate">{note.title || 'Untitled Keep'}</p>
                </div>
                <p className="text-[9px] text-zinc-500 line-clamp-2 break-words">{note.body?.text?.text}</p>
              </div>
            ))}

            {/* Google Slides */}
            {slides.map((s, i) => (
              <div 
                key={s.id || i}
                className="shrink-0 w-48 md:w-full p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-grab active:cursor-grabbing hover:border-yellow-500/50 transition-colors"
                draggable
                onDragStart={(e) => onDragStart(e, {
                  service: 'slide',
                  label: s.name,
                  subtext: `ID: ${s.id.slice(0, 8)}...`,
                })}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Presentation className="w-3.5 h-3.5 text-yellow-500" />
                  <p className="text-[11px] font-semibold text-zinc-200 truncate">{s.name}</p>
                </div>
                <p className="text-[9px] text-zinc-500 mt-1">Presentation File</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
