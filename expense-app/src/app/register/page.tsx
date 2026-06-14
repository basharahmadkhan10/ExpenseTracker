'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Sun, Moon } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const active = saved || 'light';
    setTheme(active);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(active === 'dark' ? 'dark' : 'light');
    document.body.className = active === 'dark' ? 'dark-theme' : 'light-theme';
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next === 'dark' ? 'dark' : 'light');
    document.body.className = next === 'dark' ? 'dark-theme' : 'light-theme';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.warn("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success(`Account registered! Welcome, ${name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f5bb1b] bg-dots-grid px-4 overflow-hidden selection:bg-black selection:text-[#f5bb1b]">
      {/* Floating animated decorative shapes in the background */}
      <div className="absolute top-10 left-10 w-12 h-12 bg-white/20 border-2 border-black rounded-xl floating-shape"></div>
      <div className="absolute top-1/4 right-16 w-8 h-8 bg-black/20 border-2 border-white rounded-lg floating-shape-delayed-1"></div>
      <div className="absolute bottom-20 left-12 w-14 h-14 bg-white/10 border-2 border-black rounded-2xl floating-shape-delayed-2"></div>
      <div className="absolute bottom-10 right-14 w-10 h-10 bg-black/10 border-2 border-white rounded-lg floating-shape"></div>

      {/* Theme Switcher in the corner */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border-3 border-black text-[#111111] dark:text-white hover:bg-[#fafafa] transition cursor-pointer shadow-[3px_3px_0px_#000] flex items-center justify-center"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>
      </div>

      <div className="w-full max-w-md neobrutal-card-white p-8 space-y-6 relative z-10">
        
        {/* Title Tagline */}
        <div className="text-center space-y-4">
          <div className="inline-block bg-white text-black border-2 border-black px-4 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_#000] rounded-xl">
            📝 SIGN UP
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-widest text-[#111111] bg-[#f5bb1b] border-3 border-black py-2 px-5 shadow-[3px_3px_0px_#000] rounded-2xl inline-block uppercase">
              CREATE ACCOUNT
            </h1>
            <p className="text-[9.5px] text-slate-550 dark:text-slate-400 font-black tracking-wider uppercase pt-2">
              Join the Shared Ledger Group
            </p>
          </div>
        </div>

        {/* Tab Toggle like the mockup */}
        <div className="flex border-3 border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_#000]">
          <Link 
            href="/login" 
            className="flex-1 text-center py-2.5 text-xs font-bold uppercase bg-white text-slate-500 hover:bg-slate-50 hover:text-black dark:bg-[#262626] dark:text-slate-400 dark:hover:bg-neutral-800 border-r-3 border-black transition"
          >
            SIGN IN
          </Link>
          <div className="flex-1 text-center py-2.5 text-xs font-black uppercase bg-[#f5bb1b] text-black select-none">
            SIGN UP
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-2 border-black p-3.5 rounded-xl shadow-[2px_2px_0px_#000] text-xs font-bold flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600 stroke-[3]" />
            <span className="uppercase tracking-wide leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Username</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rohan"
              className="block w-full neobrutal-input text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full neobrutal-input text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full neobrutal-input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full neobrutal-btn-yellow py-3 text-xs font-black disabled:opacity-50"
          >
            {loading ? 'Creating Credentials...' : 'Register Now →'}
          </button>
        </form>

        <div className="border-t-3 border-dashed border-black pt-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-black dark:text-white font-black underline hover:text-[#f5bb1b] ml-1">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
