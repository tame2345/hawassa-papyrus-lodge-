/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from '../types';

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
