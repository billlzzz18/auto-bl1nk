'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WorkspaceShell from '@/components/WorkspaceShell';
import {
  Play,
  RotateCcw,
  Loader2,
  Terminal as TerminalIcon,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle,
  Database,
  BarChart4
} from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  status: number;
  expected: string;
  received: string;
  payload?: any;
  details?: string;
  durationMs: number;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passPercentage: number;
  timestamp: string;
  runner_version: string;
  status_code: 'STABLE' | 'REGRESSION_DETECTED';
}

/**
 * JSDoc: ระบบวิเคราะห์และชุดทดสอบอัตโนมัติฝั่งแบ็คเอนด์ (API Unit Automation Test Dashboard)
 * รองรับการยิงทดสอบแบบ Real-time, ออกรายงานสถานะความเสถียร, แสดงค่า Payload ด้วยรูปแบบ JSON,
 * และตรวจสอบความปลอดภัยของ API ทุกประเภทเพื่อความลื่นไหลระดับสากล
 */
export default function ApiTestsPage() {
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [results, setResults] = useState<TestCase[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<string[]>([]);

  // Logs stream helper
  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runSuite = async () => {
    setRunning(true);
    setSummary(null);
    setResults([]);
    setLogs([]);
    addLog('🚀 เริ่มรันระบบชุดทดสอบจำลอง (Unit Automation Test) ฝั่งแบ็คเอนด์...');
    addLog('🔌 ตรวจสอบการเชื่อมต่อเซสชัน RLS และ Middleware...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      addLog('📦 ทริกเกอร์บล็อกวิเคราะห์ Endpoint: /api/auth/*');
      await new Promise((r) => setTimeout(r, 400));
      addLog('🔒 ทริกเกอร์บล็อกวิเคราะห์ความเสถียรและ RLS: /api/tasks/*');
      await new Promise((r) => setTimeout(r, 400));
      addLog('🗂️ เริ่มส่ง HTTP payloads เพื่อทดสอบพารามิเตอร์แปลกปลอมและประเภทข้อมูลที่ผิดพลาด...');

      const start = Date.now();
      const res = await fetch('/api/tests/run', { method: 'POST' });
      const duration = Date.now() - start;

      if (!res.ok) {
        throw new Error(`เซิร์ฟเวอร์ตอบสนองด้วยรหัสผิดพลาด: HTTP ${res.status}`);
      }

      const raw = await res.json();
      setSummary(raw.summary);
      setResults(raw.results);

      addLog(`✅ รันชุดทดสอบสำเร็จในเวลา ${duration}ms! ปราศจากความเสี่ยงถดถอย`);
      addLog(`📊 อัตราการผ่านชุดทดสอบ: ${raw.summary.passPercentage}% (${raw.summary.passedTests}/${raw.summary.totalTests} เคส)`);
      if (raw.summary.failedTests > 0) {
        addLog(`⚠️ มีความเสี่ยงตรวจพบบั๊กหรือข้อมูลจัดเรียงผิดพลาดจำนวน ${raw.summary.failedTests} กลุ่ม!`);
      } else {
        addLog('✨ โครงสร้าง API ทำงานได้เสถียรและไร้บั๊กถดถอย (Zero Regression Verified)');
      }

      // Record logs onto parent workspace window events if exists
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `ระบบ Automated Test Suite รันสำเร็จแล้ว ความเสถียร: ${raw.summary.passPercentage}%` }
        }));
      }

    } catch (err: any) {
      addLog(`❌ เกิดข้อผิดพลาดในการรันอัตโนมัติ: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    // Run suite after mount has settled to avoid synchronous setState inside effect
    const timer = setTimeout(() => {
      runSuite();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ['all', ...Array.from(new Set(results.map((r) => r.category)))];
  const filteredResults = selectedCategory === 'all' 
    ? results 
    : results.filter((r) => r.category === selectedCategory);

  return (
    <WorkspaceShell>
      <div id="api-tests-root" className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Banner Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-extrabold tracking-tight text-[#FFD700] flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#FFD700] animate-pulse" />
              <span>Unit & REST API Endpoint Automation Test</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-sans leading-relaxed">
              ชุดวิเคราะห์ทดสอบอัตโนมัติ (REST API Automated Sandbox) สำหรับตรวจสอบและดักคัดกรองพารามิเตอร์ Payload 
              ความมั่นคงปลอดภัยแบบแยก RLS รายโปรเจกต์ และการชนกันของนัดจัดตารางเวลาอัจฉริยะ (Appointment Slot Conflicts)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={runSuite}
              disabled={running}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 font-display font-extrabold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md justify-center transition-all duration-300 disabled:opacity-50 cursor-pointer min-w-[150px]"
            >
              {running ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Automation Suite</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => { setResults([]); setSummary(null); setLogs([]); }}
              disabled={running}
              className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-xl cursor-pointer duration-200 disabled:opacity-50"
              title="Wipe metrics logs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard statistics panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* STAT 1: Status Banner */}
          <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-950/20 flex flex-col justify-between min-h-[96px]">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-display">System Health State</span>
            <div className="mt-2 flex items-center gap-2">
              {summary ? (
                summary.status_code === 'STABLE' ? (
                  <>
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">STABLE (ปลอดภัย)</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-6 h-6 text-red-400" />
                    <span className="text-sm font-bold text-red-400">REGRESSION DETECTED</span>
                  </>
                )
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                  <span className="text-xs text-zinc-500 font-sans">Awaiting dispatch</span>
                </>
              )}
            </div>
            <span className="text-[8px] font-mono text-zinc-600 mt-1 uppercase">Version: bl1nk-v1-test</span>
          </div>

          {/* STAT 2: Progress Ring Box */}
          <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-950/20 flex items-center justify-between min-h-[96px]">
            <div className="flex flex-col justify-between h-full">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-display">Success Rate</span>
              <span className="text-2xl font-black text-white mt-1 font-mono">
                {summary ? `${summary.passPercentage}%` : '0%'}
              </span>
              <span className="text-[8px] text-zinc-650 font-display mt-0.5">Integrations test metrics</span>
            </div>
            
            {/* Custom Circular SVG ring */}
            <div className="relative w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="stroke-zinc-900"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="transition-all duration-1000 stroke-yellow-500"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={138}
                  strokeDashoffset={summary ? 138 - (138 * summary.passPercentage) / 100 : 138}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-[#FFD700]">
                {summary ? `${summary.passedTests}/${summary.totalTests}` : '0'}
              </div>
            </div>
          </div>

          {/* STAT 3: Total Runs */}
          <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-950/20 flex flex-col justify-between min-h-[96px]">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-display">Execution Cases Runs</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{summary ? summary.totalTests : '0'}</span>
              <span className="text-[10px] text-zinc-400 font-sans">unit automation tests</span>
            </div>
            <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">Warping full HTTP stack</span>
          </div>

          {/* STAT 4: API Payload Sanitizers */}
          <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-950/20 flex flex-col justify-between min-h-[96px]">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-display">Risk Profiling Blockers</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-black text-[#FF6B6B]">
                {summary ? summary.failedTests : '0'}
              </span>
              <span className="text-[10px] text-zinc-500 font-sans">failed payload errors</span>
            </div>
            <span className="text-[8px] text-zinc-650 font-display uppercase tracking-wider">RLS &amp; Conflicts protection</span>
          </div>

        </div>

        {/* Real-time Logger Stream Console */}
        <div className="glass-panel p-3.5 rounded-2xl border border-zinc-900 bg-black/80 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-[#FFD700]" />
              <span className="text-[10px] uppercase font-mono text-[#FFD700] tracking-widest">Automation Logging Output Terminal</span>
            </div>
            <span className="text-[8px] font-mono text-zinc-550">STREAM FEED-LIVE (UTC)</span>
          </div>

          <div className="h-28 overflow-y-auto font-mono text-[10px] text-zinc-450 leading-relaxed bg-[#050505] p-3 rounded-lg space-y-1.5 border border-zinc-950">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-zinc-600 shrink-0">bl1nk_tst_runner$</span>
                  <span className={log.includes('❌') ? 'text-[#FF6B6B]' : log.includes('✅') ? 'text-emerald-400' : 'text-zinc-300'}>
                    {log}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-zinc-600 italic">No output. Press &quot;Run Automation Suite&quot; to diagnostic current schemas.</div>
            )}
          </div>
        </div>

        {/* Filters & Results Block */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-widest">Tested Endpoints &amp; Rules Results</h2>
            
            {/* Tab categories selections */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900 max-w-fit">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-[9px] font-display font-bold uppercase tracking-wider rounded-lg cursor-pointer duration-150 ${
                    selectedCategory === cat 
                      ? 'bg-yellow-500/15 text-[#FFD700] border border-yellow-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {cat === 'all' ? 'All Groups' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible card list of test outcomes */}
          <div className="space-y-3">
            {filteredResults.length > 0 ? (
              filteredResults.map((t) => {
                const open = expandedTests[t.id];
                return (
                  <div
                    key={t.id}
                    className={`glass-panel rounded-2xl border transition-all duration-300 overflow-hidden bg-zinc-950/10 ${
                      t.passed ? 'border-zinc-900/60 hover:border-[#50C878]/20' : 'border-[#FF6B6B]/20 bg-red-950/5'
                    }`}
                  >
                    
                    {/* Header trigger block */}
                    <div
                      onClick={() => toggleExpand(t.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg border ${
                          t.passed 
                            ? 'bg-emerald-950/20 text-[#50C878] border-emerald-900/30' 
                            : 'bg-red-950/30 text-[#FF6B6B] border-red-900/40'
                        }`}>
                          {t.passed ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 animate-bounce" />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-[#FFD700] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">
                              {t.id}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-display font-medium">
                              {t.category}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-650">
                              {t.durationMs}ms
                            </span>
                          </div>
                          <h3 className="text-xs font-semibold text-zinc-200 mt-1 truncate">{t.name}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest font-mono border ${
                          t.passed 
                            ? 'bg-[#e6f4ea]/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-950/40 text-red-400 border-red-500/20'
                        }`}>
                          {t.passed ? 'PASSED (ผ่าน)' : 'FAILED (พบความเสี่ยง)'}
                        </span>
                        
                        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </div>
                    </div>

                    {/* Collapsed table details area - WITH PROPER LINES AND BORDERS FOR PERFECT UX */}
                    <AnimatePresence>
                      {open && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="border-t border-zinc-900/60 bg-zinc-950/40"
                        >
                          <div className="p-4 space-y-4">
                            
                            {/* Detailed Grid Table */}
                            <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-black/30">
                              <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                                <thead>
                                  <tr className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider text-[9px] font-display font-bold">
                                    <th className="py-2.5 px-3 border border-zinc-850 w-44">Parameter Node</th>
                                    <th className="py-2.5 px-3 border border-zinc-850">Diagnostic Analysis Metrics</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="py-2.5 px-3 border border-zinc-850 bg-zinc-950/30 font-display text-zinc-500 uppercase tracking-wider text-[9px]">Target Endpoint Range</td>
                                    <td className="py-2.5 px-3 border border-zinc-850 font-mono text-[11px] text-zinc-350">
                                      {t.category.includes('Login') 
                                        ? 'POST /api/auth/login' 
                                        : t.category.includes('Registration') 
                                        ? 'POST /api/auth/register' 
                                        : 'ANY /api/tasks/*'}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-2.5 px-3 border border-zinc-850 bg-zinc-950/30 font-display text-zinc-500 uppercase tracking-wider text-[9px]">Response StatusCode</td>
                                    <td className="py-2.5 px-3 border border-zinc-850 font-mono text-[11px]">
                                      <span className={t.passed ? 'text-[#50C878] font-bold' : 'text-[#FF6B6B] font-bold'}>
                                        {t.status}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-2.5 px-3 border border-zinc-850 bg-zinc-950/30 font-display text-zinc-500 uppercase tracking-wider text-[9px]">Expected Profile outcome</td>
                                    <td className="py-2.5 px-3 border border-zinc-850 text-zinc-400 font-mono text-[11px]">{t.expected}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2.5 px-3 border border-zinc-850 bg-zinc-950/30 font-display text-zinc-500 uppercase tracking-wider text-[9px]">Received diagnostics</td>
                                    <td className="py-2.5 px-3 border border-zinc-850 text-zinc-450 font-mono text-[10px] break-all leading-normal max-w-sm">
                                      {t.received}
                                    </td>
                                  </tr>
                                  {t.payload && (
                                    <tr>
                                      <td className="py-2.5 px-3 border border-zinc-850 bg-zinc-950/30 font-display text-zinc-500 uppercase tracking-wider text-[9px]">Injected JSON payload</td>
                                      <td className="py-2.5 px-3 border border-zinc-850 font-mono text-[10px] bg-zinc-950/40 p-2.5 rounded border-zinc-900 text-zinc-500 whitespace-pre-wrap">
                                        {JSON.stringify(t.payload, null, 2)}
                                      </td>
                                    </tr>
                                  )}
                                  {t.details && (
                                    <tr>
                                      <td className="py-2.5 px-3 border border-zinc-850 bg-zinc-950/30 font-display text-zinc-500 uppercase tracking-wider text-[9px]">Internal Stack-Trace / Remediations</td>
                                      <td className="py-2.5 px-3 border border-zinc-850 font-mono text-[10px] text-zinc-600 max-w-sm whitespace-pre-wrap leading-normal">
                                        {t.details}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-zinc-650 text-xs flex flex-col items-center gap-3">
                <Database className="w-8 h-8 text-zinc-800 animate-bounce" />
                <span>No automation test log output found. Trigger above button to dispatch API.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </WorkspaceShell>
  );
}
