'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import WorkspaceShell from '@/components/WorkspaceShell';
import {
  Sparkles,
  Settings,
  Terminal,
  Layers,
  Webhook,
  Activity,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Code,
  Link,
  Shield,
  FileText,
  UserCheck,
  Zap,
  Globe,
  Monitor,
  Heart,
  Eye,
  RefreshCw
} from 'lucide-react';

type SettingsTab = 'general' | 'templates' | 'sharing' | 'api_webhooks' | 'extensions' | 'mcp' | 'workflows';

/**
 * JSDoc: แผงควบคุมสิทธิ์และการตั้งค่าล้ำลึก (page /app/settings)
 * ประกอบไปด้วย 6 แท็บหลัก:
 * - General: ข้อมูลโปรไฟล์แอดมิน, บัญชี
 * - Templates: จัดการ seeded presets และคอนฟิกแท็กพื้นฐาน
 * - Sharing: RLS Public Sharing, ลิงก์สเปซแชร์ภายนอก
 * - API & Webhooks: ผู้ดูแลระบบสามารถจำลองสร้าง API Keys สุ่ม, เพิ่ม Webhooks ปลายทาง, ยิงทดสอบ payload, และพินิจ REST Specifications
 * - Extensions: การป้อนซอร์สโค้ดติดตั้งโมดูลเสริม
 * - MCP Server: ตั้งค่าการปัดเป้าเพื่อเชื่อมโยง AI คอนเนคเตอร์ภายนอก
 */
function SettingsCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'general';

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  // 1. STATE FOR API KEYS
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKeyOnce, setGeneratedKeyOnce] = useState<string | null>(null);

  // 2. STATE FOR WEBHOOKS
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['task.created']);

  // 3. STATE FOR EXTENSIONS
  const [extensions, setExtensions] = useState<any[]>([]);
  const [extName, setExtName] = useState('');
  const [extCode, setExtCode] = useState('');
  const [extType, setExtType] = useState('theme');

  // 4. REST DOCUMENTS SPECIFICATION
  const [apiDocs, setApiDocs] = useState<any>(null);

  // 5. MCP SERVER REGISTER
  const [mcpServers, setMcpServers] = useState([
    { id: 'm1', name: 'Google Workspace MCP', url: 'http://localhost:8500', isConnected: true },
    { id: 'm2', name: 'SQLite DB core MCP', url: 'http://localhost:8502', isConnected: false }
  ]);
  const [mcpName, setMcpName] = useState('');
  const [mcpUrl, setMcpUrl] = useState('');

  // 6. GENERAL PROFILE BIOMASS SET
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');

  // 7. NEW PROJECT CREATION
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [createProjectMsg, setCreateProjectMsg] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // 8. VERCEL & UPSTASH STATEFUL WORKFLOW PLAYGROUND STATE
  const [wfStatus, setWfStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [wfCurrentStep, setWfCurrentStep] = useState(0);
  const [wfLogs, setWfLogs] = useState<string[]>([]);
  const [wfMode, setWfMode] = useState<'upstash' | 'vercel'>('upstash');

  const runWorkflowSimulation = async () => {
    setWfStatus('running');
    setWfCurrentStep(1);
    setWfLogs(['[00:01] 🚦 Trigger: task.updated received from workspace integration.', '[00:01] 🔄 Initializing Stateful serverless background execution...']);

    await new Promise(r => setTimeout(r, 1200));
    setWfCurrentStep(2);
    setWfLogs(prev => [
      ...prev,
      '[00:02] ✨ Running Step 1: context.run("fetch-task-detail").',
      `[00:03] 📦 Loaded metadata: Task ID 'BL1NK-9402', Title: 'Optimize DB Queries'.`
    ]);

    await new Promise(r => setTimeout(r, 1500));
    setWfCurrentStep(3);
    setWfLogs(prev => [
      ...prev,
      '[00:04] ✨ Running Step 2: context.run("ai-summarize-task-notes").',
      '[00:05] 🧠 AI Agent Response: Prompt summarized successfully in 84ms using gemini-3.5-flash.'
    ]);

    await new Promise(r => setTimeout(r, 1500));
    setWfCurrentStep(4);
    setWfLogs(prev => [
      ...prev,
      '[00:07] 💤 Executing step delay: context.sleep("delay-duration", "5s").',
      '[00:07] ⏰ Thread paused securely. Resuming execution safely on serverless runner.'
    ]);

    await new Promise(r => setTimeout(r, 1500));
    setWfCurrentStep(5);
    setWfLogs(prev => [
      ...prev,
      '[00:12] ✨ Running Step 3: context.run("send-google-workspace-notification").',
      '[00:13] 🟢 Dispatched OAuth stream to Google Space Chat / Slack Channels successfully.',
      '[00:13] 🎉 Stateful durable workflow succeeded gracefully with no cold starts!'
    ]);
    setWfStatus('success');
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      alert('กรุณากรอกชื่อโปรเจกต์');
      return;
    }

    setCreatingProject(true);
    setCreateProjectMsg('กำลังดำเนินการสร้างสเปซโปรเจกต์ใหม่...');

    try {
      let googleAccessToken = null;
      if (typeof window !== 'undefined') {
        googleAccessToken = window.sessionStorage.getItem('bl1nk_google_token');
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          google_access_token: googleAccessToken
        })
      });

      const data = await res.json();
      if (res.ok) {
        const driveSuccess = data.data && data.data.drive_folder_link;
        setCreateProjectMsg(`สร้างสเปซใหม่ "${newProjectName}" เรียบร้อยแล้ว! ${driveSuccess ? 'และแชร์เชื่อมต่อ Google Drive อัตโนมัติในฐานข้อมูลสำเร็จ' : ''}`);
        
        // ส่งข้อมูลการแจ้งเตือนแบบ dynamic ไปยังแถบ navbar ด้านบน
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bl1nk-notification', {
            detail: {
              text: `สร้างโปรเจกต์ใหม่ "${newProjectName}" สำเร็จ! ${driveSuccess ? 'พร้อมระงับจอง Folder บน Google Drive เรียบร้อย' : ''}`
            }
          }));
        }

        setNewProjectName('');
        setNewProjectDesc('');
        loadSettingsData();
      } else {
        setCreateProjectMsg('เกิดข้อผิดพลาด: ' + (data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (err: any) {
      setCreateProjectMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
    } finally {
      setCreatingProject(false);
      setTimeout(() => setCreateProjectMsg(''), 8000);
    }
  };

  const loadSettingsData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated) {
        router.push('/');
        return;
      }
      setUser(meData.user);
      setProfileName(meData.user.name);
      setProfileBio(meData.user.bio || 'Architecting complex digital workflows.');

      // โหลด API key, Webhooks, Extensions, Projects และ REST Docs พร้อมกัน
      const [keyRes, whRes, extRes, projRes, docsRes] = await Promise.all([
        fetch('/api/keys'),
        fetch('/api/webhooks'),
        fetch('/api/extensions'),
        fetch('/api/projects'),
        fetch('/api/docs')
      ]);

      const [keyData, whData, extData, projData, docsData] = await Promise.all([
        keyRes.json(),
        whRes.json(),
        extRes.json(),
        projRes.json(),
        docsRes.json()
      ]);

      setApiKeys(keyData.data || []);
      setWebhooks(whData.data || []);
      setExtensions(extData.data || []);
      setProjects(projData.data || []);
      setApiDocs(docsData);

      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSettingsData();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  // สร้าง Developer API Key ใหม่
  const handleGenerateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });

      const body = await res.json();
      if (res.ok) {
        setGeneratedKeyOnce(body.data.raw_key);
        setNewKeyName('');
        // รีโหลดรายการ
        const keyLoad = await fetch('/api/keys');
        const keyData = await keyLoad.json();
        setApiKeys(keyData.data || []);
      }
    } catch (e) {}
  };

  // ลบคีย์
  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('ยืนยันที่จะถอนสิทธิ์ API Key คีย์นี้หรือไม่? แอนแอปที่ต่ออยู่อาจโดนตัดการเชื่อมต่อได้ทันที')) return;
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: keyId })
      });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      }
    } catch (e) {}
  };

  // บันทึกและทดสอบยิง Webhook
  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          events: webhookEvents
        })
      });

      if (res.ok) {
        setWebhookUrl('');
        // อัปสเตต
        const loadWh = await fetch('/api/webhooks');
        const loadData = await loadWh.json();
        setWebhooks(loadData.data || []);
      }
    } catch (e) {}
  };

  // ลบ Webhooks
  const handleDeleteWebhook = async (whId: string) => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: whId })
      });
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== whId));
      }
    } catch (e) {}
  };

  // สลับสเตชั่นเปิด/ปิด Webhook
  const handleToggleWebhook = async (whId: string) => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id: whId })
      });
      if (res.ok) {
        setWebhooks((prev) =>
          prev.map((w) => (w.id === whId ? { ...w, isActive: !w.isActive } : w))
        );
      }
    } catch (e) {}
  };

  // ลงรหัสความสอดคล้อง Extension ของเล่นกำหนดเอง
  const handleInstallExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName || !extCode) return;

    try {
      const res = await fetch('/api/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: extName,
          type: extType,
          code: extCode
        })
      });

      if (res.ok) {
        setExtName('');
        setExtCode('');
        // ดึงขยายใหม่
        const extLoad = await fetch('/api/extensions');
        const extData = await extLoad.json();
        setExtensions(extData.data || []);
      }
    } catch (e) {}
  };

  // แอด MCP คอนซูเลเตอร์
  const handleAddMcpServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcpName || !mcpUrl) return;

    setMcpServers((prev) => [
      ...prev,
      {
        id: 'm_' + Math.random().toString(36).substr(2, 9),
        name: mcpName,
        url: mcpUrl,
        isConnected: true
      }
    ]);
    setMcpName('');
    setMcpUrl('');
  };

  // บันทึกโปรไฟล์ด่วน
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('บันทึกปรับแก้องค์ประโยคผู้ใช้งาน (Alex Morgan) สำเร็จ!');
  };

  const menuItems = [
    { id: 'general', label: 'General / Profile', icon: Monitor },
    { id: 'templates', label: 'Preset Templates', icon: Layers },
    { id: 'sharing', label: 'RLS Shared Settings', icon: Globe },
    { id: 'api_webhooks', label: 'Developer API & Webhooks', icon: Code },
    { id: 'extensions', label: 'Themes & Extensions', icon: Zap },
    { id: 'mcp', label: 'MCP Server Node', icon: Terminal },
    { id: 'workflows', label: 'Vercel / Upstash Workflows', icon: Activity }
  ];

  return (
    <WorkspaceShell onRefreshStates={loadSettingsData}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[55vh] text-[#FFD700]">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-yellow-500" />
          <span className="font-display tracking-[0.2em] text-[10px] uppercase">Reticulating developer registry...</span>
        </div>
      ) : (
        <div id="settings-frame" className="space-y-6 pb-16 animate-fade-in duration-500">
          
          <div className="border-b border-zinc-900/60 pb-5">
            <h2 className="text-xl md:text-2xl font-display font-black text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-yellow-500" />
              <span>SYSTEM OPERATION CENTER</span>
            </h2>
            <p className="text-zinc-500 text-xs mt-1 font-sans">
              บริหารจัดระเบียบสิทธิ์, พัฒนา API คีย์เชื่อมต่อ, ออกแบบส่วนขยาย themes ยกระดับประสิทธิภาพการจัดการระดับพรีเมียม
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* LEFT TAB MENU NAVIGATION (4 COLS) */}
            <div className="md:col-span-4 space-y-1.5">
              {menuItems.map((item) => {
                const IconItem = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs flex items-center gap-3 cursor-pointer duration-250 ${
                      activeTab === item.id
                        ? 'bg-zinc-950 text-[#FFD700] border-l-2 border-yellow-500 font-bold shadow-md'
                        : 'text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200'
                    }`}
                  >
                    <IconItem className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* RIGHT WORK DETAIL AREA (8 COLS) */}
            <div className="md:col-span-8 glass-panel p-6 rounded-3xl border border-zinc-900 bg-zinc-950/20 min-h-[460px] relative">
              
              {/* TAB 1: GENERAL CONFIGS */}
              {activeTab === 'general' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-2.5">
                    General Operations
                  </h3>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Active User Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-yellow-500 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-display tracking-widest text-zinc-500">Corporate Designation Biography</label>
                      <textarea
                        rows={3}
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs focus:outline-none focus:border-yellow-500 text-zinc-300 font-sans"
                      />
                    </div>

                    <button type="submit" className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-[10px] font-display font-black uppercase tracking-widest rounded-xl shadow-lg cursor-pointer gold-glow-btn">
                      Apply Changes settings
                    </button>
                  </form>

                  <div className="border-t border-zinc-900 pt-5 mt-6 space-y-4">
                    <h4 className="text-xs font-display font-bold text-[#FFD700] uppercase tracking-widest flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>สร้างโปรเจกต์ใหม่ (Create New Project Space)</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                      สร้างพื้นที่จัดเก็บงานใหม่ หากตรวจพบว่าบัญชีของคุณเชื่อมต่อกับ Google Drive เรียบร้อยแล้ว ระบบจะยิงคำสั่งสร้างโฟลเดอร์ Google Drive สำหรับโปรเจกต์นี้ให้ทันทีและนำลิงก์มาแสดงให้เข้าถึงด่วนในหน้าจอบอร์ดงาน
                    </p>

                    <form onSubmit={handleCreateNewProject} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-display tracking-widest text-zinc-500">ชื่อพื้นที่โปรเจกต์ (Project Name) *</label>
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="เช่น แผนพัฒนาระดับยุทธศาสตร์ 2026..."
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-yellow-500 text-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-display tracking-widest text-zinc-500">เป้าหมาย / คำนิยามสั้น (Description)</label>
                        <input
                          type="text"
                          value={newProjectDesc}
                          onChange={(e) => setNewProjectDesc(e.target.value)}
                          placeholder="อธิบายสรุปขอบเขตงานสั้นๆ..."
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-yellow-500 text-zinc-300"
                        />
                      </div>

                      {createProjectMsg && (
                        <div className="text-[11px] text-[#FFD700] bg-yellow-500/15 border border-yellow-500/20 px-3.5 py-2.5 rounded-xl font-mono">
                          {createProjectMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={creatingProject}
                        className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-zinc-950 text-[10px] font-display font-black uppercase tracking-widest rounded-xl shadow-lg cursor-pointer gold-glow-btn flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{creatingProject ? 'กำลังทำงาน...' : 'สร้างโปรเจกต์ใหม่ (Create Project)'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: SEEDED PRESET TEMPLATES */}
              {activeTab === 'templates' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-2.5">
                    Preset Workspace Seeds
                  </h3>
                  <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-4">
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      💡คุณสามารถเตรียมข้อมูลหรือ Seeds presets เริ่มต้นสำหรับความสะดวกด่วน เช่น ป้ายสี, จัดฉากเวิร์กโฟลว์, กำหนดขจัดข้อแย้งตารางเวลานัดหมายอัตโนมัติ
                    </p>
                    <div className="p-3.5 bg-zinc-950 border border-zinc-900/60 rounded-xl space-y-2">
                      <h4 className="text-xs font-semibold text-zinc-200">Alex Morgan Executive Seed Case</h4>
                      <p className="text-[10px] text-zinc-550 leading-relaxed font-sans">
                        - 3 spaces: Core Work Dev, Creative Design Sprint, Personal Health Track.<br/>
                        - 10 pre-loaded tasks including reference prefixes.<br/>
                        - High priority triggers setup.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CLIENT PUBLIC SHARING */}
              {activeTab === 'sharing' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-2.5">
                    RLS Public Shared Gateways
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    คุณสามารถกำหนดค่าการเข้าถึงโปรเจกต์รายชิ้นแชร์ไปยังภายนอก โดยระบบ Row-Level Security จะคอยสอดส่องป้องกันบุคคลภายนอกแก้ไขค่าของคุณอย่างเบ็ดเสร็จ
                  </p>
                  <div className="space-y-2.5">
                    {projects.map((p) => (
                      <div key={p.id} className="p-3 bg-zinc-950/40 border border-[#1a1a1a] rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate text-zinc-200">{p.name}</p>
                          <span className="text-[9px] font-mono text-zinc-650 block mt-0.5">ID: {p.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-[9px] font-mono text-zinc-500 uppercase">
                            {p.sharing_settings?.public_access ? '🌐 Public shared' : '🔒 Private zone'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DEVELOPER API KEYS & WEBHOOK DISPATCH GATEWAYS */}
              {activeTab === 'api_webhooks' && (
                <div className="space-y-7 pr-1 max-h-[580px] overflow-y-auto">
                  
                  {/* GENERATOR KEY SECTION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-display font-bold text-[#FFD700] uppercase tracking-widest border-b border-zinc-900/60 pb-1.5 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Developer API Client Keys</span>
                    </h4>

                    {/* Show Once generated value block */}
                    <AnimatePresence>
                      {generatedKeyOnce && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between text-[#FFD700]">
                            <span className="text-[9px] uppercase font-display tracking-widest font-black">CRITICAL: COPY KEY IMMEDIATELY</span>
                            <button onClick={() => setGeneratedKeyOnce(null)} className="text-zinc-400 hover:text-white text-xs font-semibold">I saved it</button>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-sans">คีย์พรีเมียมตัวนี้ผลิตใหม่สดเพื่อความปลอดภัยและจะแสดงเพียงครั้งเดียวเท่านั้นในจอภาพนี้:</p>
                          <code className="p-2.5 bg-zinc-950/80 border border-zinc-900 text-xs font-mono text-[#FFD700] block select-all rounded-lg overflow-x-auto">
                            {generatedKeyOnce}
                          </code>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* New Key form */}
                    <form onSubmit={handleGenerateApiKey} className="flex gap-2.5">
                      <input
                        type="text"
                        required
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="ตั้งชื่อจุดมุ่งประสงค์คีย์ เช่น Mac Mini Terminal integration..."
                        className="flex-grow bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-500"
                      />
                      <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-[10px] font-display font-black py-2.5 px-4 rounded-xl cursor-pointer shadow">
                        GENERATE
                      </button>
                    </form>

                    {/* Table lists */}
                    <div className="space-y-1.5 mt-2">
                      {apiKeys.length > 0 ? (
                        apiKeys.map((key) => (
                          <div key={key.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-200 truncate">{key.name}</p>
                              <code className="text-[10px] text-[#FFD700] font-mono mt-0.5 block">{key.masked_key}</code>
                            </div>
                            <button onClick={() => handleDeleteApiKey(key.id)} className="text-zinc-600 hover:text-[#FF6B6B] p-1.5 rounded bg-zinc-950 border border-zinc-900">
                              Revoke
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-600 italic pl-1.5">No client developer keys generated yet.</p>
                      )}
                    </div>
                  </div>

                  {/* REGISTER WEBHOOK SECTION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-display font-bold text-[#FFD700] uppercase tracking-widest border-b border-zinc-900/60 pb-1.5 flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      <span>Workspace Postback Webhooks</span>
                    </h4>

                    <form onSubmit={handleRegisterWebhook} className="space-y-3">
                      <div className="flex gap-2.5">
                        <input
                          type="url"
                          required
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="ยัดปลายทางโฮสท์ https://my-server.com/webhook..."
                          className="flex-grow bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-500"
                        />
                        <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-[10px] font-display font-black py-2.5 px-4 rounded-xl cursor-pointer">
                          REGISTER
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-4 px-1 text-[10px]">
                        <label className="flex items-center gap-1.5 text-zinc-400">
                          <input
                            type="checkbox"
                            checked={webhookEvents.includes('task.created')}
                            onChange={(e) => setWebhookEvents(prev => e.target.checked ? [...prev, 'task.created'] : prev.filter(ev => ev !== 'task.created'))}
                          />
                          <span>task.created</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-400">
                          <input
                            type="checkbox"
                            checked={webhookEvents.includes('task.updated')}
                            onChange={(e) => setWebhookEvents(prev => e.target.checked ? [...prev, 'task.updated'] : prev.filter(ev => ev !== 'task.updated'))}
                          />
                          <span>task.updated</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-400">
                          <input
                            type="checkbox"
                            checked={webhookEvents.includes('task.completed')}
                            onChange={(e) => setWebhookEvents(prev => e.target.checked ? [...prev, 'task.completed'] : prev.filter(ev => ev !== 'task.completed'))}
                          />
                          <span>task.completed</span>
                        </label>
                      </div>
                    </form>

                    {/* List webhooks */}
                    <div className="space-y-1.5 mt-2">
                      {webhooks.length > 0 ? (
                        webhooks.map((wh) => (
                          <div key={wh.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <code className="text-zinc-250 font-mono truncate block text-[10px]">{wh.url}</code>
                              <div className="flex gap-1.5 mt-1">
                                {wh.events.map((ev: string) => (
                                  <span key={ev} className="px-1 py-0.3 bg-zinc-950 border border-zinc-900 rounded text-[8px] text-zinc-500">{ev}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrinks-0">
                              <button onClick={() => handleToggleWebhook(wh.id)} className="px-2 py-1 text-[9px] hover:text-white text-zinc-500 rounded bg-zinc-950 border border-zinc-900">
                                {wh.isActive ? 'Active' : 'Disabled'}
                              </button>
                              <button onClick={() => handleDeleteWebhook(wh.id)} className="text-red-400 shrink-0 p-1">🗑️</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-600 italic pl-1.5">No webhooks endpoints registered.</p>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE REST SPECIFICATION (SWAGGER) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-display font-bold text-[#FFD700] uppercase tracking-widest border-b border-zinc-900/60 pb-1.5 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Swagger Interactive Specifications docs</span>
                    </h4>

                    {apiDocs && (
                      <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-2xl max-h-48 overflow-y-auto font-mono text-[10px] leading-relaxed text-zinc-400 space-y-2 select-all">
                        <p className="text-[#FFD700] font-semibold">{apiDocs.info.title} v{apiDocs.info.version}</p>
                        <p className="text-zinc-500 font-sans">{apiDocs.info.description}</p>
                        <hr className="border-zinc-900 mb-1"/>
                        {apiDocs.endpoints.map((ep: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <span className="text-indigo-400 font-bold">{ep.path}</span>
                            <div className="pl-4">
                              {Object.keys(ep.methods).map((m) => (
                                <p key={m} className="text-zinc-500">
                                  <span className="font-bold text-yellow-500">{m}</span> : {ep.methods[m].summary}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 5: CUSTOM DEVELOPER EXTENSIONS */}
              {activeTab === 'extensions' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-2.5">
                    Custom themes & Extensions Block
                  </h3>

                  <form onSubmit={handleInstallExtension} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Extension Name</label>
                        <input
                          type="text"
                          required
                          value={extName}
                          onChange={(e) => setExtName(e.target.value)}
                          placeholder="เช่น Matrix Green Glow..."
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none text-white font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Type Category</label>
                        <select
                          value={extType}
                          onChange={(e) => setExtType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-2 text-xs focus:outline-none text-zinc-300"
                        >
                          <option value="theme">Custom UI Theme Pack</option>
                          <option value="block">Rich Text Custom Block editor</option>
                          <option value="worker">Background script automation worker</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-display tracking-widest text-zinc-500">Source JavaScript code block</label>
                      <textarea
                        rows={5}
                        required
                        value={extCode}
                        onChange={(e) => setExtCode(e.target.value)}
                        placeholder="// Type code scripts here..."
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs font-mono text-zinc-300 focus:outline-none"
                      />
                    </div>

                    <button type="submit" className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-[10px] font-display font-black uppercase tracking-widest rounded-xl cursor-pointer">
                      Deploy extension
                    </button>
                  </form>

                  {/* Lists */}
                  <div className="space-y-2 mt-4">
                    {extensions.map((ext) => (
                      <div key={ext.id} className="p-3 bg-zinc-950/40 border border-[#1a1a1a] rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-200 truncate">{ext.name}</p>
                          <span className="text-[9px] font-mono text-zinc-650 mt-0.5 block">Author: {ext.author} • Category: {ext.type}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/15 text-[9px] font-mono text-yellow-500 uppercase">
                          {ext.is_enabled ? 'Ready Active' : 'Suspended'}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 6: MCP SERVERS CONNECTION NODES */}
              {activeTab === 'mcp' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-2.5">
                    MCP Server Node definitions
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    เพิ่มขอบแขนความอัจฉริยะปัญญาประดิษฐ์ (AI Core) ด้วยการปักเป้า MCP (Model Context Protocol) ภายนอก ส่งผลให้ Agent ใน workspace สามารถแก้ไขไฟล์และวิเคราะห์รูปภาพได้สมบูรณ์
                  </p>

                  <form onSubmit={handleAddMcpServer} className="flex gap-2.5 flex-col sm:flex-row">
                    <input
                      type="text"
                      required
                      value={mcpName}
                      onChange={(e) => setMcpName(e.target.value)}
                      placeholder="Name: e.g. Notion MCP File System"
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    />
                    <input
                      type="url"
                      required
                      value={mcpUrl}
                      onChange={(e) => setMcpUrl(e.target.value)}
                      placeholder="Connector Host url: http://localhost:8500"
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    />
                    <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-[10px] font-display font-black py-2.5 px-4 rounded-xl cursor-pointer">
                      REGISTER
                    </button>
                  </form>

                  <div className="space-y-2 mt-4">
                    {mcpServers.map((srv) => (
                      <div key={srv.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-200 truncate">{srv.name}</p>
                          <code className="text-[10px] text-zinc-600 block mt-0.5">{srv.url}</code>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold font-mono ${
                          srv.isConnected ? 'bg-[#50C878]/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-950/10 text-red-500 border border-red-500/20'
                        }`}>
                          {srv.isConnected ? '● Connected' : '✕ Offline'}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 7: VERCEL & UPSTASH STATEFUL WORKFLOW PLAYGROUND */}
              {activeTab === 'workflows' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-zinc-900 pb-2.5 flex items-center justify-between">
                      <span>Vercel & Upstash Durable Workflows</span>
                      <span className="text-[9px] font-mono bg-yellow-500/10 border border-yellow-500/20 text-[#FFD700] px-2 py-0.5 rounded-full">Durable Execution</span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-2">
                      ออกแบบและควบคุมเวิร์กโฟลว์รูปแบบไร้สถานะ (Serverless Stateful Steps) ผ่าน <span className="font-semibold text-yellow-500">@upstash/workflow</span> และ Vercel Functions ช่วยให้มั่นใจได้ว่างงานที่ต้องทำหลายขั้นตอนหรือดีเลย์ข้ามวัน (Sleep and Retries) จะสามารถประมวลผลสำเร็จโดยไม่กังวลเรื่อง Timeout ผิดพลาด
                    </p>
                  </div>

                  {/* Visual flowchart step progress indicator */}
                  <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-2xl relative overflow-hidden space-y-4">
                    <p className="text-[10px] uppercase font-display tracking-wider text-zinc-500">Dynamic Step Visualizer Panel</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 relative">
                      <div className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between h-24 ${
                        wfCurrentStep >= 1 ? 'bg-yellow-500/10 border-yellow-500/50 text-[#FFD700]' : 'bg-zinc-900/40 border-zinc-900 text-zinc-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase">Step 1</span>
                          {wfCurrentStep === 1 && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />}
                          {wfCurrentStep > 1 && <span className="text-[10px] text-emerald-400">✓</span>}
                        </div>
                        <p className="text-xs font-semibold">Fetch Task</p>
                        <span className="text-[8px] opacity-75 font-mono">context.run()</span>
                      </div>

                      <div className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between h-24 ${
                        wfCurrentStep >= 3 ? 'bg-yellow-500/10 border-yellow-500/50 text-[#FFD700]' : 'bg-zinc-900/40 border-zinc-900 text-zinc-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase">Step 2</span>
                          {wfCurrentStep === 3 && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />}
                          {wfCurrentStep > 3 && <span className="text-[10px] text-emerald-400">✓</span>}
                        </div>
                        <p className="text-xs font-semibold">AI Summarizer</p>
                        <span className="text-[8px] opacity-75 font-mono">Gemini-3.5-flash</span>
                      </div>

                      <div className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between h-24 ${
                        wfCurrentStep >= 4 ? 'bg-yellow-500/10 border-yellow-500/50 text-[#FFD700]' : 'bg-zinc-900/40 border-zinc-900 text-zinc-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase">Step 3</span>
                          {wfCurrentStep === 4 && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />}
                          {wfCurrentStep > 4 && <span className="text-[10px] text-emerald-400">✓</span>}
                        </div>
                        <p className="text-xs font-semibold">Sleep Delay</p>
                        <span className="text-[8px] opacity-75 font-mono">context.sleep()</span>
                      </div>

                      <div className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between h-24 ${
                        wfCurrentStep >= 5 ? 'bg-yellow-500/10 border-yellow-500/50 text-[#FFD700]' : 'bg-zinc-900/40 border-zinc-900 text-zinc-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase">Step 4</span>
                          {wfCurrentStep === 5 && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />}
                          {wfCurrentStep > 5 && <span className="text-[10px] text-emerald-400">✓</span>}
                        </div>
                        <p className="text-xs font-semibold">OAuth Notify</p>
                        <span className="text-[8px] opacity-75 font-mono">Google Chat API</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={runWorkflowSimulation}
                        disabled={wfStatus === 'running'}
                        className="bg-[#FFD700] hover:bg-yellow-400 text-zinc-950 font-display font-black text-[10px] uppercase tracking-widest py-2 px-4 rounded-xl cursor-pointer duration-200 shadow-md shadow-yellow-500/10 flex items-center gap-1.5 disabled:opacity-40"
                      >
                        {wfStatus === 'running' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Executing Steps...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-zinc-950 animate-pulse" />
                            <span>Run Durable Workspace Workflow</span>
                          </>
                        )}
                      </button>

                      {wfStatus !== 'idle' && (
                        <button
                          onClick={() => {
                            setWfStatus('idle');
                            setWfCurrentStep(0);
                            setWfLogs([]);
                          }}
                          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-350 text-[9px] uppercase font-display font-medium rounded-xl py-2 px-3 cursor-pointer"
                        >
                          Clear Simulator
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Simulator real-time logs terminal */}
                  {wfLogs.length > 0 && (
                    <div className="bg-[#050505] border border-zinc-900 p-4 rounded-xl space-y-2.5 font-mono text-[10px] tracking-wide text-zinc-300 leading-relaxed shadow-inner">
                      <p className="text-[#FFD700] text-[9px] font-bold uppercase tracking-wider">⚡ Vercel Stateful execution live trace logs:</p>
                      <div className="space-y-1 max-h-[160px] overflow-y-auto">
                        {wfLogs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-zinc-600 select-none">[{i+1}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Syntax-highlighted sample code block selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-[10px] uppercase font-display tracking-wider text-zinc-400 font-bold block">Developer Code Blueprint (ESM Layout)</span>
                      <div className="flex bg-zinc-950 border border-zinc-900 rounded-lg p-0.5 scale-90">
                        <button
                          onClick={() => setWfMode('upstash')}
                          className={`px-2 py-0.5 rounded text-[8px] font-display font-bold uppercase tracking-wider duration-150 cursor-pointer ${
                            wfMode === 'upstash' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          @upstash/workflow
                        </button>
                        <button
                          onClick={() => setWfMode('vercel')}
                          className={`px-2 py-0.5 rounded text-[8px] font-display font-bold uppercase tracking-wider duration-150 cursor-pointer ${
                            wfMode === 'vercel' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Vercel Workflows
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#030303] border border-zinc-900 p-4 rounded-2xl relative group font-mono text-[9.5px] leading-relaxed text-zinc-400 select-all overflow-x-auto max-h-[280px]">
                      {wfMode === 'upstash' ? (
                        <pre>{`// /app/api/workflows/route.ts
import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve(async (context) => {
  // Step 1: ดึงรายละเอียดการเปลี่ยนแปลงภารกิจ
  const task = await context.run("fetch-task-detail", async () => {
    return await fetch("https://bl1nk.demo/api/tasks/BL1NK-9402").then((res) => res.json());
  });

  // Step 2: ประเมินสรุปและจัดระเบียบเนื้อหาด้วย Gemini AI
  const summary = await context.run("ai-summarize-task-notes", async () => {
    return await fetch("https://bl1nk.demo/api/gemini/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "สรุปเป้าหมายภารกิจ: " + task.notes })
    }).then(res => res.json());
  });

  // Step 3: ต้านทานและหลับรอตามเงื่อนไข Sleep (Durable Thread Pause)
  await context.sleep("delay-duration", "5s");

  // Step 4: Dispatch ข้อมูลแจ้งเตือนเข้าแชตกูเกิลเวิร์กสเปซ
  await context.run("send-google-workspace-notification", async () => {
    await fetch("https://chat.googleapis.com/v1/spaces/m804/messages", {
      method: "POST",
      headers: { "Authorization": "Bearer GOOGLE_OAUTH_TOKEN" },
      body: JSON.stringify({ text: "⚡ เวิร์กโฟลว์ " + task.id + " ทำงานสำเร็จแล้ว: " + summary.text })
    });
  });
});`}</pre>
                      ) : (
                        <pre>{`// /app/api/vercel-workflow/route.ts
import { workflow } from "@vercel/functions/workflows";

export default workflow(async (context) => {
  // Step 1: Stateful execution on Vercel Edge Runtime
  const task = await context.run("fetch-task-metadata", async () => {
    return { id: "BL1NK-9402", title: "Optimize DB Queries", notes: "Analyze slow indexes" };
  });

  // Step 2: Dynamic LLM Generation with stateless guarantees
  const summary = await context.run("ai-agent-summary", async () => {
    const aiResponse = await fetch("https://bl1nk.demo/api/gemini/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: task.notes })
    }).then(res => res.json());
    return aiResponse.text;
  });

  // Step 3: Secure Durable sleep
  await context.sleep("wait-cooldown", 5000);

  // Step 4: Dispatch Webhook Event
  await context.run("dispatch-final-webhook", async () => {
    await fetch("https://bl1nk.demo/api/webhooks", {
      method: "POST",
      body: JSON.stringify({ event: "workflow.completed", summary })
    });
  });
});`}</pre>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}
    </WorkspaceShell>
  );
}

export default function SettingsCenter() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 text-[#FFD700]">
        <span className="font-display tracking-[0.2em] text-[10px] uppercase">Reticulating developer dashboard...</span>
      </div>
    }>
      <SettingsCenterContent />
    </Suspense>
  );
}
