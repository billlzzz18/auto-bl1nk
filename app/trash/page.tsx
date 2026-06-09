'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import WorkspaceShell from '@/components/WorkspaceShell';
import {
  Trash2,
  RefreshCw,
  ArchiveRestore,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  CheckSquare
} from 'lucide-react';

/**
 * JSDoc: บอร์ดกู้คืนสถานะถังขยะส่วนกลาง (page /app/trash)
 * ตรวจสอบและควบคุมรายชิ้น กู้คืนเวิร์กสเปซหรือประชดลบข้อมูลแบบถาวร
 */
export default function TrashBinHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trashItems, setTrashItems] = useState<any[]>([]);

  // ดึงรายการในถังขยะ
  const loadTrash = async () => {
    try {
      const res = await fetch('/api/trash');
      const data = await res.json();
      setTrashItems(data.data || []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTrash();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  // คืนค่า
  const handleRestore = async (id: string) => {
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id })
      });

      if (res.ok) {
        setTrashItems((p) => p.filter((item) => item.id !== id));
        alert('กู้คืนข้อมูลเวิร์กสเปซกลับสู่สภาพแวดล้อมหลักเรียบร้อย!');
        loadTrash();
      }
    } catch (e) {}
  };

  // ลบถาวรรายชิ้น
  const handleDeletePermanently = async (id: string) => {
    if (!confirm('ข้อมูลชิ้นนี้รวมถึงความเกี่ยวข้องใดๆ จะโดนทำลายแบบถาวรและไม่สามารถกู้คืนได้อีก ต้องการดำเนินการต่อหรือไม่?')) return;
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_permanently', id })
      });

      if (res.ok) {
        setTrashItems((p) => p.filter((item) => item.id !== id));
        loadTrash();
      }
    } catch (e) {}
  };

  // ล้างลบทั้งหมด
  const handleWipeAll = async () => {
    if (!confirm('ยืนยันล้างถังขยะทั้งหมด ข้อมูลทั้งหมดจะสูญหายอย่างถาวร!')) return;
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'empty_trash' })
      });

      if (res.ok) {
        setTrashItems([]);
      }
    } catch (e) {}
  };

  return (
    <WorkspaceShell onRefreshStates={loadTrash}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[55vh] text-[#FFD700]">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-yellow-500" />
          <span className="font-display tracking-[0.2em] text-[10px] uppercase">Scanning magnetic particles...</span>
        </div>
      ) : (
        <div id="trash-hub-canvas" className="space-y-6 pb-16 animate-fade-in duration-500">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/60 pb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-black text-white flex items-center gap-2.5">
                <Trash2 className="w-6 h-6 text-[#FF6B6B]" />
                <span>30-DAY AUTOMATIC PURGE BUFFER</span>
              </h2>
              <p className="text-zinc-500 text-xs mt-1 font-sans">
                โฟลเดอร์โครงการหรือแผ่นงานการ์ดข้างล่างนี้จะถูกตัดล้างทำความสะอาดอัตโนมัติเมื่อพ้นกำหนดครบ 30 วัน
              </p>
            </div>

            {trashItems.length > 0 && (
              <button
                onClick={handleWipeAll}
                className="px-4 py-2 bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 text-[#FF6B6B] text-[10px] font-display font-semibold uppercase tracking-wider rounded-xl cursor-pointer duration-200"
              >
                Empty Entire Trash bin
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {trashItems.length > 0 ? (
              trashItems.map((item) => {
                const isProject = item.item_type === 'project';
                
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-zinc-950/40 border border-[#1b1b1b] rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-805 duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isProject ? (
                        <FolderOpen className="w-5 h-5 text-yellow-500 shrink-0" />
                      ) : (
                        <CheckSquare className="w-5 h-5 text-zinc-500 shrink-0" />
                      )}
                      
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">
                          {isProject ? item.item_data.project?.name : item.item_data?.title}
                        </p>
                        <span className="text-[9px] font-mono text-zinc-650 block mt-0.5">
                          Category: {item.item_type} • Deleted: {new Date(item.deleted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <button
                        onClick={() => handleRestore(item.id)}
                        className="px-2.5 py-1 text-[10px] hover:text-[#FFD700] bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400 flex items-center gap-1 cursor-pointer duration-150"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RESTORE</span>
                      </button>

                      <button
                        onClick={() => handleDeletePermanently(item.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-red-950/10 cursor-pointer"
                      >
                        Wipe
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-zinc-950/10 rounded-2xl border border-zinc-900/60 p-6">
                <Trash2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <h4 className="text-xs font-semibold text-zinc-400 font-display">Trash bin is clean</h4>
                <p className="text-[10px] text-zinc-600 mt-1 font-sans">
                  ไม่มีไฟล์ ข้อมูล หรือโปรเจกต์ค้างบ่มทำลายอยู่ในส่วนการ์ดขยะ
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </WorkspaceShell>
  );
}
