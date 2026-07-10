'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import WorkspaceShell from '@/components/WorkspaceShell';
import { 
  Cloud, 
  FileSpreadsheet, 
  Search, 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  Paperclip,
  Calendar,
  FileText,
  MessageSquare,
  Pin,
  Plus,
  Trash2,
  Check,
  Send,
  AlertCircle,
  Copy,
  Info,
  Mail,
  CheckSquare,
  ListTodo
} from 'lucide-react';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  auth, 
  googleProvider, 
  db,
  setCachedAccessToken, 
  getCachedAccessToken 
} from '@/lib/googleAuth';

// JSDoc: ฟังก์ชันเสรี ดึงเวลาปัจจุบันนอก Component Scope เพื่อหลีกเลี่ยงกฎความบริสุทธิ์ของตัวจัดการ React React-purity
const getTimestamp = () => Date.now();

/**
 * JSDoc: แผงควบคุมเชื่อมต่อ Google Workspace อัจฉริยะแบบครบวงจร (Drive, Sheets, Calendar, Docs, Chat และ Keep)
 * แปลงข้อมูลเรียลไทม์ และเก็บรักษาบันทึกย่อ Keep Memos ลงระบบ Firebase Firestore ของผู้ใช้จริงๆ
 */
export default function GoogleWorkspaceIntegrations() {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'files_sheets' | 'docs_calendar' | 'google_tasks' | 'gmail_core' | 'keep_memos' | 'chat_spaces'>('files_sheets');

  // Drive States
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Sheets Sync States
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  // Import Sheets States
  const [targetSpreadsheetId, setTargetSpreadsheetId] = useState('');
  const [importProjectId, setImportProjectId] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // Google Keep Memos States (Firestore backed!)
  const [memos, setMemos] = useState<any[]>([]);
  const [loadingMemos, setLoadingMemos] = useState(false);
  const [memoTitleInput, setMemoTitleInput] = useState('');
  const [memoContentInput, setMemoContentInput] = useState('');
  const [memoColor, setMemoColor] = useState('#22252a'); // Background color default
  const [keepSource, setKeepSource] = useState<'keep_api' | 'firestore_backup'>('firestore_backup');
  const [keepApiError, setKeepApiError] = useState<string | null>(null);
  const [keepMemos, setKeepMemos] = useState<any[]>([]);
  const [loadingKeepMemos, setLoadingKeepMemos] = useState(false);

  // Google Docs Creation States
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docStatus, setDocStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [docMessage, setDocMessage] = useState('');
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  // Google Calendar States
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [taskToCalStatus, setTaskToCalStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [calFeedback, setCalFeedback] = useState('');
  const [newTaskEventTitle, setNewTaskEventTitle] = useState('');
  const [newTaskEventDate, setNewTaskEventDate] = useState('');

  // Google Chat States
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [customSpaceName, setCustomSpaceName] = useState('');
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatStatus, setChatStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [chatMessageFeedback, setChatMessageFeedback] = useState('');

  // Google Tasks States
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [googleTasksList, setGoogleTasksList] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskFeedback, setTaskFeedback] = useState('');

  // Gmail States
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingGmail, setSendingGmail] = useState(false);
  const [gmailFeedback, setGmailFeedback] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
          setImportProjectId(data[0].id);
        }
      }
    } catch (e) {}
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCachedAccessToken(null);
      setGoogleUser(null);
      setToken(null);
      setDriveFiles([]);
      
      // บันทึกสถานะใน User DB
      await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_connected: false })
      });
    } catch (e) {}
  };

  const fetchDriveFiles = async (accessToken: string, query: string = '') => {
    setLoadingDrive(true);
    setDriveError(null);
    try {
      let url = 'https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,webViewLink,iconLink)';
      if (query) {
        url += `&q=name+contains+'${encodeURIComponent(query)}'+and+trashed=false`;
      } else {
        url += '&q=trashed=false';
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        throw new Error('โทเค็นหมดอายุหรือไม่มีสิทธิ์การเข้าถึงภายนอก');
      }

      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      setDriveError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง Google Drive');
    } finally {
      setLoadingDrive(false);
    }
  };

  // Google Calendar: โหลดรายการกิจกรรมล่ารางวัลจากปฏิทินจริง
  const fetchCalendarEvents = async (accessToken: string) => {
    setLoadingCalendar(true);
    setCalendarError(null);
    try {
      const nowStr = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=8&orderBy=startTime&singleEvents=true&timeMin=${nowStr}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูล Google Calendar ได้ ตรวจเช็กสิทธิเข้าถึง');
      }

      const data = await res.json();
      setCalendarEvents(data.items || []);
    } catch (err: any) {
      setCalendarError(err.message || 'ล้มเหลวในการเชื่อมโยงปฏิทิน');
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Google Chat: ค้นหาห้องแชต (Spaces) ที่เชื่อมโยง
  const fetchChatSpaces = async (accessToken: string) => {
    setLoadingSpaces(true);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setChatSpaces(data.spaces || []);
        if (data.spaces?.length > 0) {
          setSelectedSpaceId(data.spaces[0].name);
        }
      }
    } catch (err) {} finally {
      setLoadingSpaces(false);
    }
  };

  // JSDoc: แปลงโครงสร้างวิเศษของ Google Keep Notes API เป็น Standard Object
  const parseKeepNotes = (items: any[]) => {
    return items.map((item: any) => {
      let content = '';
      if (item.body?.text?.text) {
        content = item.body.text.text;
      } else if (item.body?.list?.listItems) {
        content = item.body.list.listItems
          .map((li: any) => `[${li.checked ? 'x' : ' '}] ${li.text?.text || ''}`)
          .join('\n');
      }
      return {
        id: item.name ? item.name.replace('notes/', '') : item.id,
        title: item.title || 'Untitled Keep Note 📌',
        content: content || 'Empty Note Content',
        color: '#22252a',
        created_at: item.createTime ? new Date(item.createTime).getTime() : Date.now(),
        isGoogleKeep: true,
        name: item.name
      };
    });
  };

  // JSDoc: โหลดข้อมูลกระดานบันทึกจาก Google Keep API โดยตรง หากไม่สำเร็จจะทำการ Fallback เป็น Firestore อัตโนมัติ
  const fetchKeepApiNotes = async (accessToken: string) => {
    setLoadingKeepMemos(true);
    setKeepApiError(null);
    try {
      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('ตรวจพบข้อจำกัดสิทธิการขอเข้าใช้ Google Keep API สำหรับบัญชีบุคคลทั่วไป (@gmail.com) คณะผู้พัฒนาแนะนำให้ใช้ Cloud Sync (Firestore) ที่มีความเสถียรและทนทานแทนระบบ API ตรงของ Keep');
        }
        throw new Error(`ไม่สามารถโหลด Google Keep Notes ได้: รหัส ${res.status}`);
      }
      const data = await res.json();
      const parsed = parseKeepNotes(data.notes || []);
      setKeepMemos(parsed);
      setKeepSource('keep_api');
    } catch (err: any) {
      console.warn('Google Keep API integration fallback to Firestore triggered:', err.message);
      setKeepApiError(err.message);
      setKeepSource('firestore_backup');
      // ดึง Firestore แทนทันทีเพื่อความเสถียรไร้พอร์ทเวท
      fetchMemos();
    } finally {
      setLoadingKeepMemos(false);
    }
  };

  // JSDoc: สร้างบันทึกโน้ตตรงเข้าคลาวด์ Google Keep Account
  const handleAddMemoToKeep = async (title: string, content: string) => {
    if (!token) return;
    try {
      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body: {
            text: {
              text: content
            }
          }
        })
      });
      if (!res.ok) {
        throw new Error(`สร้างบันทึกบน Google Keep ไม่สำเร็จ: รหัส ${res.status}`);
      }
      fetchKeepApiNotes(token);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `สำเร็จ! บันทึกโน้ตตรงเข้าบัญชี Google Keep ของคุณแล้ว 📝` }
        }));
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการเขียนโน้ตลง Keep');
    }
  };

  // JSDoc: สั่งงานลบบันทึกออกจาระบบคลาวด์ Google Keep อย่างถาวร
  const handleDeleteMemoFromKeep = async (name: string) => {
    if (!token) return;
    try {
      const res = await fetch(`https://keep.googleapis.com/v1/${name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error(`ลบบันทึกบน Google Keep ไม่สำเร็จ: รหัส ${res.status}`);
      }
      fetchKeepApiNotes(token);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `สำเร็จ! ลบโน้ตออกจาก Google Keep สำเร็จคลาวด์แล้ว 🗑️` }
        }));
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการสั่งลบโน้ตจาก Keep');
    }
  };

  // Firestore: ดึงโน้ต Keep Memos ออกมาจาก database จริง
  const fetchMemos = async () => {
    const localUserId = localStorage.getItem('bl1nk_user_id') || 'guest';
    setLoadingMemos(true);
    try {
      const q = query(collection(db, 'memos'), where('user_id', '==', localUserId));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      // ยึดเวลาสร้างล่าสุดขึ้นบนสุด
      items.sort((a, b) => b.created_at - a.created_at);
      setMemos(items);
    } catch (e) {
      console.error('Error fetching memos:', e);
    } finally {
      setLoadingMemos(false);
    }
  };

  /**
   * JSDoc: ดึงรายชื่อกระดานงาน (Tasklists) ทั้งหมดจาก Google Tasks API
   * ช่วยตรวจสอบกระดานดั้งเดิมของผู้ใช้งานเพื่อให้เลือกจัดการได้สะดวก
   * @param accessToken - โทเค็นยืนยันสิทธิ์เข้าใช้งาน Google Account
   */
  const fetchGoogleTaskLists = async (accessToken: string) => {
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const res = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error('ไม่สามารถเข้าถึงรายการของ Google Tasks ได้');
      const data = await res.json();
      const lists = data.items || [];
      setTaskLists(lists);
      if (lists.length > 0) {
        setSelectedTaskListId(lists[0].id);
        fetchGoogleTasks(accessToken, lists[0].id);
      }
    } catch (err: any) {
      setTasksError(err.message || 'ล้มเหลวในการเชื่อมต่อบัญชี Google Tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  /**
   * JSDoc: ดึงงานทั้งหมดภายใน Tasklist ที่เลือกจาก Google Tasks API และจัดเก็บลงตัวแปร state
   * @param accessToken - โทเค็นยืนยันสิทธิ์เข้าใช้งาน Google Account
   * @param listId - ไอดีรายการกลุ่มงานเป้าหมาย
   */
  const fetchGoogleTasks = async (accessToken: string, listId: string) => {
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลงานทั้งหมดในรายชื่อนี้ได้');
      const data = await res.json();
      setGoogleTasksList(data.items || []);
    } catch (err: any) {
      setTasksError(err.message || 'เกิดข้อผิดพลาดในการโหลดงาน Google Tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  /**
   * JSDoc: สร้างงานชิ้นใหม่ลงใน Google Tasks API บนระบบคลาวด์จริงและแจ้งเตือนพอร์ทัล
   * @param e - React Form Event
   */
  const handleCreateGoogleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTaskListId) return;
    if (!newTaskTitle.trim()) {
      alert('กรุณากรอกชื่อหัวข้อภารกิจอย่างน้อย 1 ตัวอักษร');
      return;
    }

    setCreatingTask(true);
    setTaskFeedback('กำลังบันทึกภารกิจเข้า Google Tasks...');

    try {
      const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${selectedTaskListId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTaskTitle,
          notes: newTaskNotes,
          due: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined
        })
      });

      if (!res.ok) throw new Error('เกิดปัญหาในการสร้างงานชิ้นใหม่บน Google Tasks');

      setTaskFeedback('สร้างงานสำเร็จแล้ว!');
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDueDate('');
      
      fetchGoogleTasks(token, selectedTaskListId);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `บันทึกงานใหม่เข้าสู่บัญชี Google Tasks แสนสะดวกเรียบร้อย!` }
        }));
      }
    } catch (err: any) {
      setTaskFeedback(err.message || 'ล้มเหลวในการจัดสร้างภารกิจ');
    } finally {
      setCreatingTask(false);
    }
  };

  /**
   * JSDoc: ปิดงานหรือสลับสถานะบันทึกว่าเสร็จสิ้นลง Google Tasks ของผู้ใช้
   * ลูกค้ายืนยันการดำเนินงานด้วย Confirm Dialogue ก่อนกดจัดส่งข้อมูล (User Confirmation rule)
   * @param task - ข้อมูล Object งานจาก Google Tasks API
   */
  const handleToggleGoogleTask = async (task: any) => {
    if (!token || !selectedTaskListId) return;

    const isCompleting = task.status !== 'completed';
    const actionName = isCompleting ? 'ทำเครื่องหมายว่าเสร็จสิ้น (Completed)' : 'ทำเครื่องหมายว่ายังไม่เสร็จสิ้น (Needs Action)';

    const confirmed = window.confirm(`คุณต้องการ ${actionName} สำหรับงาน "${task.title}" หรือไม่? การเปลี่ยนแปลงจะส่งผลไปยังบัญชี Google Tasks จริงทันที`);
    if (!confirmed) return;

    setLoadingTasks(true);
    try {
      const updatedStatus = isCompleting ? 'completed' : 'needsAction';
      const updatedTask = {
        ...task,
        status: updatedStatus,
        completed: isCompleting ? new Date().toISOString() : null
      };

      const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${selectedTaskListId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
      });

      if (!res.ok) throw new Error('ไม่สามารถบันทึกและสวิตช์สถานะงาน Google Tasks นี้ได้');

      fetchGoogleTasks(token, selectedTaskListId);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `ปรับสถานะสำเร็จสำหรับงานค้าง Google Tasks: "${task.title}"` }
        }));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการปรับสถานะงาน: ' + err.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  /**
   * JSDoc: ดึงอีเมลกล่องข้อความขาเข้า Gmail Inbox ด้วยการค้นหาและรวบรวมข้อมูลดีเทลพร้อมๆ กัน
   * @param accessToken - โทเค็นยืนยันสิทธิ์เข้าใช้งาน Google Account
   */
  const fetchGmailInbox = async (accessToken: string) => {
    setLoadingGmail(true);
    setGmailError(null);
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error('ไม่สามารถเชื่อมสารไปยัง Gmail API ได้ กรุณาเชื่อมสิทธิ์ใหม่อีกครั้ง');
      const data = await res.json();
      const messagesList = data.messages || [];

      const detailedMessages = await Promise.all(
        messagesList.map(async (msg: any) => {
          try {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              const headers = detail.payload?.headers || [];
              const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(ไม่มีชื่อเรื่อง)';
              const sender = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'ผู้ส่งที่ไม่รู้จัก';
              const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
              return {
                id: msg.id,
                snippet: detail.snippet || '',
                subject,
                sender,
                date
              };
            }
          } catch (e) {
            console.error('Error fetching message details:', e);
          }
          return { id: msg.id, snippet: '', subject: 'Error loading', sender: 'Error sender', date: '' };
        })
      );

      setGmailMessages(detailedMessages.filter(m => m !== undefined));
    } catch (err: any) {
      setGmailError(err.message || 'เชื่อมต่อสตรีมกล่องอีเมล Gmail ผิดพลาด');
    } finally {
      setLoadingGmail(false);
    }
  };

  /**
   * JSDoc: ออกแบบรหัสร่างและกดส่งอีเมลผ่าน Gmail API ปลายนอก
   * มีกระบวนการแจ้งเตือนและ Confirm Dialog ก่อนยิง API เพื่อความปลอดภัย (User Confirmation rule)
   * @param e - React Form Event
   */
  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      alert('กรุณากรอกข้อมูลผู้รับ ชื่อเรื่อง และรายละเอียดจดหมายให้ครบถ้วนก่อนส่ง!');
      return;
    }

    const confirmed = window.confirm(`ระบบกำลังจะส่งจดหมายอีเมลฉบับนี้จากบัญชีของคุณไปยัง: ${composeTo}\n\nคุณแน่ใจว่าต้องการส่งจริงใช่หรือไม่?`);
    if (!confirmed) return;

    setSendingGmail(true);
    setGmailFeedback('กำลังส่งเมลวิทยาสารผ่านเครือข่าย Gmail API...');

    try {
      const utf8_to_b64 = (str: string) => {
        return window.btoa(unescape(encodeURIComponent(str)));
      };
      
      const emailContent = [
        `To: ${composeTo}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: =?utf-8?B?${utf8_to_b64(composeSubject)}?=`,
        '',
        composeBody
      ].join('\r\n');

      const encodedEmail = utf8_to_b64(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!res.ok) throw new Error('เกิดข้อผิดพลาดขณะยิง Gmail API หรือสิทธิ์ถูกปฏิเสธ');

      setGmailFeedback('ส่งเมลของคุณเรียบร้อยแล้ว!');
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `จัดส่งจดหมายอีเมลสำเร็จเรียบร้อยแล้ว!` }
        }));
      }

      fetchGmailInbox(token);
    } catch (err: any) {
      setGmailFeedback(err.message || 'ส่งจดหมายล้มเหลว');
    } finally {
      setSendingGmail(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchProjects();
      fetchMemos();
    }, 100);
    
    // ดักสถานะ Auth
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setGoogleUser(user);
        const cached = getCachedAccessToken();
        if (cached) {
          setToken(cached);
          fetchDriveFiles(cached);
          fetchCalendarEvents(cached);
          fetchChatSpaces(cached);
          fetchGoogleTaskLists(cached);
          fetchGmailInbox(cached);
          fetchKeepApiNotes(cached);
        } else {
          await handleSignOut();
        }
      } else {
        setGoogleUser(null);
        setToken(null);
        setDriveFiles([]);
      }
    });

    return () => unsub();
  }, []);

  // JSDoc: อัปเดตข้อมูล Keep อัตโนมัติเมื่อเปลี่ยนแท็บมาประจำเป็น Google Keep Board
  useEffect(() => {
    if (token && activeTab === 'keep_memos') {
      const t = setTimeout(() => {
        fetchKeepApiNotes(token);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [token, activeTab]);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const tokenResult = (result as any).credential?.accessToken;
      
      if (tokenResult) {
        setToken(tokenResult);
        setCachedAccessToken(tokenResult);
        setGoogleUser(result.user);
        
        // บันทึกสถานะลง User DB ด้วย
        await fetch('/api/auth/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ google_connected: true })
        });

        fetchDriveFiles(tokenResult);
        fetchCalendarEvents(tokenResult);
        fetchChatSpaces(tokenResult);
        fetchGoogleTaskLists(tokenResult);
        fetchGmailInbox(tokenResult);
        fetchKeepApiNotes(tokenResult);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bl1nk-notification', {
            detail: { text: `เชื่อมต่อ Workspace สำเร็จ! ยืนยันพอร์ทคลาวด์อีเมล ${result.user.email}` }
          }));
        }
      } else {
        throw new Error('ไม่สามารถดึง OAuth Access Token ประจำของ Google บนระบบได้');
      }
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Google OAuth: ' + (err.message || err));
    } finally {
      setConnecting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (token) {
      const delay = setTimeout(() => {
        fetchDriveFiles(token, val);
      }, 500);
      return () => clearTimeout(delay);
    }
  };

  // ==========================================
  // EXPORT TO GOOGLE SHEETS
  // ==========================================
  const handleExportToSheets = async () => {
    if (!token) return;
    setSyncStatus('running');
    setSyncMessage('กำลังเตรียมสร้าง Google Sheet เล่มใหม่...');
    setCreatedSheetUrl(null);

    try {
      const tasksRes = await fetch(`/api/tasks?projectId=${selectedProjectId}`);
      if (!tasksRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลงานสเปซนี้ได้');
      const tasksList = await tasksRes.json();

      if (tasksList.length === 0) {
        throw new Error('โปรเจกต์นี้ไม่มีงานค้างอยู่อย่างน้อย 1 ชิ้น จึงไม่สามารถรันสเปรดชีตได้');
      }

      const structRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `bl1nk OS — Tasks Export Backup (${new Date().toLocaleDateString('th-TH')})`
          }
        })
      });

      if (!structRes.ok) throw new Error('การส่งโปรโตคอล Sheets API ผิดพลาด');
      const spreadsheetData = await structRes.json();
      const spreadsheetId = spreadsheetData.spreadsheetId;
      const sheetUrl = spreadsheetData.spreadsheetUrl;

      const headers = [['Task ID', 'Title', 'Status', 'Priority', 'Due Date', 'Description', 'Created UTC']];
      const itemsRows = tasksList.map((t: any) => [
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date || '',
        t.description || '',
        t.created_at || ''
      ]);

      const appendPayload = {
        values: [...headers, ...itemsRows]
      };

      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G${itemsRows.length + 1}?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appendPayload)
        }
      );

      if (!appendRes.ok) throw new Error('ไม่สามารถรันการพิมพ์ Appending ข้อมูลคอลัมน์ได้');

      setSyncStatus('success');
      setSyncMessage(`ส่งข้อมูลเรียบร้อย! สำรองข้อมูลภารกิจจำนวน ${tasksList.length} ชิ้นลงสเปรดชีตแล้ว`);
      setCreatedSheetUrl(sheetUrl);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `สำเร็จ! พล็อตงานจำนวน ${tasksList.length} ชิ้นลง Google Sheets เรียบร้อย` }
        }));
      }

      fetchDriveFiles(token);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(err.message || 'ล้มเหลวขณะพิมพ์เอกสาร');
    }
  };

  // ==========================================
  // IMPORT FROM GOOGLE SHEETS
  // ==========================================
  const handleImportFromSheets = async () => {
    if (!token) return;
    if (!targetSpreadsheetId.trim()) {
      alert('กรุณาป้อนรหัส Spreadsheet ID ของคุณก่อน');
      return;
    }

    setImportStatus('running');
    setImportMessage('เชื่อมต่อเครือข่ายนำเข้าและวิเคราะห์คอลัมน์...');

    try {
      const getRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId.trim()}/values/Sheet1!A1:G100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!getRes.ok) throw new Error('สิทธิเข้าถึงไม่เพียงพอ หรือ Spreadsheet ID ไม่ถูกต้อง');
      const cellData = await getRes.json();
      
      if (!cellData.values || cellData.values.length <= 1) {
        throw new Error('ไม่พบแถวงานที่ใช้งานได้ในสเปรดชีตนี้');
      }

      const rowsInput = cellData.values;
      const headers = rowsInput[0];

      const indexTitle = headers.findIndex((h: string) => h.toLowerCase().includes('title') || h.toLowerCase().includes('ชื่อ'));
      const indexStatus = headers.findIndex((h: string) => h.toLowerCase().includes('status') || h.toLowerCase().includes('สเตตัส'));
      const indexPriority = headers.findIndex((h: string) => h.toLowerCase().includes('priority') || h.toLowerCase().includes('ลำดับ'));
      const indexDueDate = headers.findIndex((h: string) => h.toLowerCase().includes('due') || h.toLowerCase().includes('กำหนด'));
      const indexDesc = headers.findIndex((h: string) => h.toLowerCase().includes('desc') || h.toLowerCase().includes('คำอธิบาย'));

      const tasksToInsert = [];
      for (let i = 1; i < rowsInput.length; i++) {
        const row = rowsInput[i];
        if (!row[indexTitle >= 0 ? indexTitle : 0]) continue;

        tasksToInsert.push({
          title: row[indexTitle >= 0 ? indexTitle : 1] || 'ภารกิจไร้ชื่อสำรอง',
          status: row[indexStatus >= 0 ? indexStatus : 2] || 'todo',
          priority: row[indexPriority >= 0 ? indexPriority : 3] || 'medium',
          due_date: row[indexDueDate >= 0 ? indexDueDate : 4] || '2026-06-30',
          description: row[indexDesc >= 0 ? indexDesc : 5] || 'นำเข้าผ่านเครือข่าย Google Sheets Connector API',
          project_id: importProjectId
        });
      }

      let successCount = 0;
      for (const t of tasksToInsert) {
        const createRes = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t)
        });
        if (createRes.ok) {
          successCount++;
        }
      }

      setImportStatus('success');
      setImportMessage(`อิมพอร์ตสำเร็จ! นำเข้างานใหม่จำนวน ${successCount} รายการแล้ว`);
      setTargetSpreadsheetId('');
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `สำเร็จ! ซิงค์เพิ่มงานใหม่ ${successCount} ชิ้นจาก Google Sheets แล้ว` }
        }));
      }
    } catch (err: any) {
      setImportStatus('error');
      setImportMessage(err.message || 'การนำเข้าล้มเหลว');
    }
  };

  // ==========================================
  // GOOGLE KEEP - FIREBASE PERSISTED MEMOS
  // ==========================================
  const handleAddMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoTitleInput.trim() && !memoContentInput.trim()) return;

    if (keepSource === 'keep_api' && token) {
      await handleAddMemoToKeep(memoTitleInput, memoContentInput);
      setMemoTitleInput('');
      setMemoContentInput('');
      setMemoColor('#22252a');
      return;
    }

    const localUserId = localStorage.getItem('bl1nk_user_id') || 'guest';
    try {
      const docRef = await addDoc(collection(db, 'memos'), {
        title: memoTitleInput,
        content: memoContentInput,
        color: memoColor,
        user_id: localUserId,
        created_at: getTimestamp()
      });

      if (docRef.id) {
        setMemoTitleInput('');
        setMemoContentInput('');
        setMemoColor('#22252a');
        fetchMemos();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bl1nk-notification', {
            detail: { text: `บันทึก Memo แล้ว (เก็บบนคลาวด์บอร์ด Firestore)` }
          }));
        }
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกลง Firestore: ' + err);
    }
  };

  const handleDeleteMemo = async (memoId: string, isGoogleKeep?: boolean, name?: string) => {
    if (isGoogleKeep && name && token) {
      await handleDeleteMemoFromKeep(name);
      return;
    }
    try {
      await deleteDoc(doc(db, 'memos', memoId));
      fetchMemos();
    } catch (err) {
      alert('ลบข้อมูลไม่สำเร็จ: ' + err);
    }
  };

  // พิมพ์ Memo ออกไปเป็นเอกสาร Docs สะดวกเร่งรัด
  const handleExportMemoToDoc = async (memo: any) => {
    if (!token) {
      alert('กรุณาเชื่อมบัญชีคลาวด์ Google ก่อนสั่งพิมพ์บันทึกย่อ!');
      return;
    }
    try {
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: memo.title || 'Memo Export bl1nk OS' })
      });

      if (!res.ok) throw new Error('เกิดปัญหากดขอสร้าง Docs API');
      const docData = await res.json();
      const documentId = docData.documentId;
      const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

      // อัปเดตเนื้อหาใน Docs
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `${memo.title || 'บันทึกของฉัน'}\n\n${memo.content || ''}\n\n---\nCreated via bl1nk Keep Controller\n`
              }
            }
          ]
        })
      });

      alert(`สำเร็จ! จัดสรรเอกสาร Docs ตัวใหม่คัดลอก Memo แล้ว เข้าดูได้ที่: ${docUrl}`);
      fetchDriveFiles(token);
    } catch (err: any) {
      alert('ล้มเหลวพิมพ์ Memo ออกคลาวด์ docs: ' + err.message);
    }
  };

  // ==========================================
  // GOOGLE DOCS GENERIC PUBLISHER
  // ==========================================
  const handleCreateGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!docTitle.trim()) {
      alert('กรุณาป้อนชื่อหัวข้อเอกสารที่ต้องการจัดทำ');
      return;
    }

    setDocStatus('running');
    setDocMessage('กำลังสร้างเอกสารจำลองโครงร่าง...');
    setCreatedDocUrl(null);

    try {
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: docTitle })
      });

      if (!res.ok) throw new Error('ส่งโครงสร้าง Docs API ปลายนอกไม่สำเร็จ');
      const docData = await res.json();
      const documentId = docData.documentId;
      const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

      if (docContent.trim()) {
        await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: docContent
                }
              }
            ]
          })
        });
      }

      setDocStatus('success');
      setDocMessage('สร้างและอัปโหลดไฟล์ Google Docs คลาวด์เรียบร้อยแล้ว!');
      setCreatedDocUrl(docUrl);
      setDocTitle('');
      setDocContent('');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `สำเร็จ! จัดส่ง Google Docs ชุดใหม่แล้ว เข้าแผงแก้ไขได้ทันที` }
        }));
      }

      fetchDriveFiles(token);
    } catch (err: any) {
      setDocStatus('error');
      setDocMessage(err.message || 'ล้มเหลวในการจัดทำเนื้อหาเอกสาร');
    }
  };

  // ==========================================
  // GOOGLE CALENDAR ACTIONS
  // ==========================================
  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newTaskEventTitle.trim() || !newTaskEventDate) {
      alert('กรุณากรอกข้อมูลกิจกรรมและกำหนดวันเวลาให้ครบการจองคาร์ด');
      return;
    }

    setTaskToCalStatus('running');
    setCalFeedback('กำลังเจรจากำหนดปฏิทิน Google Calendar...');

    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: newTaskEventTitle,
          description: 'เพิ่มกิจกรรมด่วนเชื่อมต่อโดยตรงผ่านแผงประสานงาน bl1nk ink OS',
          start: {
            date: newTaskEventDate,
            timeZone: 'Asia/Bangkok'
          },
          end: {
            date: newTaskEventDate,
            timeZone: 'Asia/Bangkok'
          }
        })
      });

      if (!res.ok) throw new Error('บัญชีไม่ยอมรับพารามิเตอร์ของ Calendar POST');
      
      setTaskToCalStatus('success');
      setCalFeedback(`บันทึกแผนงานเข้าปฏิทิน Calendar เรียบร้อย!`);
      setNewTaskEventTitle('');
      setNewTaskEventDate('');
      
      fetchCalendarEvents(token);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `ลงทะเบียนนัดหมายใหม่สำเร็จใน Google Calendar` }
        }));
      }
    } catch (err: any) {
      setTaskToCalStatus('error');
      setCalFeedback(err.message || 'ล้มเหลวจัดสร้างกิจกรรม');
    }
  };

  // ==========================================
  // GOOGLE CHAT MESSAGE DISPATCHER
  // ==========================================
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!chatMessageText.trim()) return;

    setChatStatus('running');
    setChatMessageFeedback('กำลังเข้ารหัสและส่งกระแสข้อมูลไปยังห้องแชต Google Chat...');

    try {
      // ส่งข้อมูลเข้า Chat Space
      let targetUrl = '';
      if (selectedSpaceId) {
        targetUrl = `https://chat.googleapis.com/v1/${selectedSpaceId}/messages`;
      } else if (customSpaceName.trim()) {
        targetUrl = `https://chat.googleapis.com/v1/spaces/${customSpaceName.trim()}/messages`;
      } else {
        throw new Error('กรุณาระบุห้องเป้าหมายหรือ ID ของ Space Chat');
      }

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `⚡ *bl1nk OS Notification Agent:*\n${chatMessageText}\n\n_เมื่อ ${new Date().toLocaleTimeString('th-TH')}_`
        })
      });

      if (!res.ok) {
        throw new Error('ไม่พบสิทธิการเขียนสารใน Space นี้ หรือรูปแบบ Space Name ไม่ถูกต้อง (ฟอร์แมต: spaces/AAAAA)');
      }

      setChatStatus('success');
      setChatMessageFeedback('กระจายข้อความสำเร็จ! สตรีมมิ่งบอร์ดอัปเดตแล้ว');
      setChatMessageText('');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bl1nk-notification', {
          detail: { text: `แจ้งข้อความใหม่ในกลุ่มแชตสมาคม Google Workspace Chat` }
        }));
      }
    } catch (err: any) {
      setChatStatus('error');
      setChatMessageFeedback(err.message || 'ส่งข้อความไม่สำเร็จ แนะนำใส่ Space Name รูปแบบ spaces/xxxxx');
    }
  };

  return (
    <WorkspaceShell>
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 p-1.5 md:p-4 pb-20">
        
        {/* Header Hero */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-amber-950 border border-amber-800 text-[10px] font-mono tracking-widest text-[#FFD700] font-extrabold uppercase animate-pulse">
              Universal Ecosystem
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight flex items-center gap-3">
            <Cloud className="w-8 h-8 text-[#FFD700]" />
            Real Google Workspace Core
          </h1>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-xl">
            พอร์ทเชื่อมต่อบัญชีจริง จัดการไฟล์ Google Drive และ Google Sheets ซิงค์บันทึกย่อ Keep Memos 
            จัดตารางบน Google Calendar, ลงหมุด Docs, คุยผ่านสายสตรีม Google Chat ครบในแดชบอร์ดเดียว
          </p>
        </div>

        {/* 1. Connection Section Card */}
        <div className="glass-panel p-5 rounded-3xl border border-zinc-900 shadow-xl relative overflow-hidden bg-zinc-950/60">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent blur-xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Cloud className={`w-6 h-6 ${googleUser ? 'text-green-400' : 'text-zinc-650'}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {googleUser ? 'บัญชีผู้ใช้ซิงค์แล้วกูเกิลคลาวน์' : 'Google Cloud Platform OAuth Auth'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {googleUser 
                    ? `เข้าใช้งานด้วยบัญชีแท้ของ ${googleUser.email}` 
                    : 'ล็อกอินยืนยันตัวตนเพื่อพอร์ทงานเข้า Drive, Sheets, Keep, Calendar และ Chat'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {googleUser ? (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-red-500/20 text-red-400 hover:bg-red-500/5 text-xs font-semibold rounded-xl cursor-pointer duration-200"
                >
                  Disconnect (พอร์ตหลุด)
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  disabled={connecting}
                  className="px-5 py-2.5 bg-[#FFD700] hover:bg-yellow-500 active:scale-95 text-zinc-950 text-xs font-extrabold rounded-xl cursor-pointer duration-200 shadow-md shadow-yellow-500/10 flex items-center gap-2"
                >
                  {connecting ? 'กำลังถ่ายโอน OAuth...' : 'Authorize Cloud Connection'}
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>

        {googleUser && (
          <div className="space-y-6">
            
            {/* SUB TAB CONTROLS */}
            <div className="flex border-b border-zinc-900 gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('files_sheets')}
                className={`px-4 py-2 text-xs font-semibold duration-150 shrink-0 border-b-2 transition-all ${
                  activeTab === 'files_sheets' ? 'border-[#FFD700] text-white bg-zinc-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Drive & Sheets Connector
              </button>
              <button
                onClick={() => setActiveTab('google_tasks')}
                className={`px-4 py-2 text-xs font-semibold duration-150 shrink-0 border-b-2 transition-all ${
                  activeTab === 'google_tasks' ? 'border-[#FFD700] text-white bg-zinc-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Google Tasks Manager
              </button>
              <button
                onClick={() => setActiveTab('gmail_core')}
                className={`px-4 py-2 text-xs font-semibold duration-150 shrink-0 border-b-2 transition-all ${
                  activeTab === 'gmail_core' ? 'border-[#FFD700] text-white bg-zinc-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Gmail Intelligence Core
              </button>
              <button
                onClick={() => setActiveTab('keep_memos')}
                className={`px-4 py-2 text-xs font-semibold duration-150 shrink-0 border-b-2 transition-all ${
                  activeTab === 'keep_memos' ? 'border-[#FFD700] text-white bg-zinc-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Google Keep Board (Firestore)
              </button>
              <button
                onClick={() => setActiveTab('docs_calendar')}
                className={`px-4 py-2 text-xs font-semibold duration-150 shrink-0 border-b-2 transition-all ${
                  activeTab === 'docs_calendar' ? 'border-[#FFD700] text-white bg-zinc-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Docs Publisher & Calendar Planner
              </button>
              <button
                onClick={() => setActiveTab('chat_spaces')}
                className={`px-4 py-2 text-xs font-semibold duration-150 shrink-0 border-b-2 transition-all ${
                  activeTab === 'chat_spaces' ? 'border-[#FFD700] text-white bg-zinc-900/10' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Chat Space Dispatcher
              </button>
            </div>

            {/* TAB CONTAINER CONTENT */}
            <div>
              {activeTab === 'files_sheets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* COLUMN LEFT: DRIVE FILE EXPLORER */}
                  <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-amber-500" />
                        <span className="text-xs uppercase font-display tracking-widest text-zinc-400">Google Drive Real Explorer</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-805 text-[10px] font-mono text-zinc-500 font-bold">
                        {driveFiles.length} files
                      </span>
                    </div>

                    {/* SEARCH */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                      <input
                        type="text"
                        placeholder="สแกนค้นใน Drive สเปซจริง..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-xs rounded-xl text-zinc-200 outline-none focus:border-yellow-500/20"
                      />
                    </div>

                    {/* FILE LIST */}
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {loadingDrive ? (
                        <div className="py-12 text-center text-xs text-zinc-600 font-mono flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-zinc-700 animate-spin" />
                          <span>สแกนข้อมูลจากคลาวน์เซิร์ฟเวอร์...</span>
                        </div>
                      ) : driveError ? (
                        <div className="p-4 rounded-xl border border-red-950 bg-red-950/10 text-red-400 text-xs flex gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                          <p className="leading-relaxed">{driveError}</p>
                        </div>
                      ) : driveFiles.length === 0 ? (
                        <div className="py-12 text-center text-xs text-zinc-650 flex flex-col items-center gap-2">
                          <span>ไม่พบรายการเนื้อหาในคลาวด์ไดรฟ์</span>
                        </div>
                      ) : (
                        driveFiles.map((f) => (
                          <div 
                            key={f.id}
                            className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 duration-150 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {f.mimeType === 'application/vnd.google-apps.spreadsheet' ? (
                                <FileSpreadsheet className="w-4 h-4 text-green-500 shrink-0" />
                              ) : f.mimeType === 'application/vnd.google-apps.document' ? (
                                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                              ) : (
                                <Paperclip className="w-4 h-4 text-zinc-550 shrink-0" />
                              )}
                              <div className="min-w-0 flex flex-col">
                                <span className="text-[11px] font-medium text-zinc-200 truncate">{f.name}</span>
                                <span className="text-[8px] text-zinc-650 font-mono tracking-wider uppercase mt-0.5 truncate">{f.id}</span>
                              </div>
                            </div>

                            <a 
                              href={f.webViewLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white transition-all duration-150 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* SHEET ONE-WAY EXPORT / TWO-WAY SYNC */}
                  <div className="space-y-6">
                    <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                        <Upload className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs uppercase font-display tracking-widest text-zinc-400">Export All Space to Sheets</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-display">
                            เลือกโปรเจกต์ต้นทางข้อมูล
                          </label>
                          <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none"
                          >
                            {allProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={handleExportToSheets}
                          disabled={syncStatus === 'running'}
                          className="w-full py-2.5 bg-[#FFD700] hover:bg-yellow-500 disabled:bg-zinc-850 text-zinc-900 text-xs font-extrabold rounded-xl duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/5"
                        >
                          {syncStatus === 'running' ? (
                            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 shrink-0" />
                          )}
                          <span>จัดพิมพ์ระเบียบส่งออก Google Sheet ใหม่</span>
                        </button>

                        {syncStatus !== 'idle' && (
                          <div className={`p-3.5 rounded-xl border text-xs flex gap-2.5 leading-relaxed transition-all ${
                            syncStatus === 'running' ? 'border-zinc-800 bg-zinc-900/10 text-zinc-400' :
                            syncStatus === 'success' ? 'border-emerald-950 bg-emerald-950/10 text-emerald-400' :
                            'border-red-950 bg-red-950/10 text-red-400'
                          }`}>
                            {syncStatus === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                            ) : syncStatus === 'error' ? (
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                            ) : (
                              <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500 animate-spin" />
                            )}
                            <div className="flex-grow flex flex-col gap-1.5">
                              <p>{syncMessage}</p>
                              {createdSheetUrl && (
                                <a 
                                  href={createdSheetUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[10px] text-yellow-500 hover:underline flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  <span>เปิดแผ่นกระดานแผ่นงาน</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs uppercase font-display tracking-widest text-zinc-400">Import Tasks from Sheets</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-display">
                            โปรเจกต์สล็อตรับรับเข้าข้อมูล
                          </label>
                          <select
                            value={importProjectId}
                            onChange={(e) => setImportProjectId(e.target.value)}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none"
                          >
                            {allProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-display">
                            Google Spreadsheet ID
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น 1A2b3c4d5e..."
                            value={targetSpreadsheetId}
                            onChange={(e) => setTargetSpreadsheetId(e.target.value)}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none"
                          />
                        </div>

                        <button
                          onClick={handleImportFromSheets}
                          disabled={importStatus === 'running'}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 text-zinc-950 text-xs font-extrabold rounded-xl duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {importStatus === 'running' ? (
                            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <Download className="w-4 h-4 shrink-0" />
                          )}
                          <span>เริ่มอิมพอร์ตระเบียบรายการ</span>
                        </button>

                        {importStatus !== 'idle' && (
                          <div className={`p-3.5 rounded-xl border text-xs flex gap-2.5 ${
                            importStatus === 'running' ? 'border-zinc-800 bg-zinc-950/20 text-zinc-400' :
                            importStatus === 'success' ? 'border-emerald-950 bg-emerald-950/10 text-emerald-400' :
                            'border-red-950 bg-red-950/10 text-red-400'
                          }`}>
                            <p>{importMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KEEP TAB: STICKY MEMOS */}
              {activeTab === 'keep_memos' && (
                <div className="space-y-6">
                  {/* MEMO CREATION GRID BOX */}
                  <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 relative overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
                      <Pin className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-xs uppercase font-display tracking-widest text-zinc-300">Google Keep Board Panel (Cloud-Synced via Firestore & Keep API)</span>
                    </div>

                    {/* KEEP STORAGE SYNC CONTROLLER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/30 p-3.5 rounded-2xl border border-zinc-900/80 mb-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-yellow-400" />
                        <span className="font-semibold text-zinc-300">แหล่งจัดเก็บข้อมูลบันทึก (Keep Storage Source)</span>
                      </div>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (!token) {
                              alert('กรุณาเชื่อมบัญชีคลาวด์ Google ก่อนสั่งดึงพลัง Keep API!');
                              return;
                            }
                            fetchKeepApiNotes(token);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-bold transition-all duration-250 cursor-pointer ${
                            keepSource === 'keep_api'
                              ? 'bg-yellow-400 text-zinc-950 shadow-[0_0_12px_rgba(250,204,21,0.25)]'
                              : 'text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          Google Keep API 📌
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setKeepSource('firestore_backup');
                            fetchMemos();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-bold transition-all duration-250 cursor-pointer ${
                            keepSource === 'firestore_backup'
                              ? 'bg-yellow-400 text-zinc-950 shadow-[0_0_12px_rgba(250,204,21,0.25)]'
                              : 'text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          Firestore Backup ☁️
                        </button>
                      </div>
                    </div>

                    {/* ข้อมูลแนะแนวความเสถียร (Info Notice / Warning Fallback) */}
                    {keepSource === 'firestore_backup' && keepApiError && (
                      <div className="p-3.5 bg-yellow-400/5 border border-yellow-500/20 rounded-2xl flex items-start gap-3 mb-4 text-left">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                        <div className="text-[10.5px] leading-relaxed text-yellow-300 space-y-1">
                          <p className="font-bold">ระบบความเสถียรขั้นสูงสุดทำงานสำเร็จ:</p>
                          <p>{keepApiError}</p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleAddMemo} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="หัวหัวข้อบันทึก (Keep Title)..."
                          value={memoTitleInput}
                          onChange={(e) => setMemoTitleInput(e.target.value)}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-880 rounded-xl text-xs text-zinc-200 outline-none"
                        />
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">เลือกสิสันพื้นหลัง:</span>
                          <div className="flex items-center gap-1.5">
                            {[
                              { label: 'Default', val: '#22252a' },
                              { label: 'Yellow', val: '#d4af37' },
                              { label: 'Emerald', val: '#1b4d3e' },
                              { label: 'Ruby', val: '#7c1c1c' },
                              { label: 'Indigo', val: '#1e3a8a' }
                            ].map((col) => (
                              <button
                                key={col.val}
                                type="button"
                                onClick={() => setMemoColor(col.val)}
                                className={`w-5 h-5 rounded-full border cursor-pointer duration-100 ${
                                  memoColor === col.val ? 'border-white scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: col.val }}
                                title={col.label}
                                disabled={keepSource === 'keep_api'} // keep api default background
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        placeholder="จดรายละเอียดความคิดย่อยๆ ของคุณ พึ่งส่งเข้าคลังบันทึก..."
                        value={memoContentInput}
                        onChange={(e) => setMemoContentInput(e.target.value)}
                        className="w-full p-3 bg-zinc-900 border border-zinc-880 rounded-xl text-xs text-zinc-200 outline-none font-sans leading-relaxed"
                      />

                      <button
                        type="submit"
                        className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer duration-150 flex items-center gap-2 self-end"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ปักหมุดลวดลายบอร์ด (Pin to Board)</span>
                      </button>
                    </form>
                  </div>

                  {/* ACTIVE BOARD MEMOS LISTING */}
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase font-display tracking-widest text-zinc-400 flex items-center gap-2 pl-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span>
                        บันทึกความจำปัจจุบันแหล่งข้อมูล [
                        <span className="text-yellow-400 font-bold whitespace-nowrap">
                          {keepSource === 'keep_api' ? 'Google Keep API' : 'Firestore Cloud'}
                        </span>
                        ] ({keepSource === 'keep_api' ? keepMemos.length : memos.length} รายการเล่ม)
                      </span>
                    </h3>

                    {((keepSource === 'keep_api' && loadingKeepMemos) || (keepSource === 'firestore_backup' && loadingMemos)) ? (
                      <div className="py-12 text-center text-xs text-zinc-650 font-mono animate-pulse flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-yellow-400" />
                        <span>กำลังดึงข้อมูลบันทึกคลาวด์ประสานลวดลาย...</span>
                      </div>
                    ) : (keepSource === 'keep_api' ? keepMemos.length : memos.length) === 0 ? (
                      <div className="glass-panel p-10 rounded-3xl border border-zinc-900 text-center text-xs text-zinc-600 font-mono">
                        ตู้ข้อมูลบอร์ดส่วนตัวว่างเปล่า ลองจดบันทึกปักหมุดสักชิ้นสิ!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {(keepSource === 'keep_api' ? keepMemos : memos).map((m) => (
                          <div
                            key={m.id}
                            className="p-4 rounded-2xl border border-zinc-900 hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[160px] relative group"
                            style={{ backgroundColor: m.color || '#22252a' }}
                          >
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-white tracking-tight leading-snug">{m.title || 'Untitled Note'}</h4>
                              <p className="text-[11px] text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">{m.content}</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[8px] text-zinc-400 font-mono">
                                {new Date(m.created_at).toLocaleDateString('th-TH')}
                              </span>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 duration-150 transition-opacity">
                                <button
                                  onClick={() => handleExportMemoToDoc(m)}
                                  className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900 text-yellow-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                                  title="ส่งออกบันทึกไปเป็นเอกสาร Google Docs"
                                >
                                  <FileText className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMemo(m.id, m.isGoogleKeep, m.name)}
                                  className="p-1.5 rounded-lg bg-red-950/20 border border-red-900/30 text-[#FF6B6B] hover:bg-red-500 cursor-pointer"
                                  title="ลบบันทึก"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB DOCS & CALENDAR DETAILS */}
              {activeTab === 'docs_calendar' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* DOCS PUBLISHER SCREEN */}
                  <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs uppercase font-display tracking-widest text-zinc-400">Google Docs Publisher Engine</span>
                    </div>

                    <form onSubmit={handleCreateGoogleDoc} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">Document Title</label>
                        <input
                          type="text"
                          required
                          placeholder="ชื่อหัวเรื่องรายงานตัวใหม่..."
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-cyan-500/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">Content Draft</label>
                        <textarea
                          rows={6}
                          placeholder="พรรณนาดีเทลของเอกสาร สเปซนี้รองรับการคัดลอกลง Google Documents บนบัญชีจริง..."
                          value={docContent}
                          onChange={(e) => setDocContent(e.target.value)}
                          className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none leading-relaxed font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={docStatus === 'running'}
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-800 text-zinc-950 text-xs font-extrabold rounded-xl duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/10"
                      >
                        {docStatus === 'running' ? (
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <Upload className="w-4 h-4 shrink-0" />
                        )}
                        <span>ตีพิมพ์ลงประดาน Google Docs (Publish)</span>
                      </button>

                      {docStatus !== 'idle' && (
                        <div className={`p-3 rounded-xl border text-xs flex gap-2 ${
                          docStatus === 'running' ? 'border-zinc-800 bg-zinc-950/20 text-zinc-450' :
                          docStatus === 'success' ? 'border-cyan-950 bg-cyan-950/10 text-cyan-400' :
                          'border-red-950 bg-red-950/10 text-red-400'
                        }`}>
                          <div className="flex-grow flex flex-col gap-1">
                            <p>{docMessage}</p>
                            {createdDocUrl && (
                              <a
                                href={createdDocUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#FFD700] hover:underline flex items-center gap-1 mt-1 cursor-pointer font-bold uppercase font-mono"
                              >
                                <span>เข้าตรวจแก้ไข Google Doc เล่มสร้างใหม่</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* CALENDAR MANAGER */}
                  <div className="space-y-6">
                    <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                        <Calendar className="w-4 h-4 text-[#FFD700]" />
                        <span className="text-xs uppercase font-display tracking-widest text-zinc-400">Google Calendar Active Events</span>
                      </div>

                      {/* CREATE EVENT FORM */}
                      <form onSubmit={handleCreateCalendarEvent} className="space-y-3 p-1">
                        <div className="grid grid-cols-1 gap-2.5">
                          <input
                            type="text"
                            required
                            placeholder="หัวข้อนัดหมายกำหนดการใหม่..."
                            value={newTaskEventTitle}
                            onChange={(e) => setNewTaskEventTitle(e.target.value)}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-yellow-500/20"
                          />
                          <input
                            type="date"
                            required
                            value={newTaskEventDate}
                            onChange={(e) => setNewTaskEventDate(e.target.value)}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={taskToCalStatus === 'running'}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer duration-100 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เชื่อมปักธงลงปฏิทิน Calendar</span>
                        </button>

                        {taskToCalStatus !== 'idle' && (
                          <p className={`text-[10px] font-medium ${taskToCalStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {calFeedback}
                          </p>
                        )}
                      </form>

                      {/* LIST EVENT FROM CALENDAR */}
                      <div className="space-y-1.5 border-t border-zinc-900 pt-3 flex-grow">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">
                          ตารางตารางแผนงานจำลองบน Google Calendar:
                        </span>

                        {loadingCalendar ? (
                          <div className="py-6 text-center text-[10px] text-zinc-650 font-mono animate-pulse">
                            กำลังเจาะดึงตารางนัดหมาย...
                          </div>
                        ) : calendarError ? (
                          <p className="text-[10px] text-red-400 leading-relaxed font-mono">{calendarError}</p>
                        ) : calendarEvents.length === 0 ? (
                          <p className="text-[10px] text-zinc-600 py-3 text-center">ไม่มีภารกิจหรือนัดหมายเร็วๆ นี้บนปฏิทินกูเกิล</p>
                        ) : (
                          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                            {calendarEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="p-2 rounded-xl bg-zinc-900 border border-[#1b1b1c] flex items-center justify-between gap-1"
                              >
                                <div className="space-y-0.5 truncate flex-grow">
                                  <p className="text-[11px] font-semibold text-zinc-200 truncate">{ev.summary}</p>
                                  <p className="text-[9px] text-zinc-600 font-mono tracking-wider">
                                    {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString('th-TH') : ev.start?.date || 'All day event'}
                                  </p>
                                </div>
                                <a
                                  href={ev.htmlLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-zinc-500 hover:text-[#FFD700] cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE TASKS MANAGER TAB */}
              {activeTab === 'google_tasks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                  {/* COLUMN LEFT: CREATE TASK */}
                  <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs uppercase font-display tracking-widest text-zinc-400">สร้างภารกิจใหม่ลง Google Tasks</span>
                    </div>

                    <form onSubmit={handleCreateGoogleTask} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">ชื่อภารกิจ (Task Title)</label>
                        <input
                          type="text"
                          required
                          placeholder="เช่น: ตรวจสอบและส่งรหัสบอร์ดประจำไตรมาส..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-emerald-500/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">รายละเอียดเพิ่มเติม (Notes)</label>
                        <textarea
                          rows={4}
                          placeholder="โน้ตรายละเอียดย่อยที่คุณต้องการบันทึกเก็บไว้คู่กัน..."
                          value={newTaskNotes}
                          onChange={(e) => setNewTaskNotes(e.target.value)}
                          className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none font-sans leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">วันกำหนดส่ง (Due Date)</label>
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={creatingTask}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 text-zinc-950 text-xs font-extrabold rounded-xl duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        {creatingTask ? (
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 shrink-0" />
                        )}
                        <span>บันทึกภารกิจ (Add Task)</span>
                      </button>

                      {taskFeedback && (
                        <p className="text-[10px] text-emerald-400 font-mono text-center mt-2">{taskFeedback}</p>
                      )}
                    </form>
                  </div>

                  {/* COLUMN RIGHT: TASK LIST VIEW */}
                  <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5 justify-between">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-[#FFD700]" />
                        <span className="text-xs uppercase font-display tracking-widest text-zinc-400">รายการงานในระบบคลาวด์</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-805 text-[10px] font-mono text-zinc-400 font-bold">
                        {googleTasksList.length} รายการ
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-mono text-zinc-500">เลือกกลุ่มรายการกระดาน (Tasklist)</label>
                      {loadingTasks && taskLists.length === 0 ? (
                        <span className="text-[10px] text-zinc-500 font-mono">กำลังค้นหากระดานภารกิจ...</span>
                      ) : taskLists.length > 0 ? (
                        <select
                          value={selectedTaskListId}
                          onChange={(e) => {
                            setSelectedTaskListId(e.target.value);
                            fetchGoogleTasks(token!, e.target.value);
                          }}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-yellow-500/20 cursor-pointer"
                        >
                          {taskLists.map((list) => (
                            <option key={list.id} value={list.id}>
                              {list.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-red-400">ไม่พบรายชื่อกระดานงานบน Google Accounts</span>
                      )}
                    </div>

                    <div className="space-y-2 border-t border-zinc-900 pt-3 flex-grow max-h-[350px] overflow-y-auto pr-1">
                      {loadingTasks ? (
                        <div className="py-12 text-center text-xs text-zinc-650 flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-zinc-750 animate-spin" />
                          <span>กำลังดึงข้อมูลงานจาก Google เซิร์ฟเวอร์...</span>
                        </div>
                      ) : tasksError ? (
                        <div className="p-3 text-red-400 text-xs text-center font-mono">{tasksError}</div>
                      ) : googleTasksList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-zinc-600">ไม่มีรายการงานค้างในกระดานนี้</div>
                      ) : (
                        <div className="space-y-1.5">
                          {googleTasksList.map((t) => {
                            const isCompleted = t.status === 'completed';
                            return (
                              <div
                                key={t.id}
                                className={`p-3 rounded-xl border duration-150 flex items-start gap-3 justify-between ${
                                  isCompleted 
                                    ? 'border-zinc-950 bg-zinc-955/10 bg-zinc-950/20 opacity-50' 
                                    : 'border-zinc-900 bg-zinc-900/40 hover:border-zinc-800'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 flex-grow truncate">
                                  <button
                                    onClick={() => handleToggleGoogleTask(t)}
                                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer duration-150 ${
                                      isCompleted 
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                        : 'border-zinc-700 hover:border-zinc-500'
                                    }`}
                                  >
                                    {isCompleted && <Check className="w-3 h-3" />}
                                  </button>
                                  <div className="space-y-1 truncate">
                                    <p className={`text-xs font-semibold leading-snug truncate ${
                                      isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'
                                    }`}>
                                      {t.title || '(ไม่มีชื่อเรื่อง/ไม่มีข้อความ)'}
                                    </p>
                                    {t.notes && (
                                      <p className="text-[10px] text-zinc-550 leading-relaxed font-sans mt-1">
                                        {t.notes}
                                      </p>
                                    )}
                                    {t.due && (
                                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-zinc-900 text-[8px] font-mono text-[#FFD700] font-bold">
                                        Due: {new Date(t.due).toLocaleDateString('th-TH')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* GMAIL INTELLIGENCE CORE TAB */}
              {activeTab === 'gmail_core' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                  {/* COLUMN LEFT: COMPOSE EMAIL FORM */}
                  <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                      <Mail className="w-4 h-4 text-[#FFD700]" />
                      <span className="text-xs uppercase font-display tracking-widest text-zinc-400">เขียนจดหมายด่วน (Compose Email)</span>
                    </div>

                    <form onSubmit={handleSendGmail} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">ผู้รับปลายทาง (To: Email address)</label>
                        <input
                          type="email"
                          required
                          placeholder="เช่น: support@bl1nk.com, client@example.com..."
                          value={composeTo}
                          onChange={(e) => setComposeTo(e.target.value)}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-yellow-500/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">หัวเรื่องจดหมาย (Subject)</label>
                        <input
                          type="text"
                          required
                          placeholder="เช่น: รายงานพอร์ทัลสเตตัสประจำเดือนพฤษภาคม..."
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none focus:border-yellow-500/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-zinc-500">เนื้อหาจดหมาย (Email Content)</label>
                        <textarea
                          rows={6}
                          required
                          placeholder="ป้อนรายละเอียดเนื้อหาอีเมลของคุณแบบทางการ ระบบจะทำการเข้ารหัส MIME บนมาตราฐานคลาวน์เซสชั่นอย่างปลอดภัย..."
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                          className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none leading-relaxed font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingGmail}
                        className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-800 text-zinc-950 text-xs font-extrabold rounded-xl duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-yellow-500/10"
                      >
                        {sendingGmail ? (
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <Send className="w-4 h-4 shrink-0" />
                        )}
                        <span>จัดส่งอีเมล (Send Email)</span>
                      </button>

                      {gmailFeedback && (
                        <p className="text-[10px] text-yellow-400 font-mono text-center mt-2">{gmailFeedback}</p>
                      )}
                    </form>
                  </div>

                  {/* COLUMN RIGHT: INBOX FEED */}
                  <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs uppercase font-display tracking-widest text-zinc-400">กล่องจดหมายขาเข้าล่าสุุด (Gmail Inbox)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-805 text-[10px] font-mono text-cyan-400 font-bold">
                        {gmailMessages.length} ฉบับ
                      </span>
                    </div>

                    <div className="space-y-2 flex-grow max-h-[480px] overflow-y-auto pr-1">
                      {loadingGmail ? (
                        <div className="py-12 text-center text-xs text-zinc-650 flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-zinc-750 animate-spin" />
                          <span>กำลังดึงสตรีมจดหมายล่าสุดของท่าน...</span>
                        </div>
                      ) : gmailError ? (
                        <div className="p-3 text-red-400 text-xs text-center font-mono">{gmailError}</div>
                      ) : gmailMessages.length === 0 ? (
                        <div className="py-12 text-center text-xs text-zinc-600">กล่องจดหมายขาเข้าว่างเปล่า (Empty Inbox)</div>
                      ) : (
                        <div className="space-y-2">
                          {gmailMessages.map((m) => (
                            <div
                              key={m.id}
                              className="p-3.5 rounded-2xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-800 duration-150 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2.5">
                                <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[150px]">
                                  {m.sender}
                                </span>
                                <span className="text-[8px] font-mono text-zinc-650 shrink-0">
                                  {m.date ? new Date(m.date).toLocaleString('th-TH') : ''}
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-zinc-200 truncate leading-snug">
                                {m.subject}
                              </h4>
                              <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                                {m.snippet}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CHAT TAB DETAILS */}
              {activeTab === 'chat_spaces' && (
                <div className="glass-panel p-5 rounded-3xl border border-zinc-900 bg-zinc-950/40 max-w-xl mx-auto flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                    <MessageSquare className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-xs uppercase font-display tracking-widest text-zinc-300">Google Chat Spaces Dispatch</span>
                  </div>

                  <form onSubmit={handleSendChatMessage} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-mono text-zinc-500">
                        เลือกประเภทห้องกลุ่มงาน (Spaces list)
                      </label>
                      {loadingSpaces ? (
                        <div className="text-[10px] text-zinc-500 font-mono">กำลังส่องรายชื่อห้อง...</div>
                      ) : chatSpaces.length > 0 ? (
                        <select
                          value={selectedSpaceId}
                          onChange={(e) => {
                            setSelectedSpaceId(e.target.value);
                            setCustomSpaceName('');
                          }}
                          className="w-full p-2.5 bg-zinc-905 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none"
                        >
                          {chatSpaces.map((sp) => (
                            <option key={sp.name} value={sp.name}>
                              {sp.displayName || sp.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[10px] text-[#FF6B6B] block">ไม่มี Workspace Chat Space ที่เข้าถึงได้โดยตรง</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-mono text-zinc-500">
                        หรือป้อนรหัส Space Name ด้วยตนเอง
                      </label>
                      <input
                        type="text"
                        placeholder="ฟอร์แมต: spaces/AAAAAxxxxx"
                        value={customSpaceName}
                        onChange={(e) => setCustomSpaceName(e.target.value)}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-mono text-zinc-500">
                        ข้อความจัดส่งด่วน (Alert Text message)
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="เช่น: ภารกิจวิคเลอร์ BL1NK-1002 ทำการอัปเดตสเตตัสเสร็จสมบูรณ์ พร้อมรัน Unit testing แล้ว..."
                        value={chatMessageText}
                        onChange={(e) => setChatMessageText(e.target.value)}
                        className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 outline-none font-sans leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={chatStatus === 'running'}
                      className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-850 text-zinc-950 text-xs font-extrabold rounded-xl duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {chatStatus === 'running' ? (
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Send className="w-4 h-4 shrink-0" />
                      )}
                      <span>กระจายแจ้งเตือนสารเข้า Google Chat Messages</span>
                    </button>

                    {chatStatus !== 'idle' && (
                      <div className={`p-3.5 rounded-xl border text-xs flex gap-2.5 ${
                        chatStatus === 'running' ? 'border-zinc-800 bg-zinc-950/20 text-zinc-400' :
                        chatStatus === 'success' ? 'border-emerald-950 bg-emerald-950/10 text-emerald-400' :
                        'border-red-950 bg-red-950/10 text-red-400'
                      }`}>
                        <div className="flex-grow">
                          <p>{chatMessageFeedback}</p>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </WorkspaceShell>
  );
}
