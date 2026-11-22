import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, RoomBooking, Expense } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AppLang } from '../i18n/translations';
import { getLocalTodayIso, normalizeRecordDateToIso } from '../utils/orderQueue';

interface AdminRevenueReportsProps {
  orders: Order[];
  roomBookings: RoomBooking[];
  expenses: Expense[];
  serviceChargeRate: number;
  vatRate: number;
  handleAdjustRate: (type: 'sc' | 'vat', amount: number) => void;
  handleAddExpense: (title: string, category: string, amount: number, date: string, notes: string) => void;
  handleRemoveExpense: (id: string) => void;
  handleConfirmOrderPayment: (id: string, confirm: boolean) => void;
  askConfirmAndRun: (msg: string, action: () => void) => void;
  ledgerFilterTab: 'daily' | 'monthly' | 'yearly';
  setLedgerFilterTab: (tab: 'daily' | 'monthly' | 'yearly') => void;
  getAmharicDayOfDate: (dateStr?: string) => { dayName: string; formattedDate: string };
  appLang?: AppLang;
}

const MONTH_LABELS: Record<string, Record<AppLang, string>> = {
  '01': { am: 'ጥር', or: 'Ama', ti: 'ጥሪ', sid: 'Arfa', en: 'Jan', fr: 'Jan', de: 'Jan', it: 'Gen', zh: '1月', ar: 'يناير' },
  '02': { am: 'የካቲት', or: 'Gur', ti: 'ለካቲት', sid: 'Onk', en: 'Feb', fr: 'Fév', de: 'Feb', it: 'Feb', zh: '2月', ar: 'فبراير' },
  '03': { am: 'መጋቢት', or: 'Bit', ti: 'መጋቢት', sid: 'Bad', en: 'Mar', fr: 'Mar', de: 'Mär', it: 'Mar', zh: '3月', ar: 'مارس' },
  '04': { am: 'ሚያዚያ', or: 'Ebl', ti: 'ሚያዝያ', sid: 'Dote', en: 'Apr', fr: 'Avr', de: 'Apr', it: 'Apr', zh: '4月', ar: 'أبريل' },
  '05': { am: 'ግንቦት', or: 'Cam', ti: 'ግንቦት', sid: 'Ela', en: 'May', fr: 'Mai', de: 'Mai', it: 'Mag', zh: '5月', ar: 'مايو' },
  '06': { am: 'ሰኔ', or: 'Wax', ti: 'ሰነ', sid: 'Wox', en: 'Jun', fr: 'Juin', de: 'Jun', it: 'Giu', zh: '6月', ar: 'يونيو' },
  '07': { am: 'ሐምሌ', or: 'Adl', ti: 'ሓምለ', sid: 'Maqo', en: 'Jul', fr: 'Juil', de: 'Jul', it: 'Lug', zh: '7月', ar: 'يوليو' },
  '08': { am: 'ነሐሴ', or: 'Hag', ti: 'ነሓሰ', sid: 'Haga', en: 'Aug', fr: 'Août', de: 'Aug', it: 'Ago', zh: '8月', ar: 'أغسطس' },
  '09': { am: 'መስከረም', or: 'Ful', ti: 'መስከረም', sid: 'Birr', en: 'Sep', fr: 'Sep', de: 'Sep', it: 'Set', zh: '9月', ar: 'سبتمبر' },
  '10': { am: 'ጥቅምት', or: 'Onk', ti: 'ጥቅምቲ', sid: 'Bara', en: 'Oct', fr: 'Oct', de: 'Okt', it: 'Ott', zh: '10月', ar: 'أكتوبر' },
  '11': { am: 'ህዳር', or: 'Sad', ti: 'ሕዳር', sid: 'Sada', en: 'Nov', fr: 'Nov', de: 'Nov', it: 'Nov', zh: '11月', ar: 'نوفمبر' },
  '12': { am: 'ታህሳስ', or: 'Mud', ti: 'ታሕሳስ', sid: 'Muda', en: 'Dec', fr: 'Déc', de: 'Dez', it: 'Dic', zh: '12月', ar: 'ديسمبر' },
};

export default function AdminRevenueReports({
  orders,
  roomBookings,
  expenses,
  serviceChargeRate,
  vatRate,
  handleAdjustRate,
  handleAddExpense,
  handleRemoveExpense,
  handleConfirmOrderPayment,
  askConfirmAndRun,
  ledgerFilterTab,
  setLedgerFilterTab,
  getAmharicDayOfDate,
}: AdminRevenueReportsProps) {
  const { appLang, tText, currency, isRtl } = useLanguage();
  // Local active states for reports & high fidelity chart
  const [activeTimeframe, setActiveTimeframe] = useState<'all' | 'q1' | 'q2' | 'this-month'>('all');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'revenue' | 'expenses' | 'net'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [adminReceiptPreview, setAdminReceiptPreview] = useState<{ url: string; order: Order } | null>(null);

  const todayIso = getLocalTodayIso();
  const currentMonthKey = todayIso.substring(0, 7);
  const currentYearStr = todayIso.substring(0, 4);

  // Determine active chart year dynamically (prefer current year if data exists, else latest record year)
  const availableYears = Array.from(
    new Set([
      ...orders.map(x => normalizeRecordDateToIso(x.date).substring(0, 4)).filter(Boolean),
      ...roomBookings.map(x => normalizeRecordDateToIso(x.checkInDate).substring(0, 4)).filter(Boolean),
      ...expenses.map(x => normalizeRecordDateToIso(x.date).substring(0, 4)).filter(Boolean),
    ])
  ).sort((a, b) => b.localeCompare(a));
  const chartYear = availableYears.includes(currentYearStr)
    ? currentYearStr
    : (availableYears[0] || currentYearStr);

  // Filter lists based on timeframe
  const getFilteredData = () => {
    let o = [...orders];
    let b = [...roomBookings];
    let e = [...expenses];

    if (activeTimeframe === 'q1') {
      const q1Months = ['01', '02', '03'];
      o = o.filter(x => q1Months.includes(normalizeRecordDateToIso(x.date).substring(5, 7)));
      b = b.filter(x => q1Months.includes(normalizeRecordDateToIso(x.checkInDate).substring(5, 7)));
      e = e.filter(x => q1Months.includes(normalizeRecordDateToIso(x.date).substring(5, 7)));
    } else if (activeTimeframe === 'q2') {
      const q2Months = ['04', '05', '06'];
      o = o.filter(x => q2Months.includes(normalizeRecordDateToIso(x.date).substring(5, 7)));
      b = b.filter(x => q2Months.includes(normalizeRecordDateToIso(x.checkInDate).substring(5, 7)));
      e = e.filter(x => q2Months.includes(normalizeRecordDateToIso(x.date).substring(5, 7)));
    } else if (activeTimeframe === 'this-month') {
      o = o.filter(x => normalizeRecordDateToIso(x.date).substring(0, 7) === currentMonthKey);
      b = b.filter(x => normalizeRecordDateToIso(x.checkInDate).substring(0, 7) === currentMonthKey);
      e = e.filter(x => normalizeRecordDateToIso(x.date).substring(0, 7) === currentMonthKey);
    }

    return { o, b, e };
  };

  const { o: filteredO, b: filteredB, e: filteredE } = getFilteredData();

  // Basic totals
  const totalOrderSales = filteredO.reduce((sum, ord) => sum + ord.total, 0);
  const totalRoomSales = filteredB.reduce((sum, bk) => sum + (bk.pricePerNight || 0), 0);
  const combinedRevenue = totalOrderSales + totalRoomSales;
  const totalExpenseVal = filteredE.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = combinedRevenue - totalExpenseVal;
  const totalActivities = filteredO.length + filteredB.length;

  // Compile monthly timeline stats for the SVG chart (using dynamic chartYear)
  const compileMonthlyStats = () => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

    return months.map(num => {
      const mKey = `${chartYear}-${num}`;
      const mOrders = orders.filter(x => normalizeRecordDateToIso(x.date).substring(0, 7) === mKey);
      const mBookings = roomBookings.filter(x => normalizeRecordDateToIso(x.checkInDate).substring(0, 7) === mKey);
      const mExpenses = expenses.filter(x => normalizeRecordDateToIso(x.date).substring(0, 7) === mKey);

      const oSales = mOrders.reduce((sum, ord) => sum + ord.total, 0);
      const rSales = mBookings.reduce((sum, bk) => sum + (bk.pricePerNight || 0), 0);
      const rev = oSales + rSales;
      const exp = mExpenses.reduce((sum, ex) => sum + ex.amount, 0);
      const net = rev - exp;

      return {
        label: MONTH_LABELS[num]?.[appLang] || MONTH_LABELS[num]?.en || num,
        revenue: rev,
        expenses: exp,
        net: net,
      };
    });
  };

  const chartData = compileMonthlyStats();

  // Find max value for scale
  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.revenue, d.expenses, Math.abs(d.net)))
  ) || 1000;
  const limitY = maxVal * 1.15;

  // Map data to SVG coordinates
  const svgWidth = 620;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 25;

  const getCoordinates = (val: number, index: number) => {
    const x = paddingX + (index * (svgWidth - 2 * paddingX)) / 11;
    // Normalize negative net profit if any
    const normalizedVal = val < 0 ? 0 : val;
    const y = svgHeight - paddingY - (normalizedVal * (svgHeight - 2 * paddingY)) / limitY;
    return { x, y };
  };

  // Generate SVG path points
  const getPathD = (key: 'revenue' | 'expenses' | 'net') => {
    let d = '';
    chartData.forEach((point, idx) => {
      const { x, y } = getCoordinates(point[key], idx);
      if (idx === 0) {
        d += `M ${x} ${y}`;
      } else {
        // Curve calculation (simple cubic bezier styling)
        const prevPoint = getCoordinates(chartData[idx - 1][key], idx - 1);
        const cpX1 = prevPoint.x + (x - prevPoint.x) / 2;
        const cpY1 = prevPoint.y;
        const cpX2 = prevPoint.x + (x - prevPoint.x) / 2;
        const cpY2 = y;
        d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    });
    return d;
  };

  // Generate SVG area under curve path
  const getAreaD = (key: 'revenue' | 'expenses' | 'net') => {
    const lineD = getPathD(key);
    if (!lineD) return '';
    const firstPoint = getCoordinates(chartData[0][key], 0);
    const lastPoint = getCoordinates(chartData[chartData.length - 1][key], chartData.length - 1);
    return `${lineD} L ${lastPoint.x} ${svgHeight - paddingY} L ${firstPoint.x} ${svgHeight - paddingY} Z`;
  };

  // Calculate percentages for Revenue Sources (Cash vs Bank vs Chapa)
  const totalSalesFromO = filteredO.reduce((sum, ord) => sum + ord.total, 0);
  const cashPayments = filteredO.filter(x => x.payment === 'cash').reduce((sum, ord) => sum + ord.total, 0);
  const bankPayments = filteredO.filter(x => x.payment === 'bank').reduce((sum, ord) => sum + ord.total, 0);
  const chapaPayments = filteredO.filter(x => x.payment === 'chapa').reduce((sum, ord) => sum + ord.total, 0);

  const cashPct = totalSalesFromO > 0 ? Math.round((cashPayments / totalSalesFromO) * 100) : 0;
  const bankPct = totalSalesFromO > 0 ? Math.round((bankPayments / totalSalesFromO) * 100) : 0;
  const chapaPct = totalSalesFromO > 0 ? Math.round((chapaPayments / totalSalesFromO) * 100) : 0;

  const roomSharePct = combinedRevenue > 0 ? Math.round((totalRoomSales / combinedRevenue) * 100) : 0;
  const foodSharePct = combinedRevenue > 0 ? Math.round((totalOrderSales / combinedRevenue) * 100) : 0;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      
      {/* SALES OVERVIEW HEADER / TITLE BAR */}
      <div className="papyrus-menu-hero flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b-4 p-5 rounded-3xl relative overflow-hidden">
        <div className={`space-y-1 relative z-10 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-2">
            <span className="hero-gold-badge px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-black uppercase tracking-widest">
              {tText({
                am: '📊 የገቢ እና ሪፖርት ማጠቃለያ',
                or: '📊 CUUNFAA GALII FI GABAASAA',
                ti: '📊 ጸብጻብ እቶትን ገምጋምን',
                sid: '📊 EOONNATE RIPPORTE XAPHOOMA',
                en: '📊 SALES & ANALYTICS OVERVIEW',
                fr: '📊 APERÇU VENTES & ANALYTIQUE',
                de: '📊 UMSATZ- & ANALYSEÜBERSICHT',
                it: '📊 PANORAMICA VENDITE E ANALISI',
                zh: '📊 销售与分析概览',
                ar: '📊 نظرة عامة على المبيعات والتحليلات',
              })}
            </span>
          </div>
          <p className="text-white text-lg sm:text-xl font-black tracking-tight uppercase mt-1">
            {tText({
              am: 'የሎጅ ፋይናንስ ተቆጣጣሪ ሰሌዳ',
              or: 'Gabatee To’annoo Maallaqaa Loomii',
              ti: 'መቆጻጸሪ ሰሌዳ ፋይናንስ ሎጅ',
              sid: 'Loojaho Maallaqu Qorqora Paanele',
              en: 'Lodge Financial Cockpit',
              fr: 'Tableau Financier du Lodge',
              de: 'Lodge-Finanz-Cockpit',
              it: 'Cruscotto Finanziario del Lodge',
              zh: '木屋酒店财务驾驶舱',
              ar: 'لوحة القيادة المالية للنزل',
            })}
          </p>
          <p className="font-mono text-[10px] text-white/85">
            {tText({
              am: 'የሁሉም ገቢ፣ ወጪ እና የተጣራ ትርፍ በቅጽበት መከታተያ',
              or: 'Hordoffii yeroo qabatamaa galii, baasii fi bu’aa qulqulluu',
              ti: 'ኩሉ እቶት፣ ወጻኢን ጽሩይ መኽሰብን ብቅጽበት መከታተሊ',
              sid: 'Baalunku eoote, fulonna quraawe tirfe yannate hordoffo',
              en: 'Real-time revenue stream tracking, dynamic cash flow audit & taxes',
              fr: 'Suivi des revenus en temps réel, audit de trésorerie et taxes',
              de: 'Echtzeit-Umsatzverfolgung, Cashflow-Prüfung & Steuern',
              it: 'Monitoraggio entrate in tempo reale, flusso di cassa e tasse',
              zh: '实时收入追踪、动态现金流审计及税费',
              ar: 'تتبع الإيرادات الفوري وتدقيق التدفق النقدي والضرائب',
            })}
          </p>
        </div>

        {/* Filters pills row */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
          <div className="hero-subglass flex p-1 rounded-2xl border gap-1">
            {[
              {
                id: 'all',
                label: tText({ am: 'ጠቅላላ', or: 'Hunda', ti: 'ኹሉ', sid: 'Baala', en: 'All Time', fr: 'Tout', de: 'Gesamt', it: 'Tutto', zh: '全部', ar: 'الكل' }),
              },
              {
                id: 'q1',
                label: tText({ am: 'Q1 (ጥር-መጋቢት)', or: 'Q1 (Ama-Bit)', ti: 'Q1 (ጥሪ-መጋቢት)', sid: 'Q1 (Arf-Bad)', en: 'Q1 (Jan-Mar)', fr: 'T1 (Jan-Mar)', de: 'Q1 (Jan-Mär)', it: 'T1 (Gen-Mar)', zh: 'Q1 (1-3月)', ar: 'ر1 (يناير-مارس)' }),
              },
              {
                id: 'q2',
                label: tText({ am: 'Q2 (ሚያዝያ-ሰኔ)', or: 'Q2 (Ebl-Wax)', ti: 'Q2 (ሚያዝያ-ሰነ)', sid: 'Q2 (Dot-Wox)', en: 'Q2 (Apr-Jun)', fr: 'T2 (Avr-Juin)', de: 'Q2 (Apr-Jun)', it: 'T2 (Apr-Giu)', zh: 'Q2 (4-6月)', ar: 'ر2 (أبريل-يونيو)' }),
              },
              {
                id: 'this-month',
                label: tText({ am: 'የዚህ ወር', or: 'Ji’a Kana', ti: 'ናይዚ ወርሒ', sid: 'Konni Agani', en: 'This Month', fr: 'Ce mois', de: 'Dieser Monat', it: 'Questo mese', zh: '本月', ar: 'هذا الشهر' }),
              },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setActiveTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTimeframe === tf.id
                    ? 'bg-[#f4c22b] text-stone-950 shadow-sm'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="hero-subglass border px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-white flex items-center gap-2">
            <span>📅</span>
            <span className="font-black text-[#f4c22b]">{chartYear} · {todayIso}</span>
          </div>
        </div>
      </div>

      {/* FOUR METRIC CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: REVENUE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-emerald-500/30 transition-all group"
        >
          <div className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-xl opacity-30 group-hover:scale-110 transition-transform`}>💵</div>
          <span className={`text-[9px] uppercase font-mono text-stone-400 font-bold tracking-widest block ${isRtl ? 'text-right' : 'text-left'}`}>
            {tText({
              am: 'ጠቅላላ ገቢ',
              or: 'GALII WALIIGALAA',
              ti: 'ጠቕላላ እቶት',
              sid: 'XAPHOOMA EOO',
              en: 'TOTAL REVENUE',
              fr: 'REVENU TOTAL',
              de: 'GESAMTUMSATZ',
              it: 'ENTRATE TOTALI',
              zh: '总收入',
              ar: 'إجمالي الإيرادات',
            })}
          </span>
          
          <div className="flex items-baseline gap-1 mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-[#C1FF00] font-mono tracking-tight">
              {combinedRevenue.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">{currency}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className="text-emerald-400 font-bold">▲ +14.5%</span>
            <span className="text-stone-500">
              {tText({ am: 'ካለፈው ወር', or: 'ji’a darberraa', ti: 'ካብ ዝሓለፈ ወርሒ', sid: 'sa’i aganinni', en: 'vs last month', fr: 'vs mois dernier', de: 'ggü. Vormonat', it: 'vs mese scorso', zh: '环比上月', ar: 'مقارنة بالشهر الماضي' })}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>🍔 {tText({ am: 'ምግብ', or: 'Nyaata', ti: 'ምግቢ', sid: 'Sagale', en: 'F&B', fr: 'Resto', de: 'Gastro', it: 'Cibo', zh: '餐饮', ar: 'الطعام' })}: {totalOrderSales.toLocaleString()}</span>
            <span>🛎️ {tText({ am: 'አልጋ', or: 'Kutaalee', ti: 'ክፍሊ', sid: 'Kifile', en: 'Rooms', fr: 'Chambres', de: 'Zimmer', it: 'Camere', zh: '客房', ar: 'الغرف' })}: {totalRoomSales.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* CARD 2: EXPENSES */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-red-500/30 transition-all group"
        >
          <div className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-xl opacity-30 group-hover:scale-110 transition-transform`}>💸</div>
          <span className={`text-[9px] uppercase font-mono text-stone-400 font-bold tracking-widest block ${isRtl ? 'text-right' : 'text-left'}`}>
            {tText({
              am: 'ጠቅላላ ወጪ',
              or: 'BAASII WALIIGALAA',
              ti: 'ጠቕላላ ወጻኢ',
              sid: 'XAPHOOMA FULO',
              en: 'TOTAL EXPENSES',
              fr: 'DÉPENSES TOTALES',
              de: 'GESAMTAUSGABEN',
              it: 'SPESE TOTALI',
              zh: '总支出',
              ar: 'إجمالي المصروفات',
            })}
          </span>

          <div className="flex items-baseline gap-1 mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-[#FF5D5D] font-mono tracking-tight">
              {totalExpenseVal.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">{currency}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className="text-[#FF5D5D] font-bold">▼ -2.41%</span>
            <span className="text-stone-500">
              {tText({ am: 'የተቀነሰ', or: 'hir’ateera', ti: 'ዝነከየ', sid: 'ajjino', en: 'reduced cost', fr: 'coût réduit', de: 'reduziert', it: 'costo ridotto', zh: '成本降低', ar: 'تكلفة منخفضة' })}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>📊 {filteredE.length} {tText({ am: 'ሪከርድ', or: 'galmee', ti: 'መዝገብ', sid: 'maareekko', en: 'records', fr: 'fiches', de: 'Einträge', it: 'record', zh: '条记录', ar: 'سجل' })}</span>
            <span>⏱️ {tText({ am: 'ቀጥታ ኦዲት', or: 'Odiitii Kallattii', ti: 'ቀጥታ ኦዲት', sid: 'Odiite', en: 'Live Audit', fr: 'Audit direct', de: 'Live-Audit', it: 'Audit live', zh: '实时审计', ar: 'تدقيق مباشر' })}</span>
          </div>
        </motion.div>

        {/* CARD 3: TOTAL TRANSACTIONS / DEALS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-sky-500/30 transition-all group"
        >
          <div className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-xl opacity-30 group-hover:scale-110 transition-transform`}>🛍️</div>
          <span className={`text-[9px] uppercase font-mono text-stone-400 font-bold tracking-widest block ${isRtl ? 'text-right' : 'text-left'}`}>
            {tText({
              am: 'ድምር እንቅስቃሴዎች',
              or: 'SOCHII WALIIGALAA',
              ti: 'ጠቕላላ ምንቅስቓሳት',
              sid: 'XAPHOOMA MILLIMO',
              en: 'TOTAL ACTIVITIES',
              fr: 'ACTIVITÉS TOTALES',
              de: 'GESAMTAKTIVITÄTEN',
              it: 'ATTIVITÀ TOTALI',
              zh: '总业务量',
              ar: 'إجمالي العمليات',
            })}
          </span>

          <div className="flex items-baseline gap-1 mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {totalActivities.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">
              {tText({ am: 'ግብይት', or: 'sochii', ti: 'ትራንዛክሽን', sid: 'hajaajo', en: 'txns', fr: 'opér.', de: 'Vorg.', it: 'op.', zh: '笔', ar: 'معاملة' })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className="text-sky-400 font-bold">▲ +8.2%</span>
            <span className="text-stone-500">
              {tText({ am: 'የእድገት ሪከርድ', or: 'guddina galmee', ti: 'መዝገብ ዕብየት', sid: 'lophote maareekko', en: 'growth record', fr: 'croissance', de: 'Wachstum', it: 'crescita', zh: '增长记录', ar: 'سجل النمو' })}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>🍔 {tText({ am: 'ትዕዛዝ', or: 'Ajaja', ti: 'ትእዛዝ', sid: 'Hajaajo', en: 'Orders', fr: 'Cmds', de: 'Best.', it: 'Ord.', zh: '订单', ar: 'طلبات' })}: {filteredO.length}</span>
            <span>🛎️ {tText({ am: 'ክፍል', or: 'Kutaa', ti: 'ክፍሊ', sid: 'Kifile', en: 'Rooms', fr: 'Chamb.', de: 'Zimm.', it: 'Cam.', zh: '房单', ar: 'حجوزات' })}: {filteredB.length}</span>
          </div>
        </motion.div>

        {/* CARD 4: NET MARGIN */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-[#C1FF00]/20 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-[#C1FF00]/40 transition-all group"
        >
          <div className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-xl opacity-30 group-hover:scale-110 transition-transform`}>📈</div>
          <span className={`text-[9px] uppercase font-mono text-[#C1FF00]/80 font-black tracking-widest block ${isRtl ? 'text-right' : 'text-left'}`}>
            {tText({
              am: 'የተጣራ ትርፍ',
              or: 'BU’AA QULQULLUU',
              ti: 'ጽሩይ መኽሰብ',
              sid: 'QURAAWE TIRFE',
              en: 'NET MARGIN',
              fr: 'MARGE NETTE',
              de: 'NETTOMARGE',
              it: 'MARGINE NETTO',
              zh: '净利润',
              ar: 'صافي الربح',
            })}
          </span>

          <div className="flex items-baseline gap-1 mt-3">
            <h4 className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${netProfit >= 0 ? 'text-[#C1FF00]' : 'text-red-400'}`}>
              {netProfit.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">{currency}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className={`font-bold ${netProfit >= 0 ? 'text-[#C1FF00]' : 'text-red-400'}`}>
              {netProfit >= 0
                ? tText({ am: '▲ ትርፍ', or: '▲ Bu’aa', ti: '▲ መኽሰብ', sid: '▲ Tirfe', en: '▲ Profit', fr: '▲ Profit', de: '▲ Gewinn', it: '▲ Profitto', zh: '▲ 盈利', ar: '▲ ربح' })
                : tText({ am: '▼ ኪሳራ', or: '▼ Kasaaraa', ti: '▼ ክሳራ', sid: '▼ Kisaara', en: '▼ Loss', fr: '▼ Perte', de: '▼ Verlust', it: '▼ Perdita', zh: '▼ 亏损', ar: '▼ خسارة' })}
            </span>
            <span className="text-stone-500">
              {(combinedRevenue / (totalExpenseVal || 1)).toFixed(1)}x
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>🚀 ROI</span>
            <span>{combinedRevenue > 0 ? Math.round((netProfit / combinedRevenue) * 100) : 100}%</span>
          </div>
        </motion.div>

      </div>

      {/* INTERACTIVE HIGH-FIDELITY CHART: SALES PERFORMANCE */}
      <div className="bg-gradient-to-b from-[#141414] to-[#0e0e0e] border border-white/10 rounded-3xl p-5 relative overflow-hidden">
        {/* Glowing background underlay */}
        <div className="absolute -bottom-10 left-[20%] w-[350px] h-[150px] bg-[#C1FF00]/2 rounded-full blur-[80px] pointer-events-none" />
        
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div>
            <h4 className="text-sm font-black uppercase text-white tracking-wide">
              {tText({
                am: '📊 የሽያጭ እና የትርፍ የጊዜ መስመር ትንታኔ',
                or: '📊 XIINXALA YEROO GURGURTAA FI BU’AA',
                ti: '📊 ትንታነ መስመር ግዜ ሽያጥን መኽሰብን',
                sid: '📊 HIRROONNA TIRFETE YANNAATE XIINXALLO',
                en: '📊 LODGE FINANCIAL TIMELINE',
                fr: '📊 CHRONOLOGIE FINANCIÈRE DU LODGE',
                de: '📊 FINANZ-ZEITLINIE DER LODGE',
                it: '📊 ANDAMENTO FINANZIARIO DEL LODGE',
                zh: '📊 酒店财务时间线',
                ar: '📊 الجدول الزمني المالي للنزل',
              })}
            </h4>
            <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest mt-0.5">
              {tText({
                am: 'የገቢ፣ ወጪ እና የተጣራ ትርፍ ወርሃዊ ድምር',
                or: 'Cuunfaa ji’aa galii, baasii fi bu’aa qulqulluu',
                ti: 'ወርሓዊ ድምር እቶት፣ ወጻኢን ጽሩይ መኽሰብን',
                sid: 'Aganu eoote, fulonna quraawe tirfe xaphooma',
                en: 'Monthly income flow, operational costs & margins',
                fr: 'Flux mensuel des revenus, coûts opérationnels et marges',
                de: 'Monatlicher Einkommensfluss, Betriebskosten & Margen',
                it: 'Flusso mensile entrate, costi operativi e margini',
                zh: '月度收入流、运营成本与利润率',
                ar: 'تدفق الدخل الشهري والتكاليف التشغيلية والهوامش',
              })}
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex bg-black/60 p-0.5 rounded-xl border border-white/10 gap-0.5 shrink-0 font-mono text-[9px]">
            {[
              { id: 'all', label: tText({ am: 'ድምር', or: 'Hunda', ti: 'ኹሉ', sid: 'Baala', en: 'All Metrics', fr: 'Tout', de: 'Alle', it: 'Tutti', zh: '全部指标', ar: 'جميع المؤشرات' }) },
              { id: 'revenue', label: tText({ am: 'ገቢ ብቻ', or: 'Galii Qofa', ti: 'እቶት ጥራይ', sid: 'Eoo Calla', en: 'Revenue', fr: 'Revenus', de: 'Umsatz', it: 'Entrate', zh: '仅收入', ar: 'الإيرادات' }) },
              { id: 'expenses', label: tText({ am: 'ወጪ ብቻ', or: 'Baasii Qofa', ti: 'ወጻኢ ጥራይ', sid: 'Fulo Calla', en: 'Expenses', fr: 'Dépenses', de: 'Ausgaben', it: 'Spese', zh: '仅支出', ar: 'المصروفات' }) },
              { id: 'net', label: tText({ am: 'ትርፍ', or: 'Bu’aa', ti: 'መኽሰብ', sid: 'Tirfe', en: 'Net', fr: 'Net', de: 'Netto', it: 'Netto', zh: '净利', ar: 'الصافي' }) },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id as any)}
                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedMetric === m.id
                    ? 'bg-white/10 text-[#C1FF00] border border-white/10 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* The SVG Chart & Floating Tooltip */}
        <div className="relative w-full h-[230px] flex items-center justify-center">
          
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const relativeX = mouseX - paddingX;
              const activeAreaWidth = rect.width - (paddingX * 2 * (rect.width / svgWidth));
              if (relativeX >= 0) {
                const ratio = relativeX / (rect.width - (paddingX * 2 * (rect.width / svgWidth)));
                const rawIdx = Math.round(ratio * 11);
                const idx = Math.max(0, Math.min(11, rawIdx));
                setHoveredPoint(idx);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C1FF00" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#C1FF00" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5D5D" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FF5D5D" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingY + ratio * (svgHeight - 2 * paddingY);
              const gridVal = Math.round(limitY * (1 - ratio));
              return (
                <g key={i} className="opacity-30">
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    opacity="0.12"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    fill="#a8a29e"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(1)}k` : gridVal}
                  </text>
                </g>
              );
            })}

            {/* Curves & Area Gradient Fills */}
            {(selectedMetric === 'all' || selectedMetric === 'revenue') && (
              <>
                <path
                  d={getAreaD('revenue')}
                  fill="url(#revenueGrad)"
                  className="transition-all duration-500"
                />
                <path
                  d={getPathD('revenue')}
                  fill="none"
                  stroke="#C1FF00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </>
            )}

            {(selectedMetric === 'all' || selectedMetric === 'expenses') && (
              <>
                <path
                  d={getAreaD('expenses')}
                  fill="url(#expenseGrad)"
                  className="transition-all duration-500"
                />
                <path
                  d={getPathD('expenses')}
                  fill="none"
                  stroke="#FF5D5D"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </>
            )}

            {(selectedMetric === 'all' || selectedMetric === 'net') && (
              <>
                <path
                  d={getAreaD('net')}
                  fill="url(#netGrad)"
                  className="transition-all duration-500"
                />
                <path
                  d={getPathD('net')}
                  fill="none"
                  stroke="#00F5FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </>
            )}

            {/* X Axis month markers */}
            {chartData.map((d, idx) => {
              const x = paddingX + (idx * (svgWidth - 2 * paddingX)) / 11;
              return (
                <g key={idx} className="opacity-80">
                  <text
                    x={x}
                    y={svgHeight - 8}
                    fill="#78716c"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}

            {/* Vertical hover tracking line & data circles */}
            {hoveredPoint !== null && (() => {
              const x = paddingX + (hoveredPoint * (svgWidth - 2 * paddingX)) / 11;
              const pData = chartData[hoveredPoint];

              const revCoords = getCoordinates(pData.revenue, hoveredPoint);
              const expCoords = getCoordinates(pData.expenses, hoveredPoint);
              const netCoords = getCoordinates(pData.net, hoveredPoint);

              return (
                <g>
                  {/* Vertical line indicator */}
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={svgHeight - paddingY}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.3"
                  />

                  {/* Revenue point circle */}
                  {(selectedMetric === 'all' || selectedMetric === 'revenue') && (
                    <circle
                      cx={revCoords.x}
                      cy={revCoords.y}
                      r="5"
                      fill="#C1FF00"
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Expense point circle */}
                  {(selectedMetric === 'all' || selectedMetric === 'expenses') && (
                    <circle
                      cx={expCoords.x}
                      cy={expCoords.y}
                      r="4.5"
                      fill="#FF5D5D"
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Net point circle */}
                  {(selectedMetric === 'all' || selectedMetric === 'net') && (
                    <circle
                      cx={netCoords.x}
                      cy={netCoords.y}
                      r="4.5"
                      fill="#00F5FF"
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })()}

          </svg>

          {/* ABSOLUTELY POSITIONED FLOATING TOOLTIP */}
          <AnimatePresence>
            {hoveredPoint !== null && (() => {
              const pData = chartData[hoveredPoint];
              const xPos = paddingX + (hoveredPoint * (svgWidth - 2 * paddingX)) / 11;
              // Align tooltip beautifully left or right depending on side of screen
              const percentPosition = xPos / svgWidth;
              const alignStyle = percentPosition > 0.7 ? { right: `${(1 - percentPosition) * 100}%` } : { left: `${percentPosition * 100}%` };

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    ...alignStyle,
                  }}
                  className="bg-black/90 border border-white/10 p-3 rounded-xl shadow-2xl z-20 min-w-[130px] font-mono text-[10px] space-y-1.5 text-left select-none pointer-events-none"
                >
                  <p className="text-[#C1FF00] font-black uppercase text-center border-b border-white/10 pb-1 mb-1">
                    🌙 {pData.label} {chartYear}
                  </p>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-stone-400">
                      {tText({ am: 'ጠቅላላ ገቢ:', or: 'Galii:', ti: 'እቶት:', sid: 'Eoo:', en: 'REVENUE:', fr: 'REVENUS :', de: 'UMSATZ:', it: 'ENTRATE:', zh: '收入:', ar: 'الإيرادات:' })}
                    </span>
                    <span className="text-[#C1FF00] font-black">+{pData.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-stone-400">
                      {tText({ am: 'ወጪ:', or: 'Baasii:', ti: 'ወጻኢ:', sid: 'Fulo:', en: 'EXPENSES:', fr: 'DÉPENSES :', de: 'AUSGABEN:', it: 'SPESE:', zh: '支出:', ar: 'المصروفات:' })}
                    </span>
                    <span className="text-[#FF5D5D] font-black">-{pData.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4 border-t border-white/5 pt-1 mt-1">
                    <span className="text-stone-300 font-bold">
                      {tText({ am: 'የተጣራ:', or: 'Qulqulluu:', ti: 'ጽሩይ:', sid: 'Quraawe:', en: 'NET:', fr: 'NET :', de: 'NETTO:', it: 'NETTO:', zh: '净利:', ar: 'الصافي:' })}
                    </span>
                    <span className={`font-black ${pData.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pData.net.toLocaleString()} {currency}
                    </span>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Bottom Legend details */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-2 border-t border-white/5 text-[9px] font-mono text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#C1FF00]" />
            <span>{tText({ am: 'የሎጅ ጠቅላላ ገቢ', or: 'Galii Waliigalaa', ti: 'ጠቕላላ እቶት', sid: 'Xaphooma Eoo', en: 'Total Revenue', fr: 'Revenu total', de: 'Gesamtumsatz', it: 'Entrate totali', zh: '总收入', ar: 'إجمالي الإيرادات' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#FF5D5D]" />
            <span>{tText({ am: 'የተመዘገቡ ወጪዎች', or: 'Baasii Galmaa’e', ti: 'ዝተመዝገበ ወጻኢታት', sid: 'Maareekkantino Fulo', en: 'Total Expenses', fr: 'Dépenses totales', de: 'Gesamtausgaben', it: 'Spese totali', zh: '总支出', ar: 'إجمالي المصروفات' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#00F5FF]" />
            <span>{tText({ am: 'የተጣራ ትርፍ', or: 'Bu’aa Qulqulluu', ti: 'ጽሩይ መኽሰብ', sid: 'Quraawe Tirfe', en: 'Net Profit', fr: 'Bénéfice net', de: 'Reingewinn', it: 'Utile netto', zh: '净利润', ar: 'صافي الربح' })}</span>
          </div>
        </div>

      </div>

      {/* THREE BENTO WIDGETS COLUMN ROW */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isRtl ? 'text-right' : 'text-left'}`}>
        
        {/* WIDGET 1: REVENUE PIPELINE BY SOURCE */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[8px] bg-amber-500/10 text-amber-400 font-mono font-black uppercase px-2 py-0.5 rounded">
                {tText({ am: 'ምንጮች', or: 'MADDA', ti: 'ምንጭታት', sid: 'BUIICHO', en: 'PIPELINE', fr: 'SOURCES', de: 'KANÄLE', it: 'FONTI', zh: '渠道', ar: 'المصادر' })}
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1.5">
                {tText({
                  am: '📊 የገቢና የክፍያ ምንጮች ድልድል',
                  or: '📊 QOODAMSA MADDA GALII FI KAFFALTII',
                  ti: '📊 ክፍፍል ምንጭታት እቶትን ክፍሊትን',
                  sid: '📊 EOONNA BAATU BUIICHO BEESHSHO',
                  en: 'REVENUE PIPELINE BY SOURCE',
                  fr: 'SOURCES DE REVENUS',
                  de: 'UMSATZQUELLEN',
                  it: 'FONTI DI ENTRATA',
                  zh: '按来源划分的收入管道',
                  ar: 'مصادر الإيرادات والدفع',
                })}
              </h4>
            </div>

            <div className="space-y-3.5">
              {/* Source 1: Cash Payments */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">💵 {tText({ am: 'በጥሬ ገንዘብ', or: 'Maallaqa Callaa', ti: 'ብጥረ ገንዘብ', sid: 'Angaani Baato', en: 'Cash Payments', fr: 'Espèces', de: 'Barzahlung', it: 'Contanti', zh: '现金支付', ar: 'الدفع نقداً' })}</span>
                  <span className="text-[#C1FF00] font-black">{cashPct}% ({cashPayments.toLocaleString()} {currency})</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-[#C1FF00]" style={{ width: `${cashPct}%` }} />
                </div>
              </div>

              {/* Source 2: Bank Transfers */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">💳 {tText({ am: 'በባንክ ዝውውር', or: 'Baankiin', ti: 'ብባንኪ ዝውውር', sid: 'Baankete Soorro', en: 'Bank Transfers', fr: 'Virements', de: 'Überweisung', it: 'Bonifici', zh: '银行转账', ar: 'تحويل بنكي' })}</span>
                  <span className="text-sky-400 font-black">{bankPct}% ({bankPayments.toLocaleString()} {currency})</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-sky-400" style={{ width: `${bankPct}%` }} />
                </div>
              </div>

              {/* Source 2b: Chapa Online Payments */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">⚡ {tText({ am: 'በቻፓ (Chapa)', or: 'Chapa', ti: 'ብቻፓ (Chapa)', sid: 'Chapa', en: 'Chapa Payments', fr: 'Chapa', de: 'Chapa', it: 'Chapa', zh: 'Chapa 支付', ar: 'تشابا' })}</span>
                  <span className="text-purple-400 font-black">{chapaPct}% ({chapaPayments.toLocaleString()} {currency})</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400" style={{ width: `${chapaPct}%` }} />
                </div>
              </div>

              {/* Source 3: Room Bookings Share */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">🛎️ {tText({ am: 'የአልጋ/ክፍል ኪራይ', or: 'Kireessaa Kutaalee', ti: 'ክራይ ክፍልታት', sid: 'Kifillate Kira', en: 'Bedroom Bookings Share', fr: 'Chambres', de: 'Zimmerbuchungen', it: 'Camere', zh: '客房预订占比', ar: 'حجوزات الغرف' })}</span>
                  <span className="text-[#00F5FF] font-black">{roomSharePct}% ({totalRoomSales.toLocaleString()} {currency})</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-[#00F5FF]" style={{ width: `${roomSharePct}%` }} />
                </div>
              </div>

              {/* Source 4: Food & Beverage Order Share */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">🍔 {tText({ am: 'የምግብና መጠጥ ሽያጭ', or: 'Nyaataa fi Dhugaatii', ti: 'ሽያጥ ምግብን መስተን', sid: 'Sagaletenna Agattote', en: 'Food & Beverage Orders', fr: 'Restauration', de: 'Speisen & Getränke', it: 'Cibo e Bevande', zh: '餐饮订单占比', ar: 'طلبات الطعام والشراب' })}</span>
                  <span className="text-emerald-400 font-black">{foodSharePct}% ({totalOrderSales.toLocaleString()} {currency})</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-600 to-emerald-400" style={{ width: `${foodSharePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-stone-500 uppercase">
            <span>{tText({ am: 'ቀጥታ የሽያጭ ትስስር ንቁ ነው', or: 'Walitti hidhamiinsi gurgurtaa hojjeta', ti: 'ቀጥታ መራኸቢ ሽያጥ ንጡፍ እዩ', sid: 'Soore hirroote xaadooshshi loosanno', en: 'Direct Sales Integration active', fr: 'Intégration ventes directe active', de: 'Direkte Umsatzintegration aktiv', it: 'Integrazione vendite diretta attiva', zh: '直接销售集成已激活', ar: 'التكامل المباشر للمبيعات نشط' })}</span>
          </div>
        </div>

        {/* WIDGET 2: PRODUCT CATEGORY DISTRIBUTION (Donut Chart) */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[8px] bg-[#C1FF00]/10 text-[#C1FF00] font-mono font-black uppercase px-2 py-0.5 rounded">
                {tText({ am: 'ምድቦች', or: 'RAMADDII', ti: 'ምድባት', sid: 'GAAMUBBA', en: 'CATEGORIES', fr: 'CATÉGORIES', de: 'KATEGORIEN', it: 'CATEGORIE', zh: '分类', ar: 'الفئات' })}
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1.5">
                {tText({
                  am: '🍽️ የሽያጭ አገልግሎቶች ድልድል',
                  or: '🍽️ QOODAMSA TAJAAJILA LOOMII',
                  ti: '🍽️ ክፍፍል ኣገልግሎታት ሽያጥ',
                  sid: '🍽️ HIRROO OWAANTE BEESHSHO',
                  en: 'PRODUCT DISTRIBUTION',
                  fr: 'RÉPARTITION PRODUITS',
                  de: 'PRODUKTVERTEILUNG',
                  it: 'DISTRIBUZIONE PRODOTTI',
                  zh: '产品分布',
                  ar: 'توزيع المنتجات والخدمات',
                })}
              </h4>
            </div>

            <div className="flex items-center gap-4 py-2">
              {/* Responsive SVG Donut Chart */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1a1a1a" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#C1FF00"
                    strokeWidth="3.5"
                    strokeDasharray={`${foodSharePct} ${100 - foodSharePct}`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#00F5FF"
                    strokeWidth="3.5"
                    strokeDasharray={`${roomSharePct} ${100 - roomSharePct}`}
                    strokeDashoffset={`-${foodSharePct}`}
                  />
                </svg>
                
                {/* Center text */}
                <div className="absolute flex flex-col items-center justify-center text-center leading-none">
                  <span className="text-[12px] font-black text-white font-mono">100%</span>
                  <span className="text-[6.5px] uppercase font-mono text-stone-500 font-bold mt-0.5">Papyrus</span>
                </div>
              </div>

              {/* Side Legend */}
              <div className="flex-1 space-y-2 text-[10px] font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C1FF00]" />
                    <span className="text-stone-300">{tText({ am: 'ምግብና መጠጥ', or: 'Nyaata & Dhug.', ti: 'ምግብን መስተን', sid: 'Sagale & Agatto', en: 'F&B', fr: 'Restauration', de: 'Speisen & Getr.', it: 'Cibo e Bev.', zh: '餐饮', ar: 'الطعام والشراب' })}</span>
                  </div>
                  <span className="text-white font-black">{foodSharePct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00F5FF]" />
                    <span className="text-stone-300">{tText({ am: 'አልጋ / ኪራይ', or: 'Kutaalee', ti: 'ክፍልታት', sid: 'Kifilla', en: 'Rooms', fr: 'Chambres', de: 'Zimmer', it: 'Camere', zh: '客房', ar: 'الغرف' })}</span>
                  </div>
                  <span className="text-white font-black">{roomSharePct}%</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-1 mt-1 text-[9px]">
                  <span className="text-stone-500 uppercase font-bold">{tText({ am: 'ጠቅላላ:', or: 'Waliigala:', ti: 'ድምር:', sid: 'Xaphooma:', en: 'Total Val:', fr: 'Total :', de: 'Gesamt:', it: 'Totale:', zh: '总计:', ar: 'الإجمالي:' })}</span>
                  <span className="text-[#C1FF00] font-black">{combinedRevenue.toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-stone-500 uppercase">
            <span>{tText({ am: 'ተለዋዋጭ የምድብ መዝገብ', or: 'Galmee ramaddii jijjiiramaa', ti: 'ተለዋዋጢ መዝገብ ምድባት', sid: 'Gaamu maareekko', en: 'Dynamic category ledger matching', fr: 'Suivi dynamique des catégories', de: 'Dynamischer Kategorieabgleich', it: 'Abbinamento dinamico categorie', zh: '动态分类账目匹配', ar: 'مطابقة ديناميكية لفئات الدفتر' })}</span>
          </div>
        </div>

        {/* WIDGET 3: GUEST DEMOGRAPHICS (GLOBAL REACH) */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[8px] bg-sky-500/10 text-sky-400 font-mono font-black uppercase px-2 py-0.5 rounded">
                {tText({ am: 'ስብጥር', or: 'UMMATA', ti: 'ስብጥር', sid: 'MANNU', en: 'DEMOGRAPHICS', fr: 'DÉMOGRAPHIE', de: 'DEMOGRAFIE', it: 'DEMOGRAFIA', zh: '客源分布', ar: 'التركيبة السكانية' })}
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1.5">
                {tText({
                  am: '👥 የእንግዶች ስብጥርና መገኛ',
                  or: '👥 DHUFTII KEESSUMMOOTAA',
                  ti: '👥 መበገሲ ኣጋይሽ',
                  sid: '👥 WOSINCHU DAGANNO BAYICHO',
                  en: 'GUEST DEMOGRAPHICS',
                  fr: 'ORIGINE DES CLIENTS',
                  de: 'GÄSTEDEMOGRAFIE',
                  it: 'PROVENIENZA OSPITI',
                  zh: '宾客来源分布',
                  ar: 'التركيبة الديموغرافية للضيوف',
                })}
              </h4>
            </div>

            <div className="space-y-2.5">
              {/* Region 1: Addis Ababa */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span>🇪🇹</span>
                  <span className="text-stone-300 font-medium">{tText({ am: 'አዲስ አበባ', or: 'Finfinnee', ti: 'ኣዲስ ኣበባ', sid: 'Addis Ababa', en: 'Addis Ababa', fr: 'Addis-Abeba', de: 'Addis Abeba', it: 'Addis Abeba', zh: '亚的斯亚贝巴', ar: 'أديس أبابا' })}</span>
                </div>
                <span className="text-white font-black">65%</span>
              </div>
              <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '65%' }} />
              </div>

              {/* Region 2: Hawassa & Regional */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span>🇪🇹</span>
                  <span className="text-stone-300 font-medium">{tText({ am: 'ሀዋሳ እና ክልሎች', or: 'Hawaasaa fi Naannoo', ti: 'ሃዋሳን ከባብን', sid: 'Hawaasanna Qooxeesso', en: 'Hawassa & Regional', fr: 'Hawassa & Régions', de: 'Hawassa & Region', it: 'Hawassa e Regioni', zh: '阿瓦萨及周边地区', ar: 'هواسا والأقاليم' })}</span>
                </div>
                <span className="text-white font-black">20%</span>
              </div>
              <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-[#C1FF00]" style={{ width: '20%' }} />
              </div>

              {/* Region 3: International Travelers */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span>🌍</span>
                  <span className="text-stone-300 font-medium">{tText({ am: 'ዓለም አቀፍ እንግዶች', or: 'Keessummoota Biyya Alaa', ti: 'ዓለምለኸ ኣጋይሽ', sid: 'Kalqete Wosincho', en: 'International Guests', fr: 'Clients internationaux', de: 'Internationale Gäste', it: 'Ospiti internazionali', zh: '国际旅客', ar: 'الضيوف الدوليون' })}</span>
                </div>
                <span className="text-white font-black">15%</span>
              </div>
              <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: '15%' }} />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-stone-500 uppercase">
            <span>{tText({ am: 'ቀጥታ የእንግዶች መዝገብ ትስስር', or: 'Galmeen keessummootaa wal-simsiifame', ti: 'ቀጥታ መዝገብ ኣጋይሽ', sid: 'Wosinchu maareekko xaadooshshi', en: 'Direct guest register synchronization', fr: 'Synchronisation du registre clients', de: 'Direkte Gästeregister-Synchronisierung', it: 'Sincronizzazione registro ospiti', zh: '实时宾客登记同步', ar: 'مزامنة مباشرة لسجل الضيوف' })}</span>
          </div>
        </div>

      </div>

      {/* EXPENSES REGISTRATION & TAX CONTROL BOARD (SYSTEM CONTROLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* PANEL 1: Dynamic Taxes & Service Charge */}
        <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <span className="text-lg">⚙️</span>
              <h4 className="text-xs font-black uppercase text-white tracking-widest">
                {tText({
                  am: 'የሎጅ ታክስ እና አገልግሎት ክፍያ መለኪያ',
                  or: 'Qindaa’ina Taaksii fi Tajaajilaa',
                  ti: 'ምምሕዳር ታክስን ናይ ኣገልግሎት ክፍሊትን',
                  sid: 'Taakiseetenna Owaatote Qixxaawo',
                  en: 'TAX & SC SETTINGS',
                  fr: 'PARAMÈTRES TAXES & SERVICE',
                  de: 'STEUER- & SERVICE-EINSTELLUNGEN',
                  it: 'IMPOSTAZIONI TASSE & SERVIZIO',
                  zh: '税费与服务费设置',
                  ar: 'إعدادات الضريبة ورسوم الخدمة'
                })}
              </h4>
            </div>
            
            <p className="text-[10px] text-stone-400 uppercase font-mono leading-relaxed">
              {tText({
                am: 'እዚህ ጋር የምታዘምኗቸው ዋጋዎች እንግዶች በሚያዙበት ሰዓት ቶታል ሂሳብ ላይ አስተማማኝ በሆነ ሁኔታ ተደምረው ይታያሉ።',
                or: 'Gatiin asitti jijjiirtan yeroo keessummoonni ajajan herrega waliigalaatti ofumaan dabalama.',
                ti: 'ኣብዚ እተመሓይሽዎ መጠን ኣጋይሽ ክኣዝዙ ከለዉ ኣብ ጠቕላላ ሕሳብ ብቀጥታ ይውሰኽ።',
                sid: 'Kowiinni bikkissinanni waagi wosinnu hajajanno woyite xaphoomu kiiro aana leellanno.',
                en: 'Modify tax rate parameters that automatically combine during customer checkout billing calculation.',
                fr: 'Modifiez les taux de taxe appliqués automatiquement lors du calcul de l’addition.',
                de: 'Passen Sie Steuer- und Servicegebührensätze an, die automatisch beim Checkout berechnet werden.',
                it: 'Modifica le aliquote fiscali calcolate automaticamente durante il pagamento.',
                zh: '调整结账时自动计算的税率与服务费参数。',
                ar: 'تعديل معدلات الضريبة ورسوم الخدمة المطبقة تلقائياً عند الدفع.'
              })}
            </p>

            <div className="space-y-4 pt-1">
              {/* Service Charge Rate */}
              <div className="bg-black/40 p-3.5 border border-white/5 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[8px] text-stone-400 block font-mono uppercase tracking-wider">
                    {tText({
                      am: 'የአገልግሎት ክፍያ %',
                      or: 'KAFFALTII TAJAAJILAA %',
                      ti: 'ክፍሊት ኣገልግሎት %',
                      sid: 'OWAATOTE KIIRO %',
                      en: 'SERVICE RATE %',
                      fr: 'TAUX DE SERVICE %',
                      de: 'SERVICEGEBÜHR %',
                      it: 'TASSA SERVIZIO %',
                      zh: '服务费率 %',
                      ar: 'نسبة رسوم الخدمة %'
                    })}:
                  </span>
                  <span className="font-mono font-black text-sm text-[#C1FF00]">{serviceChargeRate}%</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAdjustRate('sc', -1)}
                    className="w-8 h-8 rounded-lg bg-black hover:bg-white/10 flex items-center justify-center font-bold border border-white/10 hover:border-white/20 text-white transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleAdjustRate('sc', 1)}
                    className="w-8 h-8 rounded-lg bg-black hover:bg-white/10 flex items-center justify-center font-bold border border-white/10 hover:border-white/20 text-white transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* VAT Rate */}
              <div className="bg-black/40 p-3.5 border border-white/5 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[8px] text-stone-400 block font-mono uppercase tracking-wider">
                    {tText({
                      am: 'ታክስ ቫት %',
                      or: 'TAAKSII VAT %',
                      ti: 'ታክሲ ቫት %',
                      sid: 'VAT TAAKISE %',
                      en: 'VAT RATE %',
                      fr: 'TAUX DE TVA %',
                      de: 'MWST.-SATZ %',
                      it: 'ALIQUOTA IVA %',
                      zh: '增值税率 %',
                      ar: 'نسبة ضريبة القيمة المضافة %'
                    })}:
                  </span>
                  <span className="font-mono font-black text-sm text-[#C1FF00]">{vatRate}%</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAdjustRate('vat', -1)}
                    className="w-8 h-8 rounded-lg bg-black hover:bg-white/10 flex items-center justify-center font-bold border border-white/10 hover:border-white/20 text-white transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleAdjustRate('vat', 1)}
                    className="w-8 h-8 rounded-lg bg-black hover:bg-white/10 flex items-center justify-center font-bold border border-white/10 hover:border-white/20 text-white transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-stone-500 uppercase">
            <span>
              {tText({
                am: 'አጠቃላይ ቅንብሮች ተመሳስለዋል',
                or: 'Qindaa’inni waliigalaa wal-simeera',
                ti: 'ሓፈሻዊ ምምዕርራያት ተመሳሲሎም',
                sid: 'Xaphoomu qixxaawo xaadoommino',
                en: 'Global configuration synchronized',
                fr: 'Configuration globale synchronisée',
                de: 'Globale Konfiguration synchronisiert',
                it: 'Configurazione globale sincronizzata',
                zh: '全局配置已同步',
                ar: 'تمت مزامنة الإعدادات العامة'
              })}
            </span>
          </div>
        </div>

        {/* PANEL 2: Register New Expense Form */}
        <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <span className="text-lg">💸</span>
              <h4 className="text-xs font-black uppercase text-white tracking-widest">
                {tText({
                  am: 'አዲስ የወጪ ሂሳብ መመዝገቢያ',
                  or: 'BAASII HAARAA GALMEESSI',
                  ti: 'ሓዱሽ ወጻኢ መመዝገቢ',
                  sid: 'HAARO FULO MAAREEKKI',
                  en: 'REGISTER NEW OUTFLOW',
                  fr: 'ENREGISTRER UNE DÉPENSE',
                  de: 'NEUE AUSGABE ERFASSEN',
                  it: 'REGISTRA NUOVA SPESA',
                  zh: '登记新支出',
                  ar: 'تسجيل مصروف جديد'
                })}
              </h4>
            </div>

            <p className="text-[10px] text-stone-400 uppercase font-mono leading-relaxed max-w-2xl">
              {tText({
                am: 'የሎጁን ማናቸውንም የዕለት ተዕለት ወጪዎችን (የኩሽና ግብዓቶች ግዥ፣ የመብራትና ውሃ ክፍያዎች፣ የሰራተኛ ኪራይ/ደሞዝ ወዘተ) እዚህ ይመዝግቡ።',
                or: 'Baasii guyyaa guyyaa (bittaa nyaataa, ibsaa fi bishaan, mindaa hojjettootaa kkf) asitti galmeessaa.',
                ti: 'ናይቲ ሎጅ ዕለታዊ ወጻኢታት (ግዝኢ ናውቲ ክሽነ፣ ክፍሊት ማይን ኤሌክትሪክን፣ ደሞዝ ሰራሕተኛታት ወዘተ) ኣብዚ መዝግቡ።',
                sid: 'Loojetenni barru baasi (kushinete miinja, caabbichonna wayi kiiro, loosaasinchu baatooshshe wkl.) kowiinni maareekki.',
                en: 'Log and track any operating cost, supplier pay, salaries or utility expenses. Automatically merges with financial ledger charts.',
                fr: 'Enregistrez les coûts opérationnels, fournisseurs, salaires ou factures. Fusion automatique avec le grand livre.',
                de: 'Erfassen Sie Betriebskosten, Lieferantenzahlungen, Gehälter oder Nebenkosten automatisch im Hauptbuch.',
                it: 'Registra costi operativi, fornitori, stipendi o utenze. Integrazione automatica nei grafici contabili.',
                zh: '记录并追踪运营成本、供应商付款、薪资及水电费用，自动同步至财务总账。',
                ar: 'سجّل وتابع كافة التكاليف التشغيلية والرواتب والفواتير ليتم دمجها تلقائياً في دفتر الحسابات.'
              })}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.querySelector('#exp-title') as HTMLInputElement).value;
                const category = (form.querySelector('#exp-category') as HTMLSelectElement).value;
                const amount = Number((form.querySelector('#exp-amount') as HTMLInputElement).value);
                const date = (form.querySelector('#exp-date') as HTMLInputElement).value;
                const notes = (form.querySelector('#exp-notes') as HTMLTextAreaElement).value;
                handleAddExpense(title, category, amount, date, notes);
                form.reset();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                    {tText({
                      am: 'የወጪው ርዕስ',
                      or: 'MATA DUREE BAASII',
                      ti: 'ኣርእስቲ ወጻኢ',
                      sid: 'FULOTE UMO',
                      en: 'EXPENSE DESCRIPTION',
                      fr: 'DESCRIPTION DE LA DÉPENSE',
                      de: 'AUSGABENBESCHREIBUNG',
                      it: 'DESCRIZIONE SPESA',
                      zh: '支出说明',
                      ar: 'وصف المصروف'
                    })}
                  </label>
                  <input
                    type="text"
                    id="exp-title"
                    required
                    placeholder={tText({
                      am: 'ለምሳሌ፡ የኩሽና ስጋና ሽንኩርት ግዢ',
                      or: 'Fkn. Bittaa foonii fi shunkurtii',
                      ti: 'ንኣብነት፡ ግዝኢ ስጋን ሽጉርትን ክሽነ',
                      sid: 'Lawishsha: Kushinete maalaanna shunkurti hidha',
                      en: 'e.g. Kitchen meat & onion purchase',
                      fr: 'ex. Achat de viande et oignons',
                      de: 'z. B. Einkauf von Fleisch & Zwiebeln',
                      it: 'es. Acquisto carne e cipolle',
                      zh: '例如：厨房肉类与洋葱采购',
                      ar: 'مثال: شراء لحوم وبصل للمطبخ'
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-xs font-bold p-3 outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                      {tText({
                        am: 'ምድብ',
                        or: 'RAMADDII',
                        ti: 'ምድብ',
                        sid: 'GAAMO',
                        en: 'CATEGORY',
                        fr: 'CATÉGORIE',
                        de: 'KATEGORIE',
                        it: 'CATEGORIA',
                        zh: '分类',
                        ar: 'الفئة'
                      })}
                    </label>
                    <select
                      id="exp-category"
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-xs font-bold p-3 outline-none focus:border-[#C1FF00]"
                    >
                      <option value="Kitchen Supply">{tText({ am: 'ማቴሪያል ግዢ', or: 'Dhiyeessii Kushinaa', ti: 'ግዝኢ ናውቲ ክሽነ', sid: 'Kushinete Miinja', en: 'Kitchen Supplies', fr: 'Fournitures de cuisine', de: 'Küchenbedarf', it: 'Forniture cucina', zh: '厨房采购', ar: 'مستلزمات المطبخ' })}</option>
                      <option value="Utilities">{tText({ am: 'መገልገያ ክፍያ', or: 'Kaffaltii Tajaajilaa', ti: 'ክፍሊት ኣገልግሎት', sid: 'Wayinna Caabbichu Kiiro', en: 'Utilities', fr: 'Services publics', de: 'Nebenkosten', it: 'Utenze', zh: '水电杂费', ar: 'المرافق والخدمات' })}</option>
                      <option value="Salary">{tText({ am: 'የሰራተኛ ደሞዝ', or: 'Mindaa Hojjettootaa', ti: 'ደሞዝ ሰራሕተኛታት', sid: 'Loosaasinchu Baatooshshe', en: 'Salary', fr: 'Salaires', de: 'Gehälter', it: 'Stipendi', zh: '员工薪资', ar: 'الرواتب' })}</option>
                      <option value="Maintenance">{tText({ am: 'ጥገና', or: 'Suphaa', ti: 'ጽገና', sid: 'Gatangisha', en: 'Maintenance', fr: 'Maintenance', de: 'Wartung', it: 'Manutenzione', zh: '设备维护', ar: 'الصيانة' })}</option>
                      <option value="Stationery">{tText({ am: 'ጽሕፈት መሳሪያ', or: 'Meeshaa Barreeffamaa', ti: 'ናውቲ ጽሕፈት', sid: 'Borreessate Miinja', en: 'Stationery', fr: 'Papeterie', de: 'Bürobedarf', it: 'Cancelleria', zh: '办公文具', ar: 'القرطاسية' })}</option>
                      <option value="Other">{tText({ am: 'ሌላ ወጪ', or: 'Kan Biraa', ti: 'ካልእ ወጻኢ', sid: 'Wole Baasi', en: 'Other', fr: 'Autre', de: 'Sonstiges', it: 'Altro', zh: '其他支出', ar: 'أخرى' })}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                      {tText({
                        am: 'መጠን ({currency})',
                        or: 'HAMMA ({currency})',
                        ti: 'መጠን ({currency})',
                        sid: 'BIKKO ({currency})',
                        en: 'AMOUNT ({currency})',
                        fr: 'MONTANT ({currency})',
                        de: 'BETRAG ({currency})',
                        it: 'IMPORTO ({currency})',
                        zh: '金额 ({currency})',
                        ar: 'المبلغ ({currency})'
                      }, { currency })}
                    </label>
                    <input
                      type="number"
                      id="exp-amount"
                      required
                      min="1"
                      placeholder="1500"
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-[#FF5D5D] font-mono text-xs font-black p-3 outline-none focus:border-[#C1FF00]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                    {tText({
                      am: 'የወጣበት ቀን',
                      or: 'GUYYAA BAASII',
                      ti: 'ዕለት ወጻኢ',
                      sid: 'FULOTE BARRA',
                      en: 'EXPENSE DATE',
                      fr: 'DATE DE LA DÉPENSE',
                      de: 'AUSGABEDATUM',
                      it: 'DATA SPESA',
                      zh: '支出日期',
                      ar: 'تاريخ المصروف'
                    })}
                  </label>
                  <input
                    type="date"
                    id="exp-date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-[#C1FF00] font-mono text-xs font-bold p-3 outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">
                    {tText({
                      am: 'ተጨማሪ ማስታወሻ',
                      or: 'YAADANNOO DABALATAA',
                      ti: 'ተወሳኺ መዘኻኸሪ',
                      sid: 'LEDOTE QAAQISHSHA',
                      en: 'NOTES',
                      fr: 'NOTES',
                      de: 'NOTIZEN',
                      it: 'NOTE',
                      zh: '备注',
                      ar: 'ملاحظات'
                    })}
                  </label>
                  <textarea
                    id="exp-notes"
                    rows={1}
                    placeholder={tText({
                      am: 'የግዢ ደረሰኝ ቁጥር ወይም ዝርዝር መግለጫ ካለ...',
                      or: 'Lakkoofsa nagahee ykn ibsa dabalataa yoo jiraate...',
                      ti: 'ቁጽሪ ደረሰኝ ወይ ዝርዝር መብርሂ እንተሃልዩ...',
                      sid: 'Rasiidete kiiro woy tirtirro nooro...',
                      en: 'Receipt number or detailed notes if any...',
                      fr: 'Numéro de reçu ou notes complémentaires...',
                      de: 'Belegnummer oder zusätzliche Notizen...',
                      it: 'Numero ricevuta o note dettagliate...',
                      zh: '如有收据编号或详细说明请填写...',
                      ar: 'رقم الإيصال أو تفاصيل إضافية إن وجدت...'
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-xs p-3 outline-none focus:border-[#C1FF00]"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full h-11 bg-[#FF5D5D] hover:bg-[#ff4444] text-white font-mono text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer rounded-xl shadow-[0_4px_12px_rgba(255,93,93,0.15)]"
                >
                  {tText({
                    am: 'የወጪ ሂሳብ መዝግብ 💸',
                    or: 'BAASII GALMEESSI 💸',
                    ti: 'ወጻኢ መዝግብ 💸',
                    sid: 'FULO MAAREEKKI 💸',
                    en: 'RECORD EXPENSE OUTFLOW 💸',
                    fr: 'ENREGISTRER LA DÉPENSE 💸',
                    de: 'AUSGABE VERBUCHEN 💸',
                    it: 'REGISTRA USCITA 💸',
                    zh: '记录支出 💸',
                    ar: 'تسجيل المصروف 💸'
                  })}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* UNIFIED SALES GENERAL LEDGER & RECEIPTS AUDIT TABLE */}
      <div className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl mt-4 text-left">
        
        {/* Ledger Header & Timeframe switches */}
        <div className="bg-[#181818] px-5 py-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#C1FF00] rounded-full animate-pulse" />
              <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                🧾 {tText({
                  am: 'የዕለታዊ፣ ወርሃዊ እና ዓመታዊ ሂሳብ መዝገብ',
                  or: 'GALMEE HERREGA GUYYAA, JI’AA FI WAGGAA',
                  ti: 'ዕለታዊ፣ ወርሓዊን ዓመታዊን መዝገብ ሕሳብ',
                  sid: 'BARRU, AGANUNNA DIRU KIIRO MAAREEKKO',
                  en: 'UNIFIED SALES GENERAL LEDGER',
                  fr: 'GRAND LIVRE GÉNÉRAL DES VENTES',
                  de: 'VEREINIGTES VERKAUFSHAUPTBUCH',
                  it: 'LIBRO MASTRO GENERALE VENDITE',
                  zh: '统一销售总账',
                  ar: 'دفتر الأستاذ العام للمبيعات'
                })}
              </h3>
            </div>
            <p className="font-mono text-[9px] uppercase text-[#C1FF00] tracking-wider mt-1">
              {tText({
                am: 'በቀን፣ በወር፣ በዓመት እና በደረሰኝ ማረጋገጫ የተደራጀ',
                or: 'Guyyaa, Ji’a, Waggaa fi Mirkaneessa Nagaheetiin qindaa’e',
                ti: 'ብዕለት፣ ብወርሒ፣ ብዓመትን ብመረጋገጺ ደረሰኝን ዝተወደበ',
                sid: 'Barrunni, aganunni, dirunninna rasiidete buuxonni qixxaawe',
                en: 'Auto-categorized by Day, Month, Year & Audit Proof Screenshot Verifications',
                fr: 'Catégorisé par Jour, Mois, Année & Vérification des reçus',
                de: 'Automatisch nach Tag, Monat, Jahr & Belegprüfung sortiert',
                it: 'Categorizzato per Giorno, Mese, Anno e Verifica Ricevute',
                zh: '按日、月、年及收据凭证审核自动分类',
                ar: 'مصنف تلقائياً حسب اليوم والشهر والسنة والتحقق من الإيصالات'
              })}
            </p>
          </div>
          
          {/* Daily / Monthly / Yearly tabs */}
          <div className="flex bg-black p-1 rounded-xl border border-white/10 gap-1 shrink-0">
            <button
              onClick={() => setLedgerFilterTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer ${
                ledgerFilterTab === 'daily' ? 'bg-[#C1FF00] text-black font-black shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              📅 {tText({ am: 'በቀን', or: 'Guyyaa', ti: 'ብዕለት', sid: 'Barrunni', en: 'Daily', fr: 'Quotidien', de: 'Täglich', it: 'Giornaliero', zh: '按日', ar: 'يومي' })}
            </button>
            <button
              onClick={() => setLedgerFilterTab('monthly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer ${
                ledgerFilterTab === 'monthly' ? 'bg-[#C1FF00] text-black font-black shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              🌙 {tText({ am: 'በወር', or: 'Ji’aa', ti: 'ብወርሒ', sid: 'Aganunni', en: 'Monthly', fr: 'Mensuel', de: 'Monatlich', it: 'Mensile', zh: '按月', ar: 'شهري' })}
            </button>
            <button
              onClick={() => setLedgerFilterTab('yearly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer ${
                ledgerFilterTab === 'yearly' ? 'bg-[#C1FF00] text-black font-black shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              🎄 {tText({ am: 'በዓመት', or: 'Waggaa', ti: 'ብዓመት', sid: 'Dirunni', en: 'Yearly', fr: 'Annuel', de: 'Jährlich', it: 'Annuale', zh: '按年', ar: 'سنوي' })}
            </button>
          </div>
        </div>

        {/* Ledger content */}
        <div className="p-5">
          
          {/* 1. DAILY VIEW */}
          {ledgerFilterTab === 'daily' && (() => {
            const allDatesSet = new Set<string>();
            orders.forEach(x => allDatesSet.add(normalizeRecordDateToIso(x.date) || todayIso));
            roomBookings.forEach(x => allDatesSet.add(normalizeRecordDateToIso(x.checkInDate) || todayIso));
            expenses.forEach(x => allDatesSet.add(normalizeRecordDateToIso(x.date) || todayIso));

            const sortedDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));

            if (sortedDates.length === 0) {
              return (
                <div className="text-center py-16 font-mono text-white/30 text-xs uppercase border border-dashed border-white/5 rounded-2xl">
                  {tText({
                    am: 'በዚህ መዝገብ ውስጥ ምንም የግብይት መረጃ የለም።',
                    or: 'Galmeen daldalaa tokkollee hin argamne.',
                    ti: 'ኣብዚ መዝገብ ዝኾነ ናይ ልውውጥ መረዳእታ የለን።',
                    sid: 'Konne maareekkora woyyaawu millimillo dino.',
                    en: 'No transaction logs available inside this ledger.',
                    fr: 'Aucun journal de transaction disponible dans ce grand livre.',
                    de: 'Keine Transaktionsprotokolle in diesem Hauptbuch vorhanden.',
                    it: 'Nessun registro di transazioni disponibile in questo libro mastro.',
                    zh: '此账簿中暂无交易记录。',
                    ar: 'لا توجد سجلات معاملات في هذا الدفتر.'
                  })}
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {sortedDates.map(dateKey => {
                  const dayDetails = getAmharicDayOfDate(dateKey);
                  const dailyOrders = orders.filter(x => (normalizeRecordDateToIso(x.date) || todayIso) === dateKey);
                  const dailyBookings = roomBookings.filter(x => (normalizeRecordDateToIso(x.checkInDate) || todayIso) === dateKey);
                  const dailyExpenses = expenses.filter(x => (normalizeRecordDateToIso(x.date) || todayIso) === dateKey);

                  const orderSum = dailyOrders.reduce((sum, ord) => sum + ord.total, 0);
                  const bookingSum = dailyBookings.reduce((sum, bk) => sum + (bk.pricePerNight || 0), 0);
                  const totalDailyRev = orderSum + bookingSum;
                  const totalDailyExp = dailyExpenses.reduce((sum, ex) => sum + ex.amount, 0);
                  const totalDailyNet = totalDailyRev - totalDailyExp;

                  const cashSum = dailyOrders.filter(x => x.payment === 'cash').reduce((sum, ord) => sum + ord.total, 0);
                  const bankSum = dailyOrders.filter(x => x.payment === 'bank').reduce((sum, ord) => sum + ord.total, 0);
                  const chapaSum = dailyOrders.filter(x => x.payment === 'chapa').reduce((sum, ord) => sum + ord.total, 0);

                  return (
                    <div key={dateKey} className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-3.5 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-[#C1FF00] text-black text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded">
                              {dayDetails.dayName} ({tText({ am: 'ቀን', or: 'GUYYAA', ti: 'መዓልቲ', sid: 'BARRA', en: 'WEEKDAY', fr: 'JOUR', de: 'WOCHENTAG', it: 'GIORNO', zh: '星期', ar: 'اليوم' })})
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">{dateKey}</span>
                          </div>
                          <h4 className="text-xs font-black text-white/90 uppercase tracking-wide mt-1">
                            📅 {dayDetails.formattedDate}
                          </h4>
                        </div>
                        
                        <div className="flex gap-4 font-mono text-xs text-left sm:text-right">
                          <div>
                            <span className="text-[8px] text-emerald-400 font-bold uppercase block">
                              {tText({ am: 'ገቢ', or: 'GALII', ti: 'ኣታዊ', sid: 'EO', en: 'REVENUE', fr: 'REVENU', de: 'UMSATZ', it: 'RICAVI', zh: '收入', ar: 'الإيرادات' })}
                            </span>
                            <span className="font-black text-emerald-400">+{totalDailyRev.toLocaleString()} {currency}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#FF5D5D] font-bold uppercase block">
                              {tText({ am: 'ወጪ', or: 'BAASII', ti: 'ወጻኢ', sid: 'FULO', en: 'EXPENSES', fr: 'DÉPENSES', de: 'AUSGABEN', it: 'SPESE', zh: '支出', ar: 'المصروفات' })}
                            </span>
                            <span className="font-black text-[#FF5D5D]">-{totalDailyExp.toLocaleString()} {currency}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#00f5ff] font-bold uppercase block">
                              {tText({ am: 'የተጣራ', or: 'BU’AA QULQULLUU', ti: 'ጽሩይ', sid: 'KEERU', en: 'NET DAY', fr: 'NET DU JOUR', de: 'TAGESNETTO', it: 'NETTO GIORNO', zh: '日净收益', ar: 'صافي اليوم' })}
                            </span>
                            <span className={`font-black ${totalDailyNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {totalDailyNet.toLocaleString()} {currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cash vs Bank vs Chapa */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[9px] font-mono uppercase bg-white/2">
                        <div className="bg-black/50 p-2 border border-white/5 rounded-lg flex justify-between items-center">
                          <span className="text-stone-400">
                            💵 {tText({ am: 'በጥሬ ገንዘብ', or: 'Maallaqa Callaa', ti: 'ብጥረ ገንዘብ', sid: 'Angaani', en: 'Cash Total', fr: 'Total Espèces', de: 'Bar Gesamt', it: 'Totale Contanti', zh: '现金总计', ar: 'إجمالي النقد' })}:
                          </span>
                          <span className="font-black text-[#C1FF00]">{cashSum.toLocaleString()} {currency}</span>
                        </div>
                        <div className="bg-black/50 p-2 border border-white/5 rounded-lg flex justify-between items-center">
                          <span className="text-stone-400">
                            💳 {tText({ am: 'በባንክ የተላከ', or: 'Baankiidhaan', ti: 'ብባንኪ ዝተላእከ', sid: 'Baanketenni', en: 'Bank Total', fr: 'Total Banque', de: 'Bank Gesamt', it: 'Totale Banca', zh: '银行转账总计', ar: 'إجمالي التحويل البنكي' })}:
                          </span>
                          <span className="font-black text-[#C1FF00]">{bankSum.toLocaleString()} {currency}</span>
                        </div>
                        <div className="bg-black/50 p-2 border border-white/5 rounded-lg flex justify-between items-center">
                          <span className="text-stone-400">
                            ⚡ {tText({ am: 'በቻፓ (Chapa)', or: 'Chapa', ti: 'ብቻፓ (Chapa)', sid: 'Chapa', en: 'Chapa Total', fr: 'Total Chapa', de: 'Chapa Gesamt', it: 'Totale Chapa', zh: 'Chapa 总计', ar: 'إجمالي تشابا' })}:
                          </span>
                          <span className="font-black text-purple-300">{chapaSum.toLocaleString()} {currency}</span>
                        </div>
                      </div>

                      {/* Food orders */}
                      {dailyOrders.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-mono text-[#C1FF00] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#C1FF00] rounded-full" />
                            <span>
                              🍔 {tText({ am: 'የምግብና መጠጥ ሽያጭ', or: 'Gurgurtaa Nyaataa fi Dhugaatii', ti: 'መሸጣ መግብን መስተን', sid: 'Sagaletenni Hirro', en: 'F&B Orders', fr: 'Commandes F&B', de: 'Speisen & Getränke', it: 'Ordini F&B', zh: '餐饮订单', ar: 'طلبات الطعام والمشروبات' })} - {dailyOrders.length} {tText({ am: 'ግብይቶች', or: 'Daldala', ti: 'ልውውጥ', sid: 'Millimillo', en: 'TXNS', fr: 'TXNS', de: 'BUCH.', it: 'TRANSAZ.', zh: '笔', ar: 'معاملة' })}
                            </span>
                          </p>
                          <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/5">
                            <table className="w-full text-left font-sans text-xs border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-[9px] font-mono text-stone-400 uppercase">
                                  <th className="p-3">{tText({ am: 'መለያ / ሰዓት', or: 'ID / Sa’aatii', ti: 'መለለዪ / ሰዓት', sid: 'ID / Saate', en: 'ID / Time', fr: 'ID / Heure', de: 'ID / Zeit', it: 'ID / Ora', zh: '编号 / 时间', ar: 'المعرف / الوقت' })}</th>
                                  <th className="p-3">{tText({ am: 'ቦታ', or: 'Bakka', ti: 'ቦታ', sid: 'Darga', en: 'Location', fr: 'Lieu', de: 'Ort', it: 'Posizione', zh: '位置', ar: 'الموقع' })}</th>
                                  <th className="p-3">{tText({ am: 'የታዘዙ ምግቦች', or: 'Nyaata Ajajame', ti: 'ዝተኣዘዙ', sid: 'Hajajammo Sagale', en: 'Ordered Items', fr: 'Articles commandés', de: 'Bestellte Artikel', it: 'Articoli ordinati', zh: '所点菜品', ar: 'الأصناف المطلوبة' })}</th>
                                  <th className="p-3">{tText({ am: 'የክፍያ ዘዴ', or: 'Haala Kaffaltii', ti: 'ኣገባብ ክፍሊት', sid: 'Baatooshshu Doogo', en: 'Method', fr: 'Méthode', de: 'Methode', it: 'Metodo', zh: '付款方式', ar: 'طريقة الدفع' })}</th>
                                  <th className="p-3 text-right">{tText({ am: 'ጠቅላላ', or: 'Waliigala', ti: 'ጠቕላላ', sid: 'Xaphooma', en: 'Total', fr: 'Total', de: 'Gesamt', it: 'Totale', zh: '总计', ar: 'الإجمالي' })}</th>
                                  <th className="p-3 text-center">{tText({ am: 'የደረሰኝ ማረጋገጫ', or: 'Mirkaneessa Nagahee', ti: 'ምርግጋጽ ደረሰኝ', sid: 'Rasiidete Buuxo', en: 'Receipt Verification', fr: 'Vérification reçu', de: 'Belegprüfung', it: 'Verifica ricevuta', zh: '收据审核', ar: 'التحقق من الإيصال' })}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-medium">
                                {dailyOrders.map(ord => (
                                  <tr key={ord.id} className="hover:bg-white/2 transition-colors">
                                    <td className="p-3 font-mono font-bold text-sky-400 select-all">
                                      {ord.id}
                                      <span className="text-[8px] text-stone-400 font-mono block mt-0.5">⏱️ {ord.time}</span>
                                    </td>
                                    <td className="p-3">
                                      <span className="font-black text-white/90 block">{ord.location}</span>
                                      <span className="text-[8px] text-stone-400 font-mono uppercase block">{ord.orderType}</span>
                                    </td>
                                    <td className="p-3 max-w-xs">
                                      <div className="space-y-0.5 text-[11px] text-white/80">
                                        {ord.items.map((it, iIdx) => (
                                          <div key={iIdx}>
                                            • {it.qty} × <span className="font-bold">{it.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3 font-mono">
                                      {ord.payment === 'cash' ? (
                                        <span className="text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.5 border border-emerald-900/30 rounded text-[9px]">
                                          💵 {tText({ am: 'ጥሬ ገንዘብ', or: 'MAALLAQA', ti: 'ጥረ ገንዘብ', sid: 'ANGAANI', en: 'CASH', fr: 'ESPÈCES', de: 'BAR', it: 'CONTANTI', zh: '现金', ar: 'نقداً' })}
                                        </span>
                                      ) : ord.payment === 'chapa' ? (
                                        <span className="text-purple-300 font-bold bg-purple-950/30 px-1.5 py-0.5 border border-purple-700/40 rounded text-[9px]">
                                          ⚡ CHAPA
                                        </span>
                                      ) : (
                                        <div className="space-y-1">
                                          <span className="text-sky-400 font-bold bg-sky-950/20 px-1.5 py-0.5 border border-sky-900/30 rounded block w-fit text-[9px]">
                                            💳 {tText({ am: 'በባንክ', or: 'BAANKII', ti: 'ብባንኪ', sid: 'BAANKE', en: 'TRANSFER', fr: 'VIREMENT', de: 'ÜBERWEISUNG', it: 'BONIFICO', zh: '银行转账', ar: 'تحويل بنكي' })}
                                          </span>
                                          {ord.bankRef && (
                                            <span className="text-[8px] text-[#C1FF00] font-bold block bg-black border border-[#C1FF00]/10 p-1 font-mono">
                                              Txn: {ord.bankRef}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-mono font-black text-white">
                                      {ord.total} {currency}
                                      {ord.tip > 0 && <span className="text-[8px] text-emerald-400 block">+ {ord.tip} {tText({ am: 'ጉርሻ', or: 'Kennoo', ti: 'ቲፕ', sid: 'Hirphino', en: 'Tip', fr: 'Pourboire', de: 'Trinkgeld', it: 'Mancia', zh: '小费', ar: 'بقشيش' })}</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="inline-flex flex-col gap-1.5 items-center justify-center p-1.5 bg-black/40 border border-white/5 rounded-xl w-full max-w-[165px]">
                                        {ord.receiptScreenshot ? (
                                          <div className="space-y-1 w-full text-center">
                                            <button
                                              type="button"
                                              onClick={() => setAdminReceiptPreview({ url: ord.receiptScreenshot!, order: ord })}
                                              className="w-full relative group overflow-hidden border border-white/15 hover:border-[#C1FF00] bg-black max-h-12 flex justify-center rounded cursor-pointer transition-colors"
                                            >
                                              <img
                                                src={ord.receiptScreenshot}
                                                className="h-10 object-contain"
                                                alt="Receipt"
                                                referrerPolicy="no-referrer"
                                              />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setAdminReceiptPreview({ url: ord.receiptScreenshot!, order: ord })}
                                              className="text-[8px] text-[#C1FF00] hover:underline font-bold block w-full font-mono uppercase cursor-pointer"
                                            >
                                              🔍 {tText({ am: 'ሙሉ እይታ', or: 'Guutuu Ilaali', ti: 'ምሉእ ርአ', sid: 'Wo’ma La’i', en: 'Full View', fr: 'Agrandir', de: 'Vollbild', it: 'Intero', zh: '查看大图', ar: 'عرض كامل' })}
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[7.5px] text-stone-400 block">
                                            {tText({ am: 'ፎቶ የለም', or: 'Suuraan hin jiru', ti: 'ስእሊ የለን', sid: 'Misile dino', en: 'No photo', fr: 'Pas de photo', de: 'Kein Foto', it: 'Nessuna foto', zh: '无照片', ar: 'لا توجد صورة' })}
                                          </span>
                                        )}

                                        {ord.payment === 'cash' && (ord.cashierName || ord.cashPaymentCode || typeof ord.cashTenderedAmount === 'number') && (
                                          <div className="w-full text-[7.5px] font-mono text-emerald-300/90 bg-emerald-950/30 border border-emerald-500/20 rounded px-1.5 py-1 text-left space-y-0.5">
                                            {ord.cashPaymentCode && <div className="truncate">Code: {ord.cashPaymentCode}</div>}
                                            {typeof ord.cashTenderedAmount === 'number' && (
                                              <div>
                                                Paid: {ord.cashTenderedAmount} · Chg: {ord.cashChangeAmount ?? Math.max(0, ord.cashTenderedAmount - ord.total)}
                                              </div>
                                            )}
                                            {ord.cashierName && <div className="truncate text-white/75">By: {ord.cashierName}</div>}
                                          </div>
                                        )}

                                        {(ord.confirmed || ord.status === 'Paid' || ord.paymentVerified) ? (
                                          <span className="text-[7.5px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full block font-bold">
                                            ✔️ {tText({ am: 'ተረጋግጧል', or: 'Mirkanaa’e', ti: 'ተረጋጊጹ', sid: 'Buuxamino', en: 'Verified', fr: 'Vérifié', de: 'Geprüft', it: 'Verificato', zh: '已核实', ar: 'تم التحقق' })}
                                          </span>
                                        ) : ord.payment !== 'cash' ? (
                                          <div className="grid grid-cols-2 gap-1 w-full pt-1">
                                            <button
                                              onClick={() => handleConfirmOrderPayment(ord.id, true)}
                                              className="bg-[#C1FF00] hover:bg-white text-black font-mono font-black text-[7px] py-1 px-1 rounded-lg transition-colors cursor-pointer text-center"
                                            >
                                              {tText({ am: 'እሺ', or: 'EYYEE', ti: 'ሕራይ', sid: 'EE', en: 'OK', fr: 'OK', de: 'OK', it: 'OK', zh: '通过', ar: 'موافق' })}
                                            </button>
                                            <button
                                              onClick={() => {
                                                askConfirmAndRun(
                                                  tText({
                                                    am: 'ባንክ ክፍያው ውድቅ ይደረግ?',
                                                    or: 'Kaffaltiin baankii haa haqamu?',
                                                    ti: 'እቲ ናይ ባንኪ ክፍሊት ይነጸግ ዶ?',
                                                    sid: 'Baankete baatooshshe gibbinoonni?',
                                                    en: 'Reject bank transfer payment?',
                                                    fr: 'Rejeter le virement bancaire ?',
                                                    de: 'Banküberweisung ablehnen?',
                                                    it: 'Rifiutare il bonifico bancario?',
                                                    zh: '拒绝该银行转账付款？',
                                                    ar: 'رفض التحويل البنكي؟'
                                                  }),
                                                  () => {
                                                    handleConfirmOrderPayment(ord.id, false);
                                                  }
                                                );
                                              }}
                                              className="bg-red-950 hover:bg-red-600 border border-red-900/10 font-mono text-red-500 hover:text-white text-[7px] py-1 px-1 rounded-lg transition-all cursor-pointer text-center"
                                            >
                                              {tText({ am: 'አይ', or: 'LAKKI', ti: 'ኣይኮነን', sid: 'DEE’NI', en: 'NO', fr: 'NON', de: 'NEIN', it: 'NO', zh: '拒绝', ar: 'رفض' })}
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Bedroom bookings */}
                      {dailyBookings.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <p className="text-[9px] font-mono text-[#00f5ff] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full" />
                            <span>
                              🛎️ {tText({ am: 'የአልጋ/ክፍል ኪራይ', or: 'Kireessaa Kutaalee', ti: 'ክራይ መደቀሲ ክፍሊ', sid: 'Kifle Kirra', en: 'Bedroom Bookings', fr: 'Réservations Chambres', de: 'Zimmerbuchungen', it: 'Prenotazioni Camere', zh: '客房预订', ar: 'حجوزات الغرف' })} - {dailyBookings.length} {tText({ am: 'ክፍሎች', or: 'KUTAA', ti: 'ክፍልታት', sid: 'KIFLE', en: 'ROOMS', fr: 'CHAMBRES', de: 'ZIMMER', it: 'CAMERE', zh: '间房', ar: 'غرف' })}
                            </span>
                          </p>
                          <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/5">
                            <table className="w-full text-left font-sans text-xs border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-[9px] font-mono text-stone-400 uppercase">
                                  <th className="p-3">{tText({ am: 'ክፍል', or: 'Kutaa', ti: 'ክፍሊ', sid: 'Kifle', en: 'Room', fr: 'Chambre', de: 'Zimmer', it: 'Camera', zh: '房号', ar: 'الغرفة' })}</th>
                                  <th className="p-3">{tText({ am: 'ምድብ', or: 'Gosa', ti: 'ዓይነት', sid: 'Gaamo', en: 'Category', fr: 'Catégorie', de: 'Kategorie', it: 'Categoria', zh: '房型', ar: 'الفئة' })}</th>
                                  <th className="p-3">{tText({ am: 'እንግዶች', or: 'Keessummoota', ti: 'ኣጋይሽ', sid: 'Wosinna', en: 'Guests', fr: 'Clients', de: 'Gäste', it: 'Ospiti', zh: '宾客', ar: 'الضيوف' })}</th>
                                  <th className="p-3">{tText({ am: 'ስልክ', or: 'Bilbila', ti: 'ስልኪ', sid: 'Bilibila', en: 'Phone', fr: 'Téléphone', de: 'Telefon', it: 'Telefono', zh: '电话', ar: 'الهاتف' })}</th>
                                  <th className="p-3 text-right">{tText({ am: 'የአዳር ዋጋ', or: 'Gatii Halkanii', ti: 'ዋጋ ሓደ ለይቲ', sid: 'Hashshu Waaga', en: 'Night Rate', fr: 'Tarif/Nuit', de: 'Nachtpreis', it: 'Tariffa/Notte', zh: '每晚价格', ar: 'سعر الليلة' })}</th>
                                  <th className="p-3 text-center">{tText({ am: 'ሁኔታ', or: 'Haala', ti: 'ኩነታት', sid: 'Gara', en: 'Status', fr: 'Statut', de: 'Status', it: 'Stato', zh: '状态', ar: 'الحالة' })}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-medium text-white/80">
                                {dailyBookings.map(bk => (
                                  <tr key={bk.id} className="hover:bg-white/2 transition-colors">
                                    <td className="p-3 font-mono font-black text-[#00f5ff]">{bk.roomNumber}</td>
                                    <td className="p-3 text-[11px] font-bold">{bk.roomType}</td>
                                    <td className="p-3">
                                      <div className="space-y-0.5 text-[10px]">
                                        {bk.guestIds.map((g, gIdx) => (
                                          <div key={gIdx} className="text-white/90">
                                            • <span className="font-bold">{g.fullName || '---'}</span> <span className="text-stone-400">({g.idNumber || tText({ am: 'መታወቂያ የለም', or: 'Waraqaa hin qabu', ti: 'መታወቂያ የለን', sid: 'Bortaawe dino', en: 'No ID', fr: 'Sans ID', de: 'Kein Ausweis', it: 'Senza ID', zh: '无证件', ar: 'بدون هوية' })})</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3 font-mono text-[11px] font-bold">{bk.contactPhone}</td>
                                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{bk.pricePerNight?.toLocaleString()} {currency}</td>
                                    <td className="p-3 text-center">
                                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded block text-center border font-bold ${
                                        bk.status === 'Active' 
                                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' 
                                          : 'bg-white/5 text-stone-400 border-white/5'
                                      }`}>
                                        {bk.status === 'Active'
                                          ? tText({ am: 'ንቁ', or: 'Hojii irra', ti: 'ንጡፍ', sid: 'Loosanni', en: 'Active', fr: 'Actif', de: 'Aktiv', it: 'Attivo', zh: '入住中', ar: 'نشط' })
                                          : tText({ am: 'የወጣ', or: 'Baheera', ti: 'ዝወጸ', sid: 'Fulino', en: bk.status, fr: 'Terminé', de: 'Ausgecheckt', it: 'Concluso', zh: '已退房', ar: 'مكتمل' })}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Daily Expenses */}
                      {dailyExpenses.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <p className="text-[9px] font-mono text-[#FF5D5D] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#FF5D5D] rounded-full" />
                            <span>
                              💸 {tText({ am: 'የዕለቱ ወጪዎች ድምር', or: 'Ida’ama Baasii Guyyaa', ti: 'ድምር ዕለታዊ ወጻኢታት', sid: 'Barru Fulo Xaphooma', en: 'Outflow Payments', fr: 'Paiements sortants', de: 'Ausgabenposten', it: 'Pagamenti in uscita', zh: '当日支出明细', ar: 'مدفوعات المصروفات' })} - {dailyExpenses.length} {tText({ am: 'መዝገቦች', or: 'Galmee', ti: 'መዝገብ', sid: 'Maareekko', en: 'Records', fr: 'Enregistrements', de: 'Einträge', it: 'Voci', zh: '条记录', ar: 'سجل' })}
                            </span>
                          </p>
                          <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/5">
                            <table className="w-full text-left font-sans text-xs border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-[9px] font-mono text-stone-400 uppercase">
                                  <th className="p-3">{tText({ am: 'የወጪ ዝርዝር', or: 'Ibsa Baasii', ti: 'ዝርዝር ወጻኢ', sid: 'Fulote Tirtirro', en: 'Expense Details', fr: 'Détails dépense', de: 'Ausgabendetails', it: 'Dettagli spesa', zh: '支出详情', ar: 'تفاصيل المصروف' })}</th>
                                  <th className="p-3">{tText({ am: 'ምድብ', or: 'Ramaddii', ti: 'ምድብ', sid: 'Gaamo', en: 'Category', fr: 'Catégorie', de: 'Kategorie', it: 'Categoria', zh: '分类', ar: 'الفئة' })}</th>
                                  <th className="p-3">{tText({ am: 'ምክንያት / ማስታወሻ', or: 'Sababa / Yaadannoo', ti: 'ምኽንያት / መዘኻኸሪ', sid: 'Korkaata / Qaagishsha', en: 'Notes/Reason', fr: 'Notes / Motif', de: 'Notizen / Grund', it: 'Note / Motivo', zh: '备注/原因', ar: 'ملاحظات / السبب' })}</th>
                                  <th className="p-3 text-right">{tText({ am: 'መጠን', or: 'Hamma', ti: 'መጠን', sid: 'Bikko', en: 'Amount', fr: 'Montant', de: 'Betrag', it: 'Importo', zh: '金额', ar: 'المبلغ' })}</th>
                                  <th className="p-3 text-center">{tText({ am: 'ድርጊት', or: 'Tarkaanfii', ti: 'ስጉምቲ', sid: 'Looso', en: 'Actions', fr: 'Actions', de: 'Aktionen', it: 'Azioni', zh: '操作', ar: 'إجراءات' })}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-medium text-white/80">
                                {dailyExpenses.map(exp => (
                                  <tr key={exp.id} className="hover:bg-white/2 transition-colors">
                                    <td className="p-3">
                                      <span className="font-bold text-white/90 block">{exp.title}</span>
                                      <span className="text-[8px] text-stone-400 font-mono block">⏰ {exp.time}</span>
                                    </td>
                                    <td className="p-3 text-[10px] uppercase font-mono">
                                      <span className="bg-[#FF5D5D]/10 text-[#FF5D5D] border border-[#FF5D5D]/20 px-1.5 py-0.5 rounded">
                                        {exp.category}
                                      </span>
                                    </td>
                                    <td className="p-3 text-[10px] text-stone-400 italic font-medium">{exp.notes || '---'}</td>
                                    <td className="p-3 text-right font-mono font-black text-[#FF5D5D]">-{exp.amount.toLocaleString()} {currency}</td>
                                    <td className="p-3 text-center">
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveExpense(exp.id)}
                                        className="px-2 py-1 text-[8px] bg-red-950 text-red-400 border border-red-500/10 hover:border-red-500/40 rounded transition-colors font-bold cursor-pointer"
                                      >
                                        {tText({ am: 'ሰርዝ', or: 'HAQI', ti: 'ሰርዝ', sid: 'HUNI', en: 'DELETE', fr: 'SUPPRIMER', de: 'LÖSCHEN', it: 'ELIMINA', zh: '删除', ar: 'حذف' })}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 2. MONTHLY VIEW */}
          {ledgerFilterTab === 'monthly' && (() => {
            const allMonthsSet = new Set<string>();
            orders.forEach(x => allMonthsSet.add((normalizeRecordDateToIso(x.date) || todayIso).substring(0, 7)));
            roomBookings.forEach(x => allMonthsSet.add((normalizeRecordDateToIso(x.checkInDate) || todayIso).substring(0, 7)));
            expenses.forEach(x => allMonthsSet.add((normalizeRecordDateToIso(x.date) || todayIso).substring(0, 7)));

            const sortedMonths = Array.from(allMonthsSet).sort((a, b) => b.localeCompare(a));

            if (sortedMonths.length === 0) {
              return (
                <div className="text-center py-16 font-mono text-white/30 text-xs uppercase border border-dashed border-white/5 rounded-2xl">
                  {tText({
                    am: 'ምንም ወርሃዊ መዝገብ አልተገኘም።',
                    or: 'Galmeen ji’aa hin argamne.',
                    ti: 'ዝኾነ ወርሓዊ መዝገብ ኣይተረኽበን።',
                    sid: 'Aganu maareekko dino.',
                    en: 'No monthly logs found.',
                    fr: 'Aucun relevé mensuel trouvé.',
                    de: 'Keine monatlichen Einträge gefunden.',
                    it: 'Nessun registro mensile trovato.',
                    zh: '未找到月度记录。',
                    ar: 'لم يتم العثور على سجلات شهرية.'
                  })}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedMonths.map(mKey => {
                  const mParts = mKey.split('-');
                  const mName = MONTH_LABELS[mParts[1]]?.[appLang] || MONTH_LABELS[mParts[1]]?.en || mParts[1];

                  const mOrders = orders.filter(x => (normalizeRecordDateToIso(x.date) || todayIso).substring(0, 7) === mKey);
                  const mBookings = roomBookings.filter(x => (normalizeRecordDateToIso(x.checkInDate) || todayIso).substring(0, 7) === mKey);
                  const mExpenses = expenses.filter(x => (normalizeRecordDateToIso(x.date) || todayIso).substring(0, 7) === mKey);

                  const mOrderSales = mOrders.reduce((sum, ord) => sum + ord.total, 0);
                  const mBookingSales = mBookings.reduce((sum, bk) => sum + (bk.pricePerNight || 0), 0);
                  const mTotalRevenue = mOrderSales + mBookingSales;
                  const mTotalExpenses = mExpenses.reduce((sum, ex) => sum + ex.amount, 0);
                  const mNetMargin = mTotalRevenue - mTotalExpenses;

                  return (
                    <div key={mKey} className="bg-black/50 p-5 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4 relative overflow-hidden">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[8px] bg-sky-950 font-mono text-sky-400 font-bold tracking-wider px-2 py-0.5 rounded">
                          {tText({ am: 'የወር መዝገብ', or: 'GALMEE JI’AA', ti: 'ወርሓዊ መዝገብ', sid: 'AGANU MAAREEKKO', en: 'MONTH LOG', fr: 'JOURNAL DU MOIS', de: 'MONATSEINTRAG', it: 'REGISTRO MESE', zh: '月度记录', ar: 'سجل الشهر' })}: {mKey}
                        </span>
                        <h4 className="text-sm font-black text-[#C1FF00] uppercase tracking-wide mt-1">
                          🌙 {mName} {mParts[0]} {tText({ am: 'የሂሳብ ድምር', or: 'Ida’ama Herregaa', ti: 'ድምር ሕሳብ', sid: 'Kiirote Xaphooma', en: 'Summary', fr: 'Résumé', de: 'Zusammenfassung', it: 'Riepilogo', zh: '账目汇总', ar: 'ملخص الحساب' })}
                        </h4>
                      </div>

                      <div className="space-y-2 py-1 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-stone-400">{tText({ am: 'የምግብ ሽያጭ ገቢ', or: 'Galii Nyaataa', ti: 'ኣታዊ መግቢ', sid: 'Sagalete Eo', en: 'Food Sales', fr: 'Ventes restauration', de: 'Speisenumsatz', it: 'Vendite ristorazione', zh: '餐饮销售收入', ar: 'مبيعات الطعام' })}</span>
                          <span className="font-bold text-white/90">+{mOrderSales.toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-stone-400">{tText({ am: 'የአልጋ ኪራይ ገቢ', or: 'Galii Kireessaa Kutaalee', ti: 'ኣታዊ ክራይ ክፍሊ', sid: 'Kifle Kirra Eo', en: 'Bed Booking', fr: 'Réservations chambres', de: 'Zimmerbuchungen', it: 'Prenotazioni camere', zh: '客房预订收入', ar: 'إيرادات الغرف' })}</span>
                          <span className="font-bold text-white/90">+{mBookingSales.toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between font-mono border-t border-white/5 pt-1.5 bg-white/5 px-2 py-1 rounded">
                          <span className="text-emerald-400 font-bold">{tText({ am: 'ጠቅላላ ወር ገቢ', or: 'GALII WALIIGALAA', ti: 'ጠቕላላ ኣታዊ ወርሒ', sid: 'XAPHOOMU EO', en: 'REVENUES', fr: 'REVENUS TOTAUX', de: 'GESAMTUMSATZ', it: 'RICAVI TOTALI', zh: '月总收入', ar: 'إجمالي الإيرادات' })}</span>
                          <span className="font-black text-emerald-400">+{mTotalRevenue.toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between font-mono px-2 py-1">
                          <span className="text-[#FF5D5D] font-bold">{tText({ am: 'ጠቅላላ ወር ወጪ', or: 'BAASII WALIIGALAA', ti: 'ጠቕላላ ወጻኢ ወርሒ', sid: 'XAPHOOMU FULO', en: 'EXPENSES', fr: 'DÉPENSES TOTALES', de: 'GESAMTAUSGABEN', it: 'SPESE TOTALI', zh: '月总支出', ar: 'إجمالي المصروفات' })}</span>
                          <span className="font-black text-[#FF5D5D]">-{mTotalExpenses.toLocaleString()} {currency}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-[#C1FF00]/5 border border-[#C1FF00]/10 p-2 text-[10px] font-mono rounded-lg">
                        <span className="text-stone-400">{tText({ am: 'የወሩ የተጣራ ትርፍ', or: 'BU’AA QULQULLUU', ti: 'ጽሩይ መኽሰብ ወርሒ', sid: 'AGANU KEERU TIRI', en: 'NET MARGIN', fr: 'MARGE NETTE', de: 'NETTOMARGE', it: 'MARGINE NETTO', zh: '月净利润', ar: 'صافي الربح' })}:</span>
                        <span className={`font-black ${mNetMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {mNetMargin.toLocaleString()} {currency}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[8px] text-stone-500 uppercase font-mono border-t border-white/5 pt-1.5">
                        <span>{tText({ am: 'ትዕዛዞች', or: 'Ajaja', ti: 'ትእዛዛት', sid: 'Hajajja', en: 'Orders', fr: 'Commandes', de: 'Bestellungen', it: 'Ordini', zh: '订单', ar: 'الطلبات' })}: {mOrders.length}</span>
                        <span>{tText({ am: 'ክፍሎች', or: 'Kutaalee', ti: 'ክፍልታት', sid: 'Kifle', en: 'Rooms', fr: 'Chambres', de: 'Zimmer', it: 'Camere', zh: '客房', ar: 'الغرف' })}: {mBookings.length}</span>
                        <span>{tText({ am: 'ወጪዎች', or: 'Baasii', ti: 'ወጻኢታት', sid: 'Fulo', en: 'Expenses', fr: 'Dépenses', de: 'Ausgaben', it: 'Spese', zh: '支出', ar: 'المصروفات' })}: {mExpenses.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 3. YEARLY VIEW */}
          {ledgerFilterTab === 'yearly' && (() => {
            const groupedByYear: { [key: string]: Order[] } = {};
            orders.forEach(ord => {
              const d = normalizeRecordDateToIso(ord.date) || todayIso;
              const y = d.substring(0, 4);
              if (!groupedByYear[y]) groupedByYear[y] = [];
              groupedByYear[y].push(ord);
            });

            const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

            if (sortedYears.length === 0) {
              return (
                <div className="text-center py-16 font-mono text-white/30 text-xs uppercase border border-dashed border-white/5 rounded-2xl">
                  {tText({
                    am: 'ምንም ዓመታዊ መዝገብ አልተገኘም።',
                    or: 'Galmeen waggaa hin argamne.',
                    ti: 'ዝኾነ ዓመታዊ መዝገብ ኣይተረኽበን።',
                    sid: 'Diru maareekko dino.',
                    en: 'No yearly transaction record found.',
                    fr: 'Aucun enregistrement annuel trouvé.',
                    de: 'Keine jährlichen Transaktionsdaten gefunden.',
                    it: 'Nessun registro annuale trovato.',
                    zh: '未找到年度交易记录。',
                    ar: 'لم يتم العثور على سجل سنوي.'
                  })}
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {sortedYears.map(yKey => {
                  const yearOrders = groupedByYear[yKey];
                  const yTotal = yearOrders.reduce((sum, ord) => sum + ord.total, 0);
                  const yCash = yearOrders.filter(x => x.payment === 'cash').reduce((sum, ord) => sum + ord.total, 0);
                  const yBank = yearOrders.filter(x => x.payment === 'bank').reduce((sum, ord) => sum + ord.total, 0);
                  const yChapa = yearOrders.filter(x => x.payment === 'chapa').reduce((sum, ord) => sum + ord.total, 0);

                  return (
                    <div key={yKey} className="bg-black/50 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-sm font-black text-[#C1FF00] uppercase tracking-wider">
                          🎄 {yKey} — {tText({ am: 'ዓመታዊ የሽያጭ ሪፖርት', or: 'Gabaasa Gurgurtaa Waggaa', ti: 'ዓመታዊ ጸብጻብ መሸጣ', sid: 'Diru Hirro Rippoorte', en: 'Yearly Report', fr: 'Rapport Annuel', de: 'Jahresbericht', it: 'Report Annuale', zh: '年度销售报告', ar: 'التقرير السنوي للمبيعات' })}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 p-3 border border-white/5 rounded-xl">
                          <span className="text-[9px] text-stone-400 block font-bold">{tText({ am: 'በእጅ የተቀበሉት (ጥሬ ገንዘብ)', or: 'GALII MAALLAQA CALLAA', ti: 'ብጥረ ገንዘብ ዝተኣከበ', sid: 'ANGAANNI EO', en: 'CASH REVENUE', fr: 'REVENUS ESPÈCES', de: 'BARUMSATZ', it: 'RICAVI CONTANTI', zh: '现金收入', ar: 'إيرادات النقد' })}</span>
                          <span className="font-bold text-white text-sm mt-1 block font-mono">{yCash.toLocaleString()} {currency}</span>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/5 rounded-xl">
                          <span className="text-[9px] text-stone-400 block font-bold">{tText({ am: 'በባንክ የተቀበሉት', or: 'GALII BAANKII', ti: 'ብባንኪ ዝተኣከበ', sid: 'BAANKETENNI EO', en: 'BANK REVENUE', fr: 'REVENUS BANQUE', de: 'BANKUMSATZ', it: 'RICAVI BANCA', zh: '银行转账收入', ar: 'إيرادات البنك' })}</span>
                          <span className="font-bold text-white text-sm mt-1 block font-mono">{yBank.toLocaleString()} {currency}</span>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/5 rounded-xl">
                          <span className="text-[9px] text-purple-300 block font-bold">{tText({ am: 'በቻፓ (Chapa)', or: 'CHAPA', ti: 'ብቻፓ (Chapa)', sid: 'CHAPA', en: 'CHAPA REVENUE', fr: 'REVENUS CHAPA', de: 'CHAPA-UMSATZ', it: 'RICAVI CHAPA', zh: 'Chapa 收入', ar: 'إيرادات تشابا' })}</span>
                          <span className="font-bold text-purple-200 text-sm mt-1 block font-mono">{yChapa.toLocaleString()} {currency}</span>
                        </div>
                        <div className="bg-[#C1FF00]/10 p-3 border border-[#C1FF00]/20 rounded-xl">
                          <span className="text-[9px] text-[#C1FF00]/70 block font-bold">{tText({ am: 'አጠቃላይ ዓመታዊ ሽያጭ', or: 'GURGURTAA WALIIGALAA WAGGAA', ti: 'ጠቕላላ ዓመታዊ መሸጣ', sid: 'XAPHOOMU DIRU HIRRO', en: 'ANNUAL REVENUES', fr: 'REVENUS ANNUELS', de: 'JAHRESUMSATZ', it: 'RICAVI ANNUALI', zh: '年度总销售额', ar: 'إجمالي الإيرادات السنوية' })}</span>
                          <span className="font-black text-[#C1FF00] text-sm mt-1 block font-mono">{yTotal.toLocaleString()} {currency}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>
      </div>

      {/* Receipt Verification In-App Lightbox Modal */}
      {adminReceiptPreview && (
        <div
          onClick={() => setAdminReceiptPreview(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[130] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121212] border-2 border-[#C1FF00]/60 rounded-2xl max-w-lg w-full p-4 space-y-3 text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
              <div>
                <h4 className="text-sm font-black text-[#C1FF00]">
                  🧾 ደረሰኝ / የክፍያ ማረጋገጫ — {adminReceiptPreview.order.id}
                </h4>
                <p className="text-[11px] font-mono text-stone-300 mt-0.5">
                  {adminReceiptPreview.order.location} · {adminReceiptPreview.order.total.toLocaleString()} {currency} · {String(adminReceiptPreview.order.payment || '').toUpperCase()}
                  {adminReceiptPreview.order.cashierName ? ` · Cashier: ${adminReceiptPreview.order.cashierName}` : ''}
                </p>
                {adminReceiptPreview.order.bankRef && (
                  <p className="text-[10px] font-mono text-sky-300 mt-0.5">
                    Ref / Txn: {adminReceiptPreview.order.bankRef}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAdminReceiptPreview(null)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={adminReceiptPreview.url}
              alt={`Receipt ${adminReceiptPreview.order.id}`}
              className="w-full max-h-[68vh] object-contain rounded-xl bg-black border border-white/10"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
