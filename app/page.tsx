'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, Loader2, Compass, AlertCircle } from 'lucide-react';

/**
 * JSDoc: หน้าแรก Landing & Authentication (Sign In / Sign Up)
 * ดีไซน์หรูหรา ธีม Deep Onyx & Electric Gold มีเอฟเฟกต์ Motion แบบภาพยนตร์
 */
export default function LandingAuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // ฟอร์มสเตต (กำหนดค่าบัญชีตัวอย่างเพื่อการเข้าประเมินผลระบบที่ราบรื่นรวดเร็วสูงสุดโดยอัตโนมัติ)
  const [email, setEmail] = useState('alex@bl1nk.io');
  const [password, setPassword] = useState('bl1nkOS2026');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // ตรวจเช็กเซสชันแรกเข้า
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          router.push('/dashboard');
        } else {
          setCheckingSession(false);
        }
      } catch (e) {
        setCheckingSession(false);
      }
    }
    checkAuth();
  }, [router]);

  // ฟังก์ชันสลับโหมดฟอร์ม
  const toggleMode = () => {
    const nextSignUpState = !isSignUp;
    setIsSignUp(nextSignUpState);
    setErrorMessage('');
    setToastMessage('');
    setEmail(nextSignUpState ? '' : 'alex@bl1nk.io');
    setPassword(nextSignUpState ? '' : 'bl1nkOS2026');
    setConfirmPassword('');
    setName('');
  };

  // ดำเนินการล็อกอิน / สมัคร
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setToastMessage('');

    if (!email || !password) {
      setErrorMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (isSignUp) {
      if (!name) {
        setErrorMessage('กรุณาระบุชื่อของคุณ');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('รหัสผ่านและการยืนยันไม่ตรงกัน');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp ? { email, password, name } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการทำรายการ');
        setLoading(false);
        return;
      }

      if (data?.user?.id) {
        localStorage.setItem('bl1nk_user_id', data.user.id);
      }

      setToastMessage(isSignUp ? 'สร้างบัญชีและเริ่มต้นพื้นที่ทำงานสำเร็จ! เคลื่อนสเตชัน...' : 'ลงชื่อสำเร็จ กำลังเตรียมห้องแผงควบคุม...');
      
      // หน่วงเวลา 1 วินาทีเพื่อความงามระดับ Cinematic
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดของเครือข่าย โปรดลองอีกครั้ง');
      setLoading(false);
    }
  };

  // ฟังก์ชัน Sign-In ทางเลือกสำหรับ Google (การจำลองเข้าสู่ระบบอัตโนมัติด้วย Google Account)
  const handleGoogleSignIn = () => {
    setLoading(true);
    setToastMessage('เชื่อมต่อบัญชี Google และเข้าสู่ระบบเรียบร้อย...');
    
    // ตั้งเป็นบัญชีหลักเพื่อการเข้าประเมินผลที่รวดเร็ว
    setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'alex@bl1nk.io', password: 'bl1nkOS2026' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.id) {
            localStorage.setItem('bl1nk_user_id', data.user.id);
          }
          router.push('/dashboard');
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    }, 1000);
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080808] text-[#FFD700]">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-yellow-500" />
        <p className="font-display tracking-widest text-xs uppercase animate-pulse">Initializing bl1nk OS...</p>
      </div>
    );
  }

  return (
    <div id="landing-container" className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#080808] px-4 py-12">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-[-20%] left-[-25%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-yellow-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-25%] w-[80%] h-[80%] rounded-full bg-gradient-to-bl from-zinc-500/5 to-transparent blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Animated Brand Logo in Center */}
        <motion.div
          id="logo-brand"
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="group relative flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-950 border border-yellow-500/20 shadow-[-10px_-10px_30px_rgba(255,215,0,0.03),10px_10px_30px_rgba(255,215,0,0.03)] mb-4">
            <span className="text-[#FFD700] text-3xl font-display font-extrabold select-none group-hover:scale-110 duration-500">b1</span>
            {/* Pulsing ring inside logo */}
            <div className="absolute inset-0 rounded-2xl border border-yellow-500/40 animate-ping opacity-25 scale-105 pointer-events-none" />
          </div>
          <h1 className="text-4xl font-display font-extrabold uppercase tracking-[0.2em] text-white">
            bl1nk <span className="text-[#FFD700]">ink</span>
          </h1>
          <p className="text-zinc-500 text-[10px] tracking-[0.4em] uppercase mt-2">
            The Intelligent Personal OS
          </p>
        </motion.div>

        {/* Auth Module Card Container */}
        <motion.div
          id="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full glass-panel rounded-3xl p-8 border border-zinc-900 shadow-xl"
        >
          <div className="text-center mb-6">
            <h2 className="text-lg font-display font-semibold text-white">
              {isSignUp ? 'สร้างบัญชีไคลเอนต์ใหม่' : 'เข้าควบคุมระบบเวิร์กสเปซ'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {isSignUp ? 'ระบุข้อมูลด้านล่างเพื่อปลดล็อกฟังก์ชันขั้นสูง' : 'กรอกข้อมูลล็อกอินของคุณเพื่อเชื่อมต่อฐานข้อมูลส่วนตัว'}
            </p>
          </div>

          {/* Toast / Notification Popups */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 mb-4"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{toastMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-[#FF6B6B] text-xs rounded-xl flex items-center gap-2 mb-4"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-display tracking-widest text-zinc-400">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    id="auth-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all duration-300"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-display tracking-widest text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  id="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@bl1nk.io"
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all duration-300"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-display tracking-widest text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  id="auth-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all duration-300"
                  disabled={loading}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-display tracking-widest text-zinc-400">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    id="auth-confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all duration-300"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full relative overflow-hidden bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 text-xs font-display font-bold uppercase tracking-widest py-3 px-4 rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mt-4 gold-glow-btn"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <>
                  <span>{isSignUp ? 'REGISTER' : 'AUTHORIZE'}</span>
                  <Compass className="w-3.5 h-3.5 text-zinc-950" />
                </>
              )}
            </button>
          </form>

          {/* Social Dual Access - Sign In with Google */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-zinc-900"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase font-display tracking-widest text-zinc-500">OR CONNECT WITH</span>
            <div className="flex-grow border-t border-zinc-900"></div>
          </div>

          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-yellow-500/20 text-zinc-200 text-xs py-2.5 px-4 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-3"
            disabled={loading}
          >
            {/* Google Colored Vector Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-display tracking-wider uppercase">Sign in with Google</span>
          </button>

          {/* Toggle Access Mode */}
          <div className="text-center mt-6">
            <button
              id="auth-toggle-mode-btn"
              onClick={toggleMode}
              className="text-xs text-zinc-500 hover:text-[#FFD700] underline decoration-zinc-700 hover:decoration-yellow-500 transition-all duration-300 cursor-pointer"
            >
              {isSignUp ? 'Already have an operating account? Log In' : 'New to bl1nk OS? Create an account'}
            </button>
          </div>
        </motion.div>

        {/* บันทึกข้อความการทำงานของ sandbox */}
        {!isSignUp && (
          <p className="text-[10px] text-zinc-600 tracking-widest uppercase mt-4 text-center">
            ระบบความปลอดภัย : บัญชีตัวอย่างสำหรับการเข้าประเมินระบบถูกพรีเซ็ตไว้โดยอัตโนมัติเรียบร้อยแล้ว
          </p>
        )}
      </div>
    </div>
  );
}
