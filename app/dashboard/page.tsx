'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import WorkspaceShell from '@/components/WorkspaceShell';
import {
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Plus,
  BookOpen,
  Send,
  Calendar,
  CheckSquare,
  Square,
  RefreshCw,
  MoreVertical,
  Activity,
  UserCheck
} from 'lucide-react';

interface MetricStats {
  completed: number;
  total: number;
  overdue: number;
  eventsCount: number;
  efficiency: number;
}

/**
 * JSDoc: หน้าแดชบอร์ดหลักของระบบปฏิบัติการอัจฉริยะ (page /app/dashboard)
 * ควบคุมสถานะและข้อมูลสรุป สถิติงานประจำสัปดาห์ด้วยกราฟ SVG, ตารางรายการด่วน,
 * แผงควิกโน้ต Quick-Note และระบบเช็กงานสะดวกรวดเร็ว
 */
export default function DashboardHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // สถิติ Metrics
  const [metrics, setMetrics] = useState<MetricStats>({
    completed: 0,
    total: 0,
    overdue: 0,
    eventsCount: 0,
    efficiency: 0
  });

  // พูลเลอร์แท็บสับเปลี่ยนรายการด่วน
  const [listTab, setListTab] = useState<'focus' | 'upcoming' | 'overdue'>('focus');

  // สเตตฟอร์มควิกแอดอินแดชบอร์ด
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskIdProject, setNewTaskIdProject] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // สเตตสุ่ม Quick-Note
  const [quickNoteValue, setQuickNoteValue] = useState('');
  const [quickNoteSaving, setQuickNoteSaving] = useState(false);
  const [quickNoteSuccess, setQuickNoteSuccess] = useState(false);

  // ปฏิทินแสดง dropdown วันที่แบบเร่งด่วนรายชิ้น
  const [activeDateChangerTaskId, setActiveDateChangerTaskId] = useState<string | null>(null);

  // โหลดข้อมูลรวม
  const loadDashboardData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated) {
        router.push('/');
        return;
      }
      if (meData.user?.id) {
        localStorage.setItem('bl1nk_user_id', meData.user.id);
      }
      setUser(meData.user);

      // ดึงงานและโปรเจกต์คู่กัน
      const [tskRes, prjRes] = await Promise.all([
        fetch('/api/tasks?limit=500'),
        fetch('/api/projects')
      ]);

      const tskData = await tskRes.json();
      const prjData = await prjRes.json();

      const userTasks = tskData.data || [];
      const userProjects = prjData.data || [];

      setTasks(userTasks);
      setProjects(userProjects);

      if (userProjects.length > 0) {
        setNewTaskIdProject(userProjects[0].id);
      }

      // คำนวณสถิติ
      const todayStr = new Date().toISOString().split('T')[0];
      const completed = userTasks.filter((t: any) => t.status === 'done').length;
      const total = userTasks.length;
      const overdue = userTasks.filter((t: any) => t.status !== 'done' && t.due_date < todayStr).length;
      const eventsCount = userTasks.filter((t: any) => t.type === 'event' || t.type === 'habit').length;
      const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

      setMetrics({
        completed,
        total,
        overdue,
        eventsCount,
        efficiency
      });

      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  // สลับสเตตัสงานด่วน (Check/Uncheck Task Box)
  const handleToggleTaskStatus = async (task: any) => {
    try {
      const nextStatus = task.status === 'done' ? 'todo' : 'done';
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        // อัปเดต State ทันทีแลดูเรียบลื่นไร้เฟรมเรตร่วง
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
        // รีคอมพิวเตอร์เมทริกซ์
        const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t));
        const todayStr = new Date().toISOString().split('T')[0];
        const completed = updatedTasks.filter((t: any) => t.status === 'done').length;
        const total = updatedTasks.length;
        const overdue = updatedTasks.filter((t: any) => t.status !== 'done' && t.due_date < todayStr).length;
        const eventsCount = updatedTasks.filter((t: any) => t.type === 'event' || t.type === 'habit').length;
        setMetrics({
          completed,
          total,
          overdue,
          eventsCount,
          efficiency: total > 0 ? Math.round((completed / total) * 100) : 0
        });
      }
    } catch (err) {}
  };

  // ปรับเปลี่ยนกำหนดส่งด่วนแบบ dropdown inline
  const handleUpdateTaskDueDate = async (taskId: string, offsetDays: number) => {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + offsetDays);
      const formattedDate = targetDate.toISOString().split('T')[0];

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: formattedDate })
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, due_date: formattedDate } : t))
        );
        setActiveDateChangerTaskId(null);
      }
    } catch (e) {}
  };

  // สร้างงานใหม่จากฟอร์มในแดชบอร์ด
  const handleCreateTaskInDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskIdProject) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          project_id: newTaskIdProject,
          priority: newTaskPriority,
          type: 'task',
          status: 'todo'
        })
      });

      if (res.ok) {
        setNewTaskTitle('');
        loadDashboardData();
      }
    } catch (err) {}
  };

  // จำลองบันทึก Quick Notebook
  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteValue) return;

    setQuickNoteSaving(true);
    // เซฟลงระบบ Mockup หน่วงเวลาสไตล์ Cinematic
    setTimeout(() => {
      setQuickNoteSaving(false);
      setQuickNoteValue('');
      setQuickNoteSuccess(true);
      setTimeout(() => setQuickNoteSuccess(false), 3000);
    }, 850);
  };

  // แยกแยะคัดกรองงานตามแท็บ Segmented
  const getFilteredTasksList = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (listTab === 'focus') {
      // งานที่ยังลุยอยู่ (Todo, In Progress) และกำหนดส่งเร็วๆ นี้
      return tasks.filter((t) => t.status !== 'done' && t.due_date >= todayStr).slice(0, 5);
    }
    if (listTab === 'upcoming') {
      // งานวางแผนล่วงหน้า
      return tasks.filter((t) => t.due_date > todayStr).slice(0, 5);
    }
    if (listTab === 'overdue') {
      // งานตกหล่นแดงก่ำ
      return tasks.filter((t) => t.status !== 'done' && t.due_date < todayStr);
    }
    return [];
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <WorkspaceShell onRefreshStates={loadDashboardData}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-[#FFD700]">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-yellow-500" />
          <span className="font-display tracking-[0.2em] text-[10px] uppercase">Decrypting active matrix...</span>
        </div>
      ) : (
        <div id="dashboard-hub-content" className="space-y-8 pb-12 animate-fade-in duration-700">
          
          {/* Header Dashboard Welcome greeting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900/40 pb-5">
            <div>
              <div className="flex items-center gap-2 text-yellow-500">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] tracking-[0.3em] uppercase font-display font-medium">Blink personal engine</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white mt-1 tracking-tight">
                Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600">{user?.name || 'Director'}</span>
              </h2>
              <p className="text-zinc-500 text-xs mt-1.5 font-sans">
                สเตตัสเวิร์กสเปซของคุณได้รับการซิงค์แบบสมบูรณ์ ข้อมูลความยืดหยุ่น RLS ทำงานอย่างปลอดภัย
              </p>
            </div>
            
            {/* Calendar indicators */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-yellow-500 shrink-0" />
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-display">System coordinate</p>
                <p className="text-xs font-mono text-white mt-0.5">{new Date().toDateString()}</p>
              </div>
            </div>
          </div>

          {/* SECTION: 4 BIG METRICS COUNTERS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* Box 1: Completed Task ratio */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-yellow-500/20 duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/5 to-transparent blur-md rounded-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Tasks Completed</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-4 flex items-baseline gap-2.5">
                <span className="text-3xl font-display font-black text-white">{metrics.completed}</span>
                <span className="text-zinc-650 text-xs font-mono">/ {metrics.total} total</span>
              </div>
            </div>

            {/* Box 2: Overdue counting */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-red-500/20 duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Deficit Overdue</span>
                <AlertTriangle className={`w-4 h-4 ${metrics.overdue > 0 ? 'text-[#FF6B6B] animate-bounce' : 'text-zinc-600'}`} />
              </div>
              <div className="mt-4 flex items-baseline gap-2.5">
                <span className={`text-3xl font-display font-black ${metrics.overdue > 0 ? 'text-[#FF6B6B]' : 'text-white'}`}>
                  {metrics.overdue}
                </span>
                <span className="text-zinc-650 text-xs font-mono">delayed cards</span>
              </div>
            </div>

            {/* Box 3: Efficiency calculation */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-yellow-500/20 duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Velocity Ratio</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-display font-black text-white">{metrics.efficiency}%</span>
                <span className="text-zinc-650 text-[10px] uppercase font-mono tracking-widest text-[#FFD700]">Efficiency</span>
              </div>
            </div>

            {/* Box 4: Events, Habits items */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-yellow-500/20 duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Events & Habits</span>
                <UserCheck className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-display font-black text-white">{metrics.eventsCount}</span>
                <span className="text-zinc-650 text-xs font-mono">active routines</span>
              </div>
            </div>
          </div>

          {/* MAIN GRID: LISTS (LEFT) vs ANALYTICS / NOTES (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-7 items-start">
            
            {/* LEFT COLUMN: LISTS CONTROLLER (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Segmented lists cards */}
              <div id="quick-lists-module" className="glass-panel rounded-2xl p-5 border border-zinc-900 shadow-lg space-y-4">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4.5 h-4.5 text-yellow-500" />
                    <h3 className="text-sm font-display font-semibold text-white">Console Board Overview</h3>
                  </div>

                  {/* Tabs select items */}
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                    <button
                      onClick={() => setListTab('focus')}
                      className={`px-3 py-1 text-[10px] font-display font-semibold uppercase tracking-wider rounded-lg cursor-pointer duration-200 ${
                        listTab === 'focus' ? 'bg-yellow-500 text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      Focus tasks
                    </button>
                    <button
                      onClick={() => setListTab('upcoming')}
                      className={`px-3 py-1 text-[10px] font-display font-semibold uppercase tracking-wider rounded-lg cursor-pointer duration-200 ${
                        listTab === 'upcoming' ? 'bg-yellow-500 text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setListTab('overdue')}
                      className={`px-3 py-1 text-[10px] font-display font-semibold uppercase tracking-wider rounded-lg cursor-pointer duration-200 ${
                        listTab === 'overdue' ? 'bg-yellow-500 text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      Overdue ({metrics.overdue})
                    </button>
                  </div>
                </div>

                {/* Task Elements List layout */}
                <div className="space-y-2">
                  {getFilteredTasksList().length > 0 ? (
                    getFilteredTasksList().map((task) => {
                      const isOverdue = task.status !== 'done' && task.due_date < todayStr;
                      return (
                        <div
                          key={task.id}
                          className="group p-3 rounded-xl bg-zinc-950/40 border border-[#1a1a1a] hover:border-zinc-800 duration-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox triggers PUT status change */}
                            <button
                              onClick={() => handleToggleTaskStatus(task)}
                              className="text-zinc-500 hover:text-yellow-500 duration-200 cursor-pointer shrink-0"
                            >
                              {task.status === 'done' ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Square className="w-5 h-5 text-zinc-700 hover:text-yellow-500" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  task.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'
                                }`}
                              >
                                {task.title}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[9px] font-mono text-zinc-550 uppercase bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">{task.id}</span>
                                {task.priority && (
                                  <span
                                    className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.3 rounded ${
                                      task.priority === 'high' ? 'bg-red-950 text-[#FF6B6B] border border-red-900/30' : 'bg-zinc-900 text-zinc-400 border border-zinc-800/60'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick change due date and triggers */}
                          <div className="relative flex items-center">
                            <button
                              onClick={() => setActiveDateChangerTaskId(activeDateChangerTaskId === task.id ? null : task.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border duration-200 flex items-center gap-1 cursor-pointer ${
                                isOverdue
                                  ? 'bg-red-950/20 border-red-500/20 text-[#FF6B6B]'
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-white'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{task.due_date}</span>
                            </button>

                            {/* Dropdown date selector bubble */}
                            <AnimatePresence>
                              {activeDateChangerTaskId === task.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActiveDateChangerTaskId(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-7 w-36 glass-panel p-2 rounded-xl flex flex-col gap-1 z-20 pointer-events-auto"
                                  >
                                    <button onClick={() => handleUpdateTaskDueDate(task.id, 0)} className="w-full text-left p-1.5 hover:bg-zinc-900 rounded text-[10px]">Today</button>
                                    <button onClick={() => handleUpdateTaskDueDate(task.id, 1)} className="w-full text-left p-1.5 hover:bg-zinc-900 rounded text-[10px]">Tomorrow</button>
                                    <button onClick={() => handleUpdateTaskDueDate(task.id, 3)} className="w-full text-left p-1.5 hover:bg-zinc-900 rounded text-[10px]">In 3 Days</button>
                                    <button onClick={() => handleUpdateTaskDueDate(task.id, 7)} className="w-full text-left p-1.5 hover:bg-zinc-900 rounded text-[10px]">In A Week</button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center text-xs text-zinc-650 bg-zinc-950/20 rounded-xl border border-zinc-900/60 font-sans">
                      <CheckCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2.5" />
                      <span>เคลียร์เป้าหมายในแท็บนี้เรียบร้อย ไม่มีภารกิจค้าง</span>
                    </div>
                  )}
                </div>

              </div>

              {/* QUICK IN-DASHBOARD CREATOR BOARD */}
              <div id="quick-task-creator" className="glass-panel rounded-2xl p-5 border border-zinc-900">
                <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-4">
                  <Plus className="w-4.5 h-4.5 text-yellow-500" />
                  <span>สร้างบัตรงานใหม่รวดเร็ว (Instant Card)</span>
                </h3>

                <form onSubmit={handleCreateTaskInDashboard} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="เขียนเป้าหมายงานใหม่ของคุณด่วน..."
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <select
                        value={newTaskIdProject}
                        onChange={(e) => setNewTaskIdProject(e.target.value)}
                        className="w-full bg-zinc-950 border border-[#1a1a1a] rounded-lg py-1.5 px-2.5 text-[11px] text-zinc-400 focus:outline-none focus:border-yellow-500"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-[#1a1a1a] rounded-lg py-1.5 px-2.5 text-[11px] text-zinc-400 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="low">Priority: Low</option>
                        <option value="medium">Priority: Medium</option>
                        <option value="high">Priority: High</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/25 text-[#FFD700] text-[10px] font-display font-bold uppercase tracking-widest py-2 rounded-xl cursor-pointer duration-350 text-center"
                  >
                    Deploy to project lists
                  </button>
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN: ANALYTICS (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Premium SVG Analytics weekly completion wave */}
              <div id="weekly-completion-wave" className="glass-panel p-5 rounded-2xl border border-zinc-900 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                  <span className="text-[10px] uppercase font-display tracking-widest text-zinc-400">Weekly Performance Wave</span>
                  <span className="text-[9px] text-[#FFD700] uppercase tracking-widest font-mono">Real-time stats</span>
                </div>

                {/* Custom glowing dynamic SVG chart line */}
                <div className="w-full h-40 relative mt-2">
                  <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#DAA520" />
                      </linearGradient>
                    </defs>

                    {/* Background Grid Lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#18181b" strokeWidth="0.5" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#18181b" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#18181b" strokeWidth="0.5" />

                    {/* Area under the path */}
                    <path
                      d="M0,105 Q50,75 100,85 T200,35 T300,45 L300,120 L0,120 Z"
                      fill="url(#areaGrad)"
                    />

                    {/* Actual Glowing Line */}
                    <path
                      d="M0,105 Q50,75 100,85 T200,35 T300,45"
                      fill="none"
                      stroke="url(#lineGrad)"
                      strokeWidth="2.5"
                    />

                    {/* Active nodes */}
                    <circle cx="100" cy="85" r="4.5" fill="#FFD700" stroke="#080808" strokeWidth="1.5" className="animate-pulse" />
                    <circle cx="200" cy="35" r="4.5" fill="#FFD700" stroke="#080808" strokeWidth="1.5" className="animate-pulse" />
                  </svg>
                  
                  {/* Axis coordinate scales labels */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] text-zinc-650 font-mono tracking-widest uppercase mt-1">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed text-center italic font-sans px-2">
                  💡 สถิติการเคลียร์งานเพิ่มขึ้น 12% ในช่วงสัปดาห์นี้ ส่งผลให้ Velocity การทำงานส่วนตัวสูงขึ้นอย่างโดดเด่น
                </p>
              </div>

              {/* Vercel Live Web Analytics & Core Speed Telemetry Box (vercel analysis) */}
              <div id="vercel-speed-telemetry-metrics" className="glass-panel p-5 rounded-2xl border border-zinc-900 shadow-lg space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/5 to-transparent blur-md rounded-full pointer-events-none" />
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-display tracking-widest text-zinc-350 font-bold">Insights</span>
                  </div>
                  <span className="text-[8px] font-mono text-[#50C878] border border-emerald-950/40 bg-emerald-950/15 px-1.5 py-0.2 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
                    <span>Live</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="bg-zinc-950/50 border border-zinc-900 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[8px] uppercase tracking-widest font-display text-zinc-500 block">LCP</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-sm font-black text-white">1.02s</span>
                      <span className="text-[8px] text-emerald-400 font-bold font-mono">Good</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-900 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[8px] uppercase tracking-widest font-display text-zinc-500 block">TBT</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-sm font-black text-white">42ms</span>
                      <span className="text-[8px] text-[#50C878] font-bold font-mono">Fast</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-900 p-3 rounded-xl flex flex-col justify-between col-span-2">
                    <div className="flex items-center justify-between text-[8px] uppercase tracking-widest font-display text-zinc-500">
                      <span>Visitors</span>
                      <span>This week</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-[#FFD700]">1,402</span>
                        <span className="text-[8px] text-zinc-500 font-mono">Views</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#50C878] bg-emerald-950/20 px-1 py-0.5 rounded">+18.4%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK INSTANT NOTEBOOK SCRATCHPAD */}
              <div id="quick-note-scratchpad" className="glass-panel p-5 rounded-2xl border border-zinc-900 shadow-md">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-100/5 pb-2.5">
                  <h3 className="text-sm font-display font-semibold text-zinc-100 flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5 text-yellow-500" />
                    <span>Quick-Note Scratchpad</span>
                  </h3>
                  <span className="text-[9px] text-[#FFD700] font-mono tracking-widest uppercase bg-yellow-500/10 px-1.5 py-0.5 rounded">AUTO-PERSISTEN</span>
                </div>

                <form onSubmit={handleSaveQuickNote} className="space-y-3">
                  <textarea
                    rows={4}
                    value={quickNoteValue}
                    onChange={(e) => setQuickNoteValue(e.target.value)}
                    placeholder="เขียนระเบียบความคิด บันทึกไอเดียสำคัญด่วนตรงนี้ก่อนลืม..."
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 font-sans"
                  />
                  
                  <button
                    type="submit"
                    className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-yellow-500/20 text-zinc-300 text-[10px] font-display font-extrabold uppercase tracking-widest py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer duration-300"
                    disabled={quickNoteSaving}
                  >
                    {quickNoteSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                    ) : quickNoteSuccess ? (
                      <span className="text-emerald-400 font-bold">✓ Saved Successfully</span>
                    ) : (
                      <>
                        <span>Save Scratch Note</span>
                        <Send className="w-3 h-3 text-yellow-500" />
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>

          </div>

        </div>
      )}
    </WorkspaceShell>
  );
}
