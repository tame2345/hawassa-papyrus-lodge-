/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StaffMember } from '../types';
import { Unlock, Lock, AlertCircle, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | 'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | '';
  staffList: StaffMember[];
  onSuccess: (staff: StaffMember) => void;
  onResetCredentials?: (name: string, pin: string, password?: string, username?: string) => void;
}

export default function LoginModal({ isOpen, onClose, role, staffList, onSuccess, onResetCredentials }: LoginModalProps) {
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
      if (staffList.length > 0) {
        // filter by role if set
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
      setLoginError('እባክዎ ባለ 4 አሃዝ ፒን ያስገቡ።');
      return;
    }
    const matched = staffList.find(s => s.pin === pinBuffer && (s.role === role || s.accessPrivilege === role));
    if (matched) {
      onSuccess(matched);
      onClose();
    } else {
      setLoginError('የተሳሳተ የይለፍ ቃል! (Incorrect PIN)');
      setPinBuffer('');
    }
  };

  const handlePasswordLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('እባክዎ መግቢያ ስምና የይለፍ ቃል በትክክል ያስገቡ!');
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
      setLoginError('የተሳሳተ የይለፍ ቃል ወይም መግቢያ ስም! (Wrong Username/Password)');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ans = recoveryAnswer.trim().toLowerCase();
    const matchStaff = staffList.find(s => s.name === recoveryStaff);
    
    if (matchStaff) {
      const isCorrect = 
        (matchStaff.securityAnswer && matchStaff.securityAnswer.trim().toLowerCase() === ans) ||
        (!matchStaff.securityAnswer && (ans === 'ሀዋሳ' || ans === 'hawassa' || ans === 'hawasa')) ||
        (ans === 'ሀዋሳ' || ans === 'hawassa' || ans === 'hawasa'); // global fallback

      if (isCorrect) {
        setRecoveredPin(matchStaff.pin);
        setRecoveredPass(matchStaff.password || 'Pass123!');
        setRecoveredUser(matchStaff.username || 'user99');
        setNewPin(matchStaff.pin);
        setNewPassword(matchStaff.password || 'Pass123!');
        setNewUsername(matchStaff.username || 'user99');
      } else {
        alert('የደህንነት ሚስጥር ቃል ስህተት ነው! እባክዎ በትክክል ይመልሱ። / Incorrect Security Answer!');
      }
    } else {
      alert('ሰራተኛው አልተገኘም!');
    }
  };

  const handlePerformReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      alert('ባለ 4 አሃዝ ኮድ (PIN) ቁጥር ብቻ መሆን አለበት!');
      return;
    }
    if (!newPassword.trim() || !newUsername.trim()) {
      alert('እባክዎ መግቢያ ስምና የይለፍ ቃል በትክክል ያስገቡ!');
      return;
    }

    if (onResetCredentials) {
      onResetCredentials(recoveryStaff, newPin, newPassword, newUsername);
      setRecoveredPin(newPin);
      setRecoveredPass(newPassword);
      setRecoveredUser(newUsername);
      setIsResetMode(false);
      alert('🔑 የደህንነት መግቢያ መለያው በተሳካ ሁኔታ ተቀይሯል! / Credentials updated successfully.');
    } else {
      alert('ስህተት ተከስቷል፤ እባክዎ እንደገና ይሞክሩ።');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] w-full max-w-sm rounded-none border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Acid theme accent bar */}
        <div className="h-1 w-full bg-[#C1FF00]"></div>

        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
          id="btn-close-login"
        >
          <X className="w-5 h-5" />
        </button>

        {!showRecovery ? (
          <div className="p-6 flex flex-col items-center">
            <div className="mb-2 bg-white/5 border border-white/10 w-12 h-12 flex items-center justify-center text-[#C1FF00]">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>

            <h3 className="text-xs font-black tracking-widest text-[#C1FF00] uppercase text-center font-sans">
              {role === 'waiter' ? 'አስተናጋጅ መግቢያ (Waiters)' : 
               role === 'chef' ? 'የኩሽና መግቢያ (Kitchen)' : 
               role === 'receptionist' ? 'የሪሴብሽን መግቢያ (Reception)' : 
               role === 'manager' ? 'የማናጀር መግቢያ (Manager)' : 
               role === 'cashier' ? 'የካሸር መግቢያ (Cashier Desktop)' : 
               role === 'guard' ? 'የጥበቃ መግቢያ (Guard Portal)' : 
               role === 'admin' ? 'የስራ አስኪያጅ መግቢያ (Admin)' :
               `የመግቢያ መለያ (${String(role).toUpperCase()})`}
            </h3>
            
            {/* Login Methods Selection tabs */}
            <div className="flex w-full bg-black/40 border border-white/5 p-1 rounded mt-4 mb-4 text-[10px] font-bold font-sans">
              <button 
                type="button"
                onClick={() => {
                  setLoginMethod('pin');
                  setLoginError(null);
                }}
                className={`flex-1 py-1 px-2.5 text-center transition-all cursor-pointer ${loginMethod === 'pin' ? 'bg-[#C1FF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                🔢 ባለ 4-ቁጥር (PIN)
              </button>
              <button 
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setLoginError(null);
                }}
                className={`flex-1 py-1 px-2.5 text-center transition-all cursor-pointer ${loginMethod === 'password' ? 'bg-[#C1FF00] text-black font-black' : 'text-white/60 hover:text-white'}`}
              >
                👤 ዩዘርና የይለፍ ቃል
              </button>
            </div>

            {loginMethod === 'pin' ? (
              <div className="w-full flex flex-col items-center">
                {/* Display screen */}
                <div className="w-full bg-[#181818] border border-white/5 p-4 rounded-none text-center">
                  <div className="text-3xl font-mono tracking-[0.4em] font-black text-[#C1FF00]">
                    {pinBuffer ? '•'.repeat(pinBuffer.length) : <span className="text-white/20">••••</span>}
                  </div>
                  {loginError && (
                    <p className="text-red-500 text-[10px] uppercase font-black tracking-wide mt-2 font-mono">
                      {loginError}
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
                      className="bg-[#1A1A1A] hover:bg-[#252525] border border-white/5 py-3 hover:border-white/10 text-white font-mono text-lg font-black transition-all active:bg-[#C1FF00] active:text-black cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    id="keypad-clear"
                    onClick={handleClear}
                    className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/10 text-red-400 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                  >
                    CLEAR
                  </button>
                  <button
                    type="button"
                    id="keypad-num-0"
                    onClick={() => handleKeyPress('0')}
                    className="bg-[#1A1A1A] hover:bg-[#252525] border border-white/5 py-3 text-white font-mono text-lg font-black transition-all active:bg-[#C1FF00] active:text-black cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    id="keypad-enter"
                    onClick={handleLoginSubmit}
                    className="bg-[#C1FF00] hover:bg-white text-black font-mono text-[11px] uppercase font-black transition-colors cursor-pointer"
                  >
                    ENTER
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordLoginSubmit} className="w-full space-y-4 text-left font-sans">
                <div>
                  <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">ዩዘርኔም (USERNAME)</label>
                  <input 
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="e.g. abebe_lodge"
                    required
                    className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00] text-center"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">የይለፍ ቃል (PASSWORD)</label>
                  <input 
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00] text-center"
                  />
                </div>

                {loginError && (
                  <p className="text-red-500 text-[10px] uppercase font-black tracking-wide text-center font-mono">
                    ⚠️ {loginError}
                  </p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-2.5 font-mono cursor-pointer transition-colors shadow-md"
                >
                  SECURE LOGIN 🔓
                </button>
              </form>
            )}

            <button 
              onClick={() => {
                setShowRecovery(true);
                setRecoveredPin(null);
                setRecoveryAnswer('');
                setIsResetMode(false);
              }} 
              className="text-[10px] font-mono text-[#C1FF00] hover:underline mt-6 uppercase tracking-wider cursor-pointer font-sans"
              id="btn-login-forgot"
            >
              Forgot PIN/Password? / ይለፍ ቃል ማግኛ 🔑
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <AlertCircle className="text-[#C1FF00] w-5 h-5" />
              <h4 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                የይለፍ ቃል ማግኛና መቀየሪያ
              </h4>
            </div>

            {!recoveredPin ? (
              <form onSubmit={handleRecoverySubmit} className="space-y-4 text-left font-sans">
                <div>
                  <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">
                    የሰራተኛ ስም ይምረጡ (SELECT STAFF)
                  </label>
                  <select 
                    value={recoveryStaff}
                    onChange={(e) => {
                      setRecoveryStaff(e.target.value);
                      setRecoveredPin(null);
                    }}
                    className="w-full bg-[#1A1A1A] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                  >
                    {staffList.filter(s => !role || s.role === role || s.accessPrivilege === role).map((s, idx) => (
                      <option key={idx} value={s.name}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-white/5 border border-white/5 text-[11px] leading-relaxed text-white">
                  <span className="text-[#C1FF00] font-black block mb-1">🙋‍♂️ የደህንነት መለያ ጥያቄ (Security Question):</span>
                  የተመዘገበው የደህንነት ሚስጥር ቃል ወይም ሎጁ የሚገኝበት ከተማ ማን ይባላል? (Enter custom security secret word or 'hawassa')
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">
                    የደህንነት መልስ (ANSWER / SECRET KEYWORD)
                  </label>
                  <input 
                    type="text" 
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    placeholder="ለምሳሌ፡ ሀዋሳ"
                    required
                    className="w-full bg-[#1A1A1A] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowRecovery(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] uppercase font-mono font-bold py-2.5 border border-white/10 cursor-pointer"
                  >
                    BACK
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-[#C1FF00] hover:bg-white text-black text-[10px] uppercase font-mono font-black py-2.5 cursor-pointer"
                  >
                    VERIFY
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-left font-sans">
                {/* Credentials Revealed Box */}
                <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg space-y-2">
                  <p className="text-[9px] font-mono text-[#C1FF00] uppercase font-black tracking-widest">
                    🔑 የአሁኑ መግቢያ መለያዎች
                  </p>
                  <div className="text-xs space-y-1 text-white/90 bg-[#121212] p-2 rounded font-mono">
                    <p><span className="text-white/40 font-sans">ስም:</span> <span className="font-bold text-[#00f5ff] font-sans">{recoveryStaff}</span></p>
                    <p><span className="text-white/40 font-sans">Username (ዩዘር):</span> <span className="font-bold">{recoveredUser}</span></p>
                    <p><span className="text-white/40 font-sans">Password (ይለፍ):</span> <span className="font-bold text-yellow-300">{recoveredPass}</span></p>
                    <p><span className="text-white/40 font-sans">PIN Code:</span> <span className="bg-white/10 px-1 text-emerald-400 font-bold">{recoveredPin}</span></p>
                  </div>
                </div>

                {/* Reset credentials toggle or form */}
                {!isResetMode ? (
                  <div className="space-y-3 pt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsResetMode(true)}
                      className="w-full bg-[#00f5ff] hover:bg-[#C1FF00] text-black font-black text-xs uppercase py-3 rounded transition-all cursor-pointer"
                    >
                      ✏️ አዲስ ዩዘርና ፓስወርድ ቀይር (Reset)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowRecovery(false);
                      }}
                      className="w-full bg-[#1e1e1e] hover:bg-white/10 text-white border border-white/10 font-bold text-xs uppercase py-2.5 rounded cursor-pointer"
                    >
                      ወደ መግቢያ ገጽ ተመለስ (LOGIN)
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePerformReset} className="space-y-3 border-t border-white/10 pt-3">
                    <p className="text-[9px] text-[#C1FF00] uppercase font-mono font-bold">አዲሱን መለያ መረጃ ይሙሉ (New Setup)</p>
                    
                    <div>
                      <label className="text-[8px] font-mono text-white/45 uppercase block mb-1">አዲስ ዩዘር ኔም (NEW USERNAME)</label>
                      <input 
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                        className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#C1FF00]"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-mono text-white/45 uppercase block mb-1">አዲስ ፓስወርድ (NEW PASSWORD)</label>
                      <input 
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#C1FF00]"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-mono text-white/45 uppercase block mb-1">አዲስ ባለ 4-አሃዝ ፒን (NEW 4-DIGIT PIN)</label>
                      <input 
                        type="text"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        required
                        className="w-full bg-[#181818] border border-[#00f5ff]/40 text-[#00f5ff] text-center font-mono text-sm font-black p-2 outline-none focus:border-[#00f5ff]"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setIsResetMode(false)}
                        className="flex-1 bg-white/5 text-white border border-white/10 text-[10px] py-2 uppercase font-medium cursor-pointer"
                      >
                        BACK
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 bg-emerald-500 hover:bg-[#C1FF00] hover:text-black text-white font-black text-[10px] py-1.5 uppercase cursor-pointer"
                      >
                        SAVE CHANGES ✔
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
