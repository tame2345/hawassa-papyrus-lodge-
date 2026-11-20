/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import { useLanguage } from '../context/LanguageContext';

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
  appLang: _propAppLang,
  expandedOrders,
  onToggleExpand,
  onEditOrder,
  onCancelOrder,
  onRefresh,
  onOpenFullModal,
}: LiveOrderTrackerProps) {
  const { t, tText, currency, isRtl } = useLanguage();
  const [lookupQuery, setLookupQuery] = useState('');
  const [showLiveBoard, setShowLiveBoard] = useState(mode === 'modal');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  // Track orders transitioning into 'Preparing' or 'Completed' for an elevated arrival pulse
  const prevStagesRef = useRef<Record<string, string>>({});
  const [recentlyTransitioned, setRecentlyTransitioned] = useState<Record<string, 'Preparing' | 'Completed'>>({});

  // Update timestamp whenever orders list updates & detect transitions to Preparing/Completed
  useEffect(() => {
    setLastUpdatedLabel(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );

    const newlyTransitioned: Record<string, 'Preparing' | 'Completed'> = {};
    const nextMap: Record<string, string> = {};

    for (const ord of orders) {
      const stage = getEffectiveCookingStatus(ord);
      nextMap[ord.id] = stage;
      const prev = prevStagesRef.current[ord.id];
      if (prev && prev !== stage && (stage === 'Preparing' || stage === 'Completed')) {
        newlyTransitioned[ord.id] = stage;
      }
    }
    prevStagesRef.current = nextMap;

    const changedIds = Object.keys(newlyTransitioned);
    if (changedIds.length > 0) {
      setRecentlyTransitioned((curr) => ({ ...curr, ...newlyTransitioned }));
      const timer = window.setTimeout(() => {
        setRecentlyTransitioned((curr) => {
          const updated = { ...curr };
          for (const id of changedIds) {
            if (updated[id] === newlyTransitioned[id]) {
              delete updated[id];
            }
          }
          return updated;
        });
      }, 3600);
      return () => window.clearTimeout(timer);
    }
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
    // Keep Paid/Completed/Served orders visible so guest sees final Waiter Checked & Delivered step
    return orders.filter((o) => {
      const stage = getEffectiveCookingStatus(o);
      if (stage === 'Inactive') return false;
      const isHighlighted = highlightedOrderId && o.id === highlightedOrderId;
      const isTrackedId = trackedOrderIds.includes(o.id);
      const isSameLocation = cleanLoc !== '' && o.location.trim().toLowerCase() === cleanLoc;
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
        label: t('tracker.step_queued'),
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      {
        num: 2,
        label: t('tracker.step_preparing'),
        icon: <ChefHat className="w-3.5 h-3.5" />,
      },
      {
        num: 3,
        label: t('tracker.step_ready'),
        icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
      },
      {
        num: 4,
        label: t('tracker.step_served'),
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
    ];

    return (
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
        {steps.map((s) => {
          const isDone = stepIndex > s.num;
          const isCurrent = stepIndex === s.num;
          const isPreparingStep = isCurrent && s.num === 2;
          const isCompletedStep = isCurrent && s.num === 3;
          return (
            <div key={s.num} className="flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-600'
                    : isCurrent
                    ? s.num === 2
                      ? 'bg-[#b21f1f] order-bar-pulse'
                      : s.num === 3
                      ? 'bg-emerald-600 order-bar-pulse'
                      : s.num === 4
                      ? 'bg-emerald-600'
                      : 'bg-[#f4c22b]'
                    : 'bg-stone-200'
                }`}
              />
              <div
                className={`flex items-center gap-1 text-[10px] font-bold leading-tight ${
                  isCurrent
                    ? isPreparingStep
                      ? 'text-[#b21f1f]'
                      : isCompletedStep
                      ? 'text-emerald-700'
                      : 'text-stone-900'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-stone-400'
                }`}
              >
                <span className="relative inline-flex items-center justify-center shrink-0">
                  {s.icon}
                  {(isPreparingStep || isCompletedStep) && (
                    <span
                      aria-hidden="true"
                      className={`ml-1 w-1.5 h-1.5 rounded-full inline-block ${
                        isPreparingStep
                          ? 'bg-[#b21f1f] order-dot-preparing'
                          : 'bg-emerald-500 order-dot-completed'
                      }`}
                    />
                  )}
                </span>
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

    const transitionState = recentlyTransitioned[ord.id];
    const isPreparing = metrics.effectiveStage === 'Preparing';
    const isCompleted = metrics.effectiveStage === 'Completed';

    const statusText =
      metrics.effectiveStage === 'Served'
        ? t('tracker.status_served')
        : isCompleted
        ? t('tracker.status_completed')
        : isPreparing
        ? t('tracker.status_preparing')
        : t('tracker.status_pending');

    return (
      <div
        key={ord.id}
        className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
          transitionState === 'Completed'
            ? 'order-transition-completed border-emerald-500 ring-2 ring-emerald-400/50 shadow-md'
            : transitionState === 'Preparing'
            ? 'order-transition-preparing border-[#b21f1f] ring-2 ring-[#f4c22b]/70 shadow-md'
            : isJustPlaced
            ? 'border-[#b21f1f] ring-2 ring-[#f4c22b]/60 shadow-lg'
            : isCompleted
            ? 'border-emerald-300 shadow-sm'
            : isPreparing
            ? 'border-amber-300 shadow-sm'
            : 'border-[#ebe5d8] shadow-sm'
        }`}
      >
        {/* Celebratory Banner if this order was just placed */}
        {isJustPlaced && (
          <div className="bg-[#b21f1f] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f4c22b] shrink-0" />
              <span>
                {tText({
                  am: `ትዕዛዝዎ ${formatOrderCode(ord.id)} በተሳካ ሁኔታ ተመዝግቧል!`,
                  en: `Order ${formatOrderCode(ord.id)} placed successfully!`,
                  or: `Ajajni keessan ${formatOrderCode(ord.id)} galmaa'eera!`,
                  ti: `ትእዛዝኩም ${formatOrderCode(ord.id)} ተመዝጊቡ ኣሎ!`,
                  sid: `Hajajokki ${formatOrderCode(ord.id)} maareessamino!`,
                  fr: `Commande ${formatOrderCode(ord.id)} enregistrée !`,
                  de: `Bestellung ${formatOrderCode(ord.id)} erfolgreich aufgegeben!`,
                  it: `Ordine ${formatOrderCode(ord.id)} inviato con successo!`,
                  zh: `订单 ${formatOrderCode(ord.id)} 下单成功！`,
                  ar: `تم تسجيل طلبك ${formatOrderCode(ord.id)} بنجاح!`,
                })}
              </span>
            </div>
            {metrics.inKitchenQueue && (
              <span className="font-mono text-[11px] text-[#f4c22b] font-black tabular-nums">
                #{metrics.position} · {metrics.ordersAhead}
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
                  {ord.status === 'Paid' ? t('common.paid') : t('common.unpaid')} ({String(ord.payment || 'cash').toUpperCase()})
                </span>
              </div>

              <div className="inline-flex items-center gap-2 pt-0.5">
                {(isPreparing || isCompleted) && (
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 order-dot-completed'
                        : 'bg-[#b21f1f] order-dot-preparing'
                    }`}
                  />
                )}
                <p
                  className={`text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'text-emerald-700'
                      : isPreparing
                      ? 'text-[#b21f1f]'
                      : 'text-stone-600'
                  }`}
                >
                  {statusText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] font-mono font-black text-stone-900 tabular-nums block">
                  {ord.total} {currency}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  {ord.items.reduce((s, it) => s + (it.qty || 1), 0)} {t('common.items')}
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
                    {t('tracker.ahead_label')}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-black text-[#b21f1f] tabular-nums">
                      {metrics.ordersAhead}
                    </span>
                    <span className="text-[11px] font-bold text-stone-600">
                      {metrics.ordersAhead === 0
                        ? tText({ am: 'ቀዳሚ ተራ!', en: 'Next up!', or: 'Dura!', ti: 'ቀዳማይ!', sid: 'Albicho!', fr: 'Suivant !', de: 'Als Nächstes!', it: 'Prossimo!', zh: '下一位！', ar: 'التالي!' })
                        : t('tracker.active')}
                    </span>
                  </div>
                </div>

                {/* 2. Your Position */}
                <div className="bg-[#f4c22b]/20 border border-[#f4c22b] rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-1">
                  <span className="text-[11px] font-bold text-stone-800">
                    {t('tracker.position_label')}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-black text-stone-900 tabular-nums">
                      #{metrics.position}
                    </span>
                    <span className="text-[11px] font-bold text-stone-700 tabular-nums">
                      / {metrics.totalInQueue}
                    </span>
                  </div>
                </div>

                {/* 3. Orders After / Next Behind */}
                <div className="bg-white border border-stone-200 rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-1">
                  <span className="text-[11px] font-bold text-stone-500">
                    {t('tracker.behind_label')}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-black text-stone-800 tabular-nums">
                      {metrics.ordersBehind}
                    </span>
                    <span className="text-[11px] font-bold text-stone-600">
                      {t('tracker.active')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plain-language summary sentence + ETA */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700 pt-0.5">
                <p className="font-semibold leading-snug">
                  {metrics.ordersAhead === 0 ? (
                    metrics.effectiveStage === 'Preparing' ? (
                      tText({
                        am: '🔥 ከእርስዎ በፊት ምንም ትዕዛዝ የለም — የእርስዎ ትዕዛዝ አሁን ኩሽና ውስጥ እየተዘጋጀ ነው።',
                        en: '🔥 0 orders ahead — your order is currently being prepared in the kitchen.',
                        or: '🔥 Ajajni dura keessan jiru hin jiru — amma qophaa\'aa jira.',
                        ti: '🔥 ቅድሜኹም ትእዛዝ የለን — ሕጂ ኣብ ክሽነ ይዳሎ ኣሎ።',
                        sid: '🔥 Albakkiinni hajajo dino — xa qixxaawanni no.',
                        fr: '🔥 0 commande devant — la vôtre est en préparation.',
                        de: '🔥 0 Bestellungen vor Ihnen — Ihre wird gerade zubereitet.',
                        it: '🔥 0 ordini davanti — il tuo è in preparazione.',
                        zh: '🔥 前方无排队订单 — 您的菜品正在制作中。',
                        ar: '🔥 لا توجد طلبات قبلك — طلبك قيد التحضير الآن.',
                      })
                    ) : (
                      tText({
                        am: '🎯 ከእርስዎ በፊት ምንም ትዕዛዝ የለም — የእርስዎ ትዕዛዝ #1ኛ ተራ ላይ ነው (ቀጥሎ ይጀመራል)።',
                        en: '🎯 0 orders ahead — you are #1 in line and up next!',
                        or: '🎯 Ajajni dura keessan hin jiru — isintu #1 dha!',
                        ti: '🎯 ቅድሜኹም ትእዛዝ የለን — #1ኛ ተራ ኢኹም!',
                        sid: '🎯 Albakkiinni hajajo dino — #1 deerra aana nootto!',
                        fr: '🎯 0 commande devant — vous êtes #1 et le prochain !',
                        de: '🎯 0 Bestellungen vor Ihnen — Sie sind #1!',
                        it: '🎯 0 ordini davanti — sei il #1 in fila!',
                        zh: '🎯 前方无排队订单 — 您是第 1 位，即将开始制作！',
                        ar: '🎯 لا توجد طلبات قبلك — أنت رقم 1 في القائمة!',
                      })
                    )
                  ) : (
                    tText({
                      am: `⏳ ከእርስዎ ትዕዛዝ በፊት ${metrics.ordersAhead} ትዕዛዝ(ዞች) እየተስተናገዱ ነው፤ እርስዎ #${metrics.position}ኛው ተራ ላይ ነዎት።`,
                      en: `⏳ ${metrics.ordersAhead} order(s) ahead of yours — you are #${metrics.position} in line.`,
                      or: `⏳ Ajajni ${metrics.ordersAhead} dura keessan jira — sadarkaan keessan #${metrics.position}.`,
                      ti: `⏳ ቅድሜኹም ${metrics.ordersAhead} ትእዛዝ ኣሎ — #${metrics.position}ኛ ተራ ኢኹም።`,
                      sid: `⏳ Albakkiinni ${metrics.ordersAhead} hajajo no — #${metrics.position} deerra.`,
                      fr: `⏳ ${metrics.ordersAhead} commande(s) avant vous — vous êtes #${metrics.position}.`,
                      de: `⏳ ${metrics.ordersAhead} Bestellung(en) vor Ihnen — Position #${metrics.position}.`,
                      it: `⏳ ${metrics.ordersAhead} ordini prima del tuo — sei #${metrics.position}.`,
                      zh: `⏳ 前方还有 ${metrics.ordersAhead} 笔订单 — 您当前排第 #${metrics.position} 位。`,
                      ar: `⏳ هناك ${metrics.ordersAhead} طلب قبلك — ترتيبك #${metrics.position}.`,
                    })
                  )}
                </p>
                <span className="font-mono text-[11px] font-bold text-stone-600 tabular-nums">
                  ⏱ ~{metrics.estimatedMinutes} min
                </span>
              </div>

              {/* Visual Live Queue Train */}
              {activeKitchenQueue.length > 0 && (
                <div className="pt-2 border-t border-stone-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-500">
                      {t('tracker.live_board')}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                      {activeKitchenQueue.length} {t('tracker.active')}
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
                                ? `bg-[#b21f1f] text-white border-[#8c1414] font-black shadow-sm ${
                                    qStage === 'Preparing' ? 'order-badge-pulse-preparing' : ''
                                  }`
                                : qStage === 'Preparing'
                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                                : 'bg-white border-stone-200 text-stone-600 font-medium'
                            }`}
                          >
                            {qStage === 'Preparing' && (
                              <span
                                aria-hidden="true"
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isMine ? 'bg-[#f4c22b] order-dot-preparing' : 'bg-[#b21f1f] order-dot-preparing'
                                }`}
                              />
                            )}
                            <span className="tabular-nums font-black">#{qIdx + 1}</span>
                            <span>{formatOrderCode(qOrd.id)}</span>
                            <span className="text-[9px] opacity-85">
                              {isMine
                                ? '★'
                                : qStage === 'Preparing'
                                ? t('tracker.step_preparing')
                                : t('tracker.step_queued')}
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
            <div
              className={`bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 ${
                isCompleted ? 'order-badge-pulse-completed' : ''
              }`}
            >
              <div className="flex flex-col gap-0.5 font-bold">
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {isCompleted && (
                      <span
                        aria-hidden="true"
                        className="ml-1 w-2 h-2 rounded-full bg-emerald-500 order-dot-completed"
                      />
                    )}
                  </span>
                  <span>
                    {isCompleted
                      ? t('tracker.status_completed')
                      : t('tracker.status_served')}
                  </span>
                </div>
                {(ord.chefName || ord.waiter || ord.servedAt) && (
                  <p className="text-[11px] font-medium text-emerald-800/90 pl-6">
                    {ord.chefName ? `👨‍🍳 ${ord.chefName}` : ''}
                    {ord.chefName && ord.waiter ? ' · ' : ''}
                    {ord.waiter ? `🏃 ${ord.waiter}` : ''}
                    {ord.servedAt ? ` · ${ord.servedAt}` : ''}
                  </p>
                )}
              </div>
              <span className="font-mono text-[11px] font-black text-emerald-700">
                {metrics.effectiveStage === 'Served'
                  ? tText({
                      am: '✓ ተረጋግጧል / ደርሷል',
                      en: '✓ Verified & Delivered',
                      or: '✓ Mirkanaa\'ee Gahe',
                      ti: '✓ ተረጋጊጹ / በጺሑ',
                      sid: '✓ Buuxame Iillino',
                      fr: '✓ Vérifié & Livré',
                      de: '✓ Geprüft & Geliefert',
                      it: '✓ Verificato & Consegnato',
                      zh: '✓ 已核验并送达',
                      ar: '✓ تم التحقق والتسليم',
                    })
                  : `0 ${t('tracker.active')}`}
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
                          {item.qty} × {item.price} {currency}
                        </p>
                      </div>
                      <span className="font-mono font-black text-stone-900 tabular-nums shrink-0">
                        {item.price * item.qty} {currency}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price breakdown summary */}
                <div className="flex flex-wrap justify-between items-center gap-2 bg-stone-50 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 font-mono tabular-nums">
                    <span>
                      {t('tracker.service_label')} {ord.serviceCharge || 0}
                    </span>
                    <span>·</span>
                    <span>
                      VAT: {ord.vat || 0}
                    </span>
                    {ord.tip > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          {t('tracker.tip_label')} {ord.tip}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="font-mono font-black text-sm text-[#b21f1f] tabular-nums">
                    {t('tracker.total_label')} {ord.total} {currency}
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
                      {t('tracker.edit_order')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelOrder(ord.id)}
                      className="flex-1 min-w-[140px] bg-[#b21f1f] hover:bg-[#8c1414] text-white font-black text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      {t('tracker.cancel_order')}
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
              <span>{t('tracker.live_board')}</span>
            </h5>
          </div>
          <div className="text-[11px] font-mono font-bold text-stone-600 tabular-nums">
            {preparingOrders.length} {t('tracker.step_preparing')} · {pendingOrders.length}{' '}
            {t('tracker.step_queued')} · {readyForPickupOrders.length}{' '}
            {t('tracker.step_ready')}
          </div>
        </div>

        {activeKitchenQueue.length === 0 && readyForPickupOrders.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs font-bold bg-[#fcfbf7] rounded-2xl border border-dashed border-stone-300">
            {t('common.none')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: Now Preparing */}
            <div className="bg-[#fcfbf7] border border-amber-200 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-amber-900">
                <span>🔥 {t('tracker.step_preparing')}</span>
                <span className="font-mono tabular-nums">{preparingOrders.length}</span>
              </div>
              {preparingOrders.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-3 text-center">
                  {t('common.none')}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {preparingOrders.map((o) => {
                    const m = queueSnapshot.getMetrics(o);
                    const isMine = myOrderSet.has(o.id);
                    const isTransitioning = recentlyTransitioned[o.id] === 'Preparing';
                    return (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                          isMine
                            ? 'bg-[#b21f1f] text-white border-[#8c1414] font-black shadow-sm order-badge-pulse-preparing'
                            : isTransitioning
                            ? 'bg-amber-50 border-amber-400 text-stone-900 font-bold order-transition-preparing'
                            : 'bg-white border-amber-200/80 text-stone-800 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            aria-hidden="true"
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isMine ? 'bg-[#f4c22b] order-dot-preparing' : 'bg-[#b21f1f] order-dot-preparing'
                            }`}
                          />
                          <span className="font-mono tabular-nums">#{m.position}</span>
                          <span className="font-mono truncate">{formatOrderCode(o.id)}</span>
                        </div>
                        <span className="text-[10px] font-mono shrink-0">
                          {isMine ? '★' : o.location}
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
                <span>⏳ {t('tracker.step_queued')}</span>
                <span className="font-mono tabular-nums">{pendingOrders.length}</span>
              </div>
              {pendingOrders.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-3 text-center">
                  {t('common.none')}
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
                          {isMine ? `★ (${m.ordersAhead})` : `${m.ordersAhead}`}
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
                <span>✅ {t('tracker.step_ready')}</span>
                <span className="font-mono tabular-nums">{readyForPickupOrders.length}</span>
              </div>
              {readyForPickupOrders.length === 0 ? (
                <p className="text-[11px] text-stone-400 py-3 text-center">
                  {t('common.none')}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {readyForPickupOrders.map((o) => {
                    const isMine = myOrderSet.has(o.id);
                    const isTransitioning = recentlyTransitioned[o.id] === 'Completed';
                    return (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                          isMine
                            ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-sm order-badge-pulse-completed'
                            : isTransitioning
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold order-transition-completed'
                            : 'bg-white border-emerald-200 text-emerald-900 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            aria-hidden="true"
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isMine ? 'bg-white order-dot-completed' : 'bg-emerald-500 order-dot-completed'
                            }`}
                          />
                          <span className="font-mono truncate">{formatOrderCode(o.id)}</span>
                        </div>
                        <span className="text-[10px] font-mono shrink-0">
                          {isMine ? '★' : o.location}
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
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="bg-[#fcfbf7] border border-[#f0e7d5] p-5 sm:p-6 rounded-[2rem] space-y-5 shadow-xl text-stone-900"
    >
      {/* Top Bar: Title + Live Status + Refresh + Toggle Live Board */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-stone-200 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#b21f1f] rounded-full animate-ping inline-block shrink-0" />
            <h4 className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
              {t('tracker.title')}
            </h4>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            {t('tracker.subtitle', { time: lastUpdatedLabel })}
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
            📺 {t('tracker.live_board')} ({activeKitchenQueue.length})
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('common.refresh')}</span>
            </button>
          )}

          {mode === 'inline' && onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              className="px-3 py-2 rounded-xl text-xs font-black bg-[#f4c22b] hover:bg-yellow-400 text-stone-900 border border-[#cf9d12] transition-all cursor-pointer"
            >
              {t('tracker.full_view')}
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

      {/* Order Lookup / Check Input */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder={t('tracker.lookup_placeholder')}
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
            {t('tracker.kitchen_queue')}
          </span>
          <span className="font-mono font-black text-[#b21f1f] tabular-nums">
            {activeKitchenQueue.length} {t('tracker.active')}
          </span>
        </div>
      </div>

      {/* Tracked / Matched Orders */}
      {matchedOrders.length > 0 ? (
        <div className="space-y-4">{matchedOrders.map((ord) => renderOrderCard(ord))}</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 text-center space-y-1.5">
          <p className="text-xs sm:text-sm font-black text-stone-800">
            {t('tracker.empty_title', { loc: lookupQuery.trim() || guestLocation })}
          </p>
          <p className="text-[11px] text-stone-500 font-medium tabular-nums">
            {t('tracker.kitchen_queue')} {activeKitchenQueue.length} {t('tracker.active')}
          </p>
        </div>
      )}

      {/* Full Live Kitchen Display Board */}
      {showLiveBoard && renderLiveKitchenBoard()}
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-[#5C0A0A]/80 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-5">
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
