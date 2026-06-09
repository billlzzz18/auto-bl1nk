'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import WorkspaceShell from '@/components/WorkspaceShell';
import {
  Sparkles,
  Heart,
  Edit3,
  CheckCircle,
  Clock,
  Eye,
  Kanban,
  Table,
  Grid as GridIcon,
  Calendar as CalendarIcon,
  TrendingUp,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  Paperclip,
  CheckSquare,
  Bookmark,
  Share2,
  FileText,
  AlertCircle,
  Activity,
  HelpCircle
} from 'lucide-react';

type ProjectView = 'table' | 'kanban' | 'grid' | 'timeline' | 'calendar';

/**
 * JSDoc: หน้าโปรเจกต์จัดการบอร์ดแบบผสมผสาน (page /app/project/[id])
 * รวมการรัน 5 มุมมองหลัก (Table, Kanban, Grid, Timeline, Calendar)
 * มีลิ้นชักสไลด์ข้าง (Slide-Over Panel) สำหรับเปิดส่องรายละเอียดงาน
 * และบรรจุ lobeditor สำหรับจดบันทึกมาร์กดาวน์ด้วยคำสั่ง Slash (/)
 */
export default function ProjectWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  
  // การปรับสลับมุมมองพรีเมียม
  const [activeView, setActiveView] = useState<ProjectView>('table');

  // ตัวแก้ไขข้อมูลงโปรเจกต์ด่วน
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [renaming, setRenaming] = useState(false);

  // ลิ้นชักรายละเอียดภารกิจ (Slide-Over Drawer)
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // สเตตยิบย่อยของงานที่กำลังโฟกัสใน Drawer
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerDesc, setDrawerDesc] = useState('');
  const [drawerStatus, setDrawerStatus] = useState('todo');
  const [drawerPriority, setDrawerPriority] = useState('medium');
  const [drawerDueDate, setDrawerDueDate] = useState('');
  const [drawerType, setDrawerType] = useState('task');
  const [drawerTags, setDrawerTags] = useState<string[]>([]);
  const [drawerSaving, setDrawerSaving] = useState(false);

  // lobeditor Content State (Markdown Notes)
  const [markdownNotes, setMarkdownNotes] = useState('');
  const [showSlashHints, setShowSlashHints] = useState(false);

  // Lobe AI Workspace & Customization States
  const [lobeEditorMode, setLobeEditorMode] = useState<'edit' | 'preview'>('edit');
  const [drawerIcon, setDrawerIcon] = useState('📝');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Drag and Drop States for Kanban View
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColId(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    setDragOverColId(null);

    if (taskId) {
      await handleMoveTaskStatus(taskId, colId);
    }
  };

  const handleMoveTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const taskToMove = tasks.find((t) => t.id === taskId);
      if (!taskToMove || taskToMove.status === newStatus) return;

      // Update locally first for premium responsive feel
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        // Revert on error
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: taskToMove.status } : t))
        );
      } else {
        if (selectedTask?.id === taskId) {
          setDrawerStatus(newStatus);
        }
        // ส่งการแจ้งเตือนแบบ dynamic
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bl1nk-notification', {
            detail: { text: `ภารกิจ "${taskToMove.title || taskId}" ถูกย้ายสเตตัสไปยัง "${newStatus}" เรียบร้อยแล้ว` }
          }));
        }
      }
    } catch (err) {
      const origTask = tasks.find((t) => t.id === taskId);
      if (origTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: origTask.status } : t))
        );
      }
    }
  };

  // ตารางปฏิทินยึดเดือนปัจจุบัน
  const [currentYear] = useState(2026);
  const [currentMonth] = useState(5); // June (0-indexed = 5)

  // ดึงรายละเอียดโปรเจกต์และแท็บสัมพันธ์
  const loadWorkspace = async () => {
    try {
      const projRes = await fetch(`/api/projects/${id}`);
      if (!projRes.ok) {
        alert('Access Denied: คุณไม่มีสิทธิ์เข้าถึงหรือโปรเจกต์นี้ถูกย้ายลบแล้ว');
        router.push('/dashboard');
        return;
      }
      const projData = await projRes.json();
      const loadedProj = projData.data;

      setProject(loadedProj);
      setProjectName(loadedProj.name);
      setProjectDesc(loadedProj.description || '');
      setIsFav(loadedProj.is_favorite);

      // โหลด Tasks ภายใต้ ID นี้
      const tskRes = await fetch(`/api/tasks?project_id=${id}`);
      const tskData = await tskRes.json();
      setTasks(tskData.data || []);

      // โหลดแท็กสีสแปน
      const tagRes = await fetch('/api/tags');
      const tagData = await tagRes.json();
      setTags(tagData.data?.tags || []);

      const allProjRes = await fetch('/api/projects');
      const allProjData = await allProjRes.json();
      setAllProjects(allProjData.data || []);

      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWorkspace();
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  // สลับสเตตัสงานแบบด่วน (Fast toggle done)
  const handleToggleTask = async (task: any) => {
    try {
      const updatedStatus = task.status === 'done' ? 'todo' : 'done';
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus })
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: updatedStatus } : t))
        );
        if (selectedTask?.id === task.id) {
          setDrawerStatus(updatedStatus);
        }
      }
    } catch (err) {}
  };

  // ดำเนินการย้ายโปรเจกต์ไป Favorite / Unfavorite ด้วยการคลิกเดียว
  const handleToggleFavorite = async () => {
    try {
      const nextFav = !isFav;
      setIsFav(nextFav);
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: nextFav })
      });
    } catch (e) {}
  };

  // ปรับบันทึกชื่อโปรเจกต์
  const handleSaveProjectDetails = async () => {
    setRenaming(true);
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, description: projectDesc })
      });
      setRenaming(false);
    } catch (e) {
      setRenaming(false);
    }
  };

  // เปิดดูระเบียนสไลด์ขวา (Open Slide Drawer Panel)
  const openTaskDrawer = (task: any) => {
    setSelectedTask(task);
    setDrawerTitle(task.title);
    setDrawerDesc(task.description || '');
    setDrawerStatus(task.status || 'todo');
    setDrawerPriority(task.priority || 'medium');
    setDrawerDueDate(task.due_date || '');
    setDrawerType(task.type || 'task');
    setDrawerTags(task.tags || []);
    setMarkdownNotes(task.notes_markdown || '');
    setDrawerIcon(task.icon || '📝');
    setLobeEditorMode('edit');
    setShowAiPanel(false);
    setAiError(null);
    setAiPrompt('');
    setDrawerOpen(true);
  };

  // บันทึกความเปลี่ยนแปลงภายใน Drawer
  const handleSaveDrawerDetails = async () => {
    if (!selectedTask) return;
    setDrawerSaving(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: drawerTitle,
          description: drawerDesc,
          status: drawerStatus,
          priority: drawerPriority,
          due_date: drawerDueDate,
          type: drawerType,
          tags: drawerTags,
          notes_markdown: markdownNotes,
          icon: drawerIcon
        })
      });

      const body = await res.json();
      if (!res.ok) {
        alert(body.error || 'เกิดปัญหาตรวจสอบ Tag Rules ไม่ผ่าน');
        setDrawerSaving(false);
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? body.data : t))
      );
      setDrawerSaving(false);
      setDrawerOpen(false);
    } catch (e) {
      setDrawerSaving(false);
    }
  };

  // นำลบงานออกจากบอร์ดด่วน
  const handleDeleteTaskInsideDrawer = async () => {
    if (!selectedTask) return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการย้ายงานชิ้นนี้ไปถังขยะ?')) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
        setDrawerOpen(false);
      }
    } catch (e) {}
  };

  // คีย์ฟังคำสั่ง Slash (/) ภายใน lobeditor
  const handleMarkdownChange = (val: string) => {
    setMarkdownNotes(val);
    if (val.endsWith('/')) {
      setShowSlashHints(true);
    } else {
      setShowSlashHints(false);
    }
  };

  // ดำเนินการยัดคำสั่งฟังก์ชั่นด่วนมาร์กดาวน์พรีเมียม
  const insertSlashCommand = (cmd: string) => {
    let replacedText = markdownNotes.slice(0, -1); // หั่น / ออก
    if (cmd === 'todo') {
      replacedText += '- [ ] ';
    } else if (cmd === 'h1') {
      replacedText += '# ';
    } else if (cmd === 'h2') {
      replacedText += '## ';
    } else if (cmd === 'code') {
      replacedText += '```js\n\n```';
    } else if (cmd === 'tag') {
      replacedText += '[TAG: Important]';
    }
    setMarkdownNotes(replacedText);
    setShowSlashHints(false);
  };

  // ระบบ Streamdown AI (Lobe Chat-Style Streaming)
  const runStreamdownAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiIsGenerating(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `โปรดช่วยสรุปและสร้างมาร์กดาวน์อย่างพรีเมียมและสวยงามสำหรับเรื่องนี้: ${aiPrompt}`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ตรวจไม่พบ API Key หรือเกิดข้อผิดพลาดจาก Gemini API');
      }

      const textToStream = data.text || '';
      let index = 0;
      setMarkdownNotes('');
      // จำลองเอฟเฟกต์การพิมพ์ (Streamdown Typing animation) ความเสถียร 100%
      const interval = setInterval(() => {
        if (index < textToStream.length) {
          const chunk = textToStream.slice(index, index + 4);
          setMarkdownNotes((prev) => prev + chunk);
          index += 4;
        } else {
          clearInterval(interval);
          setAiIsGenerating(false);
          setAiPrompt('');
        }
      }, 15);
    } catch (err: any) {
      setAiIsGenerating(false);
      setAiError(err.message || 'เกิดข้อผิดพลาดบางประการ');
    }
  };

  // สร้างงานย่อยใหม่
  const handleCreateSubTask = async (parentId: string) => {
    const subTitle = prompt('รบกวนกรอกรายละเอียดของงานย่อย Sub-Task:');
    if (!subTitle) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subTitle,
          project_id: id,
          parent_id: parentId,
          type: 'task',
          status: 'todo'
        })
      });

      if (res.ok) {
        loadWorkspace();
      }
    } catch (err) {}
  };

  // ควบคุมเซกเมนต์วิวย่อย 5 ประเภท
  const renderViewContent = () => {
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-20 glass-panel rounded-2xl border border-zinc-900">
          <Bookmark className="w-10 h-10 text-zinc-600 mb-3 animate-pulse" />
          <h4 className="text-sm font-semibold text-zinc-300">Workspace is fully clean</h4>
          <p className="text-zinc-550 text-xs mt-1 text-center max-w-sm">
            โปรเจกต์นี้ยังไม่มีภารกิจภายใน รบกวนคลิกปุ่ม &quot;+ Item&quot; ด้านขวาบนเพื่อปักหมุดข้อตกลงงานชิ้นแรก
          </p>
        </div>
      );
    }

    // ----------------------------------------------------
    // VIEW 1: FLEET TABLE SPREADSHEET WITH INLINE NODES
    // ----------------------------------------------------
    if (activeView === 'table') {
      // คัดแยก parent nodes และ child nodes
      const parentTasks = tasks.filter((t) => !t.parent_id);

      return (
        <div id="fleet-table-container" className="overflow-x-auto glass-panel p-3 rounded-2xl border border-zinc-850 bg-zinc-950/30 shadow-2xl">
          <table className="w-full text-xs text-left text-zinc-300 border-collapse border border-zinc-800/80">
            <thead>
              <tr className="bg-zinc-950/90 text-zinc-400 uppercase tracking-wider text-[10px] font-display">
                <th className="py-3 px-4 w-12 text-center border border-zinc-805/80">Status</th>
                <th className="py-3 px-4 border border-zinc-805/80">Task Hierarchy Nodes</th>
                <th className="py-3 px-4 w-32 border border-zinc-805/80">Priority</th>
                <th className="py-3 px-4 w-32 border border-zinc-805/80">Due Date</th>
                <th className="py-3 px-4 w-28 text-center border border-zinc-805/80">Reference ID</th>
              </tr>
            </thead>
            <tbody>
              {parentTasks.map((t) => {
                const childTasks = tasks.filter((child) => child.parent_id === t.id);
                return (
                  <React.Fragment key={t.id}>
                    {/* Parent Row */}
                    <tr className="hover:bg-zinc-900/40 group duration-150 transition-colors">
                      <td className="py-3 px-4 text-center border border-zinc-800/60">
                        <input
                          type="checkbox"
                          checked={t.status === 'done'}
                          onChange={() => handleToggleTask(t)}
                          className="w-4 h-4 text-yellow-500 border-zinc-700 bg-zinc-950 rounded cursor-pointer shrink-0"
                        />
                      </td>
                      <td className="py-3 px-4 border border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => openTaskDrawer(t)}
                            className={`font-semibold cursor-pointer text-zinc-200 hover:text-[#FFD700] flex items-center gap-1.5 truncate ${
                              t.status === 'done' ? 'line-through text-zinc-500' : ''
                            }`}
                          >
                            <span className="text-sm shrink-0">{t.icon || '📝'}</span>
                            <span>{t.title}</span>
                          </span>
                          {childTasks.length > 0 && (
                            <span className="px-1.5 py-0.3 rounded bg-zinc-900 text-zinc-500 text-[9px] font-mono border border-zinc-800/50">
                              +{childTasks.length} nested
                            </span>
                          )}
                          <button
                            onClick={() => handleCreateSubTask(t.id)}
                            className="hidden group-hover:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 hover:text-[#FFD700] text-[9px] border border-zinc-800/60"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add sub</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-zinc-800/60">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${
                          t.priority === 'high' 
                            ? 'bg-red-950/40 text-[#FF6B6B] border-red-900/40' 
                            : t.priority === 'medium'
                            ? 'bg-amber-950/40 text-[#FFD700] border-amber-900/40'
                            : 'bg-emerald-950/40 text-[#50C878] border-emerald-900/40'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-450 font-mono text-[11px] border border-zinc-800/60">{t.due_date}</td>
                      <td className="py-3 px-4 text-center border border-zinc-800/60">
                        <span className="text-[10px] font-mono text-zinc-500 tracking-widest bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-900">
                          {t.id}
                        </span>
                      </td>
                    </tr>

                    {/* Children Rows render */}
                    {childTasks.map((child) => (
                      <tr key={child.id} className="bg-zinc-950/30 hover:bg-zinc-900/20 duration-150 transition-colors">
                        <td className="py-2.5 px-4 text-center border border-zinc-800/40">
                          <input
                            type="checkbox"
                            checked={child.status === 'done'}
                            onChange={() => handleToggleTask(child)}
                            className="w-3.5 h-3.5 text-yellow-500 border-zinc-700 bg-zinc-950 rounded cursor-pointer shrink-0"
                          />
                        </td>
                        <td className="py-2.5 px-4 pl-10 border border-zinc-800/40">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-650">└─</span>
                            <span
                              onClick={() => openTaskDrawer(child)}
                              className={`cursor-pointer hover:text-yellow-500 flex items-center gap-1.5 truncate text-zinc-350 text-xs ${
                                child.status === 'done' ? 'line-through text-zinc-500 font-medium' : ''
                              }`}
                            >
                              <span className="text-xs shrink-0">{child.icon || '📝'}</span>
                              <span>{child.title}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[10px] text-zinc-500 italic uppercase border border-zinc-800/40">subtask</td>
                        <td className="py-2.5 px-4 text-zinc-500 font-mono text-[10px] border border-zinc-800/40">{child.due_date}</td>
                        <td className="py-2.5 px-4 text-center border border-zinc-800/40">
                          <span className="text-[9px] font-mono text-zinc-650 bg-zinc-950/20 px-1.5 py-0.3 rounded border border-zinc-900/30">
                            {child.id}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // ----------------------------------------------------
    // VIEW 2: KANBAN COLUMN BOARD (Todo, Progress, Review, Done)
    // ----------------------------------------------------
    if (activeView === 'kanban') {
      const columns = [
        { id: 'todo', title: 'To Do list', borderCol: 'border-t-yellow-500/20' },
        { id: 'in_progress', title: 'In Progress boards', borderCol: 'border-t-cyan-500/20' },
        { id: 'review', title: 'Under Review', borderCol: 'border-t-purple-500/20' },
        { id: 'done', title: 'Deployed Done', borderCol: 'border-t-[#50C878]/20' }
      ];

      return (
        <div id="kanban-grid-board" className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragEnter={(e) => handleDragEnter(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`glass-panel p-4 rounded-2xl border-t-2 ${col.borderCol} flex flex-col gap-3 min-h-[420px] transition-all duration-200 ${
                  dragOverColId === col.id 
                    ? 'border-yellow-500/40 bg-yellow-500/[0.015] scale-[1.01] shadow-[0_0_20px_rgba(255,215,0,0.03)] outline-dashed outline-1 outline-yellow-500/20' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1.5">
                  <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-zinc-400">
                    {col.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-zinc-950 border border-zinc-900 text-[10px] font-mono text-zinc-500">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-grow space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openTaskDrawer(t)}
                      className={`p-3 bg-zinc-950/40 border rounded-xl cursor-grab duration-150 flex flex-col gap-2 relative group transition-all ${
                        draggingTaskId === t.id 
                          ? 'opacity-40 border-yellow-500/30 bg-yellow-500/5 scale-95 shadow-none' 
                          : 'border-[#1a1a1a] hover:border-zinc-850 hover:bg-zinc-950/60 active:cursor-grabbing'
                      }`}
                    >
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-yellow-500 duration-150 flex items-center gap-1.5 truncate">
                        <span className="text-sm shrink-0">{t.icon || '📝'}</span>
                        <span>{t.title}</span>
                      </span>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] uppercase font-bold tracking-wider border ${
                          t.priority === 'high' 
                            ? 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]' 
                            : t.priority === 'medium'
                            ? 'bg-[#fef7e0] text-[#b06000] border-[#feebc8]'
                            : 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                        }`}>
                          {t.priority}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-650">
                          <span>{t.id}</span>
                          <span>•</span>
                          <span>{t.due_date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ----------------------------------------------------
    // VIEW 3: BENTO GRID (GALLERY VIEWS)
    // ----------------------------------------------------
    if (activeView === 'grid') {
      return (
        <div id="gallery-bento-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => openTaskDrawer(t)}
              className="glass-panel p-5 rounded-2xl border border-zinc-900 hover:border-yellow-500/20 shadow-md cursor-pointer duration-300 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-yellow-500/5 to-transparent blur-md pointer-events-none" />
              <div className="flex items-start justify-between gap-2">
                <span className="font-display font-black text-white text-[11px] tracking-widest uppercase bg-zinc-950 border border-zinc-900 px-2.5 py-0.5 rounded">
                  {t.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold uppercase ${
                  t.status === 'done' ? 'bg-emerald-950/35 text-emerald-400' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {t.status}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-150 mt-3 flex items-center gap-1.5 truncate group-hover:text-yellow-500 duration-200">
                <span className="text-sm shrink-0">{t.icon || '📝'}</span>
                <span>{t.title}</span>
              </h4>
              <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2 h-8 leading-relaxed">{t.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับการปฏิบัติภารกิจนี้'}</p>
              
              <div className="flex items-center justify-between border-t border-zinc-900/60 mt-4 pt-3 text-[10px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-650" />
                  <span>{t.due_date}</span>
                </span>
                <span className="uppercase text-[9px]">{t.priority} priority</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // ----------------------------------------------------
    // VIEW 4: TIMELINE (GANTT TRACKING VIEWS)
    // ----------------------------------------------------
    if (activeView === 'timeline') {
      return (
        <div id="timeline-gantt-board" className="glass-panel p-5 rounded-2xl border border-zinc-900 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-[10px] uppercase font-display tracking-widest text-zinc-400">Project Gantt Track Timeline (Quarter View)</span>
            <span className="text-[9px] text-[#FFD700] uppercase tracking-widest font-mono">2026 June</span>
          </div>

          <div className="space-y-3">
            {tasks.map((t) => {
              // ม็อคตำแหน่งวันกว้างๆ ขวามือ
              const offsetVal = Math.floor(Math.random() * 40);
              const widthVal = Math.max(30, Math.floor(Math.random() * 60));

              return (
                <div key={t.id} className="grid grid-cols-12 items-center gap-4 py-1.5 border-b border-zinc-900/20">
                  <div className="col-span-3 truncate text-xs font-semibold text-zinc-300 hover:text-yellow-500 cursor-pointer" onClick={() => openTaskDrawer(t)}>
                    {t.title}
                  </div>
                  <div className="col-span-9 relative h-6 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900/60">
                    <div
                      style={{ left: `${offsetVal}%`, width: `${widthVal}%` }}
                      className="absolute top-1 h-4 rounded-md bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 shadow-[0_0_10px_rgba(255,215,0,0.1)] shrink"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // VIEW 5: CALENDAR VIEW (MONTHLY DETAILED GRID)
    // ----------------------------------------------------
    if (activeView === 'calendar') {
      // June 2026 มี 30 วัน เริ่มต้นที่วันจันทร์
      const days = Array.from({ length: 30 }, (_, index) => index + 1);

      return (
        <div id="calendar-grid-module" className="glass-panel p-5 rounded-3xl border border-zinc-900 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-[10px] uppercase font-display tracking-widest text-zinc-400">June 2026 Calendar Grid</span>
            <span className="text-[9px] text-yellow-500 font-mono tracking-widest">30 Days Month</span>
          </div>

          {/* Days labels */}
          <div className="grid grid-cols-7 text-center text-[9px] uppercase font-display tracking-widest text-zinc-600 font-semibold mb-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days Grid block */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const formattedDayStr = `2026-06-${day.toString().padStart(2, '0')}`;
              const dayTasks = tasks.filter((t) => t.due_date === formattedDayStr);

              return (
                <div
                  key={day}
                  className="min-h-16 p-1 bg-zinc-950/40 border border-[#18181b]/60 hover:border-yellow-500/20 rounded-xl duration-150 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-zinc-550 block text-right">{day}</span>
                  
                  {/* Plumb matching items tags Inside box */}
                  <div className="space-y-0.5 mt-1 overflow-hidden">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openTaskDrawer(t)}
                        className="px-1 py-0.5 rounded bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/10 text-[8px] text-yellow-500 truncate cursor-pointer uppercase font-mono"
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <WorkspaceShell onRefreshStates={loadWorkspace}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[65vh] text-[#FFD700]">
          <Activity className="w-8 h-8 animate-spin mb-3 text-yellow-500" />
          <span className="font-display tracking-[0.2em] text-[10px] uppercase">Reticulating workspace canvas...</span>
        </div>
      ) : (
        <div id="project-workspace-root" className="space-y-6 pb-20 relative">
          
          {/* HEADER SECTION: TITLES + NAMING */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-950 pb-5">
            
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={handleSaveProjectDetails}
                  placeholder="สลับชื่อโปรเจกต์..."
                  className="bg-transparent border-none text-xl md:text-2xl font-display font-black text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/30 rounded px-1.5"
                />
                
                {/* Favorite toggle star */}
                <button
                  onClick={handleToggleFavorite}
                  className="p-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-500 hover:text-yellow-500 cursor-pointer duration-200"
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-600'}`} />
                </button>
              </div>

              <input
                type="text"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                onBlur={handleSaveProjectDetails}
                placeholder="ระบุคำนิยามเป้าหมายระดับพื้นที่ปฏิบัติงานด่วน..."
                className="w-full max-w-xl bg-transparent border-none text-xs text-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/10 px-1.5 block"
              />

              {/* Google Drive Folder & Google Sheet style indicators */}
              <div className="flex flex-wrap items-center gap-3 mt-2 pl-1.5">
                {project?.drive_folder_link ? (
                  <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full text-[10px] text-green-400 font-sans shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <strong>Linked Folder:</strong>
                    <a
                      href={project.drive_folder_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD700] hover:underline font-medium hover:text-yellow-400 duration-150"
                    >
                      เปิดโฟลเดอร์ Google Drive ของ Space นี้
                    </a>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 px-2.5 py-1 rounded-full text-[10px] text-zinc-500 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <span>ไม่มีการประสาน Drive Folder (เชื่อมบัญชีในหน้าตั้งค่าเพื่อให้สร้างอัตโนมัติ)</span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/25 px-2.5 py-1 rounded-full text-[10px] text-yellow-400 font-sans">
                  <span>📊</span>
                  <span>แมปสไตล์ลักษณะเซลล์ตามแผนงาน Google Spreadsheet</span>
                </div>
              </div>
            </div>

            {/* View selectors buttons panel */}
            <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 flex-wrap shrink">
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-2 text-[10px] font-display font-semibold uppercase tracking-wider rounded-xl cursor-pointer duration-250 flex items-center gap-1.5 ${
                  activeView === 'table' ? 'bg-yellow-500 text-zinc-950 font-extrabold shadow-md' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <Table className="w-4 h-4" />
                <span className="hidden sm:inline">Fleet Table</span>
              </button>

              <button
                onClick={() => setActiveView('kanban')}
                className={`px-3 py-2 text-[10px] font-display font-semibold uppercase tracking-wider rounded-xl cursor-pointer duration-250 flex items-center gap-1.5 ${
                  activeView === 'kanban' ? 'bg-yellow-500 text-zinc-950 font-extrabold shadow-md' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>

              <button
                onClick={() => setActiveView('grid')}
                className={`px-3 py-2 text-[10px] font-display font-semibold uppercase tracking-wider rounded-xl cursor-pointer duration-250 flex items-center gap-1.5 ${
                  activeView === 'grid' ? 'bg-yellow-500 text-zinc-950 font-extrabold shadow-md' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <GridIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Bento Grid</span>
              </button>

              <button
                onClick={() => setActiveView('timeline')}
                className={`px-3 py-2 text-[10px] font-display font-semibold uppercase tracking-wider rounded-xl cursor-pointer duration-250 flex items-center gap-1.5 ${
                  activeView === 'timeline' ? 'bg-yellow-500 text-zinc-950 font-extrabold shadow-md' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Timeline</span>
              </button>

              <button
                onClick={() => setActiveView('calendar')}
                className={`px-3 py-2 text-[10px] font-display font-semibold uppercase tracking-wider rounded-xl cursor-pointer duration-250 flex items-center gap-1.5 ${
                  activeView === 'calendar' ? 'bg-yellow-500 text-zinc-950 font-extrabold shadow-md' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>
          </div>

          {/* ACTIVE VIEW WRAPPERS RENDERS */}
          <div id="view-canvas-wrapper" className="min-h-[460px]">
            {renderViewContent()}
          </div>

          {/* ----------------------------------------------------
              8. SLIDE-OVER DRAWER (TASK DETAILS SIDE PANEL)
              ---------------------------------------------------- */}
          <AnimatePresence>
            {drawerOpen && (
              <>
                {/* Backdrop Blur overlay */}
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setDrawerOpen(false)} />
                
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                  className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0c0c0c] border-l border-zinc-900 shadow-2xl z-50 flex flex-col"
                >
                  {/* Drawer Header Controls */}
                  <div className="p-4 border-b border-zinc-900 bg-zinc-950/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tracking-widest text-[#FFD700] uppercase bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/15">
                        {selectedTask?.id}
                      </span>
                      <span className="text-[11px] text-zinc-500 uppercase font-display tracking-widest">Workspace card details</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button onClick={handleDeleteTaskInsideDrawer} className="p-1.5 hover:bg-red-950/15 text-zinc-500 hover:text-red-400 rounded-lg duration-150">
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => setDrawerOpen(false)} className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Drawer Content and lobeditor Area */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-5 smooth-scroll">
                    
                    {/* Basic properties input */}
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-20 space-y-1">
                          <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500 block">Task Icon</label>
                          <select
                            value={drawerIcon}
                            onChange={(e) => setDrawerIcon(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-2 text-center text-sm cursor-pointer focus:outline-none text-white font-sans"
                          >
                            <option value="📝">📝 Note</option>
                            <option value="🚀">🚀 Project</option>
                            <option value="🔥">🔥 Hot</option>
                            <option value="🎯">🎯 Goal</option>
                            <option value="✨">✨ Shiny</option>
                            <option value="💡">💡 Idea</option>
                            <option value="📅">📅 Plan</option>
                            <option value="🛠️">🛠️ Code</option>
                            <option value="⭐️">⭐️ Star</option>
                          </select>
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500 block">Task Title</label>
                          <input
                            type="text"
                            required
                            value={drawerTitle}
                            onChange={(e) => setDrawerTitle(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-1.5 px-3 text-sm focus:outline-none focus:border-yellow-500 text-white font-sans font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Brief Description</label>
                        <textarea
                          rows={2}
                          value={drawerDesc}
                          onChange={(e) => setDrawerDesc(e.target.value)}
                          placeholder="เขียนจุดประสงค์ของงานย่อๆ..."
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-yellow-500 text-zinc-300 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Select matrices */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Status Node</label>
                          <select
                            value={drawerStatus}
                            onChange={(e) => setDrawerStatus(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-2 text-xs focus:outline-none text-zinc-300"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Under Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Target Priority</label>
                          <select
                            value={drawerPriority}
                            onChange={(e) => setDrawerPriority(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-2 text-xs focus:outline-none text-zinc-300"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Deadline Date</label>
                          <input
                            type="date"
                            value={drawerDueDate}
                            onChange={(e) => setDrawerDueDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-1.5 px-3 text-xs focus:outline-none text-zinc-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Model Type</label>
                          <select
                            value={drawerType}
                            onChange={(e) => setDrawerType(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-2 text-xs focus:outline-none text-zinc-300"
                          >
                            <option value="task">General Task</option>
                            <option value="milestone">Milestone Marker</option>
                            <option value="note">Document/Note card</option>
                            <option value="event">Scheduled Event</option>
                            <option value="habit">Dynamic Habit</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section: lobeditor (The Interactive Text block editor with Lobe AI & Streamdown) */}
                    <div className="space-y-3.5 border-t border-zinc-900/60 pt-4 relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] uppercase font-display tracking-widest text-zinc-400 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#FFD700] animate-pulse" />
                          <span>lobeditor : Workspace Notes</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {/* AI Copilot toggle button */}
                          <button
                            type="button"
                            onClick={() => setShowAiPanel(!showAiPanel)}
                            className={`p-1.5 rounded-lg border text-[10px] flex items-center gap-1.5 duration-200 cursor-pointer ${
                              showAiPanel 
                                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-500' 
                                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Lobe AI Copilot</span>
                          </button>

                          {/* Edit / Preview switcher */}
                          <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-900 scale-95">
                            <button
                              type="button"
                              onClick={() => setLobeEditorMode('edit')}
                              className={`px-2 py-1 rounded text-[9px] font-display font-bold uppercase tracking-wider duration-150 cursor-pointer ${
                                lobeEditorMode === 'edit' ? 'bg-zinc-900 text-white border border-white/5' : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setLobeEditorMode('preview')}
                              className={`px-2 py-1 rounded text-[9px] font-display font-bold uppercase tracking-wider duration-150 cursor-pointer ${
                                lobeEditorMode === 'preview' ? 'bg-zinc-900 text-white border border-white/5' : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lobe AI Streaming (Streamdown) Panel */}
                      <AnimatePresence>
                        {showAiPanel && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-3 shadow-inner text-xs overflow-hidden"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                              <p className="text-[10px] font-display uppercase tracking-wider text-yellow-500 font-black flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Lobe Streamdown AI Engine</span>
                              </p>
                              <span className="text-[8px] font-mono text-zinc-550">Gemini Powered</span>
                            </div>

                            <p className="text-[10px] text-zinc-400 leading-relaxed">
                              ระบุหัวข้อเป้าหมายเพื่อให้ Lobe AI เรียบเรียงมาร์กดาวน์ลงบันทึกในรูปแบบ Dynamic Streaming (Streamdown) ได้ทันที!
                            </p>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="เช่น สรุปฟังก์ชันเวิร์กโฟลว์ของ Vercel..."
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                                disabled={aiIsGenerating}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') runStreamdownAi();
                                }}
                              />
                              <button
                                type="button"
                                onClick={runStreamdownAi}
                                disabled={aiIsGenerating || !aiPrompt.trim()}
                                className="bg-[#FFD700] hover:bg-yellow-400 text-zinc-950 font-display font-bold uppercase tracking-widest text-[9px] px-3.5 py-1.5 rounded-lg disabled:opacity-50 duration-150 cursor-pointer flex items-center gap-1.5"
                              >
                                {aiIsGenerating ? (
                                  <>
                                    <div className="w-2.5 h-2.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                                    <span>Streaming...</span>
                                  </>
                                ) : (
                                  <span>Streamdown</span>
                                )}
                              </button>
                            </div>

                            {/* Credentials setup helper alert */}
                            {aiError && (
                              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg space-y-2 text-zinc-300">
                                <div className="flex items-center gap-2 text-red-400 font-bold font-display text-[10px] uppercase">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>ตรวจพบข้อผิดพลาด / ตรวจไม่พบ GEMINI_API_KEY</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                  {aiError}
                                </p>
                                <div className="border-t border-red-500/10 pt-2 text-[10px] space-y-1.5 text-zinc-400 leading-relaxed">
                                  <p className="font-semibold text-zinc-300">💡 วิธีตั้งค่ารหัสลับให้อยู่รอดปลอดภัย (Secure API Keys):</p>
                                  <p>
                                    ใน AI Studio คุณสามารถใส่คีย์ความลับอย่างปลอดภัยเพื่อใช้งานจริงได้ทันที โดยเปิดแผงควบคุมหลักแถบข้าง เลือก <span className="font-semibold text-yellow-500">Settings &gt; Secrets (หรือ API Keys)</span> แล้วเพิ่มตัวแปรระบบชื่อ:
                                  </p>
                                  <div className="font-mono bg-zinc-950/80 px-2 py-1 rounded text-red-300 select-all border border-zinc-900 text-center text-[10px]">
                                    GEMINI_API_KEY=YOUR_GEMINI_KEY
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {lobeEditorMode === 'edit' ? (
                        <div className="relative">
                          <textarea
                            rows={10}
                            value={markdownNotes}
                            onChange={(e) => handleMarkdownChange(e.target.value)}
                            placeholder="เขียนบันทึกความจำเป้าหมาย... กดคีย์พิมพ์ / เพื่อเรียก Snippet ด่วนของ Lobeditor"
                            className="w-full bg-[#050505] border border-zinc-900 rounded-xl p-3.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-yellow-550 font-sans leading-relaxed min-h-[160px]"
                          />

                          {/* Slash command options popover inside editor */}
                          <AnimatePresence>
                            {showSlashHints && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-10 left-3 w-56 glass-panel p-1.5 rounded-xl flex flex-col gap-0.5 z-40 shadow-2xl"
                              >
                                <p className="px-2 py-1 text-[8px] uppercase tracking-widest text-zinc-550 font-display">Lobeditor Quick Snippets</p>
                                <button type="button" onClick={() => insertSlashCommand('todo')} className="w-full text-left p-1.5 hover:bg-zinc-900 hover:text-white rounded text-[10px] flex items-center gap-1.5 cursor-pointer">
                                  <span>🔘</span> <span>Insert Checklist Box</span>
                                </button>
                                <button type="button" onClick={() => insertSlashCommand('h1')} className="w-full text-left p-1.5 hover:bg-zinc-900 hover:text-white rounded text-[10px] flex items-center gap-1.5 cursor-pointer">
                                  <span>Heading 1</span> <span>(# )</span>
                                </button>
                                <button type="button" onClick={() => insertSlashCommand('h2')} className="w-full text-left p-1.5 hover:bg-zinc-900 hover:text-white rounded text-[10px] flex items-center gap-1.5 cursor-pointer">
                                  <span>Heading 2</span> <span>(## )</span>
                                </button>
                                <button type="button" onClick={() => insertSlashCommand('code')} className="w-full text-left p-1.5 hover:bg-zinc-900 hover:text-white rounded text-[10px] flex items-center gap-1.5 cursor-pointer">
                                  <span>Code Sandbox Block</span> <span>(```js )</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        /* Lobe Premium Live Markdown compilation & preview rendering */
                        <div className="bg-[#050505] border border-zinc-900 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed min-h-[160px] overflow-y-auto max-h-[300px]">
                          {markdownNotes.trim() === '' ? (
                            <p className="text-zinc-600 italic">ไม่มีข้อมูลจดบันทึก ให้กด Edit หรือใช้ AI เพื่อเริ่มจดจำ...</p>
                          ) : (
                            <div className="space-y-2.5">
                              {markdownNotes.split('\n').map((line, idx) => {
                                if (line.startsWith('# ')) {
                                  return (
                                    <h1 key={idx} className="text-base font-bold text-white border-b border-zinc-900 pb-1 font-display mt-2">
                                      {line.slice(2)}
                                    </h1>
                                  );
                                }
                                if (line.startsWith('## ')) {
                                  return (
                                    <h2 key={idx} className="text-sm font-bold text-yellow-500 font-display mt-1.5">
                                      {line.slice(3)}
                                    </h2>
                                  );
                                }
                                if (line.startsWith('- [ ] ') || line.startsWith('🔘 ')) {
                                  const text = line.startsWith('- [ ] ') ? line.slice(6) : line.slice(2);
                                  return (
                                    <div key={idx} className="flex items-center gap-2 text-zinc-300 py-0.5">
                                      <input type="checkbox" disabled className="rounded border-zinc-800 bg-zinc-950 text-yellow-500 focus:ring-0" />
                                      <span>{text}</span>
                                    </div>
                                  );
                                }
                                if (line.startsWith('- [x] ')) {
                                  return (
                                    <div key={idx} className="flex items-center gap-2 text-zinc-500 line-through py-0.5">
                                      <input type="checkbox" checked disabled className="rounded border-zinc-800 bg-zinc-950 text-yellow-500 focus:ring-0" />
                                      <span>{line.slice(6)}</span>
                                    </div>
                                  );
                                }
                                if (line.startsWith('- ') || line.startsWith('* ')) {
                                  return (
                                    <ul key={idx} className="list-disc pl-4 space-y-1">
                                      <li>{line.slice(2)}</li>
                                    </ul>
                                  );
                                }
                                if (line.startsWith('```')) {
                                  if (line === '```' || line.startsWith('```js') || line.startsWith('```typescript') || line.startsWith('```json')) {
                                    return null; // Don't show code container labels directly
                                  }
                                }
                                return <p key={idx} className="text-zinc-300 font-sans">{line}</p>;
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Drawer Footer actions */}
                  <div className="p-4 border-t border-zinc-900 bg-zinc-950/20 shrink-0 flex items-center gap-3">
                    <button
                      onClick={handleSaveDrawerDetails}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 text-[10px] font-display font-black uppercase tracking-widest py-2.5 rounded-xl cursor-pointer duration-200 text-center shadow-lg"
                      disabled={drawerSaving}
                    >
                      {drawerSaving ? 'Saving parameters...' : 'Save dynamic parameters'}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      )}
    </WorkspaceShell>
  );
}
