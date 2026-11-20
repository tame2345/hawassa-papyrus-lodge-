import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { KeyRound, Mail, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  PapyrusChefClocheCrest,
  PapyrusBrushUnderline,
  HeadingBurstDashes,
  PapyrusChefDivider,
  PapyrusOrangeBackdropLayer,
  PapyrusCardCulinaryAccents,
} from './PapyrusEntryDecor';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface SupabaseLoginProps {
  appLang?: string;
}

export const SupabaseLogin: React.FC<SupabaseLoginProps> = () => {
  const { t, tText, isRtl } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(t('auth.enter_credentials_err'));
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (authError) {
        if (email.trim() === 'tamecolorgrading@gmail.com' && password.trim() === 'Admin123!') {
          sessionStorage.setItem('supabase_session_bypassed', 'true');
          sessionStorage.setItem('supabase_bypassed_user_email', email.trim());
          sessionStorage.setItem('supabase_bypassed_user_id', 'super-admin-demo-id');
          sessionStorage.setItem('supabase_bypassed_current_user', JSON.stringify({
            name: 'Super Admin',
            role: 'SuperAdmin',
            pin: '9999',
            active: true
          }));
          setSuccess(tText({
            am: 'በስኬት ገብተዋል! በመዛወር ላይ...',
            en: 'Bypassed successfully! Redirecting...',
            or: 'Milkaa\'inaan seentaniittu! Ce\'aa jira...',
            ti: 'ብዓወት ኣቲኹም! ይሰጋገር ኣሎ...',
            sid: 'Danchunni e\'ootto! Soorramanni no...',
            fr: 'Connexion réussie ! Redirection...',
            de: 'Erfolgreich angemeldet! Weiterleitung...',
            it: 'Accesso riuscito! Reindirizzamento...',
            zh: '登录成功！正在跳转...',
            ar: 'تم تسجيل الدخول بنجاح! جاري التوجيه...',
          }));
          setTimeout(() => {
            window.history.pushState({}, '', '/admin');
          }, 1000);
          return;
        }
        throw authError;
      }

      if (data.user) {
        const userEmail = data.user.email;

        const { data: adminCheck } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', userEmail)
          .single();

        const isSuperAdmin = userEmail === 'tamecolorgrading@gmail.com';
        const isAuthorizedAdmin = adminCheck && adminCheck.status === 'Active';

        if (isSuperAdmin || isAuthorizedAdmin) {
          sessionStorage.setItem('supabase_session_bypassed', 'false');
          sessionStorage.setItem('supabase_bypassed_user_email', userEmail || '');
          sessionStorage.setItem('supabase_bypassed_user_id', data.user.id);
          sessionStorage.setItem('supabase_bypassed_current_user', JSON.stringify({
            name: adminCheck?.name || (isSuperAdmin ? 'Super Admin' : 'Admin User'),
            role: adminCheck?.role || (isSuperAdmin ? 'SuperAdmin' : 'Admin'),
            pin: '1234',
            active: true
          }));

          setSuccess(tText({
            am: 'በስኬት ገብተዋል! ወደ ማስተዳደሪያው በመዛወር ላይ...',
            en: 'Login successful! Redirecting to CMS...',
            or: 'Milkaa\'inaan seentaniittu! Gara CMS deemaa jira...',
            ti: 'ብዓወት ኣቲኹም! ናብ CMS ይሰጋገር ኣሎ...',
            sid: 'E\'ootto! Gara CMS ha\'ranno...',
            fr: 'Connexion réussie ! Redirection vers le CMS...',
            de: 'Anmeldung erfolgreich! Weiterleitung zum CMS...',
            it: 'Accesso riuscito! Reindirizzamento al CMS...',
            zh: '登录成功！正在前往管理后台...',
            ar: 'تم تسجيل الدخول بنجاح! جاري الانتقال إلى لوحة التحكم...',
          }));
          setTimeout(() => {
            window.history.pushState({}, '', '/admin');
          }, 1200);
        } else {
          await supabase.auth.signOut();
          setError(tText({
            am: 'እባክዎ ለመግባት የአስተዳዳሪ ፈቃድ ያስፈልግዎታል!',
            en: 'Access Denied: Admin authorization required!',
            or: 'Hayyamni hin kennamne: Hayyama bulchaa barbaachisa!',
            ti: 'ፍቓድ ተኸልኪሉ: ናይ ኣመሓዳሪ ፍቓድ የድሊ!',
            sid: 'Fajjo dino: Massagaanchu fajjo hasiisanno!',
            fr: 'Accès refusé : autorisation administrateur requise !',
            de: 'Zugriff verweigert: Admin-Berechtigung erforderlich!',
            it: 'Accesso negato: autorizzazione amministratore richiesta!',
            zh: '拒绝访问：需要管理员权限！',
            ar: 'تم رفض الوصول: مطلوب صلاحية المسؤول!',
          }));
        }
      }
    } catch (err: any) {
      setError(err.message || tText({
        am: 'ማረጋገጫው አልተሳካም። እባክዎ መረጃውን ያረጋግጡ።',
        en: 'Authentication failed. Please check credentials.',
        or: 'Mirkaneessuun hin milkoofne. Odeeffannoo kee mirkaneeffadhu.',
        ti: 'ምርግጋጽ ኣይተዓወተን። ሓበሬታኹም ኣረጋግጹ።',
        sid: 'Buuxxishi di-ikkino. Borooxokki la\'i.',
        fr: 'Échec d\'authentification. Vérifiez vos identifiants.',
        de: 'Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.',
        it: 'Autenticazione fallita. Controlla le credenziali.',
        zh: '身份验证失败，请检查账号信息。',
        ar: 'فشل التحقق. يرجى مراجعة بيانات الدخول.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-br from-[#8C1414] via-[#7A1010] to-[#5C0A0A] flex items-center justify-center p-4 font-sans text-[#1C1917] relative overflow-hidden"
    >
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector id="login-lang-selector" variant="entry" />
      </div>

      {/* Subtle warm ambient glow on backdrop */}
      <div className="absolute top-1/4 left-1/4 w-[460px] h-[460px] bg-[#FF5A1F]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        <PapyrusOrangeBackdropLayer />

        <div className="w-full bg-[#FFFDF9] border border-orange-100 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-8 relative overflow-hidden">
          <PapyrusCardCulinaryAccents />

          <div className="relative z-10">
            {/* Lodge Logo Title */}
            <div className="text-center mb-6 space-y-1">
              <div className="flex justify-center">
                <PapyrusChefClocheCrest className="w-16 h-12" />
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <HeadingBurstDashes side="left" />
                <h2 className="text-2xl font-black text-[#1C1917] tracking-tight">
                  Hawassa <span className="text-[#FF5A1F]">Papyrus</span>
                </h2>
                <HeadingBurstDashes side="right" />
              </div>
              <PapyrusBrushUnderline className="w-40 h-2 mx-auto" />
              <p className="text-[10px] text-[#EA580C] font-mono tracking-widest font-extrabold uppercase pt-0.5">
                {t('auth.super_cms')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-2xl mb-4 flex items-start gap-2.5 text-left">
                <AlertTriangle className="text-red-600 w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs text-red-800 font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl mb-4 text-left">
                <span className="text-xs text-emerald-800 font-bold">{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="bg-[#F5F5F4] border border-stone-200/90 focus-within:border-[#FF5A1F] focus-within:bg-white rounded-full p-1.5 pr-4 flex items-center gap-3 transition-all">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#EA4C08] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  className="w-full bg-transparent text-[#1C1917] placeholder-[#A8A29E] text-xs font-semibold py-1.5 outline-none border-none focus:ring-0"
                />
              </div>

              <div className="bg-[#F5F5F4] border border-stone-200/90 focus-within:border-[#FF5A1F] focus-within:bg-white rounded-full p-1.5 pr-3.5 flex items-center gap-3 transition-all">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#EA4C08] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-xs">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  className="w-full bg-transparent text-[#1C1917] placeholder-[#A8A29E] text-xs font-semibold py-1.5 outline-none border-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-[#78716C] hover:text-[#EA580C] p-1 cursor-pointer shrink-0"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-[#FF6B2C] to-[#EA4C08] hover:from-[#FF5714] hover:to-[#DC3F00] text-[#FFFFFF] font-black text-xs uppercase tracking-wider rounded-full shadow-[0_8px_20px_rgba(255,90,31,0.32)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.sign_in')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <PapyrusChefDivider />
              <p className="text-[10px] text-[#57534E] leading-relaxed max-w-xs mx-auto">
                💡 <b>{tText({
                  am: 'የቅድመ-እይታ መግቢያ (Demo Login):',
                  en: 'Demo Login:',
                  or: 'Seensa Agarsiisaa:',
                  ti: 'ናይ ፈተነ መእተዊ:',
                  sid: 'Demo Seena:',
                  fr: 'Connexion Démo :',
                  de: 'Demo-Login:',
                  it: 'Accesso Demo:',
                  zh: '演示登录：',
                  ar: 'تسجيل تجريبي:',
                })}</b> <br />
                {tText({ am: 'ኢሜይል:', en: 'Email:', or: 'Imeelii:', ti: 'ኢመይል:', sid: 'Imeele:', fr: 'E-mail :', de: 'E-Mail:', it: 'Email:', zh: '邮箱：', ar: 'البريد:' })}{' '}
                <span className="text-[#EA580C] font-mono font-bold select-all">tamecolorgrading@gmail.com</span> <br />
                {tText({ am: 'የይለፍ ቃል:', en: 'Password:', or: 'Jecha Darbii:', ti: 'መሕለፊ ቓል:', sid: 'Sai Qaale:', fr: 'Mot de passe :', de: 'Passwort:', it: 'Password:', zh: '密码：', ar: 'كلمة المرور:' })}{' '}
                <span className="text-[#1C1917] font-mono font-bold select-all">Admin123!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

