/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Phone,
  Send,
  CheckCircle2,
  Trash2,
  Crown,
  Briefcase,
  MessageSquare,
  Save,
} from 'lucide-react';
import type { LeadershipContacts, LeadershipMessage } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface LeadershipInboxPanelProps {
  portalRole: 'manager' | 'admin';
  currentStaffName: string;
  messages: LeadershipMessage[];
  onReplyMessage: (id: string, replyText: string, repliedBy: string) => void;
  onResolveMessage: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  contacts: LeadershipContacts;
  onSaveContacts: (updated: LeadershipContacts) => void;
}

export const LeadershipInboxPanel: React.FC<LeadershipInboxPanelProps> = ({
  portalRole,
  currentStaffName,
  messages,
  onReplyMessage,
  onResolveMessage,
  onDeleteMessage,
  contacts,
  onSaveContacts,
}) => {
  const { t, tText, isRtl } = useLanguage();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [draftContacts, setDraftContacts] = useState<LeadershipContacts>(contacts);
  const [savedNotice, setSavedNotice] = useState(false);

  React.useEffect(() => {
    setDraftContacts(contacts);
  }, [contacts]);

  const relevantMessages = messages.filter((m) => {
    if (portalRole === 'admin') return true;
    return m.target === 'manager' || m.target === 'support' || m.target === 'both';
  });

  const pendingCount = relevantMessages.filter((m) => m.status === 'Pending').length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContacts(draftContacts);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      {/* Left: Direct Messages Inbox */}
      <div className="lg:col-span-7 bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-mono font-black uppercase text-yellow-400 block">
              DIRECT GUEST & LEADERSHIP INBOX
            </span>
            <h3 className="text-sm font-black text-white uppercase mt-0.5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-yellow-400" />
              <span>
                {portalRole === 'admin'
                  ? tText({
                      am: 'የዋና ስራ አስኪያጅ እና የማናጀር ቀጥታ መልዕክቶች',
                      en: 'General Manager & Manager Direct Inbox',
                      or: 'Ergaa Kallattii Hoogganaa fi Bulchaa',
                      ti: 'ቀጥታ መልእኽቲ ዋና ኣመሓዳርን ማናጀርን',
                      sid: 'Aliyye Massagaanchunna Massagaanchu Sokka',
                      fr: 'Boîte de réception Direction & Gérant',
                      de: 'Direktpostfach Direktion & Management',
                      it: 'Posta Diretta Direzione & Manager',
                      zh: '总经理与经理直达收件箱',
                      ar: 'صندوق رسائل الإدارة العامة والمدير',
                    })
                  : tText({
                      am: 'የማናጀር ቀጥታ መልዕክቶች (Guest Escalations)',
                      en: 'Manager Direct Messages (Guest Escalations)',
                      or: 'Ergaa Kallattii Hoogganaa',
                      ti: 'ቀጥታ መልእኽቲ ማናጀር',
                      sid: 'Massagaanchu Sokka',
                      fr: 'Messages Directs Gérant',
                      de: 'Direktnachrichten Manager',
                      it: 'Messaggi Diretti Manager',
                      zh: '经理直达消息（宾客反馈）',
                      ar: 'رسائل المدير المباشرة',
                    })}
              </span>
            </h3>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black border ${
              pendingCount > 0
                ? 'bg-red-600/20 text-red-300 border-red-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {pendingCount > 0
              ? tText({ am: '{c} አዲስ መልዕክት (PENDING)', en: '{c} Pending', or: '{c} Haaraa', ti: '{c} ሓድሽ', sid: '{c} Haaro', fr: '{c} En attente', de: '{c} Offen', it: '{c} In attesa', zh: '{c} 条待处理', ar: '{c} قيد الانتظار' }, { c: pendingCount })
              : tText({ am: '{c} ጠቅላላ መልዕክቶች', en: '{c} Messages', or: '{c} Ergaa', ti: '{c} መልእኽቲ', sid: '{c} Sokka', fr: '{c} Messages', de: '{c} Nachrichten', it: '{c} Messaggi', zh: '共 {c} 条', ar: '{c} رسائل' }, { c: relevantMessages.length })}
          </span>
        </div>

        {relevantMessages.length === 0 ? (
          <div className="py-12 text-center text-white/40 text-xs font-mono border border-dashed border-white/10 rounded-xl">
            📩 {tText({
              am: 'እስካሁን ከእንግዶች የተላከ ቀጥታ መልዕክት የለም።',
              en: 'No guest direct messages yet.',
              or: 'Ergaan keessummootaa hin jiru.',
              ti: 'ክሳብ ሕጂ ዝተላእከ መልእኽቲ የለን።',
              sid: 'Wosinootunni sokkino sokka dino.',
              fr: 'Aucun message client pour le moment.',
              de: 'Noch keine Gästenachrichten.',
              it: 'Nessun messaggio dagli ospiti.',
              zh: '暂无宾客消息。',
              ar: 'لا توجد رسائل من الضيوف حتى الآن.',
            })}
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {relevantMessages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl p-4 border space-y-3 ${
                  m.status === 'Pending'
                    ? 'bg-red-950/25 border-yellow-400/50'
                    : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-yellow-400 text-black font-black text-[10px] font-mono">
                      📍 {m.location}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold">
                      {m.target === 'manager'
                        ? tText({
                            am: '👑 ለማናጀር',
                            or: '👑 Hojii Gaggeessaaf',
                            ti: '👑 ንማናጀር',
                            sid: '👑 Maanejeraho',
                            en: '👑 To Manager',
                            fr: '👑 Au Manager',
                            de: '👑 An Manager',
                            it: '👑 Al Manager',
                            zh: '👑 致经理',
                            ar: '👑 للمدير',
                          })
                        : m.target === 'admin'
                          ? tText({
                              am: '👔 ለስራ አስኪያጅ',
                              or: '👔 Hogganaa Ol-aanaaf',
                              ti: '👔 ንዋና መካየዲ',
                              sid: '👔 Qaruwa Maanejeraho',
                              en: '👔 To General Manager',
                              fr: '👔 Au Directeur Général',
                              de: '👔 An Geschäftsführung',
                              it: '👔 Al Direttore Generale',
                              zh: '👔 致总经理',
                              ar: '👔 للمدير العام',
                            })
                          : m.target === 'support'
                            ? tText({
                                am: '🎧 ለSupport ቡድን',
                                or: '🎧 Garee Deeggarsaaf',
                                ti: '🎧 ንጉጅለ ደገፍ',
                                sid: '🎧 Irkoote Gaamora',
                                en: '🎧 To Support Team',
                                fr: '🎧 À l’équipe Support',
                                de: '🎧 An Support-Team',
                                it: '🎧 Al Team Supporto',
                                zh: '🎧 致客服团队',
                                ar: '🎧 لفريق الدعم',
                              })
                            : tText({
                                am: '👥 ለሁሉም',
                                or: '👥 Hundaaf',
                                ti: '👥 ንኹሎም',
                                sid: '👥 Baalaho',
                                en: '👥 To All',
                                fr: '👥 À tous',
                                de: '👥 An alle',
                                it: '👥 A tutti',
                                zh: '👥 致所有人',
                                ar: '👥 للجميع',
                              })}
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">
                      {m.topic}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50">
                    {m.date} {m.time}
                  </span>
                </div>

                {(m.senderName || m.senderPhone) && (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/80">
                    {m.senderName && (
                      <span>
                        👤 <strong>{m.senderName}</strong>
                      </span>
                    )}
                    {m.senderPhone && (
                      <a
                        href={`tel:${m.senderPhone}`}
                        className="text-emerald-400 hover:underline font-mono font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> {m.senderPhone}
                      </a>
                    )}
                  </div>
                )}

                <p className="text-xs text-white font-semibold bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed">
                  {m.message}
                </p>

                {m.reply && (
                  <div className="bg-emerald-950/40 border-l-2 border-emerald-400 p-2.5 rounded-r-lg text-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-emerald-300 font-bold">
                      <span>
                        ✔{' '}
                        {tText(
                          {
                            am: 'የተሰጠ ምላሽ ({staff})',
                            or: 'Deebii kenname ({staff})',
                            ti: 'ዝተዋህበ መልሲ ({staff})',
                            sid: 'Qolantino dawaro ({staff})',
                            en: 'Reply sent ({staff})',
                            fr: 'Réponse envoyée ({staff})',
                            de: 'Antwort gesendet ({staff})',
                            it: 'Risposta inviata ({staff})',
                            zh: '已回复 ({staff})',
                            ar: 'تم الرد ({staff})',
                          },
                          { staff: m.repliedBy || currentStaffName }
                        )}
                      </span>
                      <span>{m.replyTime}</span>
                    </div>
                    <p className="text-emerald-100">{m.reply}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={replyDrafts[m.id] ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                    placeholder={tText({
                      am: 'ለእንግዳው ቀጥታ ምላሽ እዚህ ይጻፉ...',
                      or: 'Deebii kallattii keessummaaf asitti barreessaa...',
                      ti: 'ንጋሻ ቀጥታ መልሲ ኣብዚ ጽሓፉ...',
                      sid: 'Wosinchaho soore dawaro kawiichonni borreessi...',
                      en: 'Write a direct reply to the guest here...',
                      fr: 'Écrivez une réponse directe au client ici...',
                      de: 'Direkte Antwort an den Gast hier eingeben...',
                      it: "Scrivi qui una risposta diretta all'ospite...",
                      zh: '在此输入给客人的直接回复...',
                      ar: 'اكتب رداً مباشراً للضيف هنا...',
                    })}
                    className="flex-1 bg-[#181818] border border-white/15 focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const txt = (replyDrafts[m.id] || '').trim();
                        if (!txt) return;
                        onReplyMessage(m.id, txt, currentStaffName);
                        setReplyDrafts((prev) => ({ ...prev, [m.id]: '' }));
                      }}
                      className="px-3 py-2 rounded-lg bg-yellow-400 hover:bg-white text-black font-black text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>
                        {tText({
                          am: 'መልስ ላክ',
                          or: 'Deebii Ergi',
                          ti: 'መልሲ ልኣኽ',
                          sid: 'Dawaro Soyi',
                          en: 'Send Reply',
                          fr: 'Envoyer',
                          de: 'Antwort senden',
                          it: 'Invia risposta',
                          zh: '发送回复',
                          ar: 'إرسال الرد',
                        })}
                      </span>
                    </button>
                    {m.status !== 'Resolved' && (
                      <button
                        type="button"
                        onClick={() => onResolveMessage(m.id)}
                        className="px-2.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        title={tText({
                          am: 'ተፈቷል ብለህ ምልክት አድርግ',
                          or: 'Furmata argate jedhi',
                          ti: 'ተፈቲሑ ኢልካ ምልክት ግበር',
                          sid: 'Tiramino yaate malaatisi',
                          en: 'Mark Resolved',
                          fr: 'Marquer comme résolu',
                          de: 'Als erledigt markieren',
                          it: 'Segna come risolto',
                          zh: '标记为已解决',
                          ar: 'تحديد كمحلول',
                        })}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {tText({
                            am: 'ተፈቷል',
                            or: 'Furmameera',
                            ti: 'ተፈቲሑ',
                            sid: 'Tiramino',
                            en: 'Resolved',
                            fr: 'Résolu',
                            de: 'Gelöst',
                            it: 'Risolto',
                            zh: '已解决',
                            ar: 'تم الحل',
                          })}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteMessage(m.id)}
                      className="p-2 rounded-lg bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/25 cursor-pointer"
                      title={tText({
                        am: 'መልዕክቱን ሰርዝ',
                        or: 'Ergaa haqi',
                        ti: 'መልእኽቲ ደምስስ',
                        sid: 'Sokkaa huni',
                        en: 'Delete message',
                        fr: 'Supprimer le message',
                        de: 'Nachricht löschen',
                        it: 'Elimina messaggio',
                        zh: '删除消息',
                        ar: 'حذف الرسالة',
                      })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Configurable Direct Message Directory */}
      <div className="lg:col-span-5 bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl h-fit">
        <div className="border-b border-white/10 pb-3">
          <span className="text-[10px] font-mono font-black uppercase text-red-400 block">
            {tText({
              am: 'የአመራር አድራሻ (መልዕክት ብቻ)',
              or: 'TARREEFFAMA HOGGANSAA (ERGAA QOFA)',
              ti: 'መዝገብ ኣመራርሓ (መልእኽቲ ጥራይ)',
              sid: 'MASSAGAANO SUUMO (SOKKAA CALLA)',
              en: 'LEADERSHIP DIRECTORY (MESSAGE ONLY)',
              fr: 'ANNUAIRE DIRECTION (MESSAGE UNIQUEMENT)',
              de: 'LEITUNGSVERZEICHNIS (NUR NACHRICHT)',
              it: 'ELENCO DIREZIONE (SOLO MESSAGGI)',
              zh: '管理层目录（仅限消息）',
              ar: 'دليل الإدارة (رسائل فقط)',
            })}
          </span>
          <h3 className="text-sm font-black text-white uppercase mt-0.5">
            {tText({
              am: '👔 የማናጀር፣ የስራ አስኪያጅ እና የድጋፍ ቡድን መረጃ ማስተካከያ',
              or: '👔 Odeeffannoo Maanejerii, Hogganaa fi Garee Deeggarsaa Sirreessuu',
              ti: '👔 ሓበሬታ ማናጀር፣ ዋና መካየዲን ጉጅለ ደገፍን ምምዕርራይ',
              sid: '👔 Maanejera, Qaruwa Maanejerinna Irkoote Gaamo Mashalaqqe Biddishi',
              en: '👔 Manager, GM & Support Team Directory Settings',
              fr: '👔 Paramètres Manager, DG & Équipe Support',
              de: '👔 Manager-, Geschäftsführungs- & Support-Einstellungen',
              it: '👔 Impostazioni Manager, DG & Team Supporto',
              zh: '👔 经理、总经理与客服团队联系设置',
              ar: '👔 إعدادات المدير والمدير العام وفريق الدعم',
            })}
          </h3>
          <p className="text-[11px] text-stone-400 mt-1">
            {tText({
              am: 'እንግዶች ያለ ስልክ እና ሶሻል ሚዲያ በቀጥታ መልዕክት ማስቀመጥ እንዲችሉ ስማቸውን እና የስራ ሁኔታቸውን እዚህ ያስተካክሉ።',
              or: 'Keessummoonni bilbilaa fi miidiyaa hawaasaa malee ergaa kallattii akka kaa’an maqaa fi haala hojii isaanii asitti sirreessaa.',
              ti: 'ኣጋይሽ ብዘይ ስልክን ማሕበራዊ ሚድያን ቀጥታ መልእኽቲ ከቐምጡ ሽሞምን ኩነታት ስርሖምን ኣብዚ ኣስተኻኽሉ።',
              sid: 'Wosinchu bilbilanna sooshaale miidiyaa nookkiha soore sokkaa worra dandaanno gede suumansanna loosu garaachansa kawiicho biddishi.',
              en: 'Configure names and on-duty availability here so guests can leave direct messages without phone or social links.',
              fr: 'Configurez les noms et disponibilités ici pour que les clients laissent des messages directs sans téléphone ni réseaux.',
              de: 'Namen und Verfügbarkeit hier festlegen, damit Gäste direkte Nachrichten ohne Telefon oder Social Media senden können.',
              it: 'Configura nomi e disponibilità qui per consentire agli ospiti di inviare messaggi diretti senza telefono o social.',
              zh: '在此设置姓名和值班状态，以便客人无需电话或社交媒体即可直接留言。',
              ar: 'اضبط الأسماء وحالة التواجد هنا ليتمكن الضيوف من ترك رسائل مباشرة دون هاتف أو وسائل تواصل.',
            })}
          </p>
        </div>

        {savedNotice && (
          <div className="bg-emerald-950/60 border border-emerald-400/50 text-emerald-200 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {tText({
                am: '✅ የማናጀር እና የስራ አስኪያጅ መረጃ ተቀምጧል!',
                or: '✅ Odeeffannoon Maanejerii fi Hogganaa olkaa’ameera!',
                ti: '✅ ሓበሬታ ማናጀርን ዋና መካየድን ተዓቂቡ ኣሎ!',
                sid: '✅ Maanejerunna Qaruwa Maanejerihu mashalaqqe suuqantino!',
                en: '✅ Leadership directory contacts saved!',
                fr: '✅ Coordonnées de la direction enregistrées !',
                de: '✅ Leitungsverzeichnis gespeichert!',
                it: '✅ Contatti della direzione salvati!',
                zh: '✅ 管理层联系信息已保存！',
                ar: '✅ تم حفظ بيانات دليل الإدارة!',
              })}
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Manager Fields (Message Inbox Only) */}
          <div className="bg-black/40 border border-yellow-400/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-yellow-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />{' '}
                {tText({
                  am: 'ማናጀር (Operations Manager — መልዕክት ብቻ)',
                  or: 'Maanejerii (Operations Manager — Ergaa Qofa)',
                  ti: 'ማናጀር (Operations Manager — መልእኽቲ ጥራይ)',
                  sid: 'Maanejera (Operations Manager — Sokkaa Calla)',
                  en: 'Operations Manager (Message Only)',
                  fr: 'Directeur des Opérations (Message uniquement)',
                  de: 'Betriebsleiter (Nur Nachricht)',
                  it: 'Operations Manager (Solo messaggi)',
                  zh: '运营经理（仅限消息）',
                  ar: 'مدير العمليات (رسائل فقط)',
                })}
              </span>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftContacts.managerAvailable !== false}
                  onChange={(e) =>
                    setDraftContacts((prev) => ({
                      ...prev,
                      managerAvailable: e.target.checked,
                    }))
                  }
                />
                <span>
                  {tText({
                    am: 'በስራ ላይ',
                    or: 'Hojii irra',
                    ti: 'ኣብ ስራሕ',
                    sid: 'Loosu aana',
                    en: 'On Duty',
                    fr: 'En service',
                    de: 'Im Dienst',
                    it: 'In servizio',
                    zh: '值班中',
                    ar: 'على رأس العمل',
                  })}
                </span>
              </label>
            </div>
            <input
              type="text"
              value={draftContacts.managerName}
              onChange={(e) =>
                setDraftContacts((prev) => ({ ...prev, managerName: e.target.value }))
              }
              placeholder={tText({
                am: 'የማናጀር ስም',
                or: 'Maqaa Maanejerii',
                ti: 'ሽም ማናጀር',
                sid: 'Maanejerihu suumo',
                en: 'Manager Name',
                fr: 'Nom du Manager',
                de: 'Name des Managers',
                it: 'Nome del Manager',
                zh: '经理姓名',
                ar: 'اسم المدير',
              })}
              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
            />
            <p className="text-[10px] text-yellow-200/70">
              {tText({
                am: '📩 እንግዶች ለማናጀሩ በቀጥታ መልዕክት ማስቀመጥ ይችላሉ (ያለ ስልክ እና ሶሻል ሚዲያ)።',
                or: '📩 Keessummoonni bilbilaa fi miidiyaa malee maanejerichaaf kallattiin ergaa kaa’uu danda’u.',
                ti: '📩 ኣጋይሽ ብዘይ ስልክን ማሕበራዊ ሚድያን ንማናጀር ቀጥታ መልእኽቲ ከቐምጡ ይኽእሉ።',
                sid: '📩 Wosinchu bilbilanna sooshaale nookkiha maanejeraho soore sokkaa worra dandaanno.',
                en: '📩 Guests can leave direct messages for the Manager (without phone or social media).',
                fr: '📩 Les clients peuvent laisser des messages directs au Manager (sans téléphone ni réseaux).',
                de: '📩 Gäste können dem Manager direkte Nachrichten hinterlassen (ohne Telefon oder Social Media).',
                it: '📩 Gli ospiti possono lasciare messaggi diretti al Manager (senza telefono o social).',
                zh: '📩 客人可直接向经理留言（无需电话或社交媒体）。',
                ar: '📩 يمكن للضيوف ترك رسائل مباشرة للمدير (بدون هاتف أو تواصل اجتماعي).',
              })}
            </p>
          </div>

          {/* General Manager Fields (Message Inbox Only) */}
          <div className="bg-black/40 border border-red-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />{' '}
                {tText({
                  am: 'ዋና ስራ አስኪያጅ (General Manager — መልዕክት ብቻ)',
                  or: 'Hogganaa Ol-aanaa (General Manager — Ergaa Qofa)',
                  ti: 'ዋና መካየዲ ስራሕ (General Manager — መልእኽቲ ጥራይ)',
                  sid: 'Qaruwa Maanejera (General Manager — Sokkaa Calla)',
                  en: 'General Manager (Message Only)',
                  fr: 'Directeur Général (Message uniquement)',
                  de: 'Geschäftsführer (Nur Nachricht)',
                  it: 'Direttore Generale (Solo messaggi)',
                  zh: '总经理（仅限消息）',
                  ar: 'المدير العام (رسائل فقط)',
                })}
              </span>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftContacts.gmAvailable !== false}
                  onChange={(e) =>
                    setDraftContacts((prev) => ({
                      ...prev,
                      gmAvailable: e.target.checked,
                    }))
                  }
                />
                <span>
                  {tText({
                    am: 'በስራ ላይ',
                    or: 'Hojii irra',
                    ti: 'ኣብ ስራሕ',
                    sid: 'Loosu aana',
                    en: 'On Duty',
                    fr: 'En service',
                    de: 'Im Dienst',
                    it: 'In servizio',
                    zh: '值班中',
                    ar: 'على رأس العمل',
                  })}
                </span>
              </label>
            </div>
            <input
              type="text"
              value={draftContacts.gmName}
              onChange={(e) =>
                setDraftContacts((prev) => ({ ...prev, gmName: e.target.value }))
              }
              placeholder={tText({
                am: 'የስራ አስኪያጅ ስም',
                or: 'Maqaa Hogganaa Ol-aanaa',
                ti: 'ሽም ዋና መካየዲ',
                sid: 'Qaruwa Maanejerihu suumo',
                en: 'General Manager Name',
                fr: 'Nom du Directeur Général',
                de: 'Name des Geschäftsführers',
                it: 'Nome del Direttore Generale',
                zh: '总经理姓名',
                ar: 'اسم المدير العام',
              })}
              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-400"
            />
            <p className="text-[10px] text-red-200/70">
              {tText({
                am: '📩 እንግዶች ለዋና ስራ አስኪያጁ በቀጥታ መልዕክት ማስቀመጥ ይችላሉ (ያለ ስልክ እና ሶሻል ሚዲያ)።',
                or: '📩 Keessummoonni bilbilaa fi miidiyaa malee hogganaa ol-aanaaf kallattiin ergaa kaa’uu danda’u.',
                ti: '📩 ኣጋይሽ ብዘይ ስልክን ማሕበራዊ ሚድያን ንዋና መካየዲ ቀጥታ መልእኽቲ ከቐምጡ ይኽእሉ።',
                sid: '📩 Wosinchu bilbilanna sooshaale nookkiha qaruwa maanejeraho soore sokkaa worra dandaanno.',
                en: '📩 Guests can leave direct messages for the General Manager (without phone or social media).',
                fr: '📩 Les clients peuvent laisser des messages directs au Directeur Général (sans téléphone ni réseaux).',
                de: '📩 Gäste können dem Geschäftsführer direkte Nachrichten hinterlassen (ohne Telefon oder Social Media).',
                it: '📩 Gli ospiti possono lasciare messaggi diretti al Direttore Generale (senza telefono o social).',
                zh: '📩 客人可直接向总经理留言（无需电话或社交媒体）。',
                ar: '📩 يمكن للضيوف ترك رسائل مباشرة للمدير العام (بدون هاتف أو تواصل اجتماعي).',
              })}
            </p>
          </div>

          {/* Support Team Fields (Message Inbox Only) */}
          <div className="bg-black/40 border border-cyan-400/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                {tText({
                  am: '🎧 የድጋፍ ቡድን (Support Team 24/7 — መልዕክት ብቻ)',
                  or: '🎧 Garee Deeggarsaa (Support Team 24/7 — Ergaa Qofa)',
                  ti: '🎧 ጉጅለ ደገፍ (Support Team 24/7 — መልእኽቲ ጥራይ)',
                  sid: '🎧 Irkoote Gaamo (Support Team 24/7 — Sokkaa Calla)',
                  en: '🎧 Support Team 24/7 (Message Only)',
                  fr: '🎧 Équipe Support 24/7 (Message uniquement)',
                  de: '🎧 Support-Team 24/7 (Nur Nachricht)',
                  it: '🎧 Team Supporto 24/7 (Solo messaggi)',
                  zh: '🎧 24/7 客服团队（仅限消息）',
                  ar: '🎧 فريق الدعم 24/7 (رسائل فقط)',
                })}
              </span>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftContacts.supportAvailable !== false}
                  onChange={(e) =>
                    setDraftContacts((prev) => ({
                      ...prev,
                      supportAvailable: e.target.checked,
                    }))
                  }
                />
                <span>
                  {tText({
                    am: 'በስራ ላይ',
                    or: 'Hojii irra',
                    ti: 'ኣብ ስራሕ',
                    sid: 'Loosu aana',
                    en: 'On Duty',
                    fr: 'En service',
                    de: 'Im Dienst',
                    it: 'In servizio',
                    zh: '值班中',
                    ar: 'على رأس العمل',
                  })}
                </span>
              </label>
            </div>
            <input
              type="text"
              value={draftContacts.supportName}
              onChange={(e) =>
                setDraftContacts((prev) => ({ ...prev, supportName: e.target.value }))
              }
              placeholder={tText({
                am: 'የድጋፍ ቡድን ስም',
                or: 'Maqaa Garee Deeggarsaa',
                ti: 'ሽም ጉጅለ ደገፍ',
                sid: 'Irkoote Gaamo suumo',
                en: 'Support Team Name',
                fr: "Nom de l'équipe Support",
                de: 'Name des Support-Teams',
                it: 'Nome del Team Supporto',
                zh: '客服团队名称',
                ar: 'اسم فريق الدعم',
              })}
              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-cyan-200/70">
              {tText({
                am: '📩 እንግዶች ለድጋፍ ቡድኑ በቀጥታ መልዕክት ማስቀመጥ ይችላሉ (ያለ ስልክ እና ሶሻል ሚዲያ)።',
                or: '📩 Keessummoonni bilbilaa fi miidiyaa malee garee deeggarsaaf kallattiin ergaa kaa’uu danda’u.',
                ti: '📩 ኣጋይሽ ብዘይ ስልክን ማሕበራዊ ሚድያን ንጉጅለ ደገፍ ቀጥታ መልእኽቲ ከቐምጡ ይኽእሉ።',
                sid: '📩 Wosinchu bilbilanna sooshaale nookkiha irkoote gaamora soore sokkaa worra dandaanno.',
                en: '📩 Guests can leave direct messages for the Support Team (without phone or social media).',
                fr: "📩 Les clients peuvent laisser des messages directs à l'équipe Support (sans téléphone ni réseaux).",
                de: '📩 Gäste können dem Support-Team direkte Nachrichten hinterlassen (ohne Telefon oder Social Media).',
                it: '📩 Gli ospiti possono lasciare messaggi diretti al Team Supporto (senza telefono o social).',
                zh: '📩 客人可直接向客服团队留言（无需电话或社交媒体）。',
                ar: '📩 يمكن للضيوف ترك رسائل مباشرة لفريق الدعم (بدون هاتف أو تواصل اجتماعي).',
              })}
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#C1FF00] hover:bg-white text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <Save className="w-4 h-4" />
            <span>
              {tText({
                am: 'የመገናኛ መረጃ አስቀምጥ',
                or: 'Odeeffannoo Quunnamtii Olkaa’i',
                ti: 'ሓበሬታ መራኸቢ ዓቅብ',
                sid: 'Xaadooshshu Mashalaqqe Suuqi',
                en: 'Save Leadership Contacts',
                fr: 'Enregistrer les contacts',
                de: 'Kontakte speichern',
                it: 'Salva contatti direzione',
                zh: '保存管理层联系信息',
                ar: 'حفظ بيانات التواصل',
              })}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
