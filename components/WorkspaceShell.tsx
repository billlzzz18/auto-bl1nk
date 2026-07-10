'use client';
/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  Bell,
  Plus,
  Compass,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Hash,
  Trash2,
  Settings,
  Heart,
  Grid,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  BookOpen,
  Calendar,
  Layers,
  Terminal,
  Activity,
  Award,
  Cloud
} from 'lucide-react';

export interface SidebarData {
  user: { id: string; name: string; email: string; avatar: string; bio: string } | null;
  projects: any[];
  folders: any[];
  tags: any[];
  trashCount: number;
}

interface WorkspaceShellProps {
  children: React.ReactNode;
  onRefreshStates?: () => void;
}

const generateToastId = () => Date.now().toString();

/**
 * JSDoc: Workspace Navigation Shell (แผงครอบจักรวาลระบบ bl1nk ink)
 * รวมตัวควบคุม Sidebar, Responsive Drawer, Command Palette, Toast Alert, และ Status Bar
 */
export default function WorkspaceShell({ children, onRefreshStates }: WorkspaceShellProps) {
  const router = useRouter();
  const currentPath = usePathname();

  // ไฮเออราคีย์สถานะหลัก
  const [data, setData] = useState<SidebarData>({
    user: null,
    projects: [],
    folders: [],
    tags: [],
    trashCount: 0
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);

  // สเตตสปินเนอร์และฟีดเจอร์การแจ้งเตือน
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'alert' | 'info' }>>([]);
  const [foldersExpanded, setFoldersExpanded] = useState<Record<string, boolean>>({
    fold_work: true,
    fold_personal: true
  });

  // Onboarding Tour State
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    if (data.user && typeof window !== 'undefined') {
      const completed = window.localStorage.getItem('blink_onboarding_completed');
      if (!completed) {
        const timer = setTimeout(() => {
          setTourActive(true);
          setTourStep(1);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [data.user]);

  // สร้างและลบ Folder แบบ Dynamic
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parent_id: newFolderParentId })
      });
      if (res.ok) {
        setNewFolderName('');
        setShowNewFolderForm(false);
        fetchSidebarData();
        showToast('สร้างโฟลเดอร์เสร็จสิ้น!', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'สร้างโฟลเดอร์ไม่สำเร็จ', 'alert');
      }
    } catch (err: any) {
      showToast(err.message, 'alert');
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโฟลเดอร์นี้? (โปรเจกต์ภายในจะไม่ได้ถูกลบไปด้วย)')) return;
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchSidebarData();
        showToast('ลบโฟลเดอร์สำเร็จแล้ว!', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'ลบโฟลเดอร์ไม่สำเร็จ', 'alert');
      }
    } catch (err: any) {
      showToast(err.message, 'alert');
    }
  };

  // Modal สเตตสำหรับ Quick Task/Project
  const [quickTaskModal, setQuickTaskModal] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskProject, setQuickTaskProject] = useState('');
  const [quickTaskType, setQuickTaskType] = useState<'task' | 'milestone' | 'note' | 'event' | 'habit'>('task');

  // ยูทิลิตีระบบ Toast คลาส (ย้ายมาเริ่มต้นด้านบนสุดเพื่อเลี่ยง TS Block Scope Reference)
  const showToast = (message: string, type: 'success' | 'alert' | 'info' = 'success') => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  interface NotificationItem {
    id: string;
    text: string;
    time: string;
    unread: boolean;
  }

  // ข้อมูลแจ้งเตือนจริงผสมจำลองแอปเบื้องต้นแบบ Persisted (Lazy State Initializer เลี่ยง sync setState ใน effect)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('bl1nk_notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ใช้ค่าเริ่มต้น
        }
      }
    }
    return [
      { id: 'n1', text: 'Alex updated task "Interactive keyboard shortcuts framework"', time: '3m ago', unread: true },
      { id: 'n2', text: 'System completed automation "Slack Notification"', time: '1h ago', unread: false },
      { id: 'n3', text: 'Overdue task warning: Morning Yoga', time: '1d ago', unread: false }
    ];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bl1nk_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // ดักรับเหตุการณ์การสร้าง/อัปเกรดข้อมูลข้ามคอมโพเนนต์
  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.text) {
        const textMessage = customEvent.detail.text;
        const newNo = {
          id: 'n_' + Math.random().toString(36).substr(2, 9),
          text: textMessage,
          time: 'Just now',
          unread: true
        };
        setNotifications((prev) => [newNo, ...prev]);
        showToast(textMessage, 'success');
      }
    };

    window.addEventListener('bl1nk-notification', handleNewNotification);
    return () => {
      window.removeEventListener('bl1nk-notification', handleNewNotification);
    };
  }, []);

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleClearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // คีย์ลัดดักฟัง Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === '/') {
        // กด / เมื่อไม่ได้กำลังพิมพ์ใน input/textarea เพื่อส่องค้นหาด่วน
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ดึงข้อมูลหลักเซสชันเริ่มต้น
  const fetchSidebarData = async () => {
    try {
      // 1. ตรวจเช็ค Me
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push('/');
        return;
      }
      if (authData.user?.id) {
        localStorage.setItem('bl1nk_user_id', authData.user.id);
      }

      // 2. โหลด Projects, Folders, Tags, Trash คู่วิ่ง RLS
      const [projRes, foldRes, tagRes, trashRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/folders'),
        fetch('/api/tags'),
        fetch('/api/trash')
      ]);

      const [projData, foldData, tagData, trashData] = await Promise.all([
        projRes.json(),
        foldRes.json(),
        tagRes.json(),
        trashRes.json()
      ]);

      const sidebarUser = authData.user;
      const projects = projData.data || [];
      const folders = foldData.data || [];
      const tags = tagData.data?.tags || [];
      const trashCount = trashData.data?.length || 0;

      setData({
        user: sidebarUser,
        projects,
        folders,
        tags,
        trashCount
      });

      // ดึง favorites
      const favList = projects.filter((p: any) => p.is_favorite);
      setFavorites(favList);

      if (projects.length > 0 && !quickTaskProject) {
        setQuickTaskProject(projects[0].id);
      }

    } catch (e) {
      showToast('ระบบซิงค์เซสชันหน่วงชั่วคราว ดึงข้อมูลใหม่อัตโนมัติ...', 'alert');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSidebarData();
    }, 0);
    return () => clearTimeout(timer);
  }, [currentPath, onRefreshStates]);

  // หลบหลีกสเตตัสล็อกเอาต์
  const handleLogout = async () => {
    try {
      localStorage.removeItem('bl1nk_user_id');
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast('ทำลายข้อมูลแคช และปิดการเชื่อมต่อสำเร็จ', 'info');
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (e) {
      localStorage.removeItem('bl1nk_user_id');
      router.push('/');
    }
  };

  // กอร์ปสร้าง Tasks ด่วนจาก Command Line / Quick Action Modals
  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTaskTitle,
          project_id: quickTaskProject,
          type: quickTaskType,
          status: 'todo'
        })
      });

      const body = await res.json();
      if (!res.ok) {
        showToast(body.error || 'ไม่สามารถสร้างงานชิ้นนี้ได้', 'alert');
        return;
      }

      showToast(`สร้างสำนักงานด่วน "${quickTaskTitle}" รหัส ${body.data.id} เรียบร้อย`, 'success');
      setQuickTaskTitle('');
      setQuickTaskModal(false);
      fetchSidebarData();
      if (onRefreshStates) onRefreshStates();
    } catch (err) {
      showToast('เครือข่ายขัดข้างในการบันทึกงาน', 'alert');
    }
  };

  // ฟิลเตอร์สกรีน ค้นหาอัจฉริยะ (Spotlight Fuzzy Finder)
  const filteredCommandsAndData = () => {
    if (!searchQuery) return [];
    const qStr = searchQuery.toLowerCase();

    const results: any[] = [];

    // ค้นโครงการ
    data.projects.forEach((p) => {
      if (p.name.toLowerCase().includes(qStr)) {
        results.push({ type: 'project', label: `Space: ${p.name}`, id: p.id, action: () => router.push(`/project/${p.id}`) });
      }
    });

    // แนบคู่คำสั่งระบบ (Command Control Actions)
    const commands = [
      { type: 'command', label: 'Create New Task', icon: Plus, action: () => { setCommandPaletteOpen(false); setQuickTaskModal(true); } },
      { type: 'command', label: 'Go to Settings panel', icon: Settings, action: () => router.push('/settings') },
      { type: 'command', label: 'Wipe Cache & Log out', icon: LogOut, action: handleLogout },
      { type: 'command', label: 'See system trash bin', icon: Trash2, action: () => router.push('/trash') }
    ];

    commands.forEach((c) => {
      if (c.label.toLowerCase().includes(qStr)) {
        results.push(c);
      }
    });

    return results;
  };

  const toggleFolder = (folderId: string) => {
    setFoldersExpanded((prev) => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#080808] text-zinc-100 font-sans">
      
      {/* 1. TOAST POPOVER NOTIFIERS */}
      <div id="toast-layer" className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-xl border pointer-events-auto shadow-2xl flex items-center gap-3 min-w-[280px] max-w-[360px] ${
                toast.type === 'success'
                  ? 'bg-zinc-950/90 border-[#50C878]/30 text-emerald-400'
                  : toast.type === 'alert'
                  ? 'bg-zinc-950/90 border-red-500/30 text-[#FF6B6B]'
                  : 'bg-zinc-950/90 border-yellow-500/30 text-yellow-500'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              <div className="flex-1 text-xs font-semibold">{toast.message}</div>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. SIDEBAR SHELF (DESKTOP) */}
      <aside
        id="sidebar-desktop"
        className={`hidden md:flex flex-col h-full border-r border-[#FFD700]/10 bg-[#080808] transition-all duration-300 select-none p-5 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Header - glowing logo */}
        <div className="pb-6 mb-2 border-b border-[#FFD700]/10 flex items-center justify-between">
          <div onClick={() => router.push('/dashboard')} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.4)] flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              <div className="w-4 h-4 bg-black rounded-sm"></div>
            </div>
            <span className="text-xl font-display font-extrabold tracking-tighter text-[#FFD700]">
              bl1nk ink
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-zinc-650 hover:text-zinc-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User context menu */}
        <div className="p-3 mb-4 rounded-xl border border-white/5 bg-white/5 flex items-center gap-3">
          <img
            src={data.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="av"
            className="w-10 h-10 rounded-full border border-[#FFD700]/30 object-cover shrink-0 aspect-square max-w-none"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{data.user?.name || 'Alex Morgan'}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-display font-medium">Creative Director</p>
          </div>
        </div>

        {/* Scrollable nodes tree */}
        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4 smooth-scroll">
          {/* Section: Favorites */}
          {favorites.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] uppercase font-display tracking-widest text-zinc-500 flex items-center gap-1.5 mb-1.5">
                <Heart className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>Favorites</span>
              </p>
              {favorites.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/project/${p.id}`)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    currentPath.startsWith(`/project/${p.id}`) ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                    <span className="truncate">{p.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Workspace Projects Tree */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-display tracking-widest text-[#FFD700] flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3 h-3" />
              <span>Projects</span>
            </p>
            <div className="space-y-0.5">
              {data.projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/project/${p.id}`)}
                  className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    currentPath === `/project/${p.id}` ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-550" />
                    <span className="truncate">{p.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Modular Folders Nested Tree */}
          <div className="space-y-1">
            <div className="px-3 flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-display tracking-widest text-[#FFD700] flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3 text-[#FFD700]" />
                <span>Folders Hierarchy</span>
              </span>
              <button 
                onClick={() => {
                  setNewFolderParentId(null);
                  setShowNewFolderForm(!showNewFolderForm);
                }}
                className="text-zinc-500 hover:text-[#FFD700] duration-250 cursor-pointer"
                title="Create root folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {showNewFolderForm && (
              <form onSubmit={handleCreateFolderSubmit} className="mx-2 mb-3 p-2 bg-white/5 border border-white/10 rounded-lg space-y-2">
                <p className="text-[9px] uppercase tracking-wider text-[#FFD700]/80 font-display">
                  {newFolderParentId ? 'New Subfolder' : 'New Root Folder'}
                </p>
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-[#FFD700]"
                  required
                />
                <div className="flex items-center gap-1.5 justify-end">
                  <button 
                    type="button" 
                    onClick={() => { setShowNewFolderForm(false); setNewFolderName(''); }}
                    className="text-[9px] uppercase px-1.5 py-1 text-zinc-500 hover:text-zinc-350 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="text-[9px] uppercase px-2 py-1 bg-[#FFD700] text-black font-semibold rounded cursor-pointer duration-200 hover:bg-yellow-400"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1 px-1">
              {data.folders.filter((f) => !f.parent_id).map((f) => {
                const subFolders = data.folders.filter((sub) => sub.parent_id === f.id);
                const isExpanded = foldersExpanded[f.id];
                const folderProjects = data.projects.filter((p: any) => p.folder_id === f.id);

                return (
                  <div key={f.id} className="space-y-0.5 group/folder">
                    <div
                      onClick={() => toggleFolder(f.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer duration-200 ${
                        isExpanded ? 'text-zinc-200 bg-white/5' : 'text-zinc-400 hover:bg-[#FFD700]/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {subFolders.length > 0 || folderProjects.length > 0 ? (
                          isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#FFD700]/80" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-605" />
                        ) : <span className="w-3.5" />}
                        <span className="truncate font-medium">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/folder:opacity-100 duration-150 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewFolderParentId(f.id);
                            setShowNewFolderForm(true);
                          }}
                          className="hover:text-[#FFD700] text-zinc-600 transition-colors p-0.5"
                          title="Add subfolder"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFolder(f.id, e)}
                          className="hover:text-red-400 text-zinc-600 transition-colors p-0.5"
                          title="Delete folder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-0.5">
                        {/* Recursive-like Subfolders */}
                        {subFolders.map((sub) => {
                          const subExpanded = foldersExpanded[sub.id];
                          const subProjects = data.projects.filter((p: any) => p.folder_id === sub.id);

                          return (
                            <div key={sub.id} className="space-y-0.5 pl-3 group/subfolder">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolder(sub.id);
                                }}
                                className={`pl-3 pr-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between cursor-pointer ${
                                  subExpanded ? 'text-zinc-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {subProjects.length > 0 ? (
                                    subExpanded ? <ChevronDown className="w-3 h-3 text-[#FFD700]/70" /> : <ChevronRight className="w-3 h-3 text-zinc-650" />
                                  ) : <span className="w-3" />}
                                  <span className="truncate">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/subfolder:opacity-100 duration-150 shrink-0">
                                  <button
                                    onClick={(e) => handleDeleteFolder(sub.id, e)}
                                    className="hover:text-red-400 text-zinc-600 transition-colors p-0.5"
                                    title="Delete subfolder"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {subExpanded && subProjects.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => router.push(`/project/${p.id}`)}
                                  className={`pl-8 pr-2 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                                    currentPath === `/project/${p.id}` 
                                      ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold' 
                                      : 'text-zinc-650 hover:text-zinc-350 hover:bg-white/5'
                                  }`}
                                >
                                  <BookOpen className="w-3 h-3 text-zinc-650 shrink-0" />
                                  <span className="truncate">{p.name}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}

                        {/* Projects directly under this parent folder */}
                        {folderProjects.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => router.push(`/project/${p.id}`)}
                            className={`pl-6 pr-2 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                              currentPath === `/project/${p.id}` 
                                ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold' 
                                : 'text-zinc-550 hover:text-zinc-350 hover:bg-white/5'
                            }`}
                          >
                            <BookOpen className="w-3 h-3 text-zinc-650 shrink-0" />
                            <span className="truncate">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Tags Cloud system */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-display tracking-widest text-zinc-500 flex items-center gap-1.5 mb-1.5">
              <Hash className="w-3 h-3" />
              <span>Tag Cloud</span>
            </p>
            <div className="flex flex-wrap gap-1 px-3">
              {data.tags.map((t) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 rounded-md text-[10px] cursor-pointer hover:scale-105 active:scale-95 duration-200 border border-zinc-900 bg-white/5 shadow-sm"
                  style={{ color: t.color, borderColor: `${t.color}30` }}
                >
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer nodes */}
        <div className="p-3 border-t border-[#FFD700]/10 bg-[#080808] space-y-1">
          <div
            onClick={() => router.push('/trash')}
            className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all duration-200 ${
              currentPath === '/trash' ? 'bg-red-500/10 text-red-500 border-r-2 border-red-500 font-semibold' : 'text-zinc-500 hover:text-[#FF6B6B] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Trash Bin</span>
            </div>
            {data.trashCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-950/40 border border-red-500/20 text-red-400 text-[9px] font-mono font-bold">
                {data.trashCount}
              </span>
            )}
          </div>

          <div
            onClick={() => router.push('/integrations')}
            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 ${
              currentPath === '/integrations' ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold' : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cloud className="w-4 h-4 text-cyan-500/80" />
            <span>Google Workspace</span>
          </div>

          <div
            onClick={() => router.push('/canvas')}
            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 ${
              currentPath === '/canvas' ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold' : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid className="w-4 h-4 text-emerald-500" />
            <span>Flow Canvas</span>
          </div>

          <div
            onClick={() => router.push('/api-tests')}
            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 ${
              currentPath === '/api-tests' ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold font-bold' : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-500" />
            <span>API Tester Suite</span>
          </div>

          <div
            onClick={() => router.push('/settings')}
            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 ${
              currentPath === '/settings' ? 'text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700] font-semibold' : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings Panel</span>
          </div>
        </div>
      </aside>

      {/* 4. WORKSPACE WORK AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212]">
        
        {/* Nav Bar */}
        <header className="h-16 border-b border-[#FFD700]/10 backdrop-blur-md bg-[#080808]/50 px-4 md:px-8 flex items-center justify-between z-20">
          
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle/Mobile Trigger */}
            <button
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="hidden md:flex items-center justify-center p-2 rounded-lg bg-zinc-900 border border-zinc-900 hover:border-yellow-500/20 text-zinc-400 hover:text-zinc-200 cursor-pointer duration-300"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex md:hidden items-center justify-center p-2 rounded-lg bg-zinc-900 border border-zinc-900 hover:border-yellow-500/20 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Quick spotlight launcher */}
            <div
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:border-[#FFD700]/30 w-44 md:w-96 text-sm text-gray-400 cursor-pointer duration-300 group shadow-[0_0_10px_rgba(0,0,0,0.2)]"
            >
              <Search className="w-4 h-4 text-gray-400 group-hover:text-[#FFD700] duration-300" />
              <span className="flex-grow truncate text-left">Search (Cmd+K)</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-850 text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                k
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert badge system */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-yellow-500/20 text-zinc-400 hover:text-zinc-200 cursor-pointer relative transition-all duration-200"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter((n) => n.unread).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFD700] text-[9px] font-bold text-zinc-950 font-sans shadow-[0_0_10px_rgba(255,215,0,0.4)] animate-pulse">
                    {notifications.filter((n) => n.unread).length}
                  </span>
                )}
              </button>

              {/* Alerts popup */}
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-2 w-80 glass-panel p-4 rounded-xl flex flex-col gap-2.5 z-40"
                    >
                      <div className="flex items-center justify-between pointer-events-auto">
                        <span className="text-[10px] uppercase font-display tracking-widest text-zinc-400">System Notifications</span>
                        {notifications.filter((n) => n.unread).length > 0 && (
                          <span onClick={() => {
                            setNotifications(p => p.map(n => ({...n, unread: false})));
                            showToast('อัปเดตงานทั้งหมดเป็นอ่านแล้ว', 'info');
                          }} className="text-[9px] text-[#FFD700] cursor-pointer hover:underline font-display tracking-wider font-semibold">Mark all read</span>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                        {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="group/item p-2 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:bg-zinc-900/45 hover:border-yellow-500/10 text-xs flex flex-col gap-1.5 transition-all duration-200 cursor-pointer text-left"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-start gap-1.5 leading-relaxed">
                                {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 mt-1.5 animate-pulse" />}
                                <span className={`transition-colors text-[11px] ${n.unread ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}>{n.text}</span>
                              </div>
                              <button 
                                onClick={(e) => handleClearNotification(n.id, e)}
                                className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <span className="text-[8px] text-zinc-600 self-end font-mono uppercase tracking-widest">{n.time}</span>
                          </div>
                        ))}

                        {notifications.length === 0 && (
                          <div className="py-6 text-center text-zinc-650 text-[10px] font-display uppercase tracking-widest flex flex-col items-center gap-2">
                            <Sparkles className="w-4 h-4 text-zinc-700 animate-pulse" />
                            <span>No notifications</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Quick add triggers */}
            <div className="relative">
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="bg-[#FFD700] hover:bg-[#FFC000] text-black font-bold text-xs px-4 py-2 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,215,0,0.2)] hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black font-black" />
                <span className="hidden md:inline uppercase tracking-widest text-[10px]">Create</span>
              </button>

              <AnimatePresence>
                {quickAddOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setQuickAddOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-2 w-48 glass-panel p-2 rounded-xl flex flex-col gap-0.5 z-40"
                    >
                      <button
                        onClick={() => { setQuickAddOpen(false); setQuickTaskModal(true); }}
                        className="w-full text-left p-2 hover:bg-zinc-900/60 rounded-lg text-xs flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#FFD700]" />
                        <span>New Task / Event</span>
                      </button>
                      <button
                        onClick={() => { setQuickAddOpen(false); router.push('/settings?tab=general'); }}
                        className="w-full text-left p-2 hover:bg-zinc-900/60 rounded-lg text-xs flex items-center gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#FFD700]" />
                        <span>New Space Project</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar block dropdown */}
            <div className="relative">
              <img
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                src={data.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt="user"
                className="w-8 h-8 rounded-full border border-yellow-500/20 object-cover cursor-pointer hover:border-yellow-500 transition-all duration-300 shrink-0 aspect-square max-w-none"
              />

              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-2 w-52 glass-panel p-2 rounded-xl flex flex-col gap-0.5 z-40"
                    >
                      <div className="p-2 border-b border-zinc-900 mb-1 flex flex-col">
                        <span className="text-xs font-semibold text-white">{data.user?.name}</span>
                        <span className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">{data.user?.email}</span>
                      </div>
                      <button
                        onClick={() => { setUserDropdownOpen(false); router.push('/settings?tab=general'); }}
                        className="w-full text-left p-2 hover:bg-zinc-900/60 rounded-lg text-xs flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Settings Panel</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left p-2 hover:bg-red-950/20 rounded-lg text-xs text-[#FF6B6B] flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out Session</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content body wrapper */}
        <main className="flex-grow overflow-y-auto px-4 py-6 md:px-8 md:py-8 smooth-scroll relative">
          {children}
        </main>
      </div>

      {/* 5. SPOTLIGHT FUZZY COMMAND PALETTE MODAL */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 bg-[#080808]/80 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-lg glass-panel p-4 rounded-2xl border border-yellow-500/20 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center gap-3 px-2 py-1.5 border-b border-zinc-900">
                <Search className="w-4 h-4 text-yellow-500" />
                <input
                  type="text"
                  placeholder="Type an command or search spaces... Example: Create task"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow bg-transparent border-none text-sm text-white placeholder-zinc-600 focus:outline-none"
                  autoFocus
                />
                <button onClick={() => setCommandPaletteOpen(false)} className="text-zinc-550 text-[10px] font-mono border border-zinc-900 px-1.5 py-0.5 rounded bg-zinc-950/60">
                  ESC
                </button>
              </div>

              {/* Lists values */}
              <div className="mt-3.5 max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                {searchQuery ? (
                  filteredCommandsAndData().length > 0 ? (
                    filteredCommandsAndData().map((item, id) => {
                      const IconCmd = item.icon || Layers;
                      return (
                        <div
                          key={id}
                          onClick={() => {
                            item.action();
                            setCommandPaletteOpen(false);
                            setSearchQuery('');
                          }}
                          className="p-2.5 rounded-xl text-xs hover:bg-yellow-500/10 hover:text-white cursor-pointer flex items-center justify-between border border-transparent hover:border-yellow-500/10 duration-200"
                        >
                          <div className="flex items-center gap-2.5">
                            <IconCmd className="w-4 h-4 text-zinc-500" />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[9px] uppercase font-mono text-zinc-600">{item.type}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-zinc-600">No match results for &apos;{searchQuery}&apos;</div>
                  )
                ) : (
                  <div className="p-4 space-y-3">
                    <p className="text-[10px] uppercase font-display tracking-widest text-zinc-600 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Ready Commands Tools</span>
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      <div onClick={() => { setCommandPaletteOpen(false); setQuickTaskModal(true); }} className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-yellow-500/20 hover:text-yellow-500 text-xs cursor-pointer duration-300">
                        ⚡ Quick Add New Task / Note
                      </div>
                      <div onClick={() => { setCommandPaletteOpen(false); router.push('/settings?tab=general'); }} className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-yellow-500/20 hover:text-yellow-500 text-xs cursor-pointer duration-300">
                        ⚙️ Configure integrations
                      </div>
                      <div onClick={() => { setCommandPaletteOpen(false); router.push('/trash'); }} className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-[#FF6B6B]/20 hover:text-[#FF6B6B] text-xs cursor-pointer duration-300">
                        🗑️ View deleted trash items
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: QUICK ADD TASK */}
      <AnimatePresence>
        {quickTaskModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass-panel p-6 rounded-2xl border border-yellow-500/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span>สร้างเป้าหมายงานใหม่ด่วน</span>
                </h3>
                <button onClick={() => setQuickTaskModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuickTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Task Title</label>
                  <input
                    type="text"
                    required
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="รายละเอียดภารกิจ..."
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Destination Space</label>
                    <select
                      value={quickTaskProject}
                      onChange={(e) => setQuickTaskProject(e.target.value)}
                      className="w-full bg-zinc-950 border border-[#1a1a1a] rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500"
                    >
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Type Category</label>
                    <select
                      value={quickTaskType}
                      onChange={(e) => setQuickTaskType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-[#1a1a1a] rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500"
                    >
                      <option value="task">Task (งานทั่วไป)</option>
                      <option value="milestone">Milestone (หมุดหมายใหญ่)</option>
                      <option value="note">Note (ข้อมูลมาร์กดาวน์)</option>
                      <option value="event">Event (ตารางนัดหมาย)</option>
                      <option value="habit">Habit (พฤติกรรมประจำวัน)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 text-[10px] font-display font-extrabold uppercase tracking-widest py-2.5 px-4 rounded-xl cursor-pointer duration-300 shadow-md gold-glow-btn text-center"
                >
                  Confirm dispatch task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MOBILE DRAWER OVERLAY SIDEBAR */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3 }}
              className="relative w-72 h-full bg-[#0c0c0c] border-r border-zinc-900 flex flex-col p-4 z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-display font-black text-sm tracking-widest text-white uppercase">bl1nk ink</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Simple lists on mobile */}
              <div className="flex-grow overflow-y-auto space-y-4 pb-24">
                <div onClick={() => { setMobileMenuOpen(false); router.push('/dashboard'); }} className="p-2 hover:bg-zinc-900 rounded-xl text-xs cursor-pointer">
                  🏠 Dashboard
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 pl-2">Spaces Projects</p>
                  {data.projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { setMobileMenuOpen(false); router.push(`/project/${p.id}`); }}
                      className="p-2 hover:bg-zinc-900 rounded-xl text-xs cursor-pointer truncate pl-4"
                    >
                      📓 {p.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-900 pt-4 space-y-1.5 mb-24">
                <div onClick={() => { setMobileMenuOpen(false); router.push('/integrations'); }} className="p-2 hover:bg-zinc-900 rounded-xl text-xs cursor-pointer flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-500/80" />
                  <span>Integrations</span>
                </div>
                <div onClick={() => { setMobileMenuOpen(false); router.push('/canvas'); }} className="p-2 hover:bg-zinc-900 rounded-xl text-xs cursor-pointer flex items-center gap-2">
                  <Grid className="w-4 h-4 text-emerald-500" />
                  <span>Canvas</span>
                </div>
                <div onClick={() => { setMobileMenuOpen(false); router.push('/trash'); }} className="p-2 hover:bg-zinc-900 rounded-xl text-xs cursor-pointer flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-zinc-500" />
                  <span>Trash bin</span>
                </div>
                <div onClick={() => { setMobileMenuOpen(false); router.push('/settings'); }} className="p-2 hover:bg-zinc-900 rounded-xl text-xs cursor-pointer flex items-center gap-2">
                  <Settings className="w-4 h-4 text-zinc-500" />
                  <span>Settings Panel</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. MOBILE BOTTOM NAVIGATION (STICKY FOOTER) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#080808]/90 backdrop-blur-md border-t border-zinc-900 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-40 flex items-center justify-around px-2 pt-2 pb-6">
        <div onClick={() => router.push('/dashboard')} className={`flex flex-col items-center gap-0.5 p-2 cursor-pointer ${currentPath === '/dashboard' ? 'text-[#FFD700]' : 'text-zinc-500'}`}>
          <Activity className="w-5 h-5" />
          <span className="text-[9px] font-display">Hub</span>
        </div>
        <div onClick={() => router.push('/canvas')} className={`flex flex-col items-center gap-0.5 p-2 cursor-pointer ${currentPath === '/canvas' ? 'text-[#FFD700]' : 'text-zinc-500'}`}>
          <Grid className="w-5 h-5" />
          <span className="text-[9px] font-display">Flow</span>
        </div>
        
        <div className="flex flex-col items-center cursor-pointer relative" onClick={() => setQuickAddOpen(!quickAddOpen)}>
          <div className="absolute -top-6 bg-[#FFD700] hover:bg-yellow-400 p-3 rounded-full text-black shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-transform active:scale-95">
            <Plus className="w-5 h-5" />
          </div>
        </div>

        <div onClick={() => router.push('/integrations')} className={`flex flex-col items-center gap-0.5 p-2 cursor-pointer ${currentPath === '/integrations' ? 'text-[#FFD700]' : 'text-zinc-500'}`}>
          <Cloud className="w-5 h-5" />
          <span className="text-[9px] font-display">Drive</span>
        </div>
        <div onClick={() => router.push('/settings')} className={`flex flex-col items-center gap-0.5 p-2 cursor-pointer ${currentPath === '/settings' ? 'text-[#FFD700]' : 'text-zinc-500'}`}>
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-display">Config</span>
        </div>
      </nav>

      {/* ONBOARDING TOUR MODAL OVERLAY */}
      <AnimatePresence>
        {tourActive && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-950 border border-yellow-500/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
            >
              {/* Top ambient lights */}
              <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Progress dots & Skip button */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        tourStep === step ? 'w-8 bg-yellow-500' : 'w-2 bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('blink_onboarding_completed', 'true');
                    }
                    setTourActive(false);
                    showToast('ข้ามการแนะนำระบบเรียบร้อยแล้ว ยินดีต้อนรับสู่ bl1nk ink!', 'info');
                  }}
                  className="text-[10px] uppercase font-display tracking-widest text-zinc-500 hover:text-white duration-150 cursor-pointer"
                >
                  Skip Tour
                </button>
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {tourStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="inline-flex p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-display font-black tracking-tight text-white uppercase">
                      1. Premium Cinematic Experience
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      ยินดีต้อนรับสู่ <span className="text-yellow-400 font-bold">bl1nk ink</span> สเปซทำงานระดับ Ultra-Premium 
                      ที่ออกแบบโดยสถาปัตยกรรมสีเข้มเงียบสงบ (Cinematic Dark Aesthetic) 
                      และลดการใช้ปุ่มที่รกรุงรัง เพื่อช่วยให้สมองของคุณจดจ่ออยู่กับสิ่งสำคัญอย่างสูงสุด
                    </p>
                    <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1.5">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">💡 เคล็ดลับความฟินระดับสายตา:</p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        คุณสามารถพับหรือกาง Sidebar หลักได้ตลอดเวลาผ่านปุ่มขอบจอเพื่อสร้างพื้นที่จดจ่อแบบกว้างขวางไร้รอยต่อ
                      </p>
                    </div>
                  </motion.div>
                )}

                {tourStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Grid className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-display font-black tracking-tight text-white uppercase">
                      2. Interactive 5-View Data System
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      บริหารงานและบันทึกความจำได้ยืดหยุ่นถึง <span className="text-cyan-400 font-bold">5 มิติมุมมองระบบข้อมูล (5-View System)</span>:
                    </p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className="p-2 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[9px] font-bold text-zinc-300">LIST</div>
                      <div className="p-2 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[9px] font-bold text-zinc-300">BOARD</div>
                      <div className="p-2 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[9px] font-bold text-zinc-300">TIMELINE</div>
                      <div className="p-2 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[9px] font-bold text-zinc-300">CALENDAR</div>
                      <div className="p-2 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[9px] font-bold text-zinc-300">HABIT</div>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      สลับมิติมุมมองเหล่านี้ได้ตลอดเวลาที่ด้านบนของบอร์ดโปรเจกต์ เพื่อเรียงร้อยเป้าหมายในสายตาที่คุณปรารถนา
                    </p>
                  </motion.div>
                )}

                {tourStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-display font-black tracking-tight text-white uppercase">
                      3. Command Palette Control Center
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      ควบคุมทุกส่วนของระบบได้อย่างรวดเร็วโดยไม่ต้องปล่อยมือจากคีย์บอร์ด ผ่าน <span className="text-amber-400 font-bold">Command Palette (แผงครอบจักรวาล)</span>
                    </p>
                    <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-center">
                      <span className="font-mono text-xs bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-amber-400 font-bold">
                        Cmd + K
                      </span>
                      <span className="text-zinc-500 mx-2 text-xs">หรือ</span>
                      <span className="font-mono text-xs bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-amber-400 font-bold">
                        Ctrl + K
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed text-center font-sans">
                      หรือกดพิมพ์คีย์ <kbd className="bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 text-[10px] font-mono text-zinc-300">/</kbd> บนจอเพื่อเปิดแผงคำสั่ง ค้นหาโปรเจกต์ สร้างภารกิจ หรือตั้งค่าระบบได้ทันที
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between border-t border-zinc-900 pt-6 mt-8">
                <button
                  type="button"
                  disabled={tourStep === 1}
                  onClick={() => setTourStep((prev) => Math.max(1, prev - 1))}
                  className="px-4 py-2 rounded-xl text-[10px] uppercase font-display font-bold tracking-wider border border-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-800 disabled:opacity-20 duration-150 cursor-pointer"
                >
                  Back
                </button>

                {tourStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setTourStep((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl text-[10px] uppercase font-display font-bold tracking-widest bg-yellow-500 hover:bg-yellow-400 text-zinc-950 shadow-lg gold-glow duration-150 cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.localStorage.setItem('blink_onboarding_completed', 'true');
                      }
                      setTourActive(false);
                      showToast('เสร็จสิ้นการทัวร์ระบบ ยินดีต้อนรับอย่างเป็นทางการ!', 'success');
                    }}
                    className="px-6 py-2 rounded-xl text-[10px] uppercase font-display font-black tracking-widest bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 shadow-lg gold-glow-btn duration-150 cursor-pointer animate-pulse"
                  >
                    Enter Space
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
