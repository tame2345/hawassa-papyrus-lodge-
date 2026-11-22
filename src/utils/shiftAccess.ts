/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, ShiftAssignment, StaffMember } from '../types';

export interface LegacyTableAssignment {
  id: string;
  waiterName: string;
  tableNumber: string;
  date: string;
}

const GENERIC_WAITER_NAMES = new Set([
  '',
  'የጠረጴዛ አስተናጋጅ',
  'unassigned',
  'walk-in',
  'guest',
  'waiter',
  'waiter staff',
]);

export function isGenericWaiterLabel(name?: string): boolean {
  const clean = (name || '').trim().toLowerCase();
  return GENERIC_WAITER_NAMES.has(clean);
}

export function normalizeLocationKey(raw: string): string {
  const s = (raw || '').trim().toLowerCase();
  if (!s) return '';
  if (/^(room|rm|ክፍል)\s*[:#-]?\s*/i.test(s)) {
    const rest = s
      .replace(/^(room|rm|ክፍል)\s*[:#-]?\s*/i, '')
      .trim()
      .replace(/^0+(?=\d)/, '');
    return `room:${rest}`;
  }
  if (/^(table|tbl|ጠረጴዛ|t)\s*[:#-]?\s*/i.test(s)) {
    const rest = s
      .replace(/^(table|tbl|ጠረጴዛ|t)\s*[:#-]?\s*/i, '')
      .trim()
      .replace(/^0+(?=\d)/, '');
    return `table:${rest}`;
  }
  return s.replace(/^0+(?=\d)/, '');
}

export function inferLocationType(raw: string): 'table' | 'room' {
  const s = (raw || '').trim().toLowerCase();
  if (/^(room|rm|ክፍል)/i.test(s)) return 'room';
  if (/^(table|tbl|ጠረጴዛ|t\s*\d)/i.test(s)) return 'table';
  const num = Number(s.replace(/\D/g, ''));
  if (!Number.isNaN(num) && num >= 100) return 'room';
  return 'table';
}

export function formatCanonicalLocation(raw: string, preferredType?: 'table' | 'room'): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^(room|rm|ክፍል)\s+/i.test(trimmed)) {
    const rest = trimmed.replace(/^(room|rm|ክፍል)\s+/i, '').trim();
    return `Room ${rest}`;
  }
  if (/^(table|tbl|ጠረጴዛ)\s+/i.test(trimmed)) {
    const rest = trimmed.replace(/^(table|tbl|ጠረጴዛ)\s+/i, '').trim();
    const padded = /^\d$/.test(rest) ? `0${rest}` : rest;
    return `Table ${padded}`;
  }
  if (/^\d+$/.test(trimmed)) {
    const type = preferredType || inferLocationType(trimmed);
    if (type === 'room') return `Room ${trimmed}`;
    const padded = trimmed.length === 1 ? `0${trimmed}` : trimmed;
    return `Table ${padded}`;
  }
  return trimmed;
}

export function locationsMatch(locA: string, locB: string): boolean {
  const a = (locA || '').trim().toLowerCase();
  const b = (locB || '').trim().toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;

  const normA = normalizeLocationKey(a);
  const normB = normalizeLocationKey(b);
  if (normA && normA === normB) return true;

  // Allow matching bare number like "101" against "Room 101" or "5" against "Table 05",
  // while strictly preventing "Room 01" from matching "Table 01".
  const bareA = normA.replace(/^(room:|table:)/, '');
  const bareB = normB.replace(/^(room:|table:)/, '');
  const hasPrefixA = normA.includes(':');
  const hasPrefixB = normB.includes(':');
  if (hasPrefixA !== hasPrefixB && bareA && bareA === bareB) {
    return true;
  }
  return false;
}

export function getEffectiveStaffRole(user: StaffMember | null): string {
  if (!user) return '';
  return (user.accessPrivilege || user.role || '').trim().toLowerCase();
}

export function isSupervisorRole(user: StaffMember | null): boolean {
  const role = getEffectiveStaffRole(user);
  return role === 'admin' || role === 'manager';
}

export function getActiveShiftAssignmentsForLocation(
  assignments: ShiftAssignment[],
  location: string,
  staffRole?: 'waiter' | 'chef'
): ShiftAssignment[] {
  if (!location) return [];
  return assignments.filter((a) => {
    if (!a.active) return false;
    if (staffRole && a.staffRole !== staffRole) return false;
    return locationsMatch(a.location, location);
  });
}

export function getAssignedStaffNameForLocation(
  assignments: ShiftAssignment[],
  legacyTableAssignments: LegacyTableAssignment[],
  location: string,
  staffRole: 'waiter' | 'chef'
): string {
  const activeMatches = getActiveShiftAssignmentsForLocation(assignments, location, staffRole);
  if (activeMatches.length > 0) {
    return activeMatches[0].staffName;
  }
  if (staffRole === 'waiter') {
    const legacy = legacyTableAssignments.find((ta) => locationsMatch(ta.tableNumber, location));
    if (legacy) return legacy.waiterName;
  }
  return '';
}

export function getStaffAssignedLocations(
  staffName: string,
  staffRole: 'waiter' | 'chef',
  assignments: ShiftAssignment[],
  legacyTableAssignments: LegacyTableAssignment[] = []
): ShiftAssignment[] {
  const cleanStaff = (staffName || '').trim().toLowerCase();
  if (!cleanStaff) return [];

  const fromShifts = assignments.filter(
    (a) =>
      a.active &&
      a.staffRole === staffRole &&
      (a.staffName || '').trim().toLowerCase() === cleanStaff
  );

  if (staffRole === 'waiter') {
    const existingKeys = new Set(fromShifts.map((s) => normalizeLocationKey(s.location)));
    const legacyExtras: ShiftAssignment[] = legacyTableAssignments
      .filter((ta) => (ta.waiterName || '').trim().toLowerCase() === cleanStaff)
      .filter((ta) => !existingKeys.has(normalizeLocationKey(ta.tableNumber)))
      .map((ta) => ({
        id: ta.id,
        staffName: ta.waiterName,
        staffRole: 'waiter',
        location: ta.tableNumber,
        locationType: inferLocationType(ta.tableNumber),
        shiftPeriod: 'Full Day',
        date: ta.date,
        active: true,
      }));
    return [...fromShifts, ...legacyExtras];
  }

  return fromShifts;
}

export function canStaffAccessOrder(
  user: StaffMember | null,
  order: Order,
  assignments: ShiftAssignment[],
  legacyTableAssignments: LegacyTableAssignment[] = []
): { allowed: boolean; reason: string; matchedBy?: 'supervisor' | 'location_shift' | 'explicit_order' } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }

  const role = getEffectiveStaffRole(user);
  if (role === 'admin' || role === 'manager') {
    return { allowed: true, reason: 'Manager/Admin oversight access', matchedBy: 'supervisor' };
  }

  const staffName = (user.name || '').trim().toLowerCase();
  if (!staffName) {
    return { allowed: false, reason: 'Staff identity missing' };
  }

  if (role === 'waiter') {
    if (order.orderType === 'delivery') {
      return {
        allowed: false,
        reason: 'Delivery orders are handled exclusively by Kitchen and Delivery Couriers',
      };
    }
    const hasExplicitWaiter = !isGenericWaiterLabel(order.waiter);
    const explicitWaiterClean = (order.waiter || '').trim().toLowerCase();

    // If order explicitly targets this waiter (e.g. Chef selected Deliverer), always allow immediately
    if (hasExplicitWaiter && explicitWaiterClean === staffName) {
      return { allowed: true, reason: 'Explicitly assigned on order', matchedBy: 'explicit_order' };
    }

    const activeLocWaiters = getActiveShiftAssignmentsForLocation(assignments, order.location, 'waiter');
    if (activeLocWaiters.length > 0) {
      // If Chef explicitly reassigned to a specific other waiter, respect that override
      if (hasExplicitWaiter && explicitWaiterClean !== staffName) {
        return {
          allowed: false,
          reason: `Order for ${order.location} was dispatched to ${order.waiter}`,
        };
      }
      const assignedToUser = activeLocWaiters.some(
        (a) => (a.staffName || '').trim().toLowerCase() === staffName
      );
      return assignedToUser
        ? { allowed: true, reason: `Assigned to ${order.location}`, matchedBy: 'location_shift' }
        : {
            allowed: false,
            reason: `Order for ${order.location} is assigned to ${activeLocWaiters.map((w) => w.staffName).join(', ')}`,
          };
    }

    const legacyWaiter = legacyTableAssignments.find((ta) => locationsMatch(ta.tableNumber, order.location));
    if (legacyWaiter) {
      if (hasExplicitWaiter && explicitWaiterClean !== staffName) {
        return {
          allowed: false,
          reason: `Order for ${order.location} was dispatched to ${order.waiter}`,
        };
      }
      const matchesLegacy = (legacyWaiter.waiterName || '').trim().toLowerCase() === staffName;
      return matchesLegacy
        ? { allowed: true, reason: `Assigned to ${order.location}`, matchedBy: 'location_shift' }
        : {
            allowed: false,
            reason: `Order for ${order.location} is assigned to ${legacyWaiter.waiterName}`,
          };
    }

    // If order names another explicit waiter, isolate it to that waiter
    if (hasExplicitWaiter && explicitWaiterClean !== staffName) {
      return {
        allowed: false,
        reason: `Order for ${order.location} is assigned to ${order.waiter}`,
      };
    }

    // No shift/waiter assigned yet (e.g., Walk-In, Delivery Route, or unscheduled table):
    // allow active waiters on duty to handle it so no customer order is ever orphaned.
    return {
      allowed: true,
      reason: `Unassigned order (${order.location || 'Walk-In'}) open for active waiter pickup`,
      matchedBy: 'explicit_order',
    };
  }

  if (role === 'chef') {
    const explicitChefClean = (order.chefName || '').trim().toLowerCase();
    if (explicitChefClean && explicitChefClean === staffName) {
      return { allowed: true, reason: 'Explicitly assigned to chef', matchedBy: 'explicit_order' };
    }

    const activeLocChefs = getActiveShiftAssignmentsForLocation(assignments, order.location, 'chef');
    if (activeLocChefs.length > 0) {
      const assignedToUser = activeLocChefs.some(
        (a) => (a.staffName || '').trim().toLowerCase() === staffName
      );
      return assignedToUser
        ? { allowed: true, reason: `Kitchen shift assigned to ${order.location}`, matchedBy: 'location_shift' }
        : {
            allowed: false,
            reason: `Kitchen order for ${order.location} is assigned to ${activeLocChefs.map((c) => c.staffName).join(', ')}`,
          };
    }

    if (explicitChefClean && explicitChefClean !== staffName) {
      return {
        allowed: false,
        reason: `Kitchen order for ${order.location} is assigned to ${order.chefName}`,
      };
    }

    // No chef shift scheduled for this location (Walk-In, Delivery, or open kitchen):
    // allow active kitchen chefs to see and cook it immediately.
    return {
      allowed: true,
      reason: `Open kitchen queue for ${order.location || 'Walk-In'}`,
      matchedBy: 'location_shift',
    };
  }

  // Other staff portals (cashier / receptionist) are not waiter/chef shift-isolated on this helper
  if (role === 'cashier' || role === 'receptionist') {
    return { allowed: true, reason: `${role} portal access` };
  }

  return { allowed: false, reason: 'Insufficient role permissions for order access' };
}
