/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import {
  computeLiveOrderQueue,
  formatOrderCode,
  formatOrderTimeDisplay,
  getEffectiveCookingStatus,
  OrderQueueMetrics,
} from '../utils/orderQueue';
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChefHat,
  UtensilsCrossed,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ListOrdered,
  Sparkles,
} from 'lucide-react';

interface LiveOrderTrackerProps {
  mode: 'inline' | 'modal';
  isOpen?: boolean;
  onClose?: () => void;
  orders: Order[];
  guestLocation: string;
  trackedOrderIds: string[];
  highlightedOrderId?: string | null;
  appLang: string;
  expandedOrders: { [key: string]: boolean };
  onToggleExpand: (orderId: string) => void;
  onEditOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onRefresh?: () => Promise<void> | void;
  onOpenFullModal?: () => void;
}

export default function LiveOrderTracker({
  mode,
  isOpen = true,
  onClose,
  orders,
  guestLocation,
  trackedOrderIds,
  highlightedOrderId,
  appLang,
  expandedOrders,
  onToggleExpand,
  onEditOrder,
  onCancelOrder,
  onRefresh,
  onOpenFullModal,
}: LiveOrderTrackerProps) {
  const [lookupQuery, setLookupQuery] = useState('');
  const [showLiveBoard, setShowLiveBoard] = useState(mode === 'modal');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const isAm = appLang === 'am';

  // Update timestamp whenever orders list updates
  useEffect(() => {
    setLastUpdatedLabel(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }, [orders]);

  // If a newly placed order is highlighted, ensure board/lookup focuses cleanly
  useEffect(() => {
    if (mode === 'modal' && isOpen) {
      setShowLiveBoard(true);
    }
  }, [mode, isOpen]);

  const queueSnapshot = useMemo(() => computeLiveOrderQueue(orders), [orders]);

  // Determine which orders belong to this guest OR match their manual lookup query
  const matchedOrders = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    const cleanLoc = guestLocation.trim().toLowerCase();

    if (q) {
      const normalizedQuery = q.replace(/^#/, '');
      return orders.filter((o) => {
        const stage = getEffectiveCookingStatus(o);
        if (stage === 'Inactive') return false;
        const idNorm = (o.id || '').toLowerCase().replace(/^#/, '');
        const locNorm = (o.location || '').toLowerCase();
        const phoneNorm = (o.deliveryPhone || '').toLowerCase();
        return (
          idNorm.includes(normalizedQuery) ||
          locNorm.includes(q) ||
          (phoneNorm && phoneNorm.includes(normalizedQuery))
        );
      });
    }

    // Default: orders matching guestLocation OR placed in this session/device (`trackedOrderIds`)
    // Exclude only orders that are both Paid AND already Served by waiter (unless highlighted right now)
    return orders.filter((o) => {
      const stage = getEffectiveCookingStatus(o);
      if (stage === 'Inactive') return false;
      const isHighlighted = highlightedOrderId && o.id === highlightedOrderId;
      const isTrackedId = trackedOrderIds.includes(o.id);
      const isSameLocation = cleanLoc !== '' && o.location.trim().toLowerCase() === cleanLoc;
      const isFullyDone = o.status === 'Paid' && o.servedByWaiter;
      if (isFullyDone && !isHighlighted) return false;
      return isTrackedId || isSameLocation || isHighlighted;
    });
  }, [orders, lookupQuery, guestLocation, trackedOrderIds, highlightedOrderId]);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdatedLabel(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  if (mode === 'modal' && !isOpen) return null;

  const { activeKitchenQueue, preparingOrders, pendingOrders, readyForPickupOrders } = queueSnapshot;

  const renderStageStepper = (metrics: OrderQueueMetrics) => {
    const stage = metrics.effectiveStage;
    const stepIndex =
      stage === 'Served'
        ? 4
        : stage === 'Completed'
        ? 3
        : stage === 'Preparing'
        ? 2
        : 1;

    const steps = [
      {
        num: 1,
        label: isAm ? 'ተቀብለናል' : 'Queued',
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      {
        num: 2,
        label: isAm ? 'እየተዘጋጀ' : 'Preparing',
        icon: <ChefHat className="w-3.5 h-3.5" />,
      },
      {
        num: 3,
        label: isAm ? 'ተዘጋጅቷል' : 'Ready',
        icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
      },
      {
        num: 4,
        label: isAm ? 'ቀርቧል' : 'Served',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
    ];

    return (
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
        {steps.map((s) => {
          const isDone = stepIndex > s.num;
          const isCurrent = stepIndex === s.num;
          return (
            <div key={s.num} className="flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-600'
                    : isCurrent
                    ? s.num === 2
                      ? 'bg-[#b21f1f]'
                      : s.num === 3 || s.num === 4
                      ? 'bg-emerald-600'
                      : 'bg-[#f4c22b]'
                    : 'bg-stone-200'
                }`}
              />
              <div
                className={`flex items-center gap-1 text-[10px] font-bold leading-tight ${
                  isCurrent
                    ? 'text-stone-900'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-stone-400'
                }`}
              >
                {s.icon}
                <span className="truncate">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderCard = (ord: Order) => {
    const metrics = queueSnapshot.getMetrics(ord);
    const isJustPlaced = highlightedOrderId === ord.id;
    const isExpanded =
      expandedOrders[ord.id] !== undefined
        ? expandedOrders[ord.id]
        : isJustPlaced || matchedOrders.length <= 2;

    const statusText =
      metrics.effectiveStage === 'Served'
        ? isAm
          ? 'ለእርስዎ ቀርቧል'
          : 'Served to Table'
        : metrics.effectiveStage === 'Completed'
        ? isAm
          ? 'ተዘጋጅቷል — አስተናጋጅ እያመጣ ነው'
          : 'Ready — Waiter Delivering'
        : metrics.effectiveStage === 'Preparing'
        ? isAm
          ? 'ኩሽና ውስጥ እየተዘጋጀ ነው'
          : 'Now Preparing in Kitchen'
        : isAm
        ? 'ወረፋ ላይ (በመጠባበቅ ላይ)'
        : 'Waiting in Queue';

    return (
      <div
        key={ord.id}
        className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
          isJustPlaced
            ? 'border-[#b21f1f] ring-2 ring-[#f4c22b]/60 shadow-lg'
            : 'border-[#ebe5d8] shadow-sm'
        }`}
      >
        {/* Celebratory Banner if this order was just placed */}
        {isJustPlaced && (
          <div className="bg-[#b21f1f] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f4c22b] shrink-0" />
              <span>
                {isAm
                  ? `ትዕዛዝዎ ${formatOrderCode(ord.id)} በተሳካ ሁኔታ ተመዝግቧል!`
                  : `Order ${formatOrderCode(ord.id)} placed successfully!`}
              </span>
            </div>
            {metrics.inKitchenQueue && (
              <span className="font-mono text-[11px] text-[#f4c22b] font-black tabular-nums">
                {isAm
                  ? `ተራ #${metrics.position} / ከፊትዎ ${metrics.ordersAhead} ትዕዛዝ`
                  : `Queue #${metrics.position} · ${metrics.ordersAhead} ahead`}
              </span>
            )}
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4">
          {/* Header Row */}
          <div
            onClick={() => onToggleExpand(ord.id)}
            className="flex flex-wrap justify-between items-start gap-3 cursor-pointer select-none"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-stone-900">
                <span className="text-sm sm:text-base font-mono font-black tracking-tight text-[#b21f1f]">
                  {formatOrderCode(ord.id)}
                </span>
                <span className="text-stone-300">·</span>
                <span className="text-xs font-bold text-stone-700">{ord.location}</span>
                <span className="text-stone-300">·</span>
                <span className="text-xs font-mono text-stone-500 tabular-nums">
                  {formatOrderTimeDisplay(ord)}
                </span>
                <span className="text-stone-300">·</span>
                <span
                  className={`text-xs font-bold ${
                    ord.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {ord.status === 'Paid'
                    ? isAm
                      ? 'የተከፈለ'
                      : 'Paid'
                    : isAm
                    ? 'ያልተከፈለ'
                    : 'Unpaid'}
                </span>
              </div>

              <p className="text-xs font-bold text-stone-600">{statusText}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] font-mono font-black text-stone-900 tabular-nums block">
                  {ord.total} {isAm ? 'ብር' : 'ETB'}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  {ord.items.reduce((s, it) => s + (it.qty || 1), 0)}{' '}
                  {isAm ? 'እቃዎች' : 'items'}
                </span>
              </div>
              <button
                type="button"
                aria-label={isExpanded ? 'Collapse order details' : 'Expand order details'}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 4-Stage Stepper */}
          {renderStageStepper(metrics)}

          {/* LIVE QUEUE METRICS STRIP — Answers: Before, Current Position, After */}
          {metrics.inKitchenQueue ? (
            <div className="bg-[#fcfbf7] border border-[#ebe5d8] rounded-2xl p-3.5 sm:p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {/* 1. Orders Ahead */}
                <div className="bg-white border border-stone-200 rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-1">
                  <span className="text-[11px] font-bold text-stone-500">
                    {isAm ? 'ከእርስዎ ትዕዛዝ በፊት' : 'Orders Ahead of Yours'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-black text-[#b21f1f] tabular-nums">
                      {metrics.ordersAhead}
                    </span>
                    <span className="text-[11px] font-bold text-stone-600">
                      {metrics.ordersAhead === 0
                        ? isAm
                          ? 'ቀዳሚ ተራ!'
                          : 'Next up!'
                        : isAm
                        ? 'ትዕዛዝ አለ'
                        : 'ahead'}
                    </span>
                  </div>
                </div>

                {/* 2. Your Position */}
                <div className="bg-[#f4c22b]/20 border border-[#f4c22b] rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-1">
                  <span className="text-[11px] font-bold text-stone-800">
                    {isAm ? 'የእርስዎ ትዕዛዝ ደረጃ' : 'Your Queue Position'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-black text-stone-900 tabular-nums">
                      #{metrics.position}
                    </span>
                    <span className="text-[11px] font-bold text-stone-700 tabular-nums">
                      {isAm
                        ? `${metrics.position}ኛው (ከ${metrics.totalInQueue})`
                        : `of ${metrics.totalInQueue} active`}
                    </span>
                  </div>
                </div>

                {/* 3. Orders After / Next Behind */}
                <div className="bg-white border border-stone-200 rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-1">
                  <span className="text-[11px] font-bold text-stone-500">
                    {isAm ? 'ከእርስዎ ትዕዛዝ ቀጥሎ' : 'Orders After Yours'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-black text-stone-800 tabular-nums">
                      {metrics.ordersBehind}
                    </span>
                    <span className="text-[11px] font-bold text-stone-600">
                      {isAm ? 'ትዕዛዝ ቀጥሏል' : 'behind'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plain-language summary sentence + ETA */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700 pt-0.5">
                <p className="font-semibold leading-snug">
                  {metrics.ordersAhead === 0 ? (
                    metrics.effectiveStage === 'Preparing' ? (
                      isAm ? (
                        '🔥 ከእርስዎ በፊት ምንም ትዕዛዝ የለም — የእርስዎ ትዕዛዝ አሁን ኩሽና ውስጥ እየተዘጋጀ ነው።'
                      ) : (
                        '🔥 0 orders ahead — your order is currently being prepared in the kitchen.'
                      )
                    ) : (
                      isAm ? (
                        '🎯 ከእርስዎ በፊት ምንም ትዕዛዝ የለም — የእርስዎ ትዕዛዝ #1ኛ ተራ ላይ ነው (ቀጥሎ ይጀመራል)።'
                      ) : (
                        '🎯 0 orders ahead — you are #1 in line and up next!'
                      )
                    )
                  ) : isAm ? (
                    `⏳ ከእርስዎ ትዕዛዝ በፊት ${metrics.ordersAhead} ትዕዛዝ(ዞች) እየተስተናገዱ ነው፤ እርስዎ #${metrics.position}ኛው ተራ ላይ ነዎት።`
                  ) : (
                    `⏳ There ${metrics.ordersAhead === 1 ? 'is' : 'are'} ${metrics.ordersAhead} order${
                      metrics.ordersAhead === 1 ? '' : 's'
                    } ahead of yours — you are #${metrics.position} in line.`
                  )}
                </p>
                <span className="font-mono text-[11px] font-bold text-stone-600 tabular-nums">
                  {isAm
                    ? `ግምታዊ ቆይታ: ~${metrics.estimatedMinutes} ደቂቃ`
                    : `Est. ~${metrics.estimatedMinutes} min`}
                </span>
              </div>

              {/* Visual Live Queue Train */}
              {activeKitchenQueue.length > 0 && (
                <div className="pt-2 border-t border-stone-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-500">
                      {isAm
                        ? 'የቀጥታ የወረፋ ሰልፍ (Live Queue Order)'
                        : 'Live Kitchen Queue Sequence'}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                      {activeKitchenQueue.length} {isAm ? 'በኩሽና' : 'in queue'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {activeKitchenQueue.map((qOrd, qIdx) => {
                      const isMine = qOrd.id === ord.id;
                      const qStage = getEffectiveCookingStatus(qOrd);
                      return (
                        <React.Fragment key={qOrd.id}>
                          <div
                            className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                              isMine
                                ? 'bg-[#b21f1f] text-white border-[#8c1414] font-black shadow-sm'
                                : qStage === 'Preparing'
                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                                : 'bg-white border-stone-200 text-stone-600 font-medium'
                            }`}
                          >
                            <span className="tabular-nums font-black">#{qIdx + 1}</span>
                            <span>{formatOrderCode(qOrd.id)}</span>
                            <span className="text-[9px] opacity-85">
                              {isMine
                                ? isAm
                                  ? '★ የእርስዎ'
                                  : '★ YOU'
                                : qStage === 'Preparing'
                                ? isAm
                                  ? 'እየተዘጋጀ'
                                  : 'Cooking'
                                : isAm
                                ? 'ወረፋ'
                                : 'Queued'}
                            </span>
                          </div>
                          {qIdx < activeKitchenQueue.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-stone-300 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {metrics.effectiveStage === 'Completed'
                    ? isAm
                      ? 'ምግብዎ ተዘጋጅቶ ከኩሽና ወጥቷል — አስተናጋጅ ወደ እርስዎ እያመጣው ነው!'
                      : 'Your order is cooked and ready — our waiter is bringing it to you!'
                    : isAm
                    ? 'ትዕዛዝዎ በተሳካ ሁኔታ ቀርቧል። መልካም ምግብ!'
                    : 'Your order has been served. Enjoy your meal!'}
                </span>
              </div>
              <span className="font-mono text-[11px] font-black text-emerald-700">
                {isAm ? '0 ትዕዛዝ ከፊትዎ' : '0 ahead'}
              </span>
            </div>
          )}

          {/* Expandable Order Items & Edit/Cancel */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-stone-200 space-y-3 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ord.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-[#fcfbf7] p-3 rounded-xl border border-stone-200 flex justify-between items-center gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-stone-900 truncate">
                          {item.name || (item as any).nameAm || (item as any).nameEn || 'Menu Item'}
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono tabular-nums">
                          {item.qty} × {item.price} {isAm ? 'ብር' : 'ETB'}
                        </p>
                      </div>
                      <span className="font-mono font-black text-stone-900 tabular-nums shrink-0">
                        {item.price * item.qty} {isAm ? 'ብር' : 'ETB'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price breakdown summary */}
                <div className="flex flex-wrap justify-between items-center gap-2 bg-stone-50 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 font-mono tabular-nums">
                    <span>
                      {isAm ? 'አገልግሎት:' : 'Service:'} {ord.serviceCharge || 0}
                    </span>
                    <span>·</span>
                    <span>
                      {isAm ? 'VAT:' : 'VAT:'} {ord.vat || 0}
                    </span>
                    {ord.tip > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          {isAm ? 'ጉርሻ:' : 'Tip:'} {ord.tip}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="font-mono font-black text-sm text-[#b21f1f] tabular-nums">
                    {isAm ? 'ጠቅላላ:' : 'TOTAL:'} {ord.total} {isAm ? 'ብር' : 'ETB'}
                  </div>
                </div>

                {/* Edit / Cancel only when still Pending */}
                {metrics.effectiveStage === 'Pending' && (
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => onEditOrder(ord)}
                      className="flex-1 min-w-[140px] bg-[#f4c22b] hover:bg-yellow-400 text-stone-900 font-black text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm border border-[#cf9d12]"
                    >
                      ✏️ {isAm ? 'ትዕዛዝ አስተካክል (Edit)' : 'Edit Order'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelOrder(ord.id)}
                      className="flex-1 min-w-[140px] bg-[#b21f1f] hover:bg-[#8c1414] text-white font-black text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      ✕ {isAm ? 'ትዕዛዝ ሰርዝ (Cancel)' : 'Cancel Order'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderLiveKitchenBoard = () => {
    const myOrderSet = new Set(matchedOrders.map((o) => o.id));
    return (
      <div className="bg-white border border-[#ebe5d8] rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h5 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-[#b21f1f]" />
              <span>
                {isAm
                  ? 'የኩሽና የቀጥታ ትዕዛዝ ወረፋ ማሳያ (Live Order Queue Display)'
                  : 'Live Kitchen Order Queue Display'}
              </span>
            </h5>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {isAm
                ? 'ሁሉም ንቁ ትዕዛዞች በቅደም ተከተል እዚህ በቀጥታ ይታያሉ — የእርስዎ ትዕዛዝ በቀይ/ቢጫ ተለይቶ ይታያል።'
                : 'All active orders appear in real-time FIFO service order with yours highlighted.'}
            </p>
          </div>
          <div className="text-[11px] font-mono font-bold text-stone-600 tabular-nums">
            {preparingOrders.length} {isAm ? 'እየተዘጋጁ' : 'preparing'} · {pendingOrders.length}{' '}
            {isAm ? 'ወረፋ ላይ' : 'waiting'} · {readyForPickupOrders.length}{' '}
            {isAm ? 'ዝግጁ' : 'ready'}
          </div>
        </div>

        {activeKitchenQueue.length === 0 && readyForPickupOrders.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs font-bold bg-[#fcfbf7] rounded-2xl border border-dashed border-stone-300">
            {isAm
              ? 'በአሁኑ ሰዓት ኩሽና ውስጥ ወረፋ ላይ ያለ ትዕዛዝ የለም — አሁን ካዘዙ #1ኛ ይሆናሉ!'
              : 'No orders currently in the kitchen queue — order now to be #1!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: Now Preparing */}
            <div className="bg-[#fcfbf7] border border-amber-200 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-amber-900">
                <span>🔥 {isAm ? 'እየተዘጋጁ (Preparing)' : 'Now Preparing'}</span>
                <span className="font-mono tabular-nums">{preparingOrders.length}</span>
              </div>
              {preparingOrders.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-3 text-center">
                  {isAm ? 'ምንም የለም' : 'None'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {preparingOrders.map((o) => {
                    const m = queueSnapshot.getMetrics(o);
                    const isMine = myOrderSet.has(o.id);
                    return (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          isMine
                            ? 'bg-[#b21f1f] text-white border-[#8c1414] font-black shadow-sm'
                            : 'bg-white border-amber-200/80 text-stone-800 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono tabular-nums">#{m.position}</span>
                          <span className="font-mono truncate">{formatOrderCode(o.id)}</span>
                        </div>
                        <span className="text-[10px] font-mono shrink-0">
                          {isMine ? (isAm ? '★ የእርስዎ' : '★ YOURS') : o.location}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 2: Waiting in Queue */}
            <div className="bg-[#fcfbf7] border border-stone-200 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-stone-900">
                <span>⏳ {isAm ? 'ወረፋ ላይ (In Queue)' : 'Waiting in Line'}</span>
                <span className="font-mono tabular-nums">{pendingOrders.length}</span>
              </div>
              {pendingOrders.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-3 text-center">
                  {isAm ? 'ወረፋ የለም' : 'Queue clear'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {pendingOrders.map((o) => {
                    const m = queueSnapshot.getMetrics(o);
                    const isMine = myOrderSet.has(o.id);
                    return (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          isMine
                            ? 'bg-[#f4c22b] text-stone-950 border-[#cf9d12] font-black shadow-sm'
                            : 'bg-white border-stone-200 text-stone-700 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono tabular-nums font-black">#{m.position}</span>
                          <span className="font-mono truncate">{formatOrderCode(o.id)}</span>
                        </div>
                        <span className="text-[10px] font-mono shrink-0 tabular-nums">
                          {isMine
                            ? isAm
                              ? `★ የእርስዎ (${m.ordersAhead} ከፊት)`
                              : `★ YOU (${m.ordersAhead} ahead)`
                            : `${m.ordersAhead} ${isAm ? 'ከፊት' : 'ahead'}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 3: Ready for Pickup */}
            <div className="bg-[#fcfbf7] border border-emerald-200 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                <span>✅ {isAm ? 'ተዘጋጅቷል (Ready)' : 'Ready for Delivery'}</span>
                <span className="font-mono tabular-nums">{readyForPickupOrders.length}</span>
              </div>
              {readyForPickupOrders.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-3 text-center">
                  {isAm ? 'ምንም የለም' : 'None waiting'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {readyForPickupOrders.map((o) => {
                    const isMine = myOrderSet.has(o.id);
                    return (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          isMine
                            ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-sm'
                            : 'bg-white border-emerald-200 text-emerald-900 font-bold'
                        }`}
                      >
                        <span className="font-mono truncate">{formatOrderCode(o.id)}</span>
                        <span className="text-[10px] font-mono shrink-0">
                          {isMine ? (isAm ? '★ የእርስዎ ዝግጁ!' : '★ YOURS READY') : o.location}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const innerContent = (
    <div className="bg-[#fcfbf7] border border-[#f0e7d5] p-5 sm:p-6 rounded-[2rem] space-y-5 shadow-xl text-stone-900">
      {/* Top Bar: Title + Live Status + Refresh + Toggle Live Board */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-stone-200 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#b21f1f] rounded-full animate-ping inline-block shrink-0" />
            <h4 className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
              {isAm
                ? '📦 ላይቭ ኦርደር መከታተያ እና ወረፋ ማሳያ'
                : '📦 Live Order Tracker & Queue Display'}
            </h4>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            {isAm
              ? `ከእርስዎ በፊት ስንት ትዕዛዝ እንዳለ እና ስንተኛው ላይ እንዳሉ በቀጥታ ይከታተሉ · የዘመነው ${lastUpdatedLabel}`
              : `Live kitchen queue position & orders ahead · Updated ${lastUpdatedLabel}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLiveBoard((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              showLiveBoard
                ? 'bg-[#b21f1f] text-white border-[#8c1414]'
                : 'bg-white text-stone-800 border-stone-200 hover:border-[#b21f1f]'
            }`}
          >
            📺 {isAm ? 'ላይቭ ወረፋ ቦርድ' : 'Live Board'} ({activeKitchenQueue.length})
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title={isAm ? 'አሁን አድስ' : 'Refresh live queue'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAm ? 'አድስ' : 'Refresh'}</span>
            </button>
          )}

          {mode === 'inline' && onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              className="px-3 py-2 rounded-xl text-xs font-black bg-[#f4c22b] hover:bg-yellow-400 text-stone-900 border border-[#cf9d12] transition-all cursor-pointer"
            >
              {isAm ? 'ሙሉ ማሳያ' : 'Full View'}
            </button>
          )}

          {mode === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Order Lookup / Check Input ("ኦርደር ላይ ቼክ ማድረጊያ") */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder={
              isAm
                ? 'ትዕዛዝዎን ቼክ ያድርጉ፦ የትዕዛዝ ቁጥር (#O-...)፣ የክፍል/ጠረጴዛ ቁጥር ወይም ስልክ ያስገቡ...'
                : 'Check any order by Order ID (#O-...), Room/Table, or Phone...'
            }
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl text-xs font-bold text-stone-900 placeholder-stone-400 outline-none transition-all"
          />
          {lookupQuery && (
            <button
              type="button"
              onClick={() => setLookupQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between sm:justify-start gap-2 text-xs shrink-0">
          <span className="text-stone-500 font-bold">
            {isAm ? 'ኩሽና ውስጥ:' : 'Kitchen Queue:'}
          </span>
          <span className="font-mono font-black text-[#b21f1f] tabular-nums">
            {activeKitchenQueue.length} {isAm ? 'ትዕዛዞች' : 'active'}
          </span>
        </div>
      </div>

      {/* Tracked / Matched Orders */}
      {matchedOrders.length > 0 ? (
        <div className="space-y-4">{matchedOrders.map((ord) => renderOrderCard(ord))}</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 text-center space-y-1.5">
          <p className="text-xs sm:text-sm font-black text-stone-800">
            {lookupQuery.trim()
              ? isAm
                ? `ከ "${lookupQuery}" ጋር የሚዛመድ ንቁ ትዕዛዝ አልተገኘም።`
                : `No active order found matching "${lookupQuery}".`
              : isAm
              ? `ለ "${guestLocation}" የተመዘገበ ንቁ ትዕዛዝ አልተገኘም — ከላይ በትዕዛዝ ቁጥር (#O-...) መፈለግ ወይም አዲስ ማዘዝ ይችላሉ።`
              : `No active orders for "${guestLocation}" yet. Search by Order ID above or place an order to see your live queue position.`}
          </p>
          <p className="text-[11px] text-stone-500 font-medium">
            {isAm
              ? `በአሁኑ ሰዓት ኩሽና ውስጥ ${activeKitchenQueue.length} ትዕዛዝ(ዞች) ወረፋ ላይ አሉ — አሁን ካዘዙ #${
                  activeKitchenQueue.length + 1
                }ኛ ተራ ላይ ይሆናሉ።`
              : `Currently ${activeKitchenQueue.length} order(s) in kitchen queue — ordering now puts you at #${
                  activeKitchenQueue.length + 1
                }.`}
          </p>
        </div>
      )}

      {/* Full Live Kitchen Display Board */}
      {showLiveBoard && renderLiveKitchenBoard()}
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-5">
        <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-[2rem]">
          {innerContent}
        </div>
      </div>
    );
  }

  return (
    <div id="live-order-tracker-section" className="max-w-5xl mx-auto w-full mb-6">
      {innerContent}
    </div>
  );
}
