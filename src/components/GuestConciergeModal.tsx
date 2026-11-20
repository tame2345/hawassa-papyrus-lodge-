/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Phone,
  Send,
  UserCheck,
  X,
  CheckCircle2,
  Crown,
  Briefcase,
  MapPin,
} from 'lucide-react';
import type {
  AssistanceCall,
  LeadershipContacts,
  LeadershipMessage,
  StaffMember,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import type { LangDict } from '../i18n/translations';

interface GuestConciergeModalProps {
  isOpen: boolean;
  initialTab: 'waiter' | 'leadership';
  onClose: () => void;
  appLang: string;
  guestLocation: string;
  onChangeGuestLocation: (loc: string) => void;
  assignedWaiterName: string;
  assignedWaiterStaff?: StaffMember;
  activeLocationCalls: AssistanceCall[];
  onSendWaiterCall: (payload: {
    location: string;
    reason: string;
    message: string;
    targetWaiter?: string;
  }) => void;
  onCancelWaiterCall: (id: string) => void;
  leadershipContacts: LeadershipContacts;
  leadershipMessages: LeadershipMessage[];
  onSendLeadershipMessage: (payload: {
    target: 'manager' | 'admin' | 'support' | 'both';
    location: string;
    senderName: string;
    senderPhone: string;
    topic: string;
    message: string;
  }) => void;
}

const QUICK_LOCATIONS = [
  'Table 01',
  'Table 02',
  'Table 03',
  'Table 04',
  'Table 05',
  'Room 101',
  'Room 102',
  'Room 103',
  'Room 104',
  'Room 105',
];

const WAITER_REASONS: Array<{ id: string; icon: string; labels: LangDict }> = [
  {
    id: 'service',
    icon: '🛎️',
    labels: {
      am: 'አስተናጋጅ ይምጣልኝ',
      en: 'Call Waiter Now',
      or: 'Tajaajilaan haa dhufu',
      ti: 'ኣስተናጋጅ ይምጻእኒ',
      sid: 'Soolaancho dayo',
      fr: 'Appeler le serveur',
      de: 'Kellner jetzt rufen',
      it: 'Chiama cameriere ora',
      zh: '立即呼叫服务员',
      ar: 'استدعاء النادل الآن',
    },
  },
  {
    id: 'bill',
    icon: '🧾',
    labels: {
      am: 'ሂሳብ / ቢል አምጣልኝ',
      en: 'Request Bill / Receipt',
      or: 'Herrega / Nagahee naaf fidi',
      ti: 'ሕሳብ / ቢል ኣምጽኣለይ',
      sid: 'Biile / Nagahe abbi',
      fr: 'Demander l\'addition',
      de: 'Rechnung anfordern',
      it: 'Richiedi conto',
      zh: '结账 / 索取账单',
      ar: 'طلب الفاتورة',
    },
  },
  {
    id: 'water',
    icon: '💧',
    labels: {
      am: 'ውሃ / ተጨማሪ ዕቃ',
      en: 'Water / Cutlery / Napkins',
      or: 'Bishaan / Meeshaa dabalataa',
      ti: 'ማይ / ተወሳኺ ኣቕሓ',
      sid: 'Waa / Leddo uduunna',
      fr: 'Eau / Couverts / Serviettes',
      de: 'Wasser / Besteck / Servietten',
      it: 'Acqua / Posate / Tovaglioli',
      zh: '饮用水 / 餐具 / 纸巾',
      ar: 'ماء / أدوات مائدة / مناديل',
    },
  },
  {
    id: 'room_help',
    icon: '🧹',
    labels: {
      am: 'የክፍል ወይም የጠረጴዛ እርዳታ',
      en: 'Room / Table Assistance',
      or: 'Gargaarsa Kutaa ykn Minjaalaa',
      ti: 'ሓገዝ ክፍሊ ወይ ጠረጴዛ',
      sid: 'Kifile woy Minjaalu kaa\'lo',
      fr: 'Assistance Chambre / Table',
      de: 'Zimmer- / Tischhilfe',
      it: 'Assistenza Camera / Tavolo',
      zh: '客房或餐桌协助',
      ar: 'مساعدة الغرفة أو الطاولة',
    },
  },
];

const LEADERSHIP_TOPICS: Array<{ id: string; labels: LangDict }> = [
  {
    id: 'vip',
    labels: {
      am: '✨ ልዩ አገልግሎት / VIP',
      en: '✨ VIP / Special Request',
      or: '✨ Tajaajila Addaa / VIP',
      ti: '✨ ፍሉይ ኣገልግሎት / VIP',
      sid: '✨ Baxxino Taje / VIP',
      fr: '✨ Service VIP / Spécial',
      de: '✨ VIP / Sonderwunsch',
      it: '✨ Richiesta VIP / Speciale',
      zh: '✨ VIP / 特别请求',
      ar: '✨ خدمة VIP / طلب خاص',
    },
  },
  {
    id: 'issue',
    labels: {
      am: '⚠️ ቅሬታ / አፋጣኝ እርዳታ',
      en: '⚠️ Urgent Issue / Feedback',
      or: '⚠️ Komii / Gargaarsa Ariifachiisaa',
      ti: '⚠️ ቅሬታ / ቅልጡፍ ሓገዝ',
      sid: '⚠️ Qarra / Rakkisanno Kaa\'lo',
      fr: '⚠️ Problème urgent / Avis',
      de: '⚠️ Dringendes Anliegen',
      it: '⚠️ Problema urgente / Feedback',
      zh: '⚠️ 紧急问题 / 反馈',
      ar: '⚠️ مشكلة عاجلة / ملاحظة',
    },
  },
  {
    id: 'billing',
    labels: {
      am: '💳 የሂሳብ / የክፍያ ጉዳይ',
      en: '💳 Billing / Payment Inquiry',
      or: '💳 Dhimma Kaffaltii',
      ti: '💳 ጉዳይ ሕሳብ / ክፍሊት',
      sid: '💳 Baatanna / Herrega xa\'mo',
      fr: '💳 Facturation / Paiement',
      de: '💳 Rechnung / Zahlung',
      it: '💳 Fatturazione / Pagamento',
      zh: '💳 账单 / 付款咨询',
      ar: '💳 استفسار الفواتير / الدفع',
    },
  },
  {
    id: 'meeting',
    labels: {
      am: '🤝 ቀጠሮ / ከኃላፊ ጋር መገናኘት',
      en: '🤝 Request In-Person Visit',
      or: '🤝 Hoogganaa Wajjin Wal-arguuf',
      ti: '🤝 ምስ ሓላፊ ምርኻብ',
      sid: '🤝 Massagaanchu ledo xaada',
      fr: '🤝 Rencontrer un responsable',
      de: '🤝 Persönliches Gespräch',
      it: '🤝 Incontro di persona',
      zh: '🤝 预约负责人见面',
      ar: '🤝 طلب مقابلة شخصية',
    },
  },
];

export const GuestConciergeModal: React.FC<GuestConciergeModalProps> = ({
  isOpen,
  initialTab,
  onClose,
  appLang,
  guestLocation,
  onChangeGuestLocation,
  assignedWaiterName,
  assignedWaiterStaff,
  activeLocationCalls: _activeLocationCalls,
  onSendWaiterCall,
  onCancelWaiterCall: _onCancelWaiterCall,
  leadershipContacts,
  leadershipMessages,
  onSendLeadershipMessage,
}) => {
  const { t, tText, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'waiter' | 'leadership'>(initialTab);
  const [selectedReasonId, setSelectedReasonId] = useState<string>(WAITER_REASONS[0].id);
  const [waiterNote, setWaiterNote] = useState('');
  const [waiterSentBanner, setWaiterSentBanner] = useState<string | null>(null);

  const [leaderTarget, setLeaderTarget] = useState<'manager' | 'admin' | 'support' | 'both'>('manager');
  const [leaderTopicId, setLeaderTopicId] = useState<string>(LEADERSHIP_TOPICS[0].id);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [leaderMessageText, setLeaderMessageText] = useState('');
  const [leaderSentBanner, setLeaderSentBanner] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setWaiterSentBanner(null);
      setLeaderSentBanner(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const selectedReasonLabel =
    tText((WAITER_REASONS.find((r) => r.id === selectedReasonId) || WAITER_REASONS[0]).labels);
  const selectedTopicLabel =
    tText((LEADERSHIP_TOPICS.find((tp) => tp.id === leaderTopicId) || LEADERSHIP_TOPICS[0]).labels);

  const handleWaiterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = guestLocation.trim() || 'Room 101';
    const combinedMessage = waiterNote.trim()
      ? `${selectedReasonLabel} — ${waiterNote.trim()}`
      : selectedReasonLabel;

    onSendWaiterCall({
      location: loc,
      reason: selectedReasonLabel,
      message: combinedMessage,
      targetWaiter: assignedWaiterName || undefined,
    });

    setWaiterNote('');
    setWaiterSentBanner(
      assignedWaiterName
        ? tText({
            am: `🔔 ጥሪዎ ለ ${loc} የተመደበው አስተናጋጅ (${assignedWaiterName}) ጋር በቀጥታ ተልኳል!`,
            en: `🔔 Call sent directly to ${assignedWaiterName} (assigned to ${loc})!`,
            or: `🔔 Waamichi keessan gara ${assignedWaiterName} (${loc}) ergameera!`,
            ti: `🔔 ጻውዒትኩም ናብ ${assignedWaiterName} (${loc}) ተላኢኹ!`,
            sid: `🔔 Wixaakki ${assignedWaiterName} (${loc}) ra soyamino!`,
            fr: `🔔 Appel envoyé directement à ${assignedWaiterName} (${loc}) !`,
            de: `🔔 Ruf direkt an ${assignedWaiterName} (${loc}) gesendet!`,
            it: `🔔 Chiamata inviata a ${assignedWaiterName} (${loc})!`,
            zh: `🔔 呼叫已直接发送给负责 ${loc} 的服务员 ${assignedWaiterName}！`,
            ar: `🔔 تم إرسال الطلب مباشرة إلى ${assignedWaiterName} (${loc})!`,
          })
        : tText({
            am: `🔔 የ ${loc} ጥሪ ለበስራ ላይ ያሉ አስተናጋጆች በሙሉ ተልኳል!`,
            en: `🔔 Assistance call sent for ${loc}!`,
            or: `🔔 Waamichi gargaarsaa ${loc} tiif ergameera!`,
            ti: `🔔 ናይ ${loc} ሓገዝ ጻውዒት ተላኢኹ!`,
            sid: `🔔 ${loc} rira kaa'lote wixa soyamino!`,
            fr: `🔔 Demande d'assistance envoyée pour ${loc} !`,
            de: `🔔 Service-Ruf für ${loc} gesendet!`,
            it: `🔔 Richiesta inviata per ${loc}!`,
            zh: `🔔 已为 ${loc} 发送服务呼叫！`,
            ar: `🔔 تم إرسال نداء المساعدة إلى ${loc}!`,
          }),
    );
  };

  const handleLeadershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderMessageText.trim()) return;
    const loc = guestLocation.trim() || 'Room 101';

    onSendLeadershipMessage({
      target: leaderTarget,
      location: loc,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      topic: selectedTopicLabel,
      message: leaderMessageText.trim(),
    });

    setLeaderMessageText('');
    setLeaderSentBanner(
      tText({
        am: '✅ መልዕክትዎ በቀጥታ ለማናጀር / ስራ አስኪያጅ ተልኳል። ምላሽ ሲሰጥ እዚሁ ላይ ይታያል!',
        en: '✅ Your message has been delivered to management. Replies appear live below.',
        or: '✅ Ergaan keessan hooggantootaaf ergameera. Deebiin asitti mul\'ata.',
        ti: '✅ መልእኽትኹም ናብ ኣመሓዳሪ ተላኢኹ። መልሲ ኣብዚ ክረአ እዩ።',
        sid: '✅ Sokkaakki massagaanchu iillino. Dawaro konne leellanno.',
        fr: '✅ Votre message a été transmis à la direction. Les réponses apparaîtront ci-dessous.',
        de: '✅ Ihre Nachricht wurde an die Leitung gesendet. Antworten erscheinen hier.',
        it: '✅ Messaggio inviato alla direzione. Le risposte appariranno qui.',
        zh: '✅ 您的消息已发送至管理层，回复将实时显示在下方。',
        ar: '✅ تم إرسال رسالتك إلى الإدارة. ستظهر الردود أدناه مباشرة.',
      }),
    );
  };

  const myLeadershipThread = leadershipMessages.filter(
    (m) =>
      m.location.trim().toLowerCase() === (guestLocation || '').trim().toLowerCase(),
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-[#5C0A0A]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="w-full max-w-2xl bg-[#991B1B] border-2 border-[#f4c22b] rounded-3xl shadow-[0_24px_70px_rgba(92,10,10,0.65)] overflow-hidden text-white my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8c1414] via-[#b21f1f] to-[#7a1010] px-5 py-4 border-b border-yellow-400/50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-[#f4c22b] text-red-950 flex items-center justify-center shadow-md shrink-0">
                {activeTab === 'waiter' ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <Briefcase className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  {activeTab === 'waiter'
                    ? tText({
                        am: 'የተመደበ አስተናጋጅ መጥሪያ',
                        en: 'Call Assigned Table / Room Waiter',
                        or: 'Tajaajilaa Ramadame Waami',
                        ti: 'ዝተመደበ ኣስተናጋጅ መጸውዒ',
                        sid: 'Dooramino Soolaancho Wixa',
                        fr: 'Appeler votre serveur assigné',
                        de: 'Zugewiesenen Kellner rufen',
                        it: 'Chiama cameriere assegnato',
                        zh: '呼叫专属服务员',
                        ar: 'استدعاء النادل المخصص',
                      })
                    : t('menu.contact_leadership')}
                </h3>
                <p className="text-[11px] text-yellow-200 font-semibold">
                  {tText({
                    am: `አሁን ያሉበት ቦታ፡ ${guestLocation || 'Room 101'}`,
                    en: `Current location: ${guestLocation || 'Room 101'}`,
                    or: `Bakka ammaa: ${guestLocation || 'Room 101'}`,
                    ti: `ዘለኹምዎ ቦታ፡ ${guestLocation || 'Room 101'}`,
                    sid: `Xaa bayicho: ${guestLocation || 'Room 101'}`,
                    fr: `Emplacement actuel : ${guestLocation || 'Room 101'}`,
                    de: `Aktueller Ort: ${guestLocation || 'Room 101'}`,
                    it: `Posizione attuale: ${guestLocation || 'Room 101'}`,
                    zh: `当前位置：${guestLocation || 'Room 101'}`,
                    ar: `الموقع الحالي: ${guestLocation || 'Room 101'}`,
                  })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-xl bg-[#7A1212] hover:bg-[#B21F1F] text-white flex items-center justify-center border border-[#F4C22B]/45 cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-[#8C1414] border-b border-[#F4C22B]/35 shrink-0">
            <button
              type="button"
              id="btn-concierge-tab-waiter"
              onClick={() => setActiveTab('waiter')}
              className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                activeTab === 'waiter'
                  ? 'bg-gradient-to-r from-[#b21f1f] to-red-700 text-[#f4c22b] border-[#f4c22b] shadow-lg'
                  : 'bg-[#7A1212] text-white/85 border-[#F4C22B]/30 hover:bg-[#B21F1F] hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{t('menu.call_waiter')}</span>
            </button>
            <button
              type="button"
              id="btn-concierge-tab-leadership"
              onClick={() => setActiveTab('leadership')}
              className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                activeTab === 'leadership'
                  ? 'bg-gradient-to-r from-[#f4c22b] to-amber-400 text-stone-950 border-white shadow-lg'
                  : 'bg-[#7A1212] text-white/85 border-[#F4C22B]/30 hover:bg-[#B21F1F] hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>{t('menu.contact_leadership')}</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-left">
            {/* Location Bar (Shared across both tabs) */}
            <div className="bg-[#7A1212] border border-[#F4C22B]/40 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-[#F4C22B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-yellow-200" />
                  <span>
                    {tText({
                      am: 'የጠረጴዛ ወይም የክፍል ቁጥርዎን ያረጋግጡ (Table / Room):',
                      en: 'Confirm your Table or Room number:',
                      or: 'Lakkoofsa Minjaalaa ykn Kutaa mirkaneessaa:',
                      ti: 'ቁጽሪ ጠረጴዛ ወይ ክፍሊ ኣረጋግጹ:',
                      sid: 'Minjaalu woy Kifilu Kiiro Buuxxi:',
                      fr: 'Confirmez votre numéro de table ou chambre :',
                      de: 'Tisch- oder Zimmernummer bestätigen:',
                      it: 'Conferma numero di tavolo o camera:',
                      zh: '请确认您的桌号或房号：',
                      ar: 'أكد رقم الطاولة أو الغرفة:',
                    })}
                  </span>
                </label>
                <input
                  type="text"
                  value={guestLocation}
                  onChange={(e) => onChangeGuestLocation(e.target.value)}
                  placeholder="Table 05 / Room 101"
                  className="bg-white border-2 border-[#F4C22B] text-stone-900 text-xs font-black px-3 py-1.5 rounded-xl outline-none w-full sm:w-44"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => onChangeGuestLocation(loc)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      guestLocation.trim().toLowerCase() === loc.toLowerCase()
                        ? 'bg-[#f4c22b] text-stone-950 border-white font-black'
                        : 'bg-[#8C1414] text-white/90 border-[#F4C22B]/30 hover:bg-[#B21F1F] hover:text-white'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'waiter' ? (
              <div className="space-y-4">
                {/* Assigned Waiter Highlight Card */}
                <div className="rounded-2xl p-4 border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#7A1212] border-[#f4c22b]">
                  <div className="flex items-center gap-3">
                    {assignedWaiterStaff?.photo ? (
                      <img
                        src={assignedWaiterStaff.photo}
                        alt={assignedWaiterName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-yellow-400"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shrink-0">
                        <UserCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase text-yellow-400 block">
                        {assignedWaiterName
                          ? `${t('menu.assigned_waiter_prefix')} ${guestLocation}`
                          : `${guestLocation}`}
                      </span>
                      <p className="text-sm sm:text-base font-black text-white mt-0.5">
                        {assignedWaiterName
                          ? assignedWaiterName
                          : t('menu.waiter_ready')}
                      </p>
                      <p className="text-[11px] text-white/70 mt-0.5">
                        {t('menu.waiter_bar_help')}
                      </p>
                    </div>
                  </div>

                  {assignedWaiterStaff?.phone && (
                    <a
                      href={`tel:${assignedWaiterStaff.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{assignedWaiterStaff.phone}</span>
                    </a>
                  )}
                </div>

                {waiterSentBanner && (
                  <div className="bg-[#065F46] border border-[#6EE7B7] text-white rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FDE68A] shrink-0" />
                    <span>{waiterSentBanner}</span>
                  </div>
                )}

                {/* Call Reason & Send Form */}
                <form onSubmit={handleWaiterSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#FDE68A] block mb-2">
                      {tText({
                        am: 'የጥሪው ምክንያት ይምረጡ:',
                        en: 'Select reason for calling:',
                        or: 'Sababa waamichaa filadhaa:',
                        ti: 'ምኽንያት ጻውዒት ምረጹ:',
                        sid: 'Wixu korkaata doori:',
                        fr: 'Sélectionnez le motif :',
                        de: 'Grund auswählen:',
                        it: 'Seleziona il motivo:',
                        zh: '请选择呼叫原因：',
                        ar: 'اختر سبب الاستدعاء:',
                      })}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {WAITER_REASONS.map((reason) => {
                        const label = tText(reason.labels);
                        const isSelected = selectedReasonId === reason.id;
                        return (
                          <button
                            key={reason.id}
                            type="button"
                            onClick={() => setSelectedReasonId(reason.id)}
                            className={`p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#F4C22B] text-[#1C1917] border-white shadow-md'
                                : 'bg-[#7A1212] text-white border-[#F4C22B]/35 hover:bg-[#B21F1F]'
                            }`}
                          >
                            <span className="text-base">{reason.icon}</span>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#FDE68A] block mb-1.5">
                      {tText({
                        am: 'ተጨማሪ ማስታወሻ (አማራጭ)፦',
                        en: 'Optional note for your waiter:',
                        or: 'Yaada dabalataa (dirqama miti):',
                        ti: 'ተወሳኺ መዘኻኸሪ (ኣማራጺ)፦',
                        sid: 'Leddo qaago:',
                        fr: 'Note optionnelle pour le serveur :',
                        de: 'Optionale Notiz für den Kellner:',
                        it: 'Nota facoltativa per il cameriere:',
                        zh: '给服务员的备注（可选）：',
                        ar: 'ملاحظة اختيارية للنادل:',
                      })}
                    </label>
                    <input
                      type="text"
                      value={waiterNote}
                      onChange={(e) => setWaiterNote(e.target.value)}
                      placeholder={tText({
                        am: 'ለምሳሌ፡ 2 ብርጭቆ ውሃ፣ ተጨማሪ እንጀራ...',
                        en: 'e.g., 2 glasses of water, extra napkins...',
                        or: 'fkn: bishaan 2, buddeena dabalataa...',
                        ti: 'ንኣብነት፡ 2 ብርጭቆ ማይ...',
                        sid: 'Lawishsha: 2 waa, leddo buddeena...',
                        fr: 'ex. 2 verres d\'eau, serviettes...',
                        de: 'z.B. 2 Gläser Wasser, Servietten...',
                        it: 'es. 2 bicchieri d\'acqua, tovaglioli...',
                        zh: '例如：两杯水、加餐巾纸...',
                        ar: 'مثلاً: كوبان من الماء، مناديل إضافية...',
                      })}
                      className="w-full bg-white border-2 border-[#F4C22B] focus:border-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C1917] placeholder-stone-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-targeted-waiter-call"
                    className="w-full py-3 rounded-2xl bg-[#F4C22B] hover:bg-white text-[#1C1917] font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-[#CF9D12] shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    <span>
                      {assignedWaiterName
                        ? `${t('menu.call_waiter_named', { name: assignedWaiterName })} (${guestLocation})`
                        : `${t('menu.call_waiter')} (${guestLocation})`}
                    </span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Direct Contact Cards for Manager, General Manager & Support Team */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#7A1212] border-2 border-[#F4C22B] rounded-2xl p-3.5 space-y-2.5 shadow-lg flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-black uppercase text-[#F4C22B] block">
                          {tText({ am: '👑 ማናጀር', en: '👑 MANAGER', or: '👑 HOOGGANAA', ti: '👑 ማናጀር', sid: '👑 MASSAGAANCHO', fr: '👑 GÉRANT', de: '👑 MANAGER', it: '👑 MANAGER', zh: '👑 经理', ar: '👑 المدير' })}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            leadershipContacts.managerAvailable !== false
                              ? 'bg-[#065F46] text-white border-[#6EE7B7]'
                              : 'bg-[#5C0A0A] text-[#FDE68A] border-[#F4C22B]/40'
                          }`}
                        >
                          {leadershipContacts.managerAvailable !== false ? '● ON' : '○ OFF'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white">
                        {leadershipContacts.managerName}
                      </h4>
                      <p className="text-[10px] text-[#FEF3C7] leading-snug">
                        {tText({
                          am: 'ለማናጀር መልዕክትዎን ከታች ይጻፉ',
                          en: 'Leave a direct message below',
                          or: 'Ergaa keessan asitti barreessaa',
                          ti: 'መልእኽትኹም ኣብ ታሕቲ ጽሐፉ',
                          sid: 'Sokkaakki woroonni borreessi',
                          fr: 'Laissez un message direct ci-dessous',
                          de: 'Nachricht direkt unten hinterlassen',
                          it: 'Lascia un messaggio diretto qui sotto',
                          zh: '在下方给经理留言',
                          ar: 'اترك رسالة مباشرة أدناه',
                        })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLeaderTarget('manager')}
                      className={`w-full py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        leaderTarget === 'manager'
                          ? 'bg-[#F4C22B] text-[#1C1917] border-white font-black'
                          : 'bg-[#B21F1F] text-white border-[#F4C22B]/50 hover:bg-[#F4C22B] hover:text-[#1C1917]'
                      }`}
                    >
                      📩 {t('ai.send')}
                    </button>
                  </div>

                  <div className="bg-[#7A1212] border-2 border-[#F4C22B] rounded-2xl p-3.5 space-y-2.5 shadow-lg flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-black uppercase text-[#F4C22B] block">
                          {tText({ am: '👔 ስራ አስኪያጅ', en: '👔 GEN. MANAGER', or: '👔 BULCHAA', ti: '👔 ዋና ኣመሓዳሪ', sid: '👔 ALIYYE MASSAGAANCHO', fr: '👔 DIRECTION', de: '👔 DIREKTION', it: '👔 DIREZIONE', zh: '👔 总经理', ar: '👔 المدير العام' })}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            leadershipContacts.gmAvailable !== false
                              ? 'bg-[#065F46] text-white border-[#6EE7B7]'
                              : 'bg-[#5C0A0A] text-[#FDE68A] border-[#F4C22B]/40'
                          }`}
                        >
                          {leadershipContacts.gmAvailable !== false ? '● ON' : '○ OFF'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white">
                        {leadershipContacts.gmName}
                      </h4>
                      <p className="text-[10px] text-[#FEF3C7] leading-snug">
                        {tText({
                          am: 'ለስራ አስኪያጅ መልዕክትዎን ከታች ይጻፉ',
                          en: 'Leave a direct message below',
                          or: 'Ergaa keessan asitti barreessaa',
                          ti: 'መልእኽትኹም ኣብ ታሕቲ ጽሐፉ',
                          sid: 'Sokkaakki woroonni borreessi',
                          fr: 'Laissez un message direct ci-dessous',
                          de: 'Nachricht direkt unten hinterlassen',
                          it: 'Lascia un messaggio diretto qui sotto',
                          zh: '在下方给总经理留言',
                          ar: 'اترك رسالة مباشرة أدناه',
                        })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLeaderTarget('admin')}
                      className={`w-full py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        leaderTarget === 'admin'
                          ? 'bg-[#F4C22B] text-[#1C1917] border-white font-black'
                          : 'bg-[#B21F1F] text-white border-[#F4C22B]/50 hover:bg-[#F4C22B] hover:text-[#1C1917]'
                      }`}
                    >
                      📩 {t('ai.send')}
                    </button>
                  </div>

                  <div className="bg-[#7A1212] border-2 border-[#F4C22B] rounded-2xl p-3.5 space-y-2.5 shadow-lg flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-black uppercase text-[#F4C22B] block">
                          {tText({ am: '🎧 የድጋፍ ቡድን', en: '🎧 SUPPORT TEAM', or: '🎧 GARGAARSA', ti: '🎧 ጉጅለ ድጋፍ', sid: '🎧 KAA\'LOTE GURRA', fr: '🎧 SUPPORT', de: '🎧 SUPPORT', it: '🎧 SUPPORTO', zh: '🎧 客服支持', ar: '🎧 فريق الدعم' })}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            leadershipContacts.supportAvailable !== false
                              ? 'bg-[#065F46] text-white border-[#6EE7B7]'
                              : 'bg-[#5C0A0A] text-[#FDE68A] border-[#F4C22B]/40'
                          }`}
                        >
                          {leadershipContacts.supportAvailable !== false ? '● 24/7' : '○ OFF'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white">
                        {leadershipContacts.supportName}
                      </h4>
                      <p className="text-[10px] text-[#FEF3C7] leading-snug">
                        {tText({
                          am: 'ለድጋፍ ቡድን መልዕክትዎን ከታች ይጻፉ',
                          en: 'Leave a direct message below',
                          or: 'Ergaa keessan asitti barreessaa',
                          ti: 'መልእኽትኹም ኣብ ታሕቲ ጽሐፉ',
                          sid: 'Sokkaakki woroonni borreessi',
                          fr: 'Laissez un message direct ci-dessous',
                          de: 'Nachricht direkt unten hinterlassen',
                          it: 'Lascia un messaggio diretto qui sotto',
                          zh: '在下方给支持团队留言',
                          ar: 'اترك رسالة مباشرة أدناه',
                        })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLeaderTarget('support')}
                      className={`w-full py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        leaderTarget === 'support'
                          ? 'bg-[#F4C22B] text-[#1C1917] border-white font-black'
                          : 'bg-[#B21F1F] text-white border-[#F4C22B]/50 hover:bg-[#F4C22B] hover:text-[#1C1917]'
                      }`}
                    >
                      📩 {t('ai.send')}
                    </button>
                  </div>
                </div>

                {leaderSentBanner && (
                  <div className="bg-[#065F46] border border-[#6EE7B7] text-white rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FDE68A] shrink-0" />
                    <span>{leaderSentBanner}</span>
                  </div>
                )}

                {/* Direct Message Form */}
                <form
                  onSubmit={handleLeadershipSubmit}
                  className="bg-[#7A1212] border-2 border-[#F4C22B]/50 rounded-2xl p-4 space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F4C22B]/30 pb-2">
                    <span className="text-xs font-black text-[#F4C22B]">
                      ✉️ {t('menu.contact_leadership')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'manager', label: tText({ am: 'ማናጀር', en: 'Manager', or: 'Hoogganaa', ti: 'ማናጀር', sid: 'Massagaancho', fr: 'Gérant', de: 'Manager', it: 'Manager', zh: '经理', ar: 'المدير' }) },
                        { id: 'admin', label: tText({ am: 'ስራ አስኪያጅ', en: 'Gen. Manager', or: 'Bulchaa', ti: 'ዋና ኣመሓዳሪ', sid: 'Aliyye Massagaancho', fr: 'Direction', de: 'Direktion', it: 'Direzione', zh: '总经理', ar: 'المدير العام' }) },
                        { id: 'support', label: tText({ am: 'Support ቡድን', en: 'Support Team', or: 'Gargaarsa', ti: 'ድጋፍ', sid: 'Kaa\'lo', fr: 'Support', de: 'Support', it: 'Supporto', zh: '客服', ar: 'الدعم' }) },
                        { id: 'both', label: t('common.all') },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setLeaderTarget(opt.id as 'manager' | 'admin' | 'support' | 'both')
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                            leaderTarget === opt.id
                              ? 'bg-[#F4C22B] text-[#1C1917] border-white font-black'
                              : 'bg-[#8C1414] text-white border-[#F4C22B]/35 hover:bg-[#B21F1F]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topic selector */}
                  <div className="flex flex-wrap gap-1.5">
                    {LEADERSHIP_TOPICS.map((tp) => {
                      const label = tText(tp.labels);
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={() => setLeaderTopicId(tp.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                            leaderTopicId === tp.id
                              ? 'bg-[#F4C22B] text-[#1C1917] border-white font-black'
                              : 'bg-[#8C1414] text-white border-[#F4C22B]/30 hover:bg-[#B21F1F]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={tText({ am: 'ስምዎ (አማራጭ)', en: 'Your name (optional)', or: 'Maqaa (dirqama miti)', ti: 'ስምኩም (ኣማራጺ)', sid: 'Su\'makki', fr: 'Votre nom (optionnel)', de: 'Ihr Name (optional)', it: 'Il tuo nome (opzionale)', zh: '您的姓名（可选）', ar: 'اسمك (اختياري)' })}
                      className="bg-white border-2 border-[#F4C22B] focus:border-white rounded-xl px-3 py-2 text-xs font-bold text-[#1C1917] placeholder-stone-500 outline-none"
                    />
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder={tText({ am: 'ስልክ ቁጥርዎ (መልሶ ለመደወል)', en: 'Phone number (for callback)', or: 'Bilbila (deebisuuf)', ti: 'ቁጽሪ ስልኪ', sid: 'Silku Kiiro', fr: 'Téléphone (pour rappel)', de: 'Telefonnummer', it: 'Numero di telefono', zh: '联系电话（方便回电）', ar: 'رقم الهاتف (للتواصل)' })}
                      className="bg-white border-2 border-[#F4C22B] focus:border-white rounded-xl px-3 py-2 text-xs font-bold text-[#1C1917] placeholder-stone-500 outline-none"
                    />
                  </div>

                  <textarea
                    value={leaderMessageText}
                    onChange={(e) => setLeaderMessageText(e.target.value)}
                    required
                    rows={3}
                    placeholder={tText({
                      am: 'መልዕክትዎን፣ ልዩ ጥያቄዎን ወይም አስተያየትዎን እዚህ ይጻፉ...',
                      en: 'Write your direct message, special request, or inquiry for management...',
                      or: 'Ergaa ykn gaaffii keessan asitti barreessaa...',
                      ti: 'መልእኽትኹም ወይ ሕቶኹም ኣብዚ ጽሐፉ...',
                      sid: 'Sokkaakki woy xa\'mokki konne borreessi...',
                      fr: 'Écrivez votre message ou demande pour la direction...',
                      de: 'Schreiben Sie Ihre Nachricht an das Management...',
                      it: 'Scrivi il tuo messaggio per la direzione...',
                      zh: '在此填写给管理层的留言或需求...',
                      ar: 'اكتب رسالتك أو استفسارك للإدارة هنا...',
                    })}
                    className="w-full bg-white border-2 border-[#F4C22B] focus:border-white rounded-xl p-3 text-xs font-bold text-[#1C1917] placeholder-stone-500 outline-none resize-none"
                  />

                  <button
                    type="submit"
                    id="btn-submit-leadership-message"
                    className="w-full py-2.5 rounded-xl bg-[#F4C22B] hover:bg-white text-[#1C1917] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg border-2 border-[#CF9D12]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t('ai.send')}</span>
                  </button>
                </form>

                {/* Live Two-Way Replies */}
                {myLeadershipThread.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-black text-[#F4C22B] uppercase">
                      💬 {guestLocation}
                    </p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {myLeadershipThread.map((m) => (
                        <div
                          key={m.id}
                          className="bg-[#7A1212] border border-[#F4C22B]/40 rounded-xl p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] text-[#FEF3C7]">
                            <span className="font-bold text-[#F4C22B]">
                              {m.target.toUpperCase()} • {m.topic}
                            </span>
                            <span>
                              {m.time} • {m.status}
                            </span>
                          </div>
                          <p className="text-white font-medium">{m.message}</p>
                          {m.reply && (
                            <div className="bg-[#065F46] border-l-4 border-[#F4C22B] rounded-r-xl p-2.5 space-y-1">
                              <div className="flex justify-between text-[10px] text-[#FEF3C7] font-bold">
                                <span>
                                  {m.repliedBy || 'Management'}
                                </span>
                                <span>{m.replyTime}</span>
                              </div>
                              <p className="text-white font-semibold">{m.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
