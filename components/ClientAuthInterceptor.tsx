'use client';

import { useEffect } from 'react';

/**
 * JSDoc: อุปกรณ์ดักจับของระบบเครือข่ายจำลอง เพื่อแก้ไขปัญหา Cookie-blocked ใน Iframe ของ AI Studio
 * ดึงผู้ใช้ที่ล็อกอินอยู่จาก localStorage แล้วส่ง x-session-user-id และ Authorization Bearer ไปในทุกๆ fetch call อัตโนมัติ
 */
export default function ClientAuthInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    if (!originalFetch) return;

    const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const userId = localStorage.getItem('bl1nk_user_id');
      if (userId) {
        init = init || {};
        init.headers = init.headers || {};

        if (init.headers instanceof Headers) {
          if (!init.headers.has('Authorization')) {
            init.headers.set('Authorization', `Bearer ${userId}`);
          }
          if (!init.headers.has('x-session-user-id')) {
            init.headers.set('x-session-user-id', userId);
          }
        } else if (Array.isArray(init.headers)) {
          const hasAuthorization = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
          if (!hasAuthorization) {
            init.headers.push(['Authorization', `Bearer ${userId}`]);
          }
          const hasSessionId = init.headers.some(([k]) => k.toLowerCase() === 'x-session-user-id');
          if (!hasSessionId) {
            init.headers.push(['x-session-user-id', userId]);
          }
        } else {
          const headersRecord = init.headers as Record<string, string>;
          if (!headersRecord['Authorization'] && !headersRecord['authorization']) {
            headersRecord['Authorization'] = `Bearer ${userId}`;
          }
          if (!headersRecord['x-session-user-id'] && !headersRecord['X-Session-User-Id']) {
            headersRecord['x-session-user-id'] = userId;
          }
        }
      }

      return originalFetch(input, init);
    };

    try {
      // พยายามกำหนดเชิงลึกด้วยเกราะความปลอดภัย Object.defineProperty (มีประโยชน์มากเมื่ออยู่ภายใต้ Iframe ของระบบ Google AI Studio)
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        configurable: true,
        writable: true,
        enumerable: true
      });
    } catch (e) {
      console.warn("ClientAuthInterceptor: ตรวจพบสิทธิการเขียนคีย์จำกัดของเบราว์เซอร์ ลองใช้กระบวนการทางเลือกอื่นๆ...", e);
      try {
        window.fetch = customFetch;
      } catch (err) {
        console.error("ClientAuthInterceptor: ไม่สามารถเชื่อมโยงช่องตรวจเช็คแบบคลาสสิค:", err);
      }
    }
  }, []);

  return null;
}
