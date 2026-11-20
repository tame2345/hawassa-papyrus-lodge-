/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StaffMember } from '../types';
import { Lock, AlertCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | 'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | '';
  staffList: StaffMember[];
  onSuccess: (staff: StaffMember) => void;
  onResetCredentials?: (name: string, pin: string, password?: string, username?: string) => void;
}

export default function LoginModal({ isOpen, onClose, role, staffList, onSuccess, onResetCredentials }: LoginModalProps) {
  const { t, tText, tRole, isRtl } = useLanguage();

  const [pinBuffer, setPinBuffer] = useState('');
  const [loginMethod, setLoginMethod] = useState<'pin' | 'password'>('pin');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStaff, setRecoveryStaff] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveredPin, setRecoveredPin] = useState<string | null>(null);
  const [recoveredPass, setRecoveredPass] = useState<string | null>(null);
  const [recoveredUser, setRecoveredUser] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Reset credential fields
  const [newPin, setNewPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPinBuffer('');
      setLoginMethod('pin');
      setUsernameInput('');
      setPasswordInput('');
      setShowRecovery(false);
      setRecoveryAnswer('');
      setRecoveredPin(null);
      setRecoveredPass(null);
      setRecoveredUser(null);
      setLoginError(null);
      setNewPin('');
      setNewPassword('');
      setNewUsername('');
      setIsResetMode(false);
      setRecoveryStatus(null);
      if (staffList.length > 0) {
        const eligible = role ? staffList.filter(s => s.role === role || s.accessPrivilege === role) : staffList;
        setRecoveryStaff(eligible[0]?.name || staffList[0].name);
      }
    }
  }, [isOpen, staffList, role]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    setLoginError(null);
    if (pinBuffer.length < 4) {
      setPinBuffer(prev => prev + num);
    }
  };

  const handleClear = () => {
    setPinBuffer('');
    setLoginError(null);
  };

  const handleLoginSubmit = () => {
    if (pinBuffer.length !== 4) {
      setLoginError(tText({
        am: 'እባክዎ ባለ 4 አሃዝ ፒን ያስገቡ።',
        en: 'Please enter a 4-digit PIN.',
        or: 'Maaloo PIN lakkoofsa 4 galchaa.',
        ti: 'በጃኹም 4 ኣሃዝ ዘለዎ ፒን ኣእትዉ።',
        sid: 'Baaqqo 4 koode (PIN) eessi.',
        fr: 'Veuillez saisir un code PIN à 4 chiffres.',
        de: 'Bitte geben Sie eine 4-stellige PIN ein.',
        it: 'Inserisci un PIN a 4 cifre.',
        zh: '请输入4位PIN码。',
        ar: 'يرجى إدخال رمز PIN المكون من 4 أرقام.',
      }));
      return;
    }
    const matched = staffList.find(s => s.pin === pinBuffer && (s.role === role || s.accessPrivilege === role));
    if (matched) {
      onSuccess(matched);
      onClose();
    } else {
      setLoginError(tText({
        am: 'የተሳሳተ የይለፍ ቃል! (Incorrect PIN)',
        en: 'Incorrect PIN!',
        or: 'PIN dogoggoraa!',
        ti: 'ዝተጋገየ ፒን!',
        sid: 'Soro PIN!',
        fr: 'Code PIN incorrect !',
        de: 'Falsche PIN!',
        it: 'PIN errato!',
        zh: 'PIN码错误！',
        ar: 'رمز PIN غير صحيح!',
      }));
      setPinBuffer('');
    }
  };

  const handlePasswordLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError(tText({
        am: 'እባክዎ መግቢያ ስምና የይለፍ ቃል በትክክል ያስገቡ!',
        en: 'Please enter both username and password.',
        or: 'Maaloo maqaa fi jecha darbii sirriitti galchaa!',
        ti: 'በጃኹም ስምን መሕለፊ ቓልን ብትኽክል ኣእትዉ!',
        sid: 'Su\'manna sai qaale garunni eessi!',
        fr: 'Veuillez saisir votre identifiant et mot de passe.',
        de: 'Bitte Benutzername und Passwort eingeben.',
        it: 'Inserisci nome utente e password.',
        zh: '请输入用户名和密码！',
        ar: 'يرجى إدخال اسم المستخدم وكلمة المرور!',
      }));
      return;
    }
    const matched = staffList.find(s =>
      s.username?.toLowerCase() === usernameInput.toLowerCase().trim() &&
      s.password === passwordInput &&
      (s.role === role || s.accessPrivilege === role)
    );
    if (matched) {
      onSuccess(matched);
      onClose();
    } else {
      setLoginError(tText({
        am: 'የተሳሳተ የይለፍ ቃል ወይም መግቢያ ስም!',
        en: 'Wrong username or password!',
        or: 'Maqaan ykn jechi darbii dogoggora!',
        ti: 'ዝተጋገየ ስም ወይ መሕለፊ ቓል!',
        sid: 'Soro su\'ma woy sai qaale!',
        fr: 'Identifiant ou mot de passe incorrect !',
        de: 'Falscher Benutzername oder Passwort!',
        it: 'Nome utente o password errati!',
        zh: '用户名或密码错误！',
        ar: 'اسم المستخدم أو كلمة المرور غير صحيحة!',
      }));
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus(null);
    const ans = recoveryAnswer.trim().toLowerCase();
    const matchStaff = staffList.find(s => s.name === recoveryStaff);

    if (matchStaff) {
      const isCorrect =
        (matchStaff.securityAnswer && matchStaff.securityAnswer.trim().toLowerCase() === ans) ||
        (!matchStaff.securityAnswer && (ans === 'ሀዋሳ' || ans === 'hawassa' || ans === 'hawasa')) ||
        (ans === 'ሀዋሳ' || ans === 'hawassa' || ans === 'hawasa');

      if (isCorrect) {
        setRecoveredPin(matchStaff.pin);
        setRecoveredPass(matchStaff.password || 'Pass123!');
        setRecoveredUser(matchStaff.username || 'user99');
        setNewPin(matchStaff.pin);
        setNewPassword(matchStaff.password || 'Pass123!');
        setNewUsername(matchStaff.username || 'user99');
      } else {
        setRecoveryStatus({
          type: 'error',
          message: tText({
            am: 'የደህንነት ሚስጥር ቃል ስህተት ነው! እባክዎ በትክክል ይመልሱ።',
            en: 'Incorrect Security Answer!',
            or: 'Deebiin nageenyaa dogoggora!',
            ti: 'ናይ ድሕነት መልሲ ተጋግዩ!',
            sid: 'Keeru dawaro soroho!',
            fr: 'Réponse de sécurité incorrecte !',
            de: 'Falsche Sicherheitsantwort!',
            it: 'Risposta di sicurezza errata!',
            zh: '安全问题答案错误！',
            ar: 'إجابة سؤال الأمان غير صحيحة!',
          }),
        });
      }
    } else {
      setRecoveryStatus({
        type: 'error',
        message: tText({
          am: 'ሰራተኛው አልተገኘም!',
          en: 'Staff member not found!',
          or: 'Hojjetaan hin argamne!',
          ti: 'ሰራሕተኛ ኣይተረኽበን!',
          sid: 'Loosaanchu diafamino!',
          fr: 'Membre du personnel introuvable !',
          de: 'Mitarbeiter nicht gefunden!',
          it: 'Membro dello staff non trovato!',
          zh: '未找到该员工！',
          ar: 'لم يتم العثور على الموظف!',
        }),
      });
    }
  };

  const handlePerformReset = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus(null);
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setRecoveryStatus({
        type: 'error',
        message: tText({
          am: 'ባለ 4 አሃዝ ኮድ (PIN) ቁጥር ብቻ መሆን አለበት!',
          en: 'PIN must be exactly 4 numeric digits!',
          or: 'PIN lakkoofsa 4 qofa ta\'uu qaba!',
          ti: 'ፒን 4 ኣሃዛት ጥራይ ክኸውን ኣለዎ!',
          sid: 'PIN 4 koode calla ikka noosi!',
          fr: 'Le PIN doit contenir exactement 4 chiffres !',
          de: 'Die PIN muss genau 4 Ziffern haben!',
          it: 'Il PIN deve essere composto da 4 cifre!',
          zh: 'PIN必须为4位数字！',
          ar: 'يجب أن يتكون رمز PIN من 4 أرقام فقط!',
        }),
      });
      return;
    }
    if (!newPassword.trim() || !newUsername.trim()) {
      setRecoveryStatus({
        type: 'error',
        message: tText({
          am: 'እባክዎ መግቢያ ስምና የይለፍ ቃል በትክክል ያስገቡ!',
          en: 'Please provide a valid username and password!',
          or: 'Maaloo maqaa fi jecha darbii sirrii galchaa!',
          ti: 'በጃኹም ስምን መሕለፊ ቓልን ኣእትዉ!',
          sid: 'Su\'manna sai qaale eessi!',
          fr: 'Veuillez entrer un identifiant et un mot de passe valides !',
          de: 'Bitte gültigen Benutzernamen und Passwort eingeben!',
          it: 'Inserisci un nome utente e una password validi!',
          zh: '请输入有效的用户名和密码！',
          ar: 'يرجى إدخال اسم مستخدم وكلمة مرور صحيحين!',
        }),
      });
      return;
    }

    if (onResetCredentials) {
      onResetCredentials(recoveryStaff, newPin, newPassword, newUsername);
      setRecoveredPin(newPin);
      setRecoveredPass(newPassword);
      setRecoveredUser(newUsername);
      setIsResetMode(false);
      setRecoveryStatus({
        type: 'success',
        message: tText({
          am: '🔑 የደህንነት መግቢያ መለያው በተሳካ ሁኔታ ተቀይሯል!',
          en: '🔑 Credentials updated successfully!',
          or: '🔑 Odeeffannoon seensaa milkiin haaromfameera!',
          ti: '🔑 መለለዪ መእተዊ ብዓወት ተቐይሩ!',
          sid: '🔑 Seenate koode garunni soorramino!',
          fr: '🔑 Identifiants mis à jour avec succès !',
          de: '🔑 Zugangsdaten erfolgreich aktualisiert!',
          it: '🔑 Credenziali aggiornate con successo!',
          zh: '🔑 登录凭据已成功更新！',
          ar: '🔑 تم تحديث بيانات الدخول بنجاح!',
        }),
      });
    } else {
      setRecoveryStatus({
        type: 'error',
        message: tText({
          am: 'ስህተት ተከስቷል፤ እባክዎ እንደገና ይሞክሩ።',
          en: 'An error occurred. Please try again.',
          or: 'Dogoggorri uumameera; irra deebi\'aa yaalaa.',
          ti: 'ጌጋ ተፈጢሩ፤ ደጊምኩም ፈትኑ።',
          sid: 'Soro kalaqamino; marro wo\'naali.',
          fr: 'Une erreur est survenue. Veuillez réessayer.',
          de: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
          it: 'Si è verificato un errore. Riprova.',
          zh: '发生错误，请重试。',
          ar: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
        }),
      });
    }
  };

  const roleHeader = role ? tRole(String(role)) : tText({
    am: 'የሰራተኞች መግቢያ',
    en: 'Staff Sign In',
    or: 'Seensa Hojjettootaa',
    ti: 'መእተዊ ሰራሕተኛታት',
    sid: 'Loosaanote Seena',
    fr: 'Connexion Personnel',
    de: 'Mitarbeiter-Login',
    it: 'Accesso Staff',
    zh: '员工登录',
    ar: 'تسجيل دخول الموظفين',
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="fixed inset-0 bg-[#5C0A0A]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#991B1B] w-full max-w-sm rounded-2xl border-2 border-[#F4C22B] shadow-2xl relative overflow-hidden flex flex-col text-white">
        {/* Menu Gold accent bar */}
        <div className="h-1.5 w-full bg-[#F4C22B]"></div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/80 hover:text-[#F4C22B] transition-colors cursor-pointer"
          id="btn-close-login"
          title={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {!showRecovery ? (
          <div className="p-6 flex flex-col items-center">
            <div className="mb-2 bg-[#7A1212] border border-[#F4C22B]/60 w-12 h-12 rounded-2xl flex items-center justify-center text-[#F4C22B]">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>

            <h3 className="text-xs font-black tracking-widest text-[#F4C22B] uppercase text-center font-sans">
              {roleHeader}
            </h3>

            {/* Login Methods Selection tabs */}
            <div className="flex w-full bg-[#7A1212] border border-[#F4C22B]/40 p-1 rounded-xl mt-4 mb-4 text-[10px] font-bold font-sans">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('pin');
                  setLoginError(null);
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer ${loginMethod === 'pin' ? 'bg-[#F4C22B] text-stone-950 font-black' : 'text-white/85 hover:text-white'}`}
              >
                🔢 {t('auth.pin_mode')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setLoginError(null);
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer ${loginMethod === 'password' ? 'bg-[#F4C22B] text-stone-950 font-black' : 'text-white/85 hover:text-white'}`}
              >
                👤 {t('auth.password_mode')}
              </button>
            </div>

            {loginMethod === 'pin' ? (
              <div className="w-full flex flex-col items-center">
                {/* Display screen */}
                <div className="w-full bg-[#7A1212] border border-[#F4C22B]/50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-mono tracking-[0.4em] font-black text-[#F4C22B]">
                    {pinBuffer ? '•'.repeat(pinBuffer.length) : <span className="text-white/40">••••</span>}
                  </div>
                  {loginError && (
                    <p className="text-[#FEF08A] text-[10px] uppercase font-black tracking-wide mt-2 font-mono">
                      ⚠️ {loginError}
                    </p>
                  )}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mt-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      id={`keypad-num-${num}`}
                      onClick={() => handleKeyPress(num)}
                      className="bg-[#7A1212] hover:bg-[#B21F1F] border border-[#F4C22B]/40 py-3 rounded-xl hover:border-[#F4C22B] text-white font-mono text-lg font-black transition-all active:bg-[#F4C22B] active:text-stone-950 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    id="keypad-clear"
                    onClick={handleClear}
                    className="bg-[#7F1D1D] hover:bg-red-700 border border-[#FEF08A]/50 rounded-xl text-[#FEF08A] font-mono text-[10px] uppercase font-black tracking-wider cursor-pointer"
                  >
                    {tText({
                      am: 'አጽዳ',
                      en: 'CLEAR',
                      or: 'HAQI',
                      ti: 'ኣጽሪ',
                      sid: 'HUNI',
                      fr: 'EFFACER',
                      de: 'LÖSCHEN',
                      it: 'CANC',
                      zh: '清除',
                      ar: 'مسح',
                    })}
                  </button>
                  <button
                    type="button"
                    id="keypad-num-0"
                    onClick={() => handleKeyPress('0')}
                    className="bg-[#7A1212] hover:bg-[#B21F1F] border border-[#F4C22B]/40 rounded-xl py-3 text-white font-mono text-lg font-black transition-all active:bg-[#F4C22B] active:text-stone-950 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    id="keypad-enter"
                    onClick={handleLoginSubmit}
                    className="bg-[#F4C22B] hover:bg-white text-stone-950 rounded-xl font-mono text-[11px] uppercase font-black transition-colors cursor-pointer border border-[#CF9D12]"
                  >
                    {tText({
                      am: 'ግባ',
                      en: 'ENTER',
                      or: 'SEENI',
                      ti: 'እቶ',
                      sid: 'E\'I',
                      fr: 'ENTRER',
                      de: 'OK',
                      it: 'INVIO',
                      zh: '确认',
                      ar: 'دخول',
                    })}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordLoginSubmit} className="w-full space-y-4 text-left font-sans">
                <div>
                  <label className="text-[9px] font-mono uppercase text-[#FDE68A] font-bold block mb-1">
                    {tText({
                      am: 'ዩዘርኔም (USERNAME)',
                      en: 'USERNAME',
                      or: 'MAQAA FAYYADAMAA',
                      ti: 'ስም ተጠቃሚ',
                      sid: 'HORONSI SU\'MA',
                      fr: 'IDENTIFIANT',
                      de: 'BENUTZERNAME',
                      it: 'NOME UTENTE',
                      zh: '用户名',
                      ar: 'اسم المستخدم',
                    })}
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="e.g. abebe_lodge"
                    required
                    className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-xs font-bold p-2.5 rounded-xl outline-none focus:border-yellow-300 text-center"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-[#FDE68A] font-bold block mb-1">
                    {tText({
                      am: 'የይለፍ ቃል (PASSWORD)',
                      en: 'PASSWORD',
                      or: 'JECHA DARBII',
                      ti: 'መሕለፊ ቓል',
                      sid: 'SAI QAALE',
                      fr: 'MOT DE PASSE',
                      de: 'PASSWORT',
                      it: 'PASSWORD',
                      zh: '密码',
                      ar: 'كلمة المرور',
                    })}
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-xs font-bold p-2.5 rounded-xl outline-none focus:border-yellow-300 text-center"
                  />
                </div>

                {loginError && (
                  <p className="text-[#FEF08A] text-[10px] uppercase font-black tracking-wide text-center font-mono">
                    ⚠️ {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#F4C22B] hover:bg-white text-stone-950 text-xs font-black uppercase py-2.5 rounded-xl font-mono cursor-pointer transition-colors shadow-md border border-[#CF9D12]"
                >
                  {t('auth.unlock_btn')} 🔓
                </button>
              </form>
            )}

              <button
                onClick={() => {
                  setShowRecovery(true);
                  setRecoveredPin(null);
                  setRecoveryAnswer('');
                  setIsResetMode(false);
                  setRecoveryStatus(null);
                }}
                className="text-[10px] font-mono text-[#F4C22B] hover:underline mt-6 uppercase tracking-wider cursor-pointer font-sans font-bold"
                id="btn-login-forgot"
              >
                {t('auth.forgot_creds')} 🔑
              </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 border-b border-[#F4C22B]/35 pb-2">
              <AlertCircle className="text-[#F4C22B] w-5 h-5" />
              <h4 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                {tText({
                  am: 'የይለፍ ቃል ማግኛና መቀየሪያ',
                  en: 'Recover & Reset Credentials',
                  or: 'Jecha Darbii Deebisuu fi Jijjiiruu',
                  ti: 'መሕለፊ ቓል መምለስን መቐየርን',
                  sid: 'Sai Qaale Qolanna Soorra',
                  fr: 'Récupérer / Réinitialiser',
                  de: 'Zugangsdaten wiederherstellen',
                  it: 'Recupera e reimposta credenziali',
                  zh: '找回与重置凭据',
                  ar: 'استرداد وتحديث بيانات الدخول',
                })}
              </h4>
            </div>

            {recoveryStatus && (
              <div
                className={`mb-3 p-2.5 rounded-xl border text-[11px] font-bold leading-snug ${
                  recoveryStatus.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100'
                    : 'bg-[#5C0A0A] border-[#FEF08A] text-[#FEF08A]'
                }`}
              >
                {recoveryStatus.message}
              </div>
            )}

            {!recoveredPin ? (
              <form onSubmit={handleRecoverySubmit} className="space-y-4 text-left font-sans">
                <div>
                  <label className="text-[9px] font-mono uppercase text-[#FDE68A] font-bold block mb-1">
                    {tText({
                      am: 'የሰራተኛ ስም ይምረጡ (SELECT STAFF)',
                      en: 'SELECT STAFF MEMBER',
                      or: 'HOJJETAA FILADHU',
                      ti: 'ሰራሕተኛ ምረጽ',
                      sid: 'LOOSAANCHO DOORI',
                      fr: 'SÉLECTIONNER UN EMPLOYÉ',
                      de: 'MITARBEITER WÄHLEN',
                      it: 'SELEZIONA STAFF',
                      zh: '选择员工',
                      ar: 'اختر الموظف',
                    })}
                  </label>
                  <select
                    value={recoveryStaff}
                    onChange={(e) => {
                      setRecoveryStaff(e.target.value);
                      setRecoveredPin(null);
                    }}
                    className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 text-xs font-bold p-2.5 rounded-xl outline-none"
                  >
                    {staffList.filter(s => !role || s.role === role || s.accessPrivilege === role).map((s, idx) => (
                      <option key={idx} value={s.name}>{s.name} ({tRole(s.role)})</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-[#7A1212] border border-[#F4C22B]/40 rounded-xl text-[11px] leading-relaxed text-white">
                  <span className="text-[#F4C22B] font-black block mb-1">
                    🙋‍♂️ {tText({
                      am: 'የደህንነት መለያ ጥያቄ:',
                      en: 'Security Question:',
                      or: 'Gaaffii Nageenyaa:',
                      ti: 'ሕቶ ድሕነት:',
                      sid: 'Keeru Xa\'mo:',
                      fr: 'Question de sécurité :',
                      de: 'Sicherheitsfrage:',
                      it: 'Domanda di sicurezza:',
                      zh: '安全问题：',
                      ar: 'سؤال الأمان:',
                    })}
                  </span>
                  {tText({
                    am: "የተመዘገበው የደህንነት ሚስጥር ቃል ወይም ሎጁ የሚገኝበት ከተማ ማን ይባላል? (ለምሳሌ 'ሀዋሳ' / 'hawassa')",
                    en: "Enter your registered security secret word or the lodge city ('hawassa').",
                    or: "Jecha iccitii ykn magaalaa loodjiin keessatti argamu galchaa ('hawassa').",
                    ti: "ዝተመዝገበ ምስጢራዊ ቓል ወይ ሎጅ ዝርከበላ ከተማ ኣእትዉ ('hawassa')።",
                    sid: "Borreessinoonni maaxino qaale woy looje noo quchuma eessi ('hawassa').",
                    fr: "Saisissez votre mot secret ou la ville du lodge ('hawassa').",
                    de: "Geben Sie Ihr Sicherheitswort oder die Stadt der Lodge ein ('hawassa').",
                    it: "Inserisci la parola segreta o la città del lodge ('hawassa').",
                    zh: "请输入您的注册安全密语或度假村所在城市（'hawassa'）。",
                    ar: "أدخل كلمة الأمان المسجلة أو مدينة النزل ('hawassa').",
                  })}
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-[#FDE68A] font-bold block mb-1">
                    {tText({
                      am: 'የደህንነት መልስ (SECRET KEYWORD)',
                      en: 'SECURITY ANSWER',
                      or: 'DEEBII NAGEENYAA',
                      ti: 'መልሲ ድሕነት',
                      sid: 'KEERU DAWARO',
                      fr: 'RÉPONSE DE SÉCURITÉ',
                      de: 'SICHERHEITSANTWORT',
                      it: 'RISPOSTA DI SICUREZZA',
                      zh: '安全答案',
                      ar: 'إجابة الأمان',
                    })}
                  </label>
                  <input
                    type="text"
                    value={recoveryAnswer}
                    onChange={(e) => {
                      setRecoveryAnswer(e.target.value);
                      setRecoveryStatus(null);
                    }}
                    placeholder="hawassa"
                    required
                    className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-xs font-bold p-2.5 rounded-xl outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecovery(false);
                      setRecoveryStatus(null);
                    }}
                    className="flex-1 bg-[#7A1212] hover:bg-[#B21F1F] text-white text-[10px] uppercase font-mono font-bold py-2.5 rounded-xl border border-[#F4C22B]/40 cursor-pointer"
                  >
                    {tText({ am: 'ተመለስ', en: 'BACK', or: 'DEEBI\'I', ti: 'ተመለስ', sid: 'HIGI', fr: 'RETOUR', de: 'ZURÜCK', it: 'INDIETRO', zh: '返回', ar: 'رجوع' })}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#F4C22B] hover:bg-white text-stone-950 text-[10px] uppercase font-mono font-black py-2.5 rounded-xl cursor-pointer border border-[#CF9D12]"
                  >
                    {tText({ am: 'አረጋግጥ', en: 'VERIFY', or: 'MIRKANEESSI', ti: 'ኣረጋግጽ', sid: 'BUUXXI', fr: 'VÉRIFIER', de: 'PRÜFEN', it: 'VERIFICA', zh: '验证', ar: 'تحقق' })}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-left font-sans">
                {/* Credentials Revealed Box */}
                <div className="p-3.5 bg-[#7A1212] border border-[#F4C22B]/50 rounded-xl space-y-2">
                  <p className="text-[9px] font-mono text-[#F4C22B] uppercase font-black tracking-widest">
                    🔑 {tText({
                      am: 'የአሁኑ መግቢያ መለያዎች',
                      en: 'Current Credentials',
                      or: 'Odeeffannoo Seensaa Ammaa',
                      ti: 'ህሉው መእተዊ መለለዪታት',
                      sid: 'Xaaha Seenate Koode',
                      fr: 'Identifiants actuels',
                      de: 'Aktuelle Zugangsdaten',
                      it: 'Credenziali attuali',
                      zh: '当前登录凭据',
                      ar: 'بيانات الدخول الحالية',
                    })}
                  </p>
                  <div className="text-xs space-y-1 text-white bg-[#8C1414] p-2.5 rounded-lg font-mono border border-[#F4C22B]/30">
                    <p><span className="text-[#FDE68A] font-sans">{tText({ am: 'ስም:', en: 'Name:', or: 'Maqaa:', ti: 'ስም:', sid: 'Su\'ma:', fr: 'Nom:', de: 'Name:', it: 'Nome:', zh: '姓名:', ar: 'الاسم:' })}</span> <span className="font-bold text-white font-sans">{recoveryStaff}</span></p>
                    <p><span className="text-[#FDE68A] font-sans">Username:</span> <span className="font-bold">{recoveredUser}</span></p>
                    <p><span className="text-[#FDE68A] font-sans">Password:</span> <span className="font-bold text-[#F4C22B]">{recoveredPass}</span></p>
                    <p><span className="text-[#FDE68A] font-sans">PIN:</span> <span className="bg-emerald-700 px-1.5 rounded text-emerald-100 font-bold">{recoveredPin}</span></p>
                  </div>
                </div>

                {!isResetMode ? (
                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="w-full bg-[#F4C22B] hover:bg-white text-stone-950 font-black text-xs uppercase py-3 rounded-xl transition-all cursor-pointer border border-[#CF9D12]"
                    >
                      ✏️ {tText({
                        am: 'አዲስ ዩዘርና ፓስወርድ ቀይር',
                        en: 'Reset Username & PIN',
                        or: 'Maqaa fi PIN Haaraa Qopheessi',
                        ti: 'ሓድሽ ዩዘርን ፒንን ቀይር',
                        sid: 'Haaro Su\'manna PIN Soorri',
                        fr: 'Réinitialiser identifiant & PIN',
                        de: 'Benutzer & PIN zurücksetzen',
                        it: 'Reimposta utente e PIN',
                        zh: '重置用户名和PIN',
                        ar: 'إعادة تعيين اسم المستخدم والرمز',
                      })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRecovery(false)}
                      className="w-full bg-[#7A1212] hover:bg-[#B21F1F] text-white border border-[#F4C22B]/45 font-bold text-xs uppercase py-2.5 rounded-xl cursor-pointer"
                    >
                      {tText({
                        am: 'ወደ መግቢያ ገጽ ተመለስ',
                        en: 'Back to Sign In',
                        or: 'Gara Seensaatti Deebi\'i',
                        ti: 'ናብ መእተዊ ገጽ ተመለስ',
                        sid: 'Seenate Qoolira Higi',
                        fr: 'Retour à la connexion',
                        de: 'Zurück zum Login',
                        it: 'Torna all\'accesso',
                        zh: '返回登录',
                        ar: 'العودة لتسجيل الدخول',
                      })}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePerformReset} className="space-y-3 border-t border-[#F4C22B]/35 pt-3">
                    <p className="text-[9px] text-[#F4C22B] uppercase font-mono font-bold">
                      {tText({ am: 'አዲሱን መለያ መረጃ ይሙሉ', en: 'New Credentials Setup', or: 'Odeeffannoo Haaraa', ti: 'ሓድሽ ሓበሬታ መእተዊ', sid: 'Haaro Seenate Borro', fr: 'Nouveaux identifiants', de: 'Neue Zugangsdaten', it: 'Nuove credenziali', zh: '设置新凭据', ar: 'إعداد بيانات جديدة' })}
                    </p>

                    <div>
                      <label className="text-[8px] font-mono text-[#FDE68A] font-bold uppercase block mb-1">NEW USERNAME</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                        className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 text-xs font-bold p-2 rounded-lg outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-mono text-[#FDE68A] font-bold uppercase block mb-1">NEW PASSWORD</label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 text-xs font-bold p-2 rounded-lg outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-mono text-[#FDE68A] font-bold uppercase block mb-1">NEW 4-DIGIT PIN</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        required
                        className="w-full bg-white border-2 border-[#F4C22B] text-stone-950 text-center font-mono text-sm font-black p-2 rounded-lg outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsResetMode(false)}
                        className="flex-1 bg-[#7A1212] text-white border border-[#F4C22B]/40 text-[10px] py-2 rounded-lg uppercase font-medium cursor-pointer"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#F4C22B] hover:bg-white text-stone-950 font-black text-[10px] py-1.5 rounded-lg uppercase cursor-pointer"
                      >
                        {t('common.save')} ✔
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

