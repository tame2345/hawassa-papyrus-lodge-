import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { KeyRound, Mail, AlertTriangle } from 'lucide-react';

interface SupabaseLoginProps {
  appLang: 'am' | 'en';
}

export const SupabaseLogin: React.FC<SupabaseLoginProps> = ({ appLang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.history.pushState({}, '', '/admin');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError(appLang === 'am' ? 'እባክዎ ኢሜይል እና የይለፍ ቃል ያስገቡ!' : 'Please enter email and password!');
      setLoading(false);
      return;
    }

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (authError) {
        // Fallback for demo or development purposes if Supabase project is not yet provisioned
        if (email.trim() === 'tamecolorgrading@gmail.com' && password.trim() === 'Admin123!') {
          // Bypassed mode for preview/development
          sessionStorage.setItem('supabase_session_bypassed', 'true');
          sessionStorage.setItem('supabase_bypassed_user_email', email.trim());
          sessionStorage.setItem('supabase_bypassed_user_id', 'super-admin-demo-id');
          sessionStorage.setItem('supabase_bypassed_current_user', JSON.stringify({
            name: 'Super Admin',
            role: 'SuperAdmin',
            pin: '9999',
            active: true
          }));
          setSuccess('Bypassed successfully! Redirecting...');
          setTimeout(() => {
            window.history.pushState({}, '', '/admin');
          }, 1000);
          return;
        }
        throw authError;
      }

      if (data.user) {
        const userEmail = data.user.email;

        // 2. Check if the authenticated user is an authorized admin in our table
        const { data: adminCheck, error: dbError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', userEmail)
          .single();

        // Super Admin is always allowed, or check if admin check matches and is active
        const isSuperAdmin = userEmail === 'tamecolorgrading@gmail.com';
        const isAuthorizedAdmin = adminCheck && adminCheck.status === 'Active';

        if (isSuperAdmin || isAuthorizedAdmin) {
          // Store session info to trigger reactive state
          sessionStorage.setItem('supabase_session_bypassed', 'false');
          sessionStorage.setItem('supabase_bypassed_user_email', userEmail || '');
          sessionStorage.setItem('supabase_bypassed_user_id', data.user.id);
          sessionStorage.setItem('supabase_bypassed_current_user', JSON.stringify({
            name: adminCheck?.name || (isSuperAdmin ? 'Super Admin' : 'Admin User'),
            role: adminCheck?.role || (isSuperAdmin ? 'SuperAdmin' : 'Admin'),
            pin: '1234',
            active: true
          }));

          setSuccess(appLang === 'am' ? 'በስኬት ገብተዋል! ወደ ማስተዳደሪያው በመዛወር ላይ...' : 'Login successful! Redirecting to CMS...');
          setTimeout(() => {
            window.history.pushState({}, '', '/admin');
          }, 1200);
        } else {
          await supabase.auth.signOut();
          setError(appLang === 'am' ? 'እባክዎ ለመግባት የአስተዳዳሪ ፈቃድ ያስፈልግዎታል!' : 'Access Denied: Admin authorization required!');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      {/* Visual glowing ornaments */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#C1FF00]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00f5ff]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] bg-[#111] border-2 border-white/10 rounded-3xl shadow-2xl p-8 relative z-10 hover:border-[#C1FF00]/30 transition-all duration-300">
        {/* Lodge Logo Title */}
        <div className="text-center mb-8 space-y-1.5">
          <div className="w-16 h-16 bg-[#C1FF00]/10 rounded-2xl mx-auto flex items-center justify-center border border-[#C1FF00]/40 shadow-lg">
            <span className="text-3xl animate-pulse">👑</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-3">
            PAPYRUS LODGE
          </h2>
          <p className="text-[10px] text-[#C1FF00] font-mono tracking-widest font-extrabold uppercase">
            SUPER ADMIN CMS LOGIN
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl mb-6 flex items-start gap-2.5 text-left">
            <AlertTriangle className="text-red-400 w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-xs text-red-200 font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl mb-6 text-left">
            <span className="text-xs text-emerald-400 font-bold">{success}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono text-white/50 uppercase tracking-widest font-black block">
              {appLang === 'am' ? 'ኢሜይል አድራሻ (EMAIL ADDRESS)' : 'EMAIL ADDRESS'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@papyruslodge.com"
                className="w-full h-12 pl-11 pr-4 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#C1FF00] focus:ring-1 focus:ring-[#C1FF00] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono text-white/50 uppercase tracking-widest font-black block">
              {appLang === 'am' ? 'የይለፍ ቃል (PASSWORD)' : 'PASSWORD'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-4 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#C1FF00] focus:ring-1 focus:ring-[#C1FF00] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#C1FF00] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_12px_rgba(193,255,0,0.15)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{appLang === 'am' ? 'ግባ አስተዳዳሪ (ENTER CMS)' : 'LOGIN ADMIN ✔️'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-4 text-center">
          <p className="text-[9px] text-white/30 leading-relaxed max-w-xs mx-auto">
            💡 <b>የቅድመ-እይታ መግቢያ (Demo Login):</b> <br />
            ኢሜይል: <span className="text-[#C1FF00] font-mono font-bold select-all">tamecolorgrading@gmail.com</span> <br />
            የይለፍ ቃል: <span className="text-stone-300 font-mono font-bold select-all">Admin123!</span>
          </p>
        </div>
      </div>
    </div>
  );
};
