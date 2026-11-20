/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  History,
  MessageSquare,
  Search,
  Volume2,
  VolumeX,
  EyeOff,
  Ban,
  Trash2,
} from 'lucide-react';
import { MenuItem, StockAlertLogEntry, StockAlertSettings } from '../types';
import { buildSmsHref, getBrowserPushStatus, requestBrowserPushPermission } from '../utils/alertEngine';
import { useLanguage } from '../context/LanguageContext';

interface ManagerStockAlertPanelProps {
  menuItems: MenuItem[];
  stockAlertLogs: StockAlertLogEntry[];
  stockAlertSettings: StockAlertSettings;
  onUpdateSettings: (next: StockAlertSettings) => void;
  onToggleStock: (menuItemId: string) => void;
  onAcknowledgeAlert: (logId: string) => void;
  onAcknowledgeAll: () => void;
  onClearLogs: () => void;
  onTestSound: () => void;
  currentManagerName: string;
  appLang: string;
}

export default function ManagerStockAlertPanel({
  menuItems,
  stockAlertLogs,
  stockAlertSettings,
  onUpdateSettings,
  onToggleStock,
  onAcknowledgeAlert,
  onAcknowledgeAll,
  onClearLogs,
  onTestSound,
}: ManagerStockAlertPanelProps) {
  const { tText, currency, isRtl } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'in'>('all');
  const [logFilter, setLogFilter] = useState<'all' | 'out' | 'restocked'>('all');
  const [pushStatus, setPushStatus] = useState(getBrowserPushStatus());

  const outOfStockItems = useMemo(
    () => menuItems.filter((m) => !m.available),
    [menuItems],
  );
  const inStockItems = useMemo(
    () => menuItems.filter((m) => m.available),
    [menuItems],
  );
  const unacknowledgedOutAlerts = useMemo(
    () => stockAlertLogs.filter((l) => !l.newAvailable && !l.acknowledged),
    [stockAlertLogs],
  );

  const latestLogByItemId = useMemo(() => {
    const map = new Map<string, StockAlertLogEntry>();
    for (const log of stockAlertLogs) {
      if (!map.has(log.menuItemId)) {
        map.set(log.menuItemId, log);
      }
    }
    return map;
  }, [stockAlertLogs]);

  const filteredMenuItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...menuItems]
      .filter((item) => {
        if (stockFilter === 'out' && item.available) return false;
        if (stockFilter === 'in' && !item.available) return false;
        if (!q) return true;
        return (
          item.nameAm.toLowerCase().includes(q) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
          item.cat.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(a.available) - Number(b.available));
  }, [menuItems, searchQuery, stockFilter]);

  const filteredLogs = useMemo(() => {
    return stockAlertLogs.filter((log) => {
      if (logFilter === 'out' && log.newAvailable) return false;
      if (logFilter === 'restocked' && !log.newAvailable) return false;
      return true;
    });
  }, [stockAlertLogs, logFilter]);

  const handleTogglePush = async () => {
    if (!stockAlertSettings.pushEnabled) {
      const perm = await requestBrowserPushPermission();
      setPushStatus(perm);
      onUpdateSettings({ ...stockAlertSettings, pushEnabled: true });
    } else {
      onUpdateSettings({ ...stockAlertSettings, pushEnabled: false });
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="bg-[#121212] border border-white/10 p-5 md:p-6 rounded-3xl space-y-6 text-left">
      {/* Header Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] text-yellow-400 font-mono font-bold tracking-wider block uppercase">
            KITCHEN-TO-MANAGER STOCK ALERT SYSTEM
          </span>
          <h3 className="text-base md:text-lg font-black text-white uppercase mt-0.5 flex items-center gap-2">
            <span>
              🍽️ {tText({
                am: 'የምግብ አቅርቦትና አውቶማቲክ ማስጠንቀቂያ መቆጣጠሪያ',
                en: 'Kitchen Stock & Auto-Alert Control',
                or: 'To\'annoo Dhiyeessii Nyaataa fi Akeekkachiisaa',
                ti: 'ምቁጽጻር ቀረብ መግብን ኣውቶማቲክ መጠንቀቕታን',
                sid: 'Sagale Shiqishshanna Qorophphote Qorqorsha',
                fr: 'Contrôle des Stocks & Alertes Cuisine',
                de: 'Küchenbestand & Auto-Alarmsteuerung',
                it: 'Controllo Scorte Cucina & Avvisi',
                zh: '厨房库存与自动缺货警报控制',
                ar: 'إدارة مخزون المطبخ والتنبيهات التلقائية',
              })}
            </span>
          </h3>
          <p className="text-[11px] text-stone-400 font-sans mt-1">
            {tText({
              am: 'ኩሽና ወይም ሰራተኞች ምግብን «አልቋል (OUT OF STOCK)» ሲያደርጉ እዚህ በቀይ ቀለም ይደምቃል፣ ድምፅና Push/SMS ማስጠንቀቂያ ይላካል፣ በደንበኞች ሜኑ ላይም ይታገዳል።',
              en: 'When staff mark an item Out of Stock, it highlights here in red, triggers sound & Push/SMS alerts, and updates the customer menu.',
              or: 'Yeroo hojjettoonni nyaata dhume jedhan asitti diimata, sagalee fi Push/SMS erga.',
              ti: 'ሰራሕተኛታት መግቢ ተወዲኡ ክብሉ ከለዉ ኣብዚ ብቐይሕ ይድምቕ፣ ድምጽን Push/SMSን ይልእኽ።',
              sid: 'Loosaano sagale goofino yitanno woyite duumo kuuliinni leellanno, huurranna SMS soyinanni.',
              fr: 'Lorsqu\'un plat est épuisé, il apparaît en rouge, déclenche une alerte sonore/Push/SMS et met à jour le menu client.',
              de: 'Ausverkaufte Gerichte werden rot hervorgehoben, lösen Ton-/Push-/SMS-Alarme aus und sperren das Gästen-Menü.',
              it: 'I piatti esauriti vengono evidenziati in rosso con avviso sonoro/Push/SMS e blocco automatico sul menu.',
              zh: '当员工将菜品标记为售罄时，此处会红灯高亮显示、发送语音与Push/SMS提醒并同步更新顾客菜单。',
              ar: 'عند نفاد أي صنف، يظهر هنا باللون الأحمر مع تنبيه صوتي وإشعار Push/SMS وتحديث قائمة الضيوف فوراً.',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono text-xs tabular-nums">
          <div className={`px-3 py-2 rounded-xl border ${
            outOfStockItems.length > 0
              ? 'bg-red-950/70 border-red-500 text-red-300'
              : 'bg-black/40 border-white/10 text-stone-400'
          }`}>
            <span className="text-[9px] uppercase block opacity-75">OUT OF STOCK</span>
            <span className="text-sm font-black">
              {outOfStockItems.length} {tText({ am: 'አልቋል', en: 'Out', or: 'Dhume', ti: 'ተወዲኡ', sid: 'Goofino', fr: 'Épuisé', de: 'Aus', it: 'Esauriti', zh: '售罄', ar: 'نفد' })}
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl border bg-emerald-950/30 border-emerald-500/30 text-emerald-300">
            <span className="text-[9px] uppercase block opacity-75">IN STOCK</span>
            <span className="text-sm font-black">
              {inStockItems.length} {tText({ am: 'አለ', en: 'Available', or: 'Jira', ti: 'ኣሎ', sid: 'No', fr: 'Dispo', de: 'Verfügbar', it: 'Disponibili', zh: '在售', ar: 'متوفر' })}
            </span>
          </div>
          {unacknowledgedOutAlerts.length > 0 && (
            <button
              type="button"
              onClick={onAcknowledgeAll}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                {tText({
                  am: 'ሁሉንም ተመልክቻለሁ ({count})',
                  en: 'Acknowledge All ({count})',
                  or: 'Hunda Mirkaneeffadhe ({count})',
                  ti: 'ኩሉ ርእየዮ ({count})',
                  sid: 'Baala La\'oommo ({count})',
                  fr: 'Tout confirmer ({count})',
                  de: 'Alle bestätigen ({count})',
                  it: 'Conferma tutto ({count})',
                  zh: '全部确认 ({count})',
                  ar: 'تأكيد الكل ({count})',
                }, { count: unacknowledgedOutAlerts.length })}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Channels & Customer Menu Behavior Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Audio Alert Control */}
        <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {stockAlertSettings.audioEnabled ? (
                <Volume2 className="w-4 h-4 text-yellow-400 shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500 shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-black text-white">
                  🔊 {tText({ am: 'የድምፅ ማስጠንቀቂያ', en: 'Manager Audio Alert', or: 'Akeekkachiisa Sagalee', ti: 'ናይ ድምጺ መጠንቀቕታ', sid: 'Huurru Qorophpho', fr: 'Alerte Sonore', de: 'Akustischer Alarm', it: 'Avviso Sonoro', zh: '声音警报', ar: 'التنبيه الصوتي' })}
                </h4>
                <p className="text-[10px] text-stone-400">
                  {tText({ am: 'ኩሽና ሲዘጋ ድምፅ ያሰማ', en: 'Sound chime on stock out', or: 'Yeroo dhumu sagalee dhageessisi', ti: 'ክውዳእ ከሎ ድምጺ የስምዕ', sid: 'Goofanno woyite huurro', fr: 'Signal sonore à la rupture', de: 'Signalton bei Ausverkauf', it: 'Suono ad esaurimento', zh: '缺货时播放提示音', ar: 'صوت تنبيه عند النفاد' })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...stockAlertSettings,
                  audioEnabled: !stockAlertSettings.audioEnabled,
                })
              }
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase cursor-pointer border ${
                stockAlertSettings.audioEnabled
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-stone-800 text-stone-400 border-white/10'
              }`}
            >
              {stockAlertSettings.audioEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <button
            type="button"
            onClick={onTestSound}
            className="w-full py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-[10px] font-mono font-bold uppercase cursor-pointer transition-colors"
          >
            🔔 {tText({ am: 'ድምፁን ሞክር', en: 'Test Alert Sound', or: 'Sagalee Yaali', ti: 'ድምጺ ፈትን', sid: 'Huurro Wo\'naali', fr: 'Tester le Son', de: 'Ton Testen', it: 'Prova Suono', zh: '测试提示音', ar: 'اختبار الصوت' })}
          </button>
        </div>

        {/* Browser/Mobile Push Notification */}
        <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {stockAlertSettings.pushEnabled ? (
                <Bell className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <BellOff className="w-4 h-4 text-stone-500 shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-black text-white">📲 Push Notification</h4>
                <p className="text-[10px] text-stone-400">
                  Status: <span className="font-mono uppercase text-white/80">{pushStatus}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePush}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase cursor-pointer border ${
                stockAlertSettings.pushEnabled && pushStatus === 'granted'
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                  : 'bg-stone-800 text-stone-300 border-white/10'
              }`}
            >
              {stockAlertSettings.pushEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <button
            type="button"
            onClick={async () => {
              const perm = await requestBrowserPushPermission();
              setPushStatus(perm);
              if (perm === 'granted') {
                onUpdateSettings({ ...stockAlertSettings, pushEnabled: true });
              }
            }}
            className="w-full py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-mono font-bold uppercase cursor-pointer transition-colors"
          >
            {pushStatus === 'granted'
              ? tText({ am: '✓ Push ፍቃድ ተሰጥቷል', en: '✓ Push Enabled', or: '✓ Hayyamameera', ti: '✓ ተፈቒዱ', sid: '✓ Fajjamino', fr: '✓ Push Activé', de: '✓ Push Aktiv', it: '✓ Push Attivo', zh: '✓ 已开启推送', ar: '✓ الإشعارات مفعلة' })
              : tText({ am: '🔓 የስልክ/ብራውዘር Push ፍቀድ', en: '🔓 Enable Browser Push', or: '🔓 Push Hayyami', ti: '🔓 Push ፍቐድ', sid: '🔓 Push Fajji', fr: '🔓 Autoriser Push', de: '🔓 Push erlauben', it: '🔓 Abilita Push', zh: '🔓 允许浏览器推送', ar: '🔓 تفعيل الإشعارات' })}
          </button>
        </div>

        {/* SMS Notification Settings */}
        <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-white">
                  📱 {tText({ am: 'የሞባይል SMS ማስጠንቀቂያ', en: 'Mobile SMS Alert', or: 'Akeekkachiisa SMS', ti: 'ናይ ሞባይል SMS', sid: 'SMS Qorophpho', fr: 'Alerte SMS Mobile', de: 'SMS-Benachrichtigung', it: 'Avviso SMS Mobile', zh: '手机短信提醒', ar: 'تنبيه رسائل SMS' })}
                </h4>
                <p className="text-[10px] text-stone-400">SMS Gateway / 1-Tap</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...stockAlertSettings,
                  smsEnabled: !stockAlertSettings.smsEnabled,
                })
              }
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase cursor-pointer border ${
                stockAlertSettings.smsEnabled
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-stone-800 text-stone-400 border-white/10'
              }`}
            >
              {stockAlertSettings.smsEnabled ? 'AUTO' : 'MANUAL'}
            </button>
          </div>
          <input
            type="tel"
            value={stockAlertSettings.managerPhone}
            onChange={(e) =>
              onUpdateSettings({ ...stockAlertSettings, managerPhone: e.target.value })
            }
            placeholder="+251 9xx xxx xxx"
            className="w-full bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-400"
          />
        </div>

        {/* Customer Digital Menu Behavior */}
        <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {stockAlertSettings.customerSoldOutMode === 'hide' ? (
              <EyeOff className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Ban className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <div>
              <h4 className="text-xs font-black text-white">
                🛑 {tText({ am: 'የደንበኞች ዲጂታል ሜኑ ሁኔታ', en: 'Guest Menu Sold-Out Mode', or: 'Haala Meenuu Maamilaa', ti: 'ኩነታት ሜኑ ዓሚል', sid: 'Meenuu Hunda Leellisha', fr: 'Affichage Rupture Client', de: 'Gäste-Menü Verhalten', it: 'Modalità Menu Clienti', zh: '顾客菜单售罄显示方式', ar: 'عرض النفاد للضيوف' })}
              </h4>
              <p className="text-[10px] text-stone-400">
                {tText({ am: 'ምግቡ ሲያልቅ እንዴት ይታይ?', en: 'When item is Out of Stock', or: 'Yeroo nyaanni dhumu', ti: 'መግቢ ክውዳእ ከሎ', sid: 'Sagale goofanno woyite', fr: 'En cas de rupture de stock', de: 'Wenn ausverkauft', it: 'Quando esaurito', zh: '当菜品售罄时', ar: 'عند نفاد الصنف' })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ ...stockAlertSettings, customerSoldOutMode: 'show_sold_out' })
              }
              className={`py-1.5 px-2 rounded-lg font-bold border cursor-pointer transition-colors ${
                stockAlertSettings.customerSoldOutMode === 'show_sold_out'
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-black/50 text-stone-400 border-white/10 hover:text-white'
              }`}
            >
              {tText({ am: 'SOLD OUT አሳይ', en: 'Show Sold Out', or: 'Dhume Agarsiisi', ti: 'SOLD OUT ኣርኢ', sid: 'Goofino Leellishi', fr: 'Afficher Épuisé', de: 'Ausverkauft', it: 'Mostra Esaurito', zh: '显示已售罄', ar: 'إظهار نفد' })}
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ ...stockAlertSettings, customerSoldOutMode: 'hide' })
              }
              className={`py-1.5 px-2 rounded-lg font-bold border cursor-pointer transition-colors ${
                stockAlertSettings.customerSoldOutMode === 'hide'
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-black/50 text-stone-400 border-white/10 hover:text-white'
              }`}
            >
              {tText({ am: 'ሙሉ በሙሉ ደብቅ', en: 'Hide Completely', or: 'Guutumaatti Dhoksi', ti: 'ብሙሉኡ ሕባእ', sid: 'Wo\'ma Maaxi', fr: 'Masquer', de: 'Ausblenden', it: 'Nascondi', zh: '完全隐藏', ar: 'إخفاء تماماً' })}
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-black/40 border border-white/10 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tText({
              am: 'የምግብ ወይም የመጠጥ ስም ይፈልጉ...',
              en: 'Search menu items by name or category...',
              or: 'Maqaa nyaataa ykn dhugaatii barbaadi...',
              ti: 'ስም መግቢ ወይ መስተ ድለ...',
              sid: 'Sagale woy ago su\'ma hasi...',
              fr: 'Rechercher un plat ou une catégorie...',
              de: 'Gericht oder Kategorie suchen...',
              it: 'Cerca piatto o categoria...',
              zh: '按名称或分类搜索菜品...',
              ar: 'ابحث باسم الطبق أو الفئة...',
            })}
            className="w-full bg-[#161616] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-yellow-400"
          />
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setStockFilter('all')}
            className={`px-3 py-2 rounded-xl font-black uppercase cursor-pointer border ${
              stockFilter === 'all'
                ? 'bg-yellow-400 text-black border-yellow-300'
                : 'bg-[#181818] text-stone-300 border-white/10'
            }`}
          >
            {tText({ am: 'ሁሉም', en: 'All', or: 'Hunda', ti: 'ኩሉ', sid: 'Baala', fr: 'Tout', de: 'Alle', it: 'Tutti', zh: '全部', ar: 'الكل' })} ({menuItems.length})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('out')}
            className={`px-3 py-2 rounded-xl font-black uppercase cursor-pointer border ${
              stockFilter === 'out'
                ? 'bg-red-600 text-white border-red-400'
                : 'bg-red-950/40 text-red-300 border-red-500/30'
            }`}
          >
            🔴 {tText({ am: 'አልቋል', en: 'Out', or: 'Dhume', ti: 'ተወዲኡ', sid: 'Goofino', fr: 'Épuisé', de: 'Aus', it: 'Esauriti', zh: '售罄', ar: 'نفد' })} ({outOfStockItems.length})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('in')}
            className={`px-3 py-2 rounded-xl font-black uppercase cursor-pointer border ${
              stockFilter === 'in'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
            }`}
          >
            🟢 {tText({ am: 'አለ', en: 'In Stock', or: 'Jira', ti: 'ኣሎ', sid: 'No', fr: 'Dispo', de: 'Da', it: 'Disponibili', zh: '有货', ar: 'متوفر' })} ({inStockItems.length})
          </button>
        </div>
      </div>

      {/* Menu Stock Cards Grid — Keep dish names as-is */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredMenuItems.map((m) => {
          const isOut = !m.available;
          const lastLog = latestLogByItemId.get(m.id);

          return (
            <div
              key={m.id}
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                isOut
                  ? 'bg-red-950/75 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.22)]'
                  : 'bg-black/45 border border-white/10 hover:border-yellow-500/30'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                      isOut
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-stone-300'
                    }`}
                  >
                    {isOut
                      ? tText({ am: 'አልቋል', en: 'OUT OF STOCK', or: 'DHUMEERA', ti: 'ተወዲኡ', sid: 'GOOFINO', fr: 'ÉPUISÉ', de: 'AUSVERKAUFT', it: 'ESAURITO', zh: '已售罄', ar: 'نفد' })
                      : m.cat}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono tabular-nums">
                    {m.price} {currency}
                  </span>
                </div>

                {/* Dish name intentionally preserved as-is */}
                <h4
                  className={`text-sm font-black truncate ${
                    isOut ? 'text-red-300' : 'text-white'
                  }`}
                >
                  {m.nameAm}
                </h4>

                {m.nameEn && (
                  <p className={`text-[10px] truncate ${isOut ? 'text-red-200/80' : 'text-stone-400'}`}>
                    {m.nameEn}
                  </p>
                )}

                {isOut && lastLog && !lastLog.newAvailable && (
                  <p className="text-[10px] text-red-200 font-mono truncate">
                    👤 {lastLog.changedByName} ({lastLog.changedByRole}) • 🕒 {lastLog.time}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleStock(m.id)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black font-mono uppercase tracking-wider cursor-pointer border shrink-0 transition-all ${
                  m.available
                    ? 'bg-emerald-500/15 hover:bg-red-600 hover:text-white hover:border-red-400 text-emerald-300 border-emerald-500/35'
                    : 'bg-red-600 hover:bg-emerald-600 text-white border-red-300'
                }`}
              >
                {m.available
                  ? tText({ am: '● በክምችት አለ', en: '● In Stock', or: '● Jira', ti: '● ኣሎ', sid: '● No', fr: '● En Stock', de: '● Vorrätig', it: '● Disponibile', zh: '● 有货', ar: '● متوفر' })
                  : tText({ am: '↺ አድስ (Restock)', en: '↺ Restock', or: '↺ Haaromsi', ti: '↺ ምልኣዮ', sid: '↺ Haaroonshi', fr: '↺ Réappro.', de: '↺ Auffüllen', it: '↺ Rifornisci', zh: '↺ 补货', ar: '↺ إعادة التزويد' })}
              </button>
            </div>
          );
        })}
      </div>

      {/* Stock Change Audit History / Log */}
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-yellow-400" />
            <div>
              <h4 className="text-xs md:text-sm font-black text-white uppercase">
                📝 {tText({ am: 'የአቅርቦት ለውጥ ታሪክ መዝገብ', en: 'Stock Availability Audit Log', or: 'Galmee Jijjiirama Dhiyeessii', ti: 'መዝገብ ለውጢ ቀረብ', sid: 'Shiqishshu Soorro Maareekko', fr: 'Journal des Modifications de Stock', de: 'Bestandsänderungs-Protokoll', it: 'Registro Storico Scorte', zh: '库存变更审计记录', ar: 'سجل تغييرات المخزون' })}
              </h4>
              <p className="text-[10px] text-stone-400">
                {tText({ am: 'ማን የትኛውን ምግብ በምን ሰዓት «አልቋል» ወይም «ተመልሷል» እንዳደረገ የሚያሳይ መዝገብ', en: 'Shows which staff marked items Out of Stock or Restocked and when', or: 'Eenyu nyaata kam yoom akka dhumuu fi deebise agarsiisa', ti: 'መን ኣየናይ መግቢ መዓስ ከምዘወድአ ወይ ከምዘምልአ የርኢ', sid: 'Ayee ma sagale mamo goofino yinooro leellishanno', fr: 'Indique quel employé a modifié la disponibilité des plats', de: 'Zeigt wer wann Gerichte als ausverkauft oder vorrätig markiert hat', it: 'Mostra chi ha aggiornato la disponibilità dei piatti', zh: '记录哪位员工在何时将菜品标记为售罄或补货', ar: 'يوضح من قام بتعديل توفر الأصناف ومتى' })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setLogFilter('all')}
              className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                logFilter === 'all'
                  ? 'bg-yellow-400 text-black border-yellow-300 font-black'
                  : 'bg-[#181818] text-stone-300 border-white/10'
              }`}
            >
              {tText({ am: 'ሁሉም', en: 'All', or: 'Hunda', ti: 'ኩሉ', sid: 'Baala', fr: 'Tout', de: 'Alle', it: 'Tutti', zh: '全部', ar: 'الكل' })} ({stockAlertLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setLogFilter('out')}
              className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                logFilter === 'out'
                  ? 'bg-red-600 text-white border-red-400 font-black'
                  : 'bg-red-950/40 text-red-300 border-red-500/30'
              }`}
            >
              {tText({ am: 'አልቋል', en: 'Out of Stock', or: 'Dhume', ti: 'ተወዲኡ', sid: 'Goofino', fr: 'Épuisé', de: 'Ausverkauft', it: 'Esaurito', zh: '售罄', ar: 'نفد' })}
            </button>
            <button
              type="button"
              onClick={() => setLogFilter('restocked')}
              className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                logFilter === 'restocked'
                  ? 'bg-emerald-600 text-white border-emerald-400 font-black'
                  : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {tText({ am: 'ተመልሷል', en: 'Restocked', or: 'Deebi\'e', ti: 'ተመሊኡ', sid: 'Haaroonshamino', fr: 'Réapprovisionné', de: 'Aufgefüllt', it: 'Rifornito', zh: '已补货', ar: 'تم التزويد' })}
            </button>
            {stockAlertLogs.length > 0 && (
              <button
                type="button"
                onClick={onClearLogs}
                className="px-2.5 py-1 rounded-lg border border-white/10 bg-black/50 text-stone-400 hover:text-red-300 hover:border-red-500/40 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{tText({ am: 'አጽዳ', en: 'Clear', or: 'Haqi', ti: 'ኣጽሪ', sid: 'Huni', fr: 'Vider', de: 'Leeren', it: 'Pulisci', zh: '清空', ar: 'مسح' })}</span>
              </button>
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-10 text-center text-stone-500 text-xs">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="font-bold">
              {tText({
                am: 'ምንም የአቅርቦት ለውጥ መዝገብ የለም',
                en: 'No stock changes logged yet',
                or: 'Galmeen jijjiirama dhiyeessii hin jiru',
                ti: 'ዝኾነ መዝገብ ለውጢ ቀረብ የለን',
                sid: 'Mittoo maareekko dino',
                fr: 'Aucun changement de stock enregistré',
                de: 'Noch keine Bestandsänderungen protokolliert',
                it: 'Nessuna modifica scorte registrata',
                zh: '暂无库存变更记录',
                ar: 'لا توجد سجلات تغيير للمخزون حتى الآن',
              })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-stone-400">
                  <th className="py-2 pr-3">{tText({ am: 'ምግብ', en: 'Dish', or: 'Nyaata', ti: 'መግቢ', sid: 'Sagale', fr: 'Plat', de: 'Gericht', it: 'Piatto', zh: '菜品', ar: 'الطبق' })}</th>
                  <th className="py-2 pr-3">{tText({ am: 'ሁኔታ', en: 'Status', or: 'Haala', ti: 'ኩነታት', sid: 'Deerra', fr: 'Statut', de: 'Status', it: 'Stato', zh: '状态', ar: 'الحالة' })}</th>
                  <th className="py-2 pr-3">{tText({ am: 'የቀየረው ሰራተኛ', en: 'Staff', or: 'Hojjetaa', ti: 'ሰራሕተኛ', sid: 'Loosaancho', fr: 'Employé', de: 'Mitarbeiter', it: 'Staff', zh: '操作员', ar: 'الموظف' })}</th>
                  <th className="py-2 pr-3">{tText({ am: 'ሰዓትና ቀን', en: 'Time', or: 'Yeroo', ti: 'ሰዓትን ዕለትን', sid: 'Yanna', fr: 'Heure', de: 'Zeit', it: 'Ora', zh: '时间', ar: 'الوقت' })}</th>
                  <th className="py-2 pr-3">{tText({ am: 'ማረጋገጫ', en: 'Ack', or: 'Mirkaneessa', ti: 'ምርግጋጽ', sid: 'Buuxxisha', fr: 'Validation', de: 'Bestätigung', it: 'Conferma', zh: '确认', ar: 'التأكيد' })}</th>
                  <th className="py-2 text-right">{tText({ am: 'እርምጃ', en: 'Action', or: 'Tarkaanfii', ti: 'ስጉምቲ', sid: 'Looso', fr: 'Action', de: 'Aktion', it: 'Azione', zh: '操作', ar: 'الإجراء' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.slice(0, 50).map((log) => {
                  const isOut = !log.newAvailable;
                  const smsBody = `PAPYRUS STOCK ALERT: "${log.itemNameAm}" (${log.itemNameEn}) marked OUT OF STOCK by ${log.changedByName} (${log.changedByRole}) at ${log.time}.`;
                  return (
                    <tr
                      key={log.id}
                      className={isOut && !log.acknowledged ? 'bg-red-950/35' : ''}
                    >
                      <td className="py-2.5 pr-3 font-bold">
                        <span className={isOut ? 'text-red-400 font-black' : 'text-white'}>
                          {log.itemNameAm}
                        </span>
                        {log.itemNameEn && (
                          <span className="block text-[10px] text-stone-400 font-normal">
                            {log.itemNameEn}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase ${
                            isOut
                              ? 'bg-red-600/25 text-red-300 border border-red-500/40'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isOut ? '🔴 OUT OF STOCK' : '🟢 IN STOCK'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-stone-200">
                        <span className="font-bold">{log.changedByName}</span>
                        <span className="block text-[9px] uppercase text-stone-400">
                          {log.changedByRole}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-stone-300 tabular-nums">
                        <span className="font-bold">{log.time}</span>
                        <span className="block text-[9px] text-stone-500">{log.date}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-[10px] font-mono">
                        {isOut ? (
                          log.acknowledged ? (
                            <span className="text-emerald-400 font-bold">
                              ✓ {log.acknowledgedBy || 'Manager'} ({log.acknowledgedAt})
                            </span>
                          ) : (
                            <span className="text-red-300 font-black">PENDING ACK</span>
                          )
                        ) : (
                          <span className="text-stone-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOut && (
                            <a
                              href={buildSmsHref(stockAlertSettings.managerPhone, smsBody)}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/15 text-stone-200 text-[10px] font-mono font-bold inline-flex items-center gap-1"
                              title="Send SMS via phone"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-400" />
                              <span>SMS</span>
                            </a>
                          )}
                          {isOut && !log.acknowledged && (
                            <button
                              type="button"
                              onClick={() => onAcknowledgeAlert(log.id)}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-black cursor-pointer inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>{tText({ am: 'አረጋግጥ', en: 'Ack', or: 'Mirk.', ti: 'ርኤ', sid: 'La\'i', fr: 'OK', de: 'OK', it: 'OK', zh: '确认', ar: 'تأكيد' })}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

