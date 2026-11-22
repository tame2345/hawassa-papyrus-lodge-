/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistanceCall, Order } from '../types';

export function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeRecordDateToIso(rawStr?: string): string {
  if (!rawStr) return '';
  const trimmed = String(rawStr).trim();
  if (!trimmed) return '';
  const datePart = trimmed.split(/[\sT]/)[0];

  // Already YYYY-MM-DD (or YYYY/MM/DD)
  const isoMatch = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // DD.MM.YYYY (e.g. et-EE / European locale)
  const dotMatch = datePart.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`;
  }

  // MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    // If first > 12 it must be DD/MM/YYYY, otherwise treat as MM/DD/YYYY
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    return `${slashMatch[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

export type EffectiveOrderStage = 'Pending' | 'Preparing' | 'Completed' | 'Served' | 'Inactive';

export interface OrderQueueMetrics {
  order: Order;
  effectiveStage: EffectiveOrderStage;
  inKitchenQueue: boolean;
  /** 1-based position in the active kitchen queue (0 if already cooked/served/inactive) */
  position: number;
  /** Number of active orders strictly ahead of this order */
  ordersAhead: number;
  /** Number of active orders strictly behind/after this order */
  ordersBehind: number;
  /** Total active orders currently in the kitchen queue */
  totalInQueue: number;
  /** Orders currently ahead of this order in FIFO service order */
  aheadOrders: Order[];
  /** Orders queued after this order in FIFO service order */
  behindOrders: Order[];
  /** Transparent estimated wait window in minutes */
  estimatedMinutes: number;
}

export interface LiveQueueSnapshot {
  activeKitchenQueue: Order[];
  preparingOrders: Order[];
  pendingOrders: Order[];
  readyForPickupOrders: Order[];
  servedOrders: Order[];
  getMetrics: (order: Order) => OrderQueueMetrics;
}

export function getEffectiveCookingStatus(order: Order): EffectiveOrderStage {
  const rawStatus = String(order.status || '').trim();
  if (rawStatus === 'Cancelled' || rawStatus === 'Delivered') {
    return 'Inactive';
  }
  if (order.servedByWaiter) {
    return 'Served';
  }
  const cooking = order.cookingStatus || (order.status === 'Paid' ? 'Pending' : order.status);
  if (cooking === 'Completed') return 'Completed';
  if (cooking === 'Preparing') return 'Preparing';
  return 'Pending';
}

export function getOrderSortTimestamp(order: Order): number {
  if (typeof order.createdAt === 'number' && Number.isFinite(order.createdAt)) {
    return order.createdAt;
  }
  if (order.date && order.time) {
    const cleanTime = order.time.length === 5 ? `${order.time}:00` : order.time;
    const parsed = Date.parse(`${order.date}T${cleanTime}`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (order.time) {
    const match = order.time.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = Number(match[1]);
      const m = Number(match[2]);
      return h * 60000 + m * 1000;
    }
  }
  return 0;
}

export function formatOrderTimeDisplay(order: Order): string {
  if (typeof order.createdAt === 'number' && Number.isFinite(order.createdAt)) {
    return new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return order.time || '--:--';
}

export function formatOrderCode(id: string): string {
  if (!id) return '#---';
  return id.startsWith('#') ? id : `#${id}`;
}

export function computeLiveOrderQueue(orders: Order[]): LiveQueueSnapshot {
  const indexMap = new Map<string, number>();
  orders.forEach((o, i) => indexMap.set(o.id, i));

  const preparingOrders: Order[] = [];
  const pendingOrders: Order[] = [];
  const readyForPickupOrders: Order[] = [];
  const servedOrders: Order[] = [];

  for (const ord of orders) {
    const stage = getEffectiveCookingStatus(ord);
    if (stage === 'Preparing') {
      preparingOrders.push(ord);
    } else if (stage === 'Pending') {
      pendingOrders.push(ord);
    } else if (stage === 'Completed') {
      readyForPickupOrders.push(ord);
    } else if (stage === 'Served') {
      servedOrders.push(ord);
    }
  }

  const compareFifo = (a: Order, b: Order) => {
    const tsDiff = getOrderSortTimestamp(a) - getOrderSortTimestamp(b);
    if (tsDiff !== 0) return tsDiff;
    // Since newly added orders are prepended to `orders`, higher original index means older
    return (indexMap.get(b.id) ?? 0) - (indexMap.get(a.id) ?? 0);
  };

  preparingOrders.sort(compareFifo);
  pendingOrders.sort(compareFifo);
  readyForPickupOrders.sort(compareFifo);

  // Active kitchen queue: orders currently being prepared come first, followed by pending orders oldest-first
  const activeKitchenQueue: Order[] = [...preparingOrders, ...pendingOrders];

  const queuePosMap = new Map<string, number>();
  activeKitchenQueue.forEach((ord, idx) => {
    queuePosMap.set(ord.id, idx);
  });

  const getMetrics = (order: Order): OrderQueueMetrics => {
    const effectiveStage = getEffectiveCookingStatus(order);
    const idx = queuePosMap.get(order.id);
    const totalInQueue = activeKitchenQueue.length;

    if (idx !== undefined && idx >= 0) {
      const ordersAhead = idx;
      const ordersBehind = totalInQueue - 1 - idx;
      const aheadOrders = activeKitchenQueue.slice(0, idx);
      const behindOrders = activeKitchenQueue.slice(idx + 1);
      const estimatedMinutes = Math.max(
        3,
        ordersAhead * 5 + (effectiveStage === 'Preparing' ? 5 : 9)
      );

      return {
        order,
        effectiveStage,
        inKitchenQueue: true,
        position: idx + 1,
        ordersAhead,
        ordersBehind,
        totalInQueue,
        aheadOrders,
        behindOrders,
        estimatedMinutes,
      };
    }

    return {
      order,
      effectiveStage,
      inKitchenQueue: false,
      position: 0,
      ordersAhead: 0,
      ordersBehind: 0,
      totalInQueue,
      aheadOrders: [],
      behindOrders: [],
      estimatedMinutes: effectiveStage === 'Completed' ? 2 : 0,
    };
  };

  return {
    activeKitchenQueue,
    preparingOrders,
    pendingOrders,
    readyForPickupOrders,
    servedOrders,
    getMetrics,
  };
}

const COOKING_RANK: Record<'Pending' | 'Preparing' | 'Completed', number> = {
  Pending: 0,
  Preparing: 1,
  Completed: 2,
};

function resolveOrderCookingStage(order: Order): 'Pending' | 'Preparing' | 'Completed' {
  if (order.cookingStatus === 'Completed' || order.status === 'Completed' || order.servedByWaiter) {
    return 'Completed';
  }
  if (order.cookingStatus === 'Preparing' || order.status === 'Preparing') {
    return 'Preparing';
  }
  return 'Pending';
}

const DELIVERY_RANK: Record<'Waiting Driver' | 'Assigned' | 'Picked Up' | 'Arrived' | 'Delivered', number> = {
  'Waiting Driver': 0,
  Assigned: 1,
  'Picked Up': 2,
  Arrived: 3,
  Delivered: 4,
};

function resolveOrderDeliveryStage(order: Order): 'Waiting Driver' | 'Assigned' | 'Picked Up' | 'Arrived' | 'Delivered' {
  if (order.deliveryStatus === 'Delivered' || order.deliveryDeliveredAt) return 'Delivered';
  if (order.deliveryStatus === 'Arrived' || order.deliveryArrivedAt) return 'Arrived';
  if (order.deliveryStatus === 'Picked Up' || order.deliveryPickedUpAt) return 'Picked Up';
  if (order.deliveryStatus === 'Assigned' || order.deliveryDriverName) return 'Assigned';
  return 'Waiting Driver';
}

export function mergeSingleOrder(localOrd: Order, remoteOrd: Order): Order {
  const localUpdated = typeof localOrd.updatedAt === 'number' ? localOrd.updatedAt : getOrderSortTimestamp(localOrd);
  const remoteUpdated = typeof remoteOrd.updatedAt === 'number' ? remoteOrd.updatedAt : getOrderSortTimestamp(remoteOrd);
  const preferRemote = remoteUpdated >= localUpdated;
  const base = preferRemote ? remoteOrd : localOrd;
  const secondary = preferRemote ? localOrd : remoteOrd;

  const isCancelled =
    String(localOrd.status) === 'Cancelled' || String(remoteOrd.status) === 'Cancelled';
  const isPaid =
    localOrd.status === 'Paid' ||
    remoteOrd.status === 'Paid' ||
    Boolean(localOrd.paymentVerified) ||
    Boolean(remoteOrd.paymentVerified);

  const localCook = resolveOrderCookingStage(localOrd);
  const remoteCook = resolveOrderCookingStage(remoteOrd);
  const mergedCook =
    COOKING_RANK[remoteCook] >= COOKING_RANK[localCook] ? remoteCook : localCook;

  const localDelivery = resolveOrderDeliveryStage(localOrd);
  const remoteDelivery = resolveOrderDeliveryStage(remoteOrd);
  const mergedDeliveryStatus =
    DELIVERY_RANK[remoteDelivery] >= DELIVERY_RANK[localDelivery] ? remoteDelivery : localDelivery;

  const servedByWaiter = Boolean(localOrd.servedByWaiter || remoteOrd.servedByWaiter || mergedDeliveryStatus === 'Delivered');
  const checkedByWaiter = Boolean(localOrd.checkedByWaiter || remoteOrd.checkedByWaiter || servedByWaiter);
  const customerConfirmedReceipt = Boolean(localOrd.customerConfirmedReceipt || remoteOrd.customerConfirmedReceipt);

  const cashPaymentRequested = Boolean(
    localOrd.cashPaymentRequested || remoteOrd.cashPaymentRequested
  );

  let mergedStatus: Order['status'] = base.status;
  if (isCancelled) {
    mergedStatus = 'Cancelled';
  } else if (isPaid) {
    mergedStatus = 'Paid';
  } else if (mergedCook === 'Completed' || servedByWaiter) {
    mergedStatus = 'Completed';
  } else if (mergedCook === 'Preparing') {
    mergedStatus = 'Preparing';
  } else {
    mergedStatus = 'Pending';
  }

  return {
    ...secondary,
    ...base,
    status: mergedStatus,
    cookingStatus: mergedCook,
    servedByWaiter,
    checkedByWaiter,
    customerConfirmedReceipt,
    customerReceivedAt: base.customerReceivedAt || secondary.customerReceivedAt,
    cashPaymentRequested,
    cashPayMode: base.cashPayMode || secondary.cashPayMode,
    cashPaymentCode: base.cashPaymentCode || secondary.cashPaymentCode,
    cashTenderedAmount: base.cashTenderedAmount ?? secondary.cashTenderedAmount,
    cashChangeAmount: base.cashChangeAmount ?? secondary.cashChangeAmount,
    cashRequestedAt: base.cashRequestedAt || secondary.cashRequestedAt,
    cashConfirmedAt: base.cashConfirmedAt || secondary.cashConfirmedAt,
    paymentVerified: Boolean(localOrd.paymentVerified || remoteOrd.paymentVerified || isPaid),
    deliveryStatus: (base.orderType === 'delivery' || secondary.orderType === 'delivery') ? mergedDeliveryStatus : base.deliveryStatus,
    deliveryDriverName: base.deliveryDriverName || secondary.deliveryDriverName,
    deliveryDriverPhone: base.deliveryDriverPhone || secondary.deliveryDriverPhone,
    deliveryVehicleInfo: base.deliveryVehicleInfo || secondary.deliveryVehicleInfo,
    deliveryPinCode: base.deliveryPinCode || secondary.deliveryPinCode,
    deliveryAssignedAt: base.deliveryAssignedAt || secondary.deliveryAssignedAt,
    deliveryPickedUpAt: base.deliveryPickedUpAt || secondary.deliveryPickedUpAt,
    deliveryArrivedAt: base.deliveryArrivedAt || secondary.deliveryArrivedAt,
    deliveryDeliveredAt: base.deliveryDeliveredAt || secondary.deliveryDeliveredAt,
    deliveryReturnedAt: base.deliveryReturnedAt || secondary.deliveryReturnedAt,
    deliveryProofPhoto: base.deliveryProofPhoto || secondary.deliveryProofPhoto,
    deliveryVerifiedByPin: Boolean(localOrd.deliveryVerifiedByPin || remoteOrd.deliveryVerifiedByPin),
    deliveryCashCollected: Boolean(localOrd.deliveryCashCollected || remoteOrd.deliveryCashCollected),
    waiter: (base.orderType === 'delivery' || secondary.orderType === 'delivery') ? undefined : (base.waiter || secondary.waiter),
    chefName: base.chefName || secondary.chefName,
    cashierName: base.cashierName || secondary.cashierName,
    readyAt: base.readyAt || secondary.readyAt,
    servedAt: base.servedAt || secondary.servedAt,
    updatedAt: Math.max(localUpdated, remoteUpdated) || undefined,
  };
}

/**
 * Merges two order snapshots by `order.id` without losing new orders from either
 * client/tab and advancing lifecycle stages monotonically.
 */
export function mergeOrdersByLifecycle(localOrders: Order[], incomingOrders: Order[]): Order[] {
  const byId = new Map<string, Order>();
  const orderedIds: string[] = [];

  for (const ord of incomingOrders) {
    if (!ord || !ord.id) continue;
    byId.set(ord.id, ord);
    orderedIds.push(ord.id);
  }

  for (const ord of localOrders) {
    if (!ord || !ord.id) continue;
    const existing = byId.get(ord.id);
    if (existing) {
      byId.set(ord.id, mergeSingleOrder(ord, existing));
    } else {
      byId.set(ord.id, ord);
      orderedIds.unshift(ord.id);
    }
  }

  const seen = new Set<string>();
  const result: Order[] = [];
  for (const id of orderedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const merged = byId.get(id);
    if (merged) result.push(merged);
  }
  return result;
}

export function getAssistanceCallDedupKey(call: AssistanceCall): string {
  const typeKey = call.type || 'call';
  if ((typeKey === 'pickup' || typeKey === 'new_order' || typeKey === 'cash_request') && call.orderId) {
    const bareOrder = call.orderId.replace(/^#/, '').trim().toLowerCase();
    return `${typeKey}:order:${bareOrder}`;
  }
  const normLoc = (call.location || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${typeKey}:loc:${normLoc}`;
}

function getCallTimestamp(call: AssistanceCall, fallbackIdx: number): number {
  if (typeof call.createdAt === 'number' && Number.isFinite(call.createdAt)) {
    return call.createdAt;
  }
  const match = call.id.match(/(\d{10,13})/);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallbackIdx;
}

export function deduplicateAssistanceCalls(calls: AssistanceCall[]): AssistanceCall[] {
  const activeByKey = new Map<string, { call: AssistanceCall; ts: number; orderIdx: number }>();
  const inactiveCalls: AssistanceCall[] = [];

  calls.forEach((call, idx) => {
    if (!call || !call.id) return;
    if (call.active === false) {
      inactiveCalls.push(call);
      return;
    }

    const key = getAssistanceCallDedupKey(call);
    const ts = getCallTimestamp(call, calls.length - idx);
    const existing = activeByKey.get(key);

    if (!existing) {
      activeByKey.set(key, { call, ts, orderIdx: idx });
      return;
    }

    const combinedCount = Math.max(
      existing.call.repeatCount || 1,
      call.repeatCount || 1,
      (existing.call.id !== call.id ? 2 : 1),
    );

    if (ts > existing.ts) {
      activeByKey.set(key, {
        call: {
          ...existing.call,
          ...call,
          repeatCount: combinedCount,
        },
        ts,
        orderIdx: Math.min(existing.orderIdx, idx),
      });
    } else {
      activeByKey.set(key, {
        ...existing,
        call: {
          ...existing.call,
          repeatCount: combinedCount,
        },
      });
    }
  });

  const activeList = Array.from(activeByKey.values())
    .sort((a, b) => b.ts - a.ts || a.orderIdx - b.orderIdx)
    .map((entry) => entry.call);

  return [...activeList, ...inactiveCalls].slice(0, 80);
}

export function upsertDeduplicatedAssistanceCall(
  list: AssistanceCall[],
  newCall: AssistanceCall,
): AssistanceCall[] {
  const normalizedNew: AssistanceCall = {
    ...newCall,
    createdAt: newCall.createdAt || Date.now(),
  };
  const targetKey = getAssistanceCallDedupKey(normalizedNew);

  if (normalizedNew.active === false) {
    const exists = list.some((c) => c.id === normalizedNew.id);
    const updated = exists
      ? list.map((c) => (c.id === normalizedNew.id ? normalizedNew : c))
      : [normalizedNew, ...list];
    return deduplicateAssistanceCalls(updated);
  }

  let matchedExisting: AssistanceCall | undefined;
  const remaining = list.filter((c) => {
    if (c.id === normalizedNew.id) {
      matchedExisting = c;
      return false;
    }
    if (c.active !== false && getAssistanceCallDedupKey(c) === targetKey) {
      if (!matchedExisting) matchedExisting = c;
      return false;
    }
    return true;
  });

  const mergedCall: AssistanceCall = matchedExisting
    ? {
        ...matchedExisting,
        ...normalizedNew,
        // Keep the existing card ID when updating in-place for the same call/order so alerts don't re-spam
        id: matchedExisting.id,
        repeatCount:
          matchedExisting.id === normalizedNew.id
            ? Math.max(matchedExisting.repeatCount || 1, normalizedNew.repeatCount || 1)
            : (matchedExisting.repeatCount || 1) + 1,
      }
    : normalizedNew;

  return deduplicateAssistanceCalls([mergedCall, ...remaining]);
}

export function mergeAssistanceCalls(
  localCalls: AssistanceCall[],
  incomingCalls: AssistanceCall[],
): AssistanceCall[] {
  const byId = new Map<string, AssistanceCall>();
  const orderedIds: string[] = [];

  for (const call of incomingCalls) {
    if (!call || !call.id) continue;
    byId.set(call.id, call);
    orderedIds.push(call.id);
  }

  for (const call of localCalls) {
    if (!call || !call.id) continue;
    const existing = byId.get(call.id);
    if (existing) {
      byId.set(call.id, {
        ...call,
        ...existing,
        // Resolving/deactivating an alert in either snapshot stays resolved
        active: Boolean(call.active && existing.active),
        handledBy: existing.handledBy || call.handledBy,
        repeatCount: Math.max(call.repeatCount || 1, existing.repeatCount || 1) > 1
          ? Math.max(call.repeatCount || 1, existing.repeatCount || 1)
          : undefined,
      });
    } else {
      byId.set(call.id, call);
      orderedIds.unshift(call.id);
    }
  }

  // Track latest resolved timestamp per semantic key so stale active duplicates never resurrect
  const latestResolvedTsByKey = new Map<string, number>();
  byId.forEach((call) => {
    if (call.active === false) {
      const key = getAssistanceCallDedupKey(call);
      const ts = getCallTimestamp(call, 0);
      const prevTs = latestResolvedTsByKey.get(key) ?? -1;
      if (ts > prevTs) latestResolvedTsByKey.set(key, ts);
    }
  });

  const seen = new Set<string>();
  const mergedList: AssistanceCall[] = [];
  for (const id of orderedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const merged = byId.get(id);
    if (!merged) continue;
    if (merged.active !== false) {
      const key = getAssistanceCallDedupKey(merged);
      const resolvedTs = latestResolvedTsByKey.get(key);
      const myTs = getCallTimestamp(merged, 0);
      if (resolvedTs !== undefined && resolvedTs >= myTs) {
        mergedList.push({ ...merged, active: false });
        continue;
      }
    }
    mergedList.push(merged);
  }
  return deduplicateAssistanceCalls(mergedList);
}

const SYNC_CHANNEL_NAME = 'papyrus-pos-realtime-sync';
const TAB_INSTANCE_ID = `tab-${Math.random().toString(36).slice(2, 10)}`;

export function broadcastSettingSync(key: string, value: unknown): void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.postMessage({
      senderId: TAB_INSTANCE_ID,
      key,
      value,
      ts: Date.now(),
    });
    channel.close();
  } catch {
    // Ignore BroadcastChannel errors in restricted contexts
  }
}

export function subscribeSettingSync(
  onMessage: (key: string, value: unknown) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.onmessage = (ev) => {
        const msg = ev.data as { senderId?: string; key?: string; value?: unknown } | null;
        if (!msg || msg.senderId === TAB_INSTANCE_ID || !msg.key) return;
        onMessage(msg.key, msg.value);
      };
    } catch {
      channel = null;
    }
  }

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key !== 'papyrus_settings_cache' || !ev.newValue) return;
    try {
      const parsed = JSON.parse(ev.newValue) as Record<string, unknown>;
      if (parsed.orders) onMessage('orders', parsed.orders);
      if (parsed.assistanceCalls) onMessage('assistanceCalls', parsed.assistanceCalls);
      if (parsed.shift_assignments) onMessage('shift_assignments', parsed.shift_assignments);
      if (parsed.table_assignments) onMessage('table_assignments', parsed.table_assignments);
      if (parsed.online_room_bookings) onMessage('online_room_bookings', parsed.online_room_bookings);
      if (parsed.online_table_reservations) onMessage('online_table_reservations', parsed.online_table_reservations);
    } catch {
      // ignore malformed storage cache
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
  };
}

