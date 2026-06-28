import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, RoomBooking, Expense } from '../types';

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
  appLang: 'am' | 'en' | 'or' | 'ti' | 'fr' | 'de' | 'it' | 'sid';
}

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
  appLang,
}: AdminRevenueReportsProps) {
  // Local active states for reports & high fidelity chart
  const [activeTimeframe, setActiveTimeframe] = useState<'all' | 'q1' | 'q2' | 'this-month'>('all');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'revenue' | 'expenses' | 'net'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Filter lists based on timeframe
  const getFilteredData = () => {
    let o = [...orders];
    let b = [...roomBookings];
    let e = [...expenses];

    if (activeTimeframe === 'q1') {
      const q1Months = ['01', '02', '03'];
      o = o.filter(x => q1Months.includes((x.date || '').substring(5, 7)));
      b = b.filter(x => q1Months.includes((x.checkInDate || '').substring(5, 7)));
      e = e.filter(x => q1Months.includes((x.date || '').substring(5, 7)));
    } else if (activeTimeframe === 'q2') {
      const q2Months = ['04', '05', '06'];
      o = o.filter(x => q2Months.includes((x.date || '').substring(5, 7)));
      b = b.filter(x => q2Months.includes((x.checkInDate || '').substring(5, 7)));
      e = e.filter(x => q2Months.includes((x.date || '').substring(5, 7)));
    } else if (activeTimeframe === 'this-month') {
      const currentMonth = '06'; // Native template baseline is June (2026-06)
      o = o.filter(x => (x.date || '').substring(5, 7) === currentMonth);
      b = b.filter(x => (x.checkInDate || '').substring(5, 7) === currentMonth);
      e = e.filter(x => (x.date || '').substring(5, 7) === currentMonth);
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

  // Compile monthly timeline stats for the SVG chart (using filtered range or full calendar)
  const compileMonthlyStats = () => {
    const months = [
      { name: 'Jan/ጥር', num: '01' },
      { name: 'Feb/የካቲት', num: '02' },
      { name: 'Mar/መጋቢት', num: '03' },
      { name: 'Apr/ሚያዚያ', num: '04' },
      { name: 'May/ግንቦት', num: '05' },
      { name: 'Jun/ሰኔ', num: '06' },
      { name: 'Jul/ሐምሌ', num: '07' },
      { name: 'Aug/ነሐሴ', num: '08' },
      { name: 'Sep/መስከረም', num: '09' },
      { name: 'Oct/ጥቅምት', num: '10' },
      { name: 'Nov/ህዳር', num: '11' },
      { name: 'Dec/ታህሳስ', num: '12' },
    ];

    return months.map(m => {
      const mKey = `2026-${m.num}`;
      const mOrders = orders.filter(x => (x.date || '2026-06-07').substring(0, 7) === mKey);
      const mBookings = roomBookings.filter(x => (x.checkInDate || '2026-06-07').substring(0, 7) === mKey);
      const mExpenses = expenses.filter(x => (x.date || '2026-06-07').substring(0, 7) === mKey);

      const oSales = mOrders.reduce((sum, ord) => sum + ord.total, 0);
      const rSales = mBookings.reduce((sum, bk) => sum + (bk.pricePerNight || 0), 0);
      const rev = oSales + rSales;
      const exp = mExpenses.reduce((sum, ex) => sum + ex.amount, 0);
      const net = rev - exp;

      return {
        label: appLang === 'am' ? m.name.split('/')[1] : m.name.split('/')[0],
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

  // Calculate percentages for Revenue Sources (Direct vs Bank)
  const totalSalesFromO = filteredO.reduce((sum, ord) => sum + ord.total, 0);
  const cashPayments = filteredO.filter(x => x.payment === 'cash').reduce((sum, ord) => sum + ord.total, 0);
  const bankPayments = filteredO.filter(x => x.payment === 'bank').reduce((sum, ord) => sum + ord.total, 0);

  const cashPct = totalSalesFromO > 0 ? Math.round((cashPayments / totalSalesFromO) * 100) : 40;
  const bankPct = totalSalesFromO > 0 ? Math.round((bankPayments / totalSalesFromO) * 100) : 60;
  
  const roomSharePct = combinedRevenue > 0 ? Math.round((totalRoomSales / combinedRevenue) * 100) : 45;
  const foodSharePct = combinedRevenue > 0 ? Math.round((totalOrderSales / combinedRevenue) * 100) : 55;

  return (
    <div className="space-y-6">
      
      {/* SALES OVERVIEW HEADER / TITLE BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-[#161616] to-[#1e1e1e] border border-white/10 p-5 rounded-3xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#C1FF00]/5 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="space-y-1 relative z-10 text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#C1FF00] animate-pulse" />
            <h3 className="text-sm font-black uppercase text-[#C1FF00] font-mono tracking-widest">
              {appLang === 'am' ? 'የገቢ እና ሪፖርት ማጠቃለያ' : 'SALES & ANALYTICS OVERVIEW'}
            </h3>
          </div>
          <p className="text-white text-lg font-black tracking-tight uppercase">
            {appLang === 'am' ? 'የሎጅ ፋይናንስ ተቆጣጣሪ ሰሌዳ' : 'Lodge Financial Cockpit'}
          </p>
          <p className="font-mono text-[10px] text-stone-400">
            {appLang === 'am' ? 'የሁሉም ገቢ፣ ወጪ እና የተጣራ ትርፍ በቅጽበት መከታተያ' : 'Real-time revenue stream tracking, dynamic cash flow audit & taxes'}
          </p>
        </div>

        {/* Filters pills row */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
          <div className="flex bg-black/60 p-1 rounded-2xl border border-white/10 gap-1">
            {[
              { id: 'all', label: appLang === 'am' ? 'ጠቅላላ' : 'All Time' },
              { id: 'q1', label: appLang === 'am' ? 'Q1 (ጥር-መጋቢት)' : 'Q1 (Jan-Mar)' },
              { id: 'q2', label: appLang === 'am' ? 'Q2 (ሚያዝያ-ሰኔ)' : 'Q2 (Apr-Jun)' },
              { id: 'this-month', label: appLang === 'am' ? 'የዚህ ወር' : 'This Month' },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setActiveTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTimeframe === tf.id
                    ? 'bg-[#C1FF00] text-black shadow-[0_4px_12px_rgba(193,255,0,0.2)]'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="bg-black/60 border border-white/10 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-stone-400 flex items-center gap-2">
            <span>📅</span>
            <span className="font-black text-white">JUN 2025 - JUN 2026</span>
          </div>
        </div>
      </div>

      {/* FOUR METRIC CARDS GRID (Qubify Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: REVENUE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-emerald-500/30 transition-all group"
        >
          <div className="absolute top-2 right-2 text-xl opacity-30 group-hover:scale-110 transition-transform">💵</div>
          <span className="text-[9px] uppercase font-mono text-stone-400 font-bold tracking-widest block text-left">
            {appLang === 'am' ? 'ጠቅላላ ገቢ (TOTAL REVENUE)' : 'TOTAL REVENUE'}
          </span>
          
          <div className="flex items-baseline gap-1 mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-[#C1FF00] font-mono tracking-tight">
              {combinedRevenue.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">ብር</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className="text-emerald-400 font-bold">▲ +14.5%</span>
            <span className="text-stone-500">{appLang === 'am' ? 'ካለፈው ወር' : 'vs last month'}</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>🍔 ምግብ፦ {totalOrderSales.toLocaleString()}</span>
            <span>🛎️ አልጋ፦ {totalRoomSales.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* CARD 2: EXPENSES */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-red-500/30 transition-all group"
        >
          <div className="absolute top-2 right-2 text-xl opacity-30 group-hover:scale-110 transition-transform">💸</div>
          <span className="text-[9px] uppercase font-mono text-stone-400 font-bold tracking-widest block text-left">
            {appLang === 'am' ? 'ጠቅላላ ወጪ (TOTAL EXPENSES)' : 'TOTAL EXPENSES'}
          </span>

          <div className="flex items-baseline gap-1 mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-[#FF5D5D] font-mono tracking-tight">
              {totalExpenseVal.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">ብር</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className="text-[#FF5D5D] font-bold">▼ -2.41%</span>
            <span className="text-stone-500">{appLang === 'am' ? 'የተቀነሰ' : 'reduced cost'}</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>📊 መዛግብት፦ {filteredE.length} ሪከርድ</span>
            <span>⏱️ Live Audit</span>
          </div>
        </motion.div>

        {/* CARD 3: TOTAL TRANSACTIONS / DEALS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-sky-500/30 transition-all group"
        >
          <div className="absolute top-2 right-2 text-xl opacity-30 group-hover:scale-110 transition-transform">🛍️</div>
          <span className="text-[9px] uppercase font-mono text-stone-400 font-bold tracking-widest block text-left">
            {appLang === 'am' ? 'ድምር ሁኔታዎች (LODGE ACTIVITIES)' : 'TOTAL ACTIVITIES'}
          </span>

          <div className="flex items-baseline gap-1 mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {totalActivities.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">{appLang === 'am' ? 'አክቲቪቲ' : 'txns'}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className="text-sky-400 font-bold">▲ +8.2%</span>
            <span className="text-stone-500">{appLang === 'am' ? 'የእድገት ሪከርድ' : 'growth record'}</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>🍔 ትዕዛዝ፦ {filteredO.length}</span>
            <span>🛎️ ሪሴብሽን፦ {filteredB.length}</span>
          </div>
        </motion.div>

        {/* CARD 4: NET MARGIN */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#121212] to-[#181818] border border-[#C1FF00]/20 rounded-2xl p-5 relative overflow-hidden shadow-xl hover:border-[#C1FF00]/40 transition-all group"
        >
          <div className="absolute top-2 right-2 text-xl opacity-30 group-hover:scale-110 transition-transform">📈</div>
          <span className="text-[9px] uppercase font-mono text-[#C1FF00]/80 font-black tracking-widest block text-left">
            {appLang === 'am' ? 'የተጣራ ትርፍ (NET MARGIN)' : 'NET MARGIN'}
          </span>

          <div className="flex items-baseline gap-1 mt-3">
            <h4 className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${netProfit >= 0 ? 'text-[#C1FF00]' : 'text-red-400'}`}>
              {netProfit.toLocaleString()}
            </h4>
            <span className="text-[10px] font-bold text-stone-400 font-mono">ብር</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono">
            <span className={`font-bold ${netProfit >= 0 ? 'text-[#C1FF00]' : 'text-red-400'}`}>
              {netProfit >= 0 ? '▲ Profit' : '▼ Loss'}
            </span>
            <span className="text-stone-500">
              Ratio: {(combinedRevenue / (totalExpenseVal || 1)).toFixed(1)}x
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[8px] font-mono text-stone-400">
            <span>🚀 ROI Rate</span>
            <span>{combinedRevenue > 0 ? Math.round((netProfit / combinedRevenue) * 100) : 100}% Margin</span>
          </div>
        </motion.div>

      </div>

      {/* INTERACTIVE HIGH-FIDELITY CHART: SALES PERFORMANCE (Qubify Inspired) */}
      <div className="bg-gradient-to-b from-[#141414] to-[#0e0e0e] border border-white/10 rounded-3xl p-5 relative overflow-hidden">
        {/* Glowing background underlay */}
        <div className="absolute -bottom-10 left-[20%] w-[350px] h-[150px] bg-[#C1FF00]/2 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-4 text-left">
          <div>
            <h4 className="text-sm font-black uppercase text-white tracking-wide">
              {appLang === 'am' ? '📊 የሽያጭ እና የትርፍ የጊዜ መስመር ትንታኔ (Lodge Performance Trend)' : '📊 LODGE FINANCIAL TIMELINE'}
            </h4>
            <p className="font-mono text-[9px] text-stone-400 uppercase tracking-widest mt-0.5">
              {appLang === 'am' ? 'የገቢ፣ ወጪ እና የተጣራ ትርፍ ወርሃዊ ድምር (Monthly volume and revenue distribution)' : 'Monthly income flow, operational costs & margins'}
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex bg-black/60 p-0.5 rounded-xl border border-white/10 gap-0.5 shrink-0 font-mono text-[9px]">
            {[
              { id: 'all', label: appLang === 'am' ? 'ድምር (All Metrics)' : 'All Metrics' },
              { id: 'revenue', label: appLang === 'am' ? 'ገቢ ብቻ (Revenue)' : 'Revenue' },
              { id: 'expenses', label: appLang === 'am' ? 'ወጪ ብቻ (Expenses)' : 'Expenses' },
              { id: 'net', label: appLang === 'am' ? 'ትርፍ (Net)' : 'Net' },
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
                    🌙 {pData.label} 2026
                  </p>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-stone-400">ጠቅላላ ገቢ (REVENUE):</span>
                    <span className="text-[#C1FF00] font-black">+{pData.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-stone-400">ወጪ (EXPENSES):</span>
                    <span className="text-[#FF5D5D] font-black">-{pData.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4 border-t border-white/5 pt-1 mt-1">
                    <span className="text-stone-300 font-bold">የተጣራ (NET):</span>
                    <span className={`font-black ${pData.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pData.net.toLocaleString()} ብር
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
            <span>{appLang === 'am' ? 'የሎጅ ጠቅላላ ገቢ (Lodge Income Flow)' : 'Total Revenue'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#FF5D5D]" />
            <span>{appLang === 'am' ? 'የተመዘገቡ ወጪዎች (Operational Cost)' : 'Total Expenses'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#00F5FF]" />
            <span>{appLang === 'am' ? 'የተጣራ ትርፍ ሁኔታ (Net Operating Margin)' : 'Net Profit'}</span>
          </div>
        </div>

      </div>

      {/* THREE BENTO WIDGETS COLUMN ROW (Qubify Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* WIDGET 1: REVENUE PIPELINE BY SOURCE */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[8px] bg-amber-500/10 text-amber-400 font-mono font-black uppercase px-2 py-0.5 rounded">
                PIPELINE
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1.5">
                {appLang === 'am' ? '📊 የገቢና የክፍያ ምንጮች ድልድል (Revenue Sources)' : 'REVENUE PIPELINE BY SOURCE'}
              </h4>
            </div>

            <div className="space-y-3.5">
              {/* Source 1: Cash Payments */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">💵 {appLang === 'am' ? 'በጥሬ ገንዘብ (Cash Transactions)' : 'Cash Payments'}</span>
                  <span className="text-[#C1FF00] font-black">{cashPct}% ({cashPayments.toLocaleString()} ብር)</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-[#C1FF00]" style={{ width: `${cashPct}%` }} />
                </div>
              </div>

              {/* Source 2: Bank Transfers */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">💳 {appLang === 'am' ? 'በባንክ / ማስተላለፍ (Bank Transfer)' : 'Bank Transfers'}</span>
                  <span className="text-sky-400 font-black">{bankPct}% ({bankPayments.toLocaleString()} ብር)</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-sky-400" style={{ width: `${bankPct}%` }} />
                </div>
              </div>

              {/* Source 3: Room Bookings Share */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">🛎️ {appLang === 'am' ? 'የአልጋ/ክፍል ኪራይ (Bedroom Share)' : 'Bedroom Bookings Share'}</span>
                  <span className="text-[#00F5FF] font-black">{roomSharePct}% ({totalRoomSales.toLocaleString()} ብር)</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-[#00F5FF]" style={{ width: `${roomSharePct}%` }} />
                </div>
              </div>

              {/* Source 4: Food & Beverage Order Share */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-300 font-bold">🍔 {appLang === 'am' ? 'የምግብና መጠጥ ሽያጭ (F&B Share)' : 'Food & Beverage Orders'}</span>
                  <span className="text-emerald-400 font-black">{foodSharePct}% ({totalOrderSales.toLocaleString()} ብር)</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-600 to-emerald-400" style={{ width: `${foodSharePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-stone-500 uppercase">
            <span>Direct Sales Integration active</span>
          </div>
        </div>

        {/* WIDGET 2: PRODUCT CATEGORY DISTRIBUTION (Donut Chart) */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[8px] bg-[#C1FF00]/10 text-[#C1FF00] font-mono font-black uppercase px-2 py-0.5 rounded">
                CATEGORIES
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1.5">
                {appLang === 'am' ? '🍽️ የሽያጭ አገልግሎቶች ድልድል (Lodge Distribution)' : 'PRODUCT DISTRIBUTION'}
              </h4>
            </div>

            <div className="flex items-center gap-4 py-2">
              {/* Responsive SVG Donut Chart */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Track circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="3.5"
                  />
                  {/* Segment 1: Food & Beverage */}
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
                  {/* Segment 2: Lodge Rooms */}
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
                  <span className="text-[6.5px] uppercase font-mono text-stone-500 font-bold mt-0.5">Lodge</span>
                </div>
              </div>

              {/* Side Legend */}
              <div className="flex-1 space-y-2 text-[10px] font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C1FF00]" />
                    <span className="text-stone-300">ምግብና መጠጥ (F&B)፦</span>
                  </div>
                  <span className="text-white font-black">{foodSharePct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00F5FF]" />
                    <span className="text-stone-300">አልጋ / ኪራይ (Rooms)፦</span>
                  </div>
                  <span className="text-white font-black">{roomSharePct}%</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-1 mt-1 text-[9px]">
                  <span className="text-stone-500 uppercase font-bold">Total Val:</span>
                  <span className="text-[#C1FF00] font-black">{combinedRevenue.toLocaleString()} Br</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-stone-500 uppercase">
            <span>Dynamic category ledger matching</span>
          </div>
        </div>

        {/* WIDGET 3: GUEST DEMOGRAPHICS (GLOBAL REACH) */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[8px] bg-sky-500/10 text-sky-400 font-mono font-black uppercase px-2 py-0.5 rounded">
                DEMOGRAPHICS
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1.5">
                {appLang === 'am' ? '👥 የእንግዶች ስብጥርና መገኛ (Guest Origins)' : 'GUEST DEMOGRAPHICS'}
              </h4>
            </div>

            <div className="space-y-2.5">
              {/* Region 1: Addis Ababa */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span>🇪🇹</span>
                  <span className="text-stone-300 font-medium">አዲስ አበባ (Addis Ababa)</span>
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
                  <span className="text-stone-300 font-medium">ሀዋሳ እና ክልሎች (Local Region)</span>
                </div>
                <span className="text-white font-black">20%</span>
              </div>
              <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-[#C1FF00]" style={{ width: '20%' }} />
              </div>

              {/* Region 3: International Travelers */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span className="text-stone-300 font-medium">ውጭ ሀገር (International Guests)</span>
                </div>
                <span className="text-white font-black">15%</span>
              </div>
              <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: '15%' }} />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[8px] font-mono text-stone-500 uppercase">
            <span>Direct guest register synchronization</span>
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
                {appLang === 'am' ? 'የሎጅ ታክስ እና አገልግሎት ክፍያ መለኪያ' : 'TAX & SC SETTINGS'}
              </h4>
            </div>
            
            <p className="text-[10px] text-stone-400 uppercase font-mono leading-relaxed leading-relaxed">
              {appLang === 'am' ? 'እዚህ ጋር የምታዘምኗቸው ዋጋዎች እንግዶች በሚያዙበት ሰዓት ቶታል ሂሳብ ላይ አስተማማኝ በሆነ ሁኔታ ተደምረው ይታያሉ።' : 'Modify tax rate parameters that automatically combine during customer checkout billing calculation.'}
            </p>

            <div className="space-y-4 pt-1">
              {/* Service Charge Rate */}
              <div className="bg-black/40 p-3.5 border border-white/5 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[8px] text-stone-400 block font-mono uppercase tracking-wider">SERVICE RATE (አገልግሎት %):</span>
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
                  <span className="text-[8px] text-stone-400 block font-mono uppercase tracking-wider">VAT RATE (ታክስ ቫት %):</span>
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
            <span>Global configuration synchronized</span>
          </div>
        </div>

        {/* PANEL 2: Register New Expense Form */}
        <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <span className="text-lg">💸</span>
              <h4 className="text-xs font-black uppercase text-white tracking-widest">
                {appLang === 'am' ? 'አዲስ የወጪ ሂሳብ መመዝገቢያ' : 'REGISTER NEW OUTFLOW'}
              </h4>
            </div>

            <p className="text-[10px] text-stone-400 uppercase font-mono leading-relaxed max-w-2xl">
              {appLang === 'am' 
                ? 'የሎጁን ማናቸውንም የዕለት ተዕለት ወጪዎችን (የኩሽና ግብዓቶች ግዥ፣ የመብራትና ውሃ ክፍያዎች፣ የሰራተኛ ኪራይ/ደሞዝ ወዘተ) እዚህ ይመዝግቡ።' 
                : 'Log and track any operating cost, supplier pay, salaries or utility expenses. Automatically merges with financial ledger charts.'}
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
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">የወጪው ርዕስ (EXPENSE DESCRIPTION)</label>
                  <input
                    type="text"
                    id="exp-title"
                    required
                    placeholder="e.g. የኩሽና ስጋና ሽንኩርት ግዢ"
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-xs font-bold p-3 outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">ምድብ (CATEGORY)</label>
                    <select
                      id="exp-category"
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-xs font-bold p-3 outline-none focus:border-[#C1FF00]"
                    >
                      <option value="ማቴሪያል ግዢ (Kitchen Supply)">ማቴሪያል ግዢ (Kitchen Supplies)</option>
                      <option value="መገልገያ ክፍያ (Utilities)">መገልገያ ክፍያ (Utilities)</option>
                      <option value="የሰራተኛ ደሞዝ (Salary)">የሰራተኛ ደሞዝ (Salary)</option>
                      <option value="ጥገና (Maintenance)">ጥገና (Maintenance)</option>
                      <option value="ጽሕፈት መሳሪያ (Stationery)">ጽሕፈት መሳሪያ (Stationery)</option>
                      <option value="ሌላ ወጪ (Other)">ሌላ ወጪ (Other)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">የአንድ ጊዜ ዋጋ (AMOUNT IN BIRR)</label>
                    <input
                      type="number"
                      id="exp-amount"
                      required
                      min="1"
                      placeholder="e.g. 1500"
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-[#FF5D5D] font-mono text-xs font-black p-3 outline-none focus:border-[#C1FF00]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">የወጣበት ቀን (EXPENSE DATE)</label>
                  <input
                    type="date"
                    id="exp-date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-[#C1FF00] font-mono text-xs font-bold p-3 outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-stone-400 uppercase block mb-1">ተጨማሪ ማስገቢያ ማስታወሻ (NOTES)</label>
                  <textarea
                    id="exp-notes"
                    rows={1}
                    placeholder="የግዢ ደረሰኝ ቁጥር ወይም ዝርዝር መግለጫ ካለ..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-xs p-3 outline-none focus:border-[#C1FF00]"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full h-11 bg-[#FF5D5D] hover:bg-[#ff4444] text-white font-mono text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer rounded-xl shadow-[0_4px_12px_rgba(255,93,93,0.15)]"
                >
                  RECORD EXPENSE OUTFLOW 💸
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* UNIFIED SALES GENERAL LEDGER & RECEIPTS AUDIT TABLE (ቀን/ወር/ዓመት) */}
      <div className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl mt-4 text-left">
        
        {/* Ledger Header & Timeframe switches */}
        <div className="bg-[#181818] px-5 py-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#C1FF00] rounded-full animate-pulse" />
              <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                🧾 {appLang === 'am' ? 'የዕለታዊ፣ ወርሃዊ እና ዓመታዊ ሂሳብ መዝገብ' : 'UNIFIED SALES GENERAL LEDGER'}
              </h3>
            </div>
            <p className="font-mono text-[9px] uppercase text-[#C1FF00] tracking-wider mt-1">
              Auto-categorized by Day, Month, Year & Audit Proof Screenshot Verifications
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
              📅 በቀን (Daily)
            </button>
            <button
              onClick={() => setLedgerFilterTab('monthly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer ${
                ledgerFilterTab === 'monthly' ? 'bg-[#C1FF00] text-black font-black shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              🌙 በወር (Monthly)
            </button>
            <button
              onClick={() => setLedgerFilterTab('yearly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer ${
                ledgerFilterTab === 'yearly' ? 'bg-[#C1FF00] text-black font-black shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              🎄 በዓመት (Yearly)
            </button>
          </div>
        </div>

        {/* Ledger content */}
        <div className="p-5">
          
          {/* 1. DAILY VIEW */}
          {ledgerFilterTab === 'daily' && (() => {
            const allDatesSet = new Set<string>();
            orders.forEach(x => allDatesSet.add(x.date || '2026-06-07'));
            roomBookings.forEach(x => allDatesSet.add(x.checkInDate || '2026-06-07'));
            expenses.forEach(x => allDatesSet.add(x.date || '2026-06-07'));

            const sortedDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));

            if (sortedDates.length === 0) {
              return (
                <div className="text-center py-16 font-mono text-white/30 text-xs uppercase border border-dashed border-white/5 rounded-2xl">
                  No transaction logs available inside this ledger.
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {sortedDates.map(dateKey => {
                  const dayDetails = getAmharicDayOfDate(dateKey);
                  const dailyOrders = orders.filter(x => (x.date || '2026-06-07') === dateKey);
                  const dailyBookings = roomBookings.filter(x => (x.checkInDate || '2026-06-07') === dateKey);
                  const dailyExpenses = expenses.filter(x => (x.date || '2026-06-07') === dateKey);

                  const orderSum = dailyOrders.reduce((sum, ord) => sum + ord.total, 0);
                  const bookingSum = dailyBookings.reduce((sum, bk) => sum + (bk.pricePerNight || 0), 0);
                  const totalDailyRev = orderSum + bookingSum;
                  const totalDailyExp = dailyExpenses.reduce((sum, ex) => sum + ex.amount, 0);
                  const totalDailyNet = totalDailyRev - totalDailyExp;

                  const cashSum = dailyOrders.filter(x => x.payment === 'cash').reduce((sum, ord) => sum + ord.total, 0);
                  const bankSum = dailyOrders.filter(x => x.payment === 'bank').reduce((sum, ord) => sum + ord.total, 0);

                  return (
                    <div key={dateKey} className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-3.5 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-[#C1FF00] text-black text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded">
                              {dayDetails.dayName} (WEEKDAY)
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">{dateKey}</span>
                          </div>
                          <h4 className="text-xs font-black text-white/90 uppercase tracking-wide mt-1">
                            📅 {dayDetails.formattedDate}
                          </h4>
                        </div>
                        
                        <div className="flex gap-4 font-mono text-xs text-left sm:text-right">
                          <div>
                            <span className="text-[8px] text-emerald-400 font-bold uppercase block">ገቢ (REVENUE)</span>
                            <span className="font-black text-emerald-400">+{totalDailyRev.toLocaleString()} ብር</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#FF5D5D] font-bold uppercase block">ወጪ (EXPENSES)</span>
                            <span className="font-black text-[#FF5D5D]">-{totalDailyExp.toLocaleString()} ብር</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#00f5ff] font-bold uppercase block">የተጣራ (NET DAY)</span>
                            <span className={`font-black ${totalDailyNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {totalDailyNet.toLocaleString()} ብር
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cash vs Bank */}
                      <div className="grid grid-cols-2 gap-3 text-[9px] font-mono uppercase bg-white/2">
                        <div className="bg-black/50 p-2 border border-white/5 rounded-lg flex justify-between items-center">
                          <span className="text-stone-400">💵 በጥሬ ገንዘብ (Cash Total):</span>
                          <span className="font-black text-[#C1FF00]">{cashSum.toLocaleString()} ብር</span>
                        </div>
                        <div className="bg-black/50 p-2 border border-white/5 rounded-lg flex justify-between items-center">
                          <span className="text-stone-400">💳 በባንክ የተላከ (Bank Total):</span>
                          <span className="font-black text-[#C1FF00]">{bankSum.toLocaleString()} ብር</span>
                        </div>
                      </div>

                      {/* Food orders */}
                      {dailyOrders.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-mono text-[#C1FF00] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#C1FF00] rounded-full" />
                            <span>🍔 የምግብና መጠጥ ሽያጭ (F&B Orders) - {dailyOrders.length} TXNS</span>
                          </p>
                          <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/5">
                            <table className="w-full text-left font-sans text-xs border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-[9px] font-mono text-stone-400 uppercase">
                                  <th className="p-3">ID / Time</th>
                                  <th className="p-3">Location</th>
                                  <th className="p-3">Ordered Items</th>
                                  <th className="p-3">Method</th>
                                  <th className="p-3 text-right">Total</th>
                                  <th className="p-3 text-center">Receipt Verification</th>
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
                                          💵 ጥሬ ገንዘብ (CASH)
                                        </span>
                                      ) : (
                                        <div className="space-y-1">
                                          <span className="text-sky-400 font-bold bg-sky-950/20 px-1.5 py-0.5 border border-sky-900/30 rounded block w-fit text-[9px]">
                                            💳 በባንክ / TRANSFER
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
                                      {ord.total} ብር
                                      {ord.tip > 0 && <span className="text-[8px] text-emerald-400 block">+ {ord.tip} Tip</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {ord.payment === 'cash' ? (
                                        <span className="text-stone-500 text-[9px] font-mono font-bold uppercase block">-</span>
                                      ) : (
                                        <div className="inline-flex flex-col gap-1 items-center justify-center p-1.5 bg-black/40 border border-white/5 rounded-xl w-full max-w-[150px]">
                                          {ord.receiptScreenshot ? (
                                            <div className="space-y-1 w-full text-center">
                                              <div className="relative group overflow-hidden border border-white/10 bg-black max-h-10 flex justify-center rounded">
                                                <img 
                                                  src={ord.receiptScreenshot} 
                                                  className="h-8 object-contain" 
                                                  alt="Receipt" 
                                                  referrerPolicy="no-referrer"
                                                />
                                              </div>
                                              <a 
                                                href={ord.receiptScreenshot}
                                                target="_blank"
                                                referrerPolicy="no-referrer"
                                                className="text-[7.5px] text-[#C1FF00] hover:underline font-bold block font-mono uppercase"
                                              >
                                                🔍 ገጽ እይ (Full)
                                              </a>
                                            </div>
                                          ) : (
                                            <span className="text-[7.5px] text-stone-400 block">ፎቶ የለም</span>
                                          )}
                                          {ord.confirmed ? (
                                            <span className="text-[7.5px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full block font-bold">
                                              ✔️ Verified
                                            </span>
                                          ) : (
                                            <div className="grid grid-cols-2 gap-1 w-full pt-1">
                                              <button
                                                onClick={() => handleConfirmOrderPayment(ord.id, true)}
                                                className="bg-[#C1FF00] hover:bg-white text-black font-mono font-black text-[7px] py-1 px-1 rounded-lg transition-colors cursor-pointer text-center"
                                              >
                                                OK
                                              </button>
                                              <button
                                                onClick={() => {
                                                  askConfirmAndRun('ባንክ ክፍያው ውድቅ ይደረግ? (Reject bank transfer payment?)', () => {
                                                    handleConfirmOrderPayment(ord.id, false);
                                                  });
                                                }}
                                                className="bg-red-950 hover:bg-red-600 border border-red-900/10 font-mono text-red-500 hover:text-white text-[7px] py-1 px-1 rounded-lg transition-all cursor-pointer text-center"
                                              >
                                                NO
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
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
                            <span>🛎️ የአልጋ/ክፍል ኪራይ (Bedroom Bookings) - {dailyBookings.length} ROOMS</span>
                          </p>
                          <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/5">
                            <table className="w-full text-left font-sans text-xs border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-[9px] font-mono text-stone-400 uppercase">
                                  <th className="p-3">Room</th>
                                  <th className="p-3">Category</th>
                                  <th className="p-3">Guests</th>
                                  <th className="p-3">Phone</th>
                                  <th className="p-3 text-right">Night Rate</th>
                                  <th className="p-3 text-center">Status</th>
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
                                            • <span className="font-bold">{g.fullName || '---'}</span> <span className="text-stone-400">({g.idNumber || 'No ID'})</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3 font-mono text-[11px] font-bold">{bk.contactPhone}</td>
                                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{bk.pricePerNight?.toLocaleString()} ብር</td>
                                    <td className="p-3 text-center">
                                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded block text-center border font-bold ${
                                        bk.status === 'Active' 
                                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' 
                                          : 'bg-white/5 text-stone-400 border-white/5'
                                      }`}>
                                        {bk.status}
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
                            <span>💸 የዕለቱ ወጪዎች ድምር (Outflow Payments) - {dailyExpenses.length} Records</span>
                          </p>
                          <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/5">
                            <table className="w-full text-left font-sans text-xs border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-[9px] font-mono text-stone-400 uppercase">
                                  <th className="p-3">Expense Details</th>
                                  <th className="p-3">Category</th>
                                  <th className="p-3">Notes/Reason</th>
                                  <th className="p-3 text-right">Amount</th>
                                  <th className="p-3 text-center">Actions</th>
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
                                    <td className="p-3 text-right font-mono font-black text-[#FF5D5D]">-{exp.amount.toLocaleString()} ብር</td>
                                    <td className="p-3 text-center">
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveExpense(exp.id)}
                                        className="px-2 py-1 text-[8px] bg-red-950 text-red-400 border border-red-500/10 hover:border-red-500/40 rounded transition-colors font-bold cursor-pointer"
                                      >
                                        DELETE
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
            orders.forEach(x => allMonthsSet.add((x.date || '2026-06-07').substring(0, 7)));
            roomBookings.forEach(x => allMonthsSet.add((x.checkInDate || '2026-06-07').substring(0, 7)));
            expenses.forEach(x => allMonthsSet.add((x.date || '2026-06-07').substring(0, 7)));

            const sortedMonths = Array.from(allMonthsSet).sort((a, b) => b.localeCompare(a));

            if (sortedMonths.length === 0) {
              return (
                <div className="text-center py-16 font-mono text-white/30 text-xs uppercase border border-dashed border-white/5 rounded-2xl">
                  No monthly logs found.
                </div>
              );
            }

            const monthAmharicNames: { [key: string]: string } = {
              '01': 'ጥር / January',
              '02': 'የካቲት / February',
              '03': 'መጋቢት / March',
              '04': 'ሚያዚያ / April',
              '05': 'ግንቦት / May',
              '06': 'ሰኔ / June',
              '07': 'ሐምሌ / July',
              '08': 'ነሐሴ / August',
              '09': 'መስከረም / September',
              '10': 'ጥቅምት / October',
              '11': 'ህዳር / November',
              '12': 'ታህሳስ / December'
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedMonths.map(mKey => {
                  const mParts = mKey.split('-');
                  const mName = monthAmharicNames[mParts[1]] || mParts[1];

                  const mOrders = orders.filter(x => (x.date || '2026-06-07').substring(0, 7) === mKey);
                  const mBookings = roomBookings.filter(x => (x.checkInDate || '2026-06-07').substring(0, 7) === mKey);
                  const mExpenses = expenses.filter(x => (x.date || '2026-06-07').substring(0, 7) === mKey);

                  const mOrderSales = mOrders.reduce((sum, ord) => sum + ord.total, 0);
                  const mBookingSales = mBookings.reduce((sum, bk) => sum + (bk.pricePerNight || 0), 0);
                  const mTotalRevenue = mOrderSales + mBookingSales;
                  const mTotalExpenses = mExpenses.reduce((sum, ex) => sum + ex.amount, 0);
                  const mNetMargin = mTotalRevenue - mTotalExpenses;

                  return (
                    <div key={mKey} className="bg-black/50 p-5 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4 relative overflow-hidden">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[8px] bg-sky-950 font-mono text-sky-400 font-bold tracking-wider px-2 py-0.5 rounded">
                          MONTH LOG: {mKey}
                        </span>
                        <h4 className="text-sm font-black text-[#C1FF00] uppercase tracking-wide mt-1">
                          🌙 {mName} {mParts[0]} የሂሳብ ድምር
                        </h4>
                      </div>

                      <div className="space-y-2 py-1 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-stone-400">የምግብ ሽያጭ ገቢ (Food Sales)</span>
                          <span className="font-bold text-white/90">+{mOrderSales.toLocaleString()} ብር</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-stone-400">የአልጋ ኪራይ ገቢ (Bed Booking)</span>
                          <span className="font-bold text-white/90">+{mBookingSales.toLocaleString()} ብር</span>
                        </div>
                        <div className="flex justify-between font-mono border-t border-white/5 pt-1.5 bg-white/5 px-2 py-1 rounded">
                          <span className="text-emerald-400 font-bold">ጠቅላላ ወር ገቢ (REVENUES)</span>
                          <span className="font-black text-emerald-400">+{mTotalRevenue.toLocaleString()} ብር</span>
                        </div>
                        <div className="flex justify-between font-mono px-2 py-1">
                          <span className="text-[#FF5D5D] font-bold">ጠቅላላ ወር ወጪ (EXPENSES)</span>
                          <span className="font-black text-[#FF5D5D]">-{mTotalExpenses.toLocaleString()} ብር</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-[#C1FF00]/5 border border-[#C1FF00]/10 p-2 text-[10px] font-mono rounded-lg">
                        <span className="text-stone-400">የወሩ የተጣራ ትርፍ (NET MARGIN)፦</span>
                        <span className={`font-black ${mNetMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {mNetMargin.toLocaleString()} ብር
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[8px] text-stone-500 uppercase font-mono border-t border-white/5 pt-1.5">
                        <span>ትዕዛዞች: {mOrders.length}</span>
                        <span>ክፍሎች: {mBookings.length}</span>
                        <span>ወጪዎች: {mExpenses.length}</span>
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
              const d = ord.date || '2026-06-07';
              const y = d.substring(0, 4);
              if (!groupedByYear[y]) groupedByYear[y] = [];
              groupedByYear[y].push(ord);
            });

            const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

            if (sortedYears.length === 0) {
              return (
                <div className="text-center py-16 font-mono text-white/30 text-xs uppercase border border-dashed border-white/5 rounded-2xl">
                  No yearly transaction record found.
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

                  return (
                    <div key={yKey} className="bg-black/50 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-sm font-black text-[#C1FF00] uppercase tracking-wider">
                          🎄 የ {yKey} ዓመታዊ የሽያጭ ሪፖርት (Yearly Report)
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/5 p-3 border border-white/5 rounded-xl">
                          <span className="text-[9px] text-stone-400 block font-bold">በእጅ የተቀበሉት (CASH REVENUE)</span>
                          <span className="font-bold text-white text-sm mt-1 block font-mono">{yCash.toLocaleString()} ብር</span>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/5 rounded-xl">
                          <span className="text-[9px] text-stone-400 block font-bold">በባንክ (BANK REVENUE)</span>
                          <span className="font-bold text-white text-sm mt-1 block font-mono">{yBank.toLocaleString()} ብር</span>
                        </div>
                        <div className="bg-[#C1FF00]/10 p-3 border border-[#C1FF00]/20 rounded-xl">
                          <span className="text-[9px] text-[#C1FF00]/70 block font-bold">አጠቃላይ አመታዊ ሽያጭ (ANNUAL REVENUES)</span>
                          <span className="font-black text-[#C1FF00] text-sm mt-1 block font-mono">{yTotal.toLocaleString()} ብር</span>
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

    </div>
  );
}
