/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Order, RoomBooking, ShiftAssignment, ShiftPeriod, StaffMember } from '../types';
import {
  formatCanonicalLocation,
  inferLocationType,
  locationsMatch,
  normalizeLocationKey,
} from '../utils/shiftAccess';
import { CalendarClock, ChefHat, Search, ShieldCheck, Trash2, UserCheck, Users, UtensilsCrossed } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { LangDict } from '../i18n/translations';

interface ShiftManagementModuleProps {
  staff: StaffMember[];
  shiftAssignments: ShiftAssignment[];
  onSaveShiftAssignments: React.Dispatch<React.SetStateAction<ShiftAssignment[]>>;
  orders: Order[];
  roomBookings: RoomBooking[];
  currentManagerName: string;
  appLang?: string;
}

const DEFAULT_TABLES = [
  'Table 01',
  'Table 02',
  'Table 03',
  'Table 04',
  'Table 05',
  'Table 06',
  'Table 07',
  'Table 08',
  'Table 09',
  'Table 10',
];

const DEFAULT_ROOMS = [
  'Room 101',
  'Room 102',
  'Room 103',
  'Room 104',
  'Room 105',
  'Room 106',
  'Room 107',
  'Room 108',
];

const SHIFT_PERIODS: { value: ShiftPeriod; labels: LangDict }[] = [
  {
    value: 'Full Day',
    labels: {
      am: 'ሙሉ ቀን (Full Day)',
      or: 'Guyyaa Guutuu',
      ti: 'ምሉእ መዓልቲ',
      sid: 'Wo’ma Barra',
      en: 'Full Day',
      fr: 'Journée Complète',
      de: 'Ganztägig',
      it: 'Giornata Intera',
      zh: '全天班',
      ar: 'اليوم الكامل',
    },
  },
  {
    value: 'Morning',
    labels: {
      am: 'ጠዋት (06:00–14:00)',
      or: 'Ganama (06:00–14:00)',
      ti: 'ንግሆ (06:00–14:00)',
      sid: 'Soodo (06:00–14:00)',
      en: 'Morning (06:00–14:00)',
      fr: 'Matin (06:00–14:00)',
      de: 'Morgen (06:00–14:00)',
      it: 'Mattina (06:00–14:00)',
      zh: '早班 (06:00–14:00)',
      ar: 'الصباح (06:00–14:00)',
    },
  },
  {
    value: 'Afternoon',
    labels: {
      am: 'ከሰዓት (14:00–22:00)',
      or: 'Waaree Booda (14:00–22:00)',
      ti: 'ድሕሪ ቀትሪ (14:00–22:00)',
      sid: 'Baraatunni (14:00–22:00)',
      en: 'Afternoon (14:00–22:00)',
      fr: 'Après-midi (14:00–22:00)',
      de: 'Nachmittag (14:00–22:00)',
      it: 'Pomeriggio (14:00–22:00)',
      zh: '中班 (14:00–22:00)',
      ar: 'بعد الظهر (14:00–22:00)',
    },
  },
  {
    value: 'Evening',
    labels: {
      am: 'ማታ (17:00–00:00)',
      or: 'Galgala (17:00–00:00)',
      ti: 'ምሸት (17:00–00:00)',
      sid: 'Hawarro (17:00–00:00)',
      en: 'Evening (17:00–00:00)',
      fr: 'Soir (17:00–00:00)',
      de: 'Abend (17:00–00:00)',
      it: 'Sera (17:00–00:00)',
      zh: '晚班 (17:00–00:00)',
      ar: 'المساء (17:00–00:00)',
    },
  },
  {
    value: 'Night',
    labels: {
      am: 'ሌሊት (22:00–06:00)',
      or: 'Halkan (22:00–06:00)',
      ti: 'ለይቲ (22:00–06:00)',
      sid: 'Hashsha (22:00–06:00)',
      en: 'Night (22:00–06:00)',
      fr: 'Nuit (22:00–06:00)',
      de: 'Nacht (22:00–06:00)',
      it: 'Notte (22:00–06:00)',
      zh: '夜班 (22:00–06:00)',
      ar: 'الليل (22:00–06:00)',
    },
  },
];

export default function ShiftManagementModule({
  staff,
  shiftAssignments,
  onSaveShiftAssignments,
  orders,
  roomBookings,
  currentManagerName,
}: ShiftManagementModuleProps) {
  const { appLang, tText, tRole, isRtl } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<'waiter' | 'chef'>('waiter');
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'table' | 'room'>('table');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Table 05']);
  const [customLocationInput, setCustomLocationInput] = useState<string>('');
  const [shiftPeriod, setShiftPeriod] = useState<ShiftPeriod>('Full Day');
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [replaceExistingSameRole, setReplaceExistingSameRole] = useState<boolean>(true);

  const [viewMode, setViewMode] = useState<'roster' | 'matrix'>('roster');
  const [roleFilter, setRoleFilter] = useState<'all' | 'waiter' | 'chef'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | ShiftPeriod>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [noticeBanner, setNoticeBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);
  const [recentlyAssignedLocs, setRecentlyAssignedLocs] = useState<Record<string, number>>({});
  const [recentlyAssignedIds, setRecentlyAssignedIds] = useState<Record<string, number>>({});
  const isFirstRenderRef = useRef<boolean>(true);
  const prevAssignmentsMapRef = useRef<Map<string, string>>(new Map());
  const clearAnimationTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const buildSig = (a: ShiftAssignment) =>
      `${a.staffName}|${a.staffRole}|${normalizeLocationKey(a.location)}|${a.shiftPeriod}|${a.active}`;

    const nextMap = new Map<string, string>();
    shiftAssignments.forEach((a) => nextMap.set(a.id, buildSig(a)));

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevAssignmentsMapRef.current = nextMap;
      return;
    }

    const prevMap = prevAssignmentsMapRef.current;
    const newlyChangedLocs: string[] = [];
    const newlyChangedIds: string[] = [];

    shiftAssignments.forEach((a) => {
      if (!a.active) return;
      const sig = nextMap.get(a.id);
      if (prevMap.get(a.id) !== sig) {
        newlyChangedIds.push(a.id);
        const key = normalizeLocationKey(a.location);
        if (key) newlyChangedLocs.push(key);
      }
    });

    prevAssignmentsMapRef.current = nextMap;

    if (newlyChangedLocs.length > 0 || newlyChangedIds.length > 0) {
      const stamp = Date.now();
      setRecentlyAssignedLocs((prev) => {
        const updated = { ...prev };
        newlyChangedLocs.forEach((k) => {
          updated[k] = stamp;
        });
        return updated;
      });
      setRecentlyAssignedIds((prev) => {
        const updated = { ...prev };
        newlyChangedIds.forEach((id) => {
          updated[id] = stamp;
        });
        return updated;
      });

      const timer = window.setTimeout(() => {
        setRecentlyAssignedLocs((prev) => {
          const updated = { ...prev };
          newlyChangedLocs.forEach((k) => {
            if (updated[k] === stamp) delete updated[k];
          });
          return updated;
        });
        setRecentlyAssignedIds((prev) => {
          const updated = { ...prev };
          newlyChangedIds.forEach((id) => {
            if (updated[id] === stamp) delete updated[id];
          });
          return updated;
        });
      }, 1500);
      clearAnimationTimersRef.current.push(timer);
    }
  }, [shiftAssignments]);

  useEffect(() => {
    return () => {
      clearAnimationTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const waitersList = useMemo(
    () =>
      staff.filter(
        (s) =>
          (s.role || '').toLowerCase() === 'waiter' ||
          (s.accessPrivilege || '').toLowerCase() === 'waiter'
      ),
    [staff]
  );

  const chefsList = useMemo(
    () =>
      staff.filter(
        (s) =>
          (s.role || '').toLowerCase() === 'chef' ||
          (s.accessPrivilege || '').toLowerCase() === 'chef'
      ),
    [staff]
  );

  const selectableStaff = selectedRole === 'waiter' ? waitersList : chefsList;

  const allKnownLocations = useMemo(() => {
    const map = new Map<string, { label: string; type: 'table' | 'room' }>();

    const register = (raw: string, forcedType?: 'table' | 'room') => {
      const canonical = formatCanonicalLocation(raw, forcedType);
      if (!canonical) return;
      const key = normalizeLocationKey(canonical);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          label: canonical,
          type: forcedType || inferLocationType(canonical),
        });
      }
    };

    DEFAULT_TABLES.forEach((t) => register(t, 'table'));
    DEFAULT_ROOMS.forEach((r) => register(r, 'room'));
    roomBookings
      .filter((b) => b.status === 'Active' && b.roomNumber)
      .forEach((b) => register(`Room ${b.roomNumber}`, 'room'));
    shiftAssignments.forEach((a) => register(a.location, a.locationType));
    orders
      .filter((o) => o.location && o.orderType !== 'delivery')
      .forEach((o) => register(o.location));

    return Array.from(map.values());
  }, [roomBookings, shiftAssignments, orders]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.orderType !== 'delivery' && o.status !== 'Paid' && o.status !== 'Cancelled' && (!o.servedByWaiter || o.cookingStatus !== 'Completed')),
    [orders]
  );

  const uncoveredActiveOrders = useMemo(() => {
    return activeOrders.filter((ord) => {
      const hasWaiter = shiftAssignments.some(
        (a) => a.active && a.staffRole === 'waiter' && locationsMatch(a.location, ord.location)
      );
      const hasChef = shiftAssignments.some(
        (a) => a.active && a.staffRole === 'chef' && locationsMatch(a.location, ord.location)
      );
      return !hasWaiter || !hasChef;
    });
  }, [activeOrders, shiftAssignments]);

  const stats = useMemo(() => {
    const activeWaiterShifts = shiftAssignments.filter((a) => a.active && a.staffRole === 'waiter').length;
    const activeChefShifts = shiftAssignments.filter((a) => a.active && a.staffRole === 'chef').length;
    const uniqueLocations = new Set(
      shiftAssignments.filter((a) => a.active).map((a) => normalizeLocationKey(a.location))
    ).size;
    return {
      activeWaiterShifts,
      activeChefShifts,
      uniqueLocations,
      uncoveredCount: uncoveredActiveOrders.length,
    };
  }, [shiftAssignments, uncoveredActiveOrders]);

  const toggleQuickLocation = (loc: string) => {
    const key = normalizeLocationKey(loc);
    setSelectedLocations((prev) => {
      const exists = prev.some((p) => normalizeLocationKey(p) === key);
      if (exists) {
        return prev.filter((p) => normalizeLocationKey(p) !== key);
      }
      return [...prev, loc];
    });
  };

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNoticeBanner({ type, text });
    window.setTimeout(() => {
      setNoticeBanner((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  const getShiftLabel = (period: ShiftPeriod): string => {
    const found = SHIFT_PERIODS.find((p) => p.value === period);
    return found ? tText(found.labels) : period;
  };

  const handleAssignLocations = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = selectedStaffName.trim();
    if (!targetStaff) {
      showNotice(
        'error',
        tText({
          am: 'እባክዎ መጀመሪያ አስተናጋጅ ወይም ሼፍ ይምረጡ።',
          or: 'Maaloo jalqaba keessummeessaa ykn sheefii filadhaa.',
          ti: 'በጃኹም ቅድም ኣስተናጋጅ ወይ ሼፍ ምረጹ።',
          sid: 'Eegganno umo owaataancho woy qishaancho doori.',
          en: 'Please select a waiter or chef first.',
          fr: 'Veuillez d’abord sélectionner un serveur ou un chef.',
          de: 'Bitte wählen Sie zuerst einen Kellner oder Koch aus.',
          it: 'Seleziona prima un cameriere o uno chef.',
          zh: '请先选择一位服务员或厨师。',
          ar: 'يرجى اختيار نادل أو طاهٍ أولاً.',
        })
      );
      return;
    }

    const customTokens = customLocationInput
      .split(',')
      .map((s) => formatCanonicalLocation(s, locationTypeFilter))
      .filter(Boolean);

    const combinedMap = new Map<string, string>();
    [...selectedLocations, ...customTokens].forEach((loc) => {
      const canonical = formatCanonicalLocation(loc, locationTypeFilter);
      const key = normalizeLocationKey(canonical);
      if (key && !combinedMap.has(key)) {
        combinedMap.set(key, canonical);
      }
    });

    const targetLocations = Array.from(combinedMap.values());
    if (targetLocations.length === 0) {
      showNotice(
        'error',
        tText({
          am: 'እባክዎ ቢያንስ አንድ ጠረጴዛ ወይም ክፍል ይምረጡ/ያስገቡ።',
          or: 'Maaloo yoo xiqqaate minjaala ykn kutaa tokko filadhaa.',
          ti: 'በጃኹም እንተወሓደ ሓደ ጠረጴዛ ወይ ክፍሊ ምረጹ።',
          sid: 'Eegganno ajjanna mitto xarapheeza woy kifile doori.',
          en: 'Please select or enter at least one table or room.',
          fr: 'Veuillez sélectionner ou saisir au moins une table ou chambre.',
          de: 'Bitte mindestens einen Tisch oder ein Zimmer auswählen.',
          it: 'Seleziona o inserisci almeno un tavolo o una camera.',
          zh: '请至少选择或输入一个餐桌或房间。',
          ar: 'يرجى اختيار أو إدخال طاولة أو غرفة واحدة على الأقل.',
        })
      );
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US');

    onSaveShiftAssignments((prev) => {
      let next = [...prev];

      for (const loc of targetLocations) {
        if (replaceExistingSameRole) {
          // Deactivate/remove conflicting active assignment for the same location + same role
          next = next.filter(
            (a) => !(a.staffRole === selectedRole && locationsMatch(a.location, loc))
          );
        } else {
          // Avoid duplicate row for same staff + role + location
          next = next.filter(
            (a) =>
              !(
                a.staffRole === selectedRole &&
                a.staffName.toLowerCase() === targetStaff.toLowerCase() &&
                locationsMatch(a.location, loc)
              )
          );
        }

        const newRecord: ShiftAssignment = {
          id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          staffName: targetStaff,
          staffRole: selectedRole,
          location: loc,
          locationType: inferLocationType(loc),
          shiftPeriod,
          date: todayStr,
          active: true,
          assignedBy: currentManagerName || 'Manager',
          notes: shiftNotes.trim() || undefined,
        };
        next.push(newRecord);
      }

      return next;
    });

    setCustomLocationInput('');
    setShiftNotes('');
    const locList = targetLocations.join(', ');
    const roleLabel = tRole(selectedRole);
    const periodLabel = getShiftLabel(shiftPeriod);
    showNotice(
      'success',
      tText({
        am: `${locList} ለ${roleLabel} ${targetStaff} (${periodLabel}) ተመድቧል።`,
        or: `${locList} ${roleLabel} ${targetStaff} (${periodLabel}) tiif ramadameera.`,
        ti: `${locList} ን${roleLabel} ${targetStaff} (${periodLabel}) ተመዲቡ።`,
        sid: `${locList} ${roleLabel} ${targetStaff} (${periodLabel}) ra uyinoonni.`,
        en: `Assigned ${locList} to ${roleLabel} ${targetStaff} (${periodLabel}).`,
        fr: `${locList} assigné à ${roleLabel} ${targetStaff} (${periodLabel}).`,
        de: `${locList} an ${roleLabel} ${targetStaff} (${periodLabel}) zugewiesen.`,
        it: `${locList} assegnato a ${roleLabel} ${targetStaff} (${periodLabel}).`,
        zh: `已将 ${locList} 分配给 ${roleLabel} ${targetStaff}（${periodLabel}）。`,
        ar: `تم تعيين ${locList} إلى ${roleLabel} ${targetStaff} (${periodLabel}).`,
      })
    );
  };

  const handleQuickMatrixAssign = (
    location: string,
    role: 'waiter' | 'chef',
    staffName: string
  ) => {
    const todayStr = new Date().toLocaleDateString('en-US');
    onSaveShiftAssignments((prev) => {
      const filtered = prev.filter(
        (a) => !(a.staffRole === role && locationsMatch(a.location, location))
      );
      if (!staffName) return filtered;
      const newRec: ShiftAssignment = {
        id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        staffName,
        staffRole: role,
        location,
        locationType: inferLocationType(location),
        shiftPeriod: 'Full Day',
        date: todayStr,
        active: true,
        assignedBy: currentManagerName || 'Manager',
      };
      return [...filtered, newRec];
    });
  };

  const handleToggleActive = (id: string) => {
    onSaveShiftAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const handleDeleteAssignment = (id: string) => {
    onSaveShiftAssignments((prev) => prev.filter((a) => a.id !== id));
    showNotice(
      'success',
      tText({
        am: 'የፈረቃ ምደባው ተሰርዟል።',
        or: 'Ramaddiin shifftii haqameera.',
        ti: 'ምደባ ፈረቓ ተሰሪዙ።',
        sid: 'Shifftete biddishi hoongeessiinoonni.',
        en: 'Shift assignment removed.',
        fr: 'Affectation de poste supprimée.',
        de: 'Schichtzuweisung entfernt.',
        it: 'Assegnazione turno rimossa.',
        zh: '班次分配已移除。',
        ar: 'تمت إزالة تعيين المناوبة.',
      })
    );
  };

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return shiftAssignments.filter((a) => {
      if (roleFilter !== 'all' && a.staffRole !== roleFilter) return false;
      if (periodFilter !== 'all' && a.shiftPeriod !== periodFilter) return false;
      if (statusFilter === 'active' && !a.active) return false;
      if (statusFilter === 'paused' && a.active) return false;
      if (q) {
        const hay = `${a.staffName} ${a.location} ${a.shiftPeriod} ${a.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [shiftAssignments, roleFilter, periodFilter, statusFilter, searchQuery]);

  const filteredMatrixLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allKnownLocations.filter((loc) => {
      if (!q) return true;
      const waiter = shiftAssignments.find(
        (a) => a.active && a.staffRole === 'waiter' && locationsMatch(a.location, loc.label)
      );
      const chef = shiftAssignments.find(
        (a) => a.active && a.staffRole === 'chef' && locationsMatch(a.location, loc.label)
      );
      const hay = `${loc.label} ${waiter?.staffName || ''} ${chef?.staffName || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allKnownLocations, shiftAssignments, searchQuery]);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={`space-y-6 font-sans ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Top Section Header & KPI Summary Strip */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
              <ShieldCheck className="w-4 h-4 text-[#C1FF00]" />
              <span>
                {tText({
                  am: 'የተማከለ የፈረቃ አስተዳደር',
                  or: 'Bulchiinsa Shifftii Wiirtuu',
                  ti: 'ዝተማእከለ ምምሕዳር ፈረቓ',
                  sid: 'Mereershantino Shifftete Gashshoote',
                  en: 'Centralized Shift Operations',
                  fr: 'Gestion Centralisée des Équipes',
                  de: 'Zentrale Schichtverwaltung',
                  it: 'Gestione Turni Centralizzata',
                  zh: '集中排班运营管理',
                  ar: 'إدارة المناوبات المركزية',
                })}
              </span>
              <span aria-hidden="true">/</span>
              <span>
                {tText({
                  am: 'በስራ ዘርፍ የተገደበ የትዕዛዝ ቁጥጥር',
                  or: 'To’annoo Ajajaa Gahee Hojii',
                  ti: 'ብደረጃ ስራሕ ዝተወሰነ ቁጽጽር ትእዛዝ',
                  sid: 'Loosu Qorichinni Ajaju Qorophisha',
                  en: 'Role-Isolated Order Control',
                  fr: 'Contrôle des Commandes par Rôle',
                  de: 'Rollenbasierte Bestellkontrolle',
                  it: 'Controllo Ordini per Ruolo',
                  zh: '按岗位隔离的订单权限控制',
                  ar: 'التحكم بالطلبات حسب الدور',
                })}
              </span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {tText({
                am: 'የተማከለ የፈረቃ እና የጠረጴዛ/ክፍል ምደባ ማዕከል (Shift Management)',
                or: 'Wiirtuu Ramaddii Shifftii, Minjaalaa fi Kutaa',
                ti: 'ዝተማእከለ ማእከል ምደባ ፈረቓን ጠረጴዛ/ክፍልን',
                sid: 'Mereershantino Shifftete, Xarapheezunna Kifilu Biddisha',
                en: 'Centralized Shift Management & Table/Room Assignment',
                fr: 'Gestion des Équipes & Affectation Tables/Chambres',
                de: 'Schichtplanung & Tisch-/Zimmerzuweisung',
                it: 'Gestione Turni & Assegnazione Tavoli/Camere',
                zh: '集中排班与餐桌/客房分配中心',
                ar: 'مركز إدارة المناوبات وتعيين الطاولات والغرف',
              })}
            </h3>
            <p className="text-xs text-stone-400 max-w-2xl">
              {tText({
                am: 'ለእያንዳንዱ ጠረጴዛ ወይም ክፍል አስተናጋጆችን እና ሼፎችን ይመድቡ። የተመደቡ ሰራተኞች ብቻ የራሳቸውን ትዕዛዝ ማየትና ማስተካከል ይችላሉ።',
                or: 'Minjaala ykn kutaa hundaaf keessummeessitootaa fi sheefota ramadaa. Hojjettoonni ramadaman qofti ajaja isaanii ilaaluu danda’u.',
                ti: 'ንነፍሲ ወከፍ ጠረጴዛ ወይ ክፍሊ ኣስተናጋጃትን ሼፋትን መድቡ። ዝተመደቡ ሰራሕተኛታት ጥራይ ትእዛዞም ክርእዩ ይኽእሉ።',
                sid: 'Mitto mitto xarapheezaho woy kifilaho owaataanonna qishaano uyi. Uyinoonni loosaano calla ajajansa la’a dandiitanno.',
                en: 'Assign waiters and chefs to specific tables or hotel rooms. Only designated staff can view or edit orders assigned to their locations.',
                fr: 'Assignez serveurs et chefs à des tables ou chambres spécifiques. Seul le personnel désigné peut voir ou modifier ces commandes.',
                de: 'Weisen Sie Kellner und Köche bestimmten Tischen oder Zimmern zu. Nur zugewiesenes Personal kann diese Bestellungen einsehen.',
                it: 'Assegna camerieri e chef a tavoli o camere specifici. Solo il personale designato può gestire tali ordini.',
                zh: '为指定餐桌或客房分配服务员和厨师。仅被分配的员工可查看和编辑所属位置的订单。',
                ar: 'قم بتعيين النادلين والطهاة لطاولات أو غرف محددة. يمكن فقط للموظفين المعينين عرض أو تعديل طلبات مواقعهم.',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-black/50 border border-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('roster')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'roster'
                    ? 'bg-[#C1FF00] text-black'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {tText({
                  am: 'የፈረቃ ዝርዝር (Roster)',
                  or: 'Tarree Shifftii (Roster)',
                  ti: 'ዝርዝር ፈረቓ (Roster)',
                  sid: 'Shifftete Xapho (Roster)',
                  en: 'Shift Roster',
                  fr: 'Liste des Équipes',
                  de: 'Schichtplan',
                  it: 'Elenco Turni',
                  zh: '排班列表',
                  ar: 'جدول المناوبات',
                })}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-[#C1FF00] text-black'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {tText({
                  am: 'የጠረጴዛና ክፍል ሰንጠረዥ (Matrix)',
                  or: 'Gabatee Minjaalaa fi Kutaa',
                  ti: 'ሰንጠረዥ ጠረጴዛን ክፍልን',
                  sid: 'Xarapheezunna Kifilu Shaashsha',
                  en: 'Coverage Matrix',
                  fr: 'Matrice de Couverture',
                  de: 'Abdeckungsmatrix',
                  it: 'Matrice Copertura',
                  zh: '岗位覆盖矩阵',
                  ar: 'مصفوفة التغطية',
                })}
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-stone-400 block">
              {tText({
                am: 'ንቁ የአስተናጋጅ ምደባዎች',
                or: 'Ramaddii Keessummeessaa Nuti',
                ti: 'ንጡፋት ምደባታት ኣስተናጋጅ',
                sid: 'Nqo Owaataanchu Shiffte',
                en: 'Active Waiter Shifts',
                fr: 'Postes Serveurs Actifs',
                de: 'Aktive Kellnerschichten',
                it: 'Turni Cameriere Attivi',
                zh: '生效中服务员班次',
                ar: 'مناوبات النادلين النشطة',
              })}
            </span>
            <p className="text-2xl font-black font-mono tabular-nums text-yellow-400 mt-1">
              {stats.activeWaiterShifts}
            </p>
            <span className="text-[11px] text-stone-500">
              {waitersList.length} {tText({
                am: 'አስተናጋጆች በዝርዝር',
                or: 'keessummeessitoota galmaa’an',
                ti: 'ዝተመዝገቡ ኣስተናጋጃት',
                sid: 'borreessamino owaataano',
                en: 'registered waiters',
                fr: 'serveurs enregistrés',
                de: 'registrierte Kellner',
                it: 'camerieri registrati',
                zh: '名已登记服务员',
                ar: 'نادلين مسجلين',
              })}
            </span>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-stone-400 block">
              {tText({
                am: 'ንቁ የሼፍ (ኩሽና) ምደባዎች',
                or: 'Ramaddii Sheefii Nuti',
                ti: 'ንጡፋት ምደባታት ሼፍ',
                sid: 'Nqo Qishaanchu Shiffte',
                en: 'Active Chef Shifts',
                fr: 'Postes Chefs Actifs',
                de: 'Aktive Kochschichten',
                it: 'Turni Chef Attivi',
                zh: '生效中厨师班次',
                ar: 'مناوبات الطهاة النشطة',
              })}
            </span>
            <p className="text-2xl font-black font-mono tabular-nums text-orange-400 mt-1">
              {stats.activeChefShifts}
            </p>
            <span className="text-[11px] text-stone-500">
              {chefsList.length} {tText({
                am: 'ሼፎች በዝርዝር',
                or: 'sheefota galmaa’an',
                ti: 'ዝተመዝገቡ ሼፋት',
                sid: 'borreessamino qishaano',
                en: 'registered chefs',
                fr: 'chefs enregistrés',
                de: 'registrierte Köche',
                it: 'chef registrati',
                zh: '名已登记厨师',
                ar: 'طهاة مسجلين',
              })}
            </span>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-stone-400 block">
              {tText({
                am: 'የተሸፈኑ ጠረጴዛዎችና ክፍሎች',
                or: 'Minjaalotaa fi Kutaalee Haguugaman',
                ti: 'ዝተሸፈኑ ጠረጴዛታትን ክፍልታትን',
                sid: 'Amadamino Xarapheezunna Kifilla',
                en: 'Covered Tables & Rooms',
                fr: 'Tables & Chambres Couvertes',
                de: 'Abgedeckte Tische & Zimmer',
                it: 'Tavoli & Camere Coperti',
                zh: '已覆盖餐桌与客房',
                ar: 'الطاولات والغرف المغطاة',
              })}
            </span>
            <p className="text-2xl font-black font-mono tabular-nums text-emerald-400 mt-1">
              {stats.uniqueLocations}
            </p>
            <span className="text-[11px] text-stone-500">
              {allKnownLocations.length} {tText({
                am: 'ጠቅላላ ቦታዎች',
                or: 'iddoowwan waliigalaa',
                ti: 'ጠቕላላ ቦታታት',
                sid: 'xaphooma bayicha',
                en: 'total tracked locations',
                fr: 'emplacements suivis',
                de: 'erfasste Standorte',
                it: 'posizioni monitorate',
                zh: '个受控位置',
                ar: 'إجمالي المواقع المتابعة',
              })}
            </span>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-stone-400 block">
              {tText({
                am: 'ምደባ የጎደላቸው ንቁ ትዕዛዞች',
                or: 'Ajajoota Nuti Ramaddii Hin Qabne',
                ti: 'ምደባ ዝጎደሎም ንጡፋት ትእዛዛት',
                sid: 'Shiffte Hoosino Nqo Ajaja',
                en: 'Uncovered Active Orders',
                fr: 'Commandes Actives Non Couvertes',
                de: 'Unbesetzte aktive Bestellungen',
                it: 'Ordini Attivi Scoperti',
                zh: '未覆盖的活动订单',
                ar: 'طلبات نشطة بدون تعيين',
              })}
            </span>
            <p
              className={`text-2xl font-black font-mono tabular-nums mt-1 ${
                stats.uncoveredCount > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {stats.uncoveredCount}
            </p>
            <span className="text-[11px] text-stone-500">
              {stats.uncoveredCount > 0
                ? tText({
                    am: 'አስተናጋጅ ወይም ሼፍ ያልተመደበባቸው',
                    or: 'Keessummeessaa ykn sheefii hin qabne',
                    ti: 'ኣስተናጋጅ ወይ ሼፍ ዘይተመደቦም',
                    sid: 'Owaataancho woy qishaancho dinohu',
                    en: 'Missing waiter or chef assignment',
                    fr: 'Serveur ou chef manquant',
                    de: 'Kellner- oder Kochzuweisung fehlt',
                    it: 'Manca cameriere o chef assegnato',
                    zh: '缺少服务员或厨师分配',
                    ar: 'ينقصها تعيين نادل أو طاهٍ',
                  })
                : tText({
                    am: 'ሁሉም ንቁ ትዕዛዞች ተመድበዋል',
                    or: 'Ajajoonni hundi ramadamaniiru',
                    ti: 'ኩሎም ንጡፋት ትእዛዛት ተመዲቦም',
                    sid: 'Baalanti nqo ajaja uyinoonni',
                    en: 'All active orders covered',
                    fr: 'Toutes les commandes couvertes',
                    de: 'Alle aktiven Bestellungen abgedeckt',
                    it: 'Tutti gli ordini attivi coperti',
                    zh: '所有活动订单均已覆盖',
                    ar: 'جميع الطلبات النشطة مغطاة',
                  })}
            </span>
          </div>
        </div>

        {/* Inline Feedback Banner */}
        {noticeBanner && (
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
              noticeBanner.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}
          >
            <span>{noticeBanner.text}</span>
            <button
              type="button"
              onClick={() => setNoticeBanner(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Uncovered Active Orders Alert Bar */}
      {uncoveredActiveOrders.length > 0 && (
        <div className="bg-[#161210] border border-amber-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black text-amber-300">
                ⚠️ {tText({
                  am: 'አስተናጋጅ ወይም ሼፍ ያልተመደበላቸው ንቁ ትዕዛዞች',
                  or: 'Ajajoota Nuti Keessummeessaa ykn Sheefii Hin Qabne',
                  ti: 'ኣስተናጋጅ ወይ ሼፍ ዘይተመደቦም ንጡፋት ትእዛዛት',
                  sid: 'Owaataancho woy Qishaancho Dinore Nqo Ajaja',
                  en: 'Active Orders Missing Waiter or Chef Shift Coverage',
                  fr: 'Commandes actives sans couverture serveur ou chef',
                  de: 'Aktive Bestellungen ohne Kellner- oder Kochzuweisung',
                  it: 'Ordini attivi senza copertura di turno',
                  zh: '缺少服务员或厨师值班覆盖的活动订单',
                  ar: 'طلبات نشطة تفتقر إلى تغطية نادل أو طاهٍ',
                })}
              </h4>
              <p className="text-[11px] text-stone-400">
                {tText({
                  am: 'ሰራተኞች የሚታያቸው የተመደበላቸው ትዕዛዝ ብቻ ስለሆነ እነዚህን ጠረጴዛዎች/ክፍሎች ወዲያውኑ ይመድቡ።',
                  or: 'Hojjettoonni ajaja ramadameef qofa waan arganiif iddoowwan kana battalumatti ramadaa.',
                  ti: 'ሰራሕተኛታት ዝተመደበሎም ትእዛዝ ጥራይ ስለዝርእዩ ነዞም ቦታታት ብቅልጡፍ መድቡ።',
                  sid: 'Loosaano uyinoonninsa ajaja calla la’anno daafira konne bayicha raho uyi.',
                  en: 'Because staff can only view and edit designated orders, assign a waiter and chef to these locations below.',
                  fr: 'Le personnel ne voyant que ses commandes assignées, assignez un serveur et un chef ci-dessous.',
                  de: 'Da Mitarbeiter nur zugewiesene Bestellungen sehen, weisen Sie diesen Orten Kellner und Koch zu.',
                  it: 'Poiché lo staff vede solo gli ordini assegnati, assegna cameriere e chef qui sotto.',
                  zh: '由于员工仅能查看和编辑分配给自己的订单，请及时为以下位置分配服务员和厨师。',
                  ar: 'لأن الموظفين يمكنهم فقط عرض الطلبات المخصصة لهم، قم بتعيين نادل وطاهٍ لهذه المواقع أدناه.',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className="px-3 py-1.5 bg-amber-400 hover:bg-white text-black text-xs font-bold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              {tText({
                am: 'በሰንጠረዥ መድብ',
                or: 'Gabatee Keessatti Ramadi',
                ti: 'ኣብ ሰንጠረዥ መድብ',
                sid: 'Shaashshaho Biddishi',
                en: 'Assign in Matrix',
                fr: 'Assigner dans la Matrice',
                de: 'In Matrix zuweisen',
                it: 'Assegna in Matrice',
                zh: '在矩阵中分配',
                ar: 'تعيين في المصفوفة',
              })}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {uncoveredActiveOrders.slice(0, 8).map((ord) => {
              const hasW = shiftAssignments.some(
                (a) => a.active && a.staffRole === 'waiter' && locationsMatch(a.location, ord.location)
              );
              const hasC = shiftAssignments.some(
                (a) => a.active && a.staffRole === 'chef' && locationsMatch(a.location, ord.location)
              );
              return (
                <div
                  key={ord.id}
                  className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs flex items-center gap-3"
                >
                  <span className="font-mono font-bold text-white">{ord.id}</span>
                  <span aria-hidden="true" className="text-stone-600">·</span>
                  <span className="font-bold text-amber-300">{ord.location}</span>
                  <span aria-hidden="true" className="text-stone-600">·</span>
                  <span className="text-[11px] text-stone-400">
                    {!hasW && !hasC
                      ? tText({
                          am: 'አስተናጋጅ እና ሼፍ የለውም',
                          or: 'Keessummeessaa fi Sheefii hin qabu',
                          ti: 'ኣስተናጋጅን ሼፍን የብሉን',
                          sid: 'Owaataanchonna Qishaancho Dino',
                          en: 'No Waiter & No Chef',
                          fr: 'Sans Serveur ni Chef',
                          de: 'Kein Kellner & Kein Koch',
                          it: 'Senza Cameriere né Chef',
                          zh: '无服务员与厨师',
                          ar: 'لا يوجد نادل ولا طاهٍ',
                        })
                      : !hasW
                      ? tText({
                          am: 'አስተናጋጅ የለውም',
                          or: 'Keessummeessaa hin qabu',
                          ti: 'ኣስተናጋጅ የብሉን',
                          sid: 'Owaataancho Dino',
                          en: 'No Waiter',
                          fr: 'Sans Serveur',
                          de: 'Kein Kellner',
                          it: 'Senza Cameriere',
                          zh: '无服务员',
                          ar: 'لا يوجد نادل',
                        })
                      : tText({
                          am: 'ሼፍ የለውም',
                          or: 'Sheefii hin qabu',
                          ti: 'ሼፍ የብሉን',
                          sid: 'Qishaancho Dino',
                          en: 'No Chef',
                          fr: 'Sans Chef',
                          de: 'Kein Koch',
                          it: 'Senza Chef',
                          zh: '无厨师',
                          ar: 'لا يوجد طاهٍ',
                        })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const canon = formatCanonicalLocation(ord.location);
                      setLocationTypeFilter(inferLocationType(canon));
                      setSelectedLocations([canon]);
                      if (!hasW) setSelectedRole('waiter');
                      else if (!hasC) setSelectedRole('chef');
                    }}
                    className="px-2 py-1 bg-white/10 hover:bg-[#C1FF00] hover:text-black text-white rounded text-[11px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    {tText({
                      am: 'ምረጥ',
                      or: 'Filadhu',
                      ti: 'ምረጽ',
                      sid: 'Doori',
                      en: 'Select',
                      fr: 'Choisir',
                      de: 'Auswählen',
                      it: 'Seleziona',
                      zh: '选择',
                      ar: 'اختيار',
                    })}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 12-Col Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Shift Builder Form */}
        <div className="lg:col-span-4 bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#C1FF00]" />
              <span>
                {tText({
                  am: 'አዲስ ፈረቃ መመደቢያ',
                  or: 'Shifftii Haaraa Ramadi',
                  ti: 'ሓድሽ ፈረቓ መመደቢ',
                  sid: 'Haaro Shiffte Biddishsha',
                  en: 'Assign Staff Shift',
                  fr: 'Assigner un Poste',
                  de: 'Schicht Zuweisen',
                  it: 'Assegna Turno',
                  zh: '分配员工班次',
                  ar: 'تعيين مناوبة الموظف',
                })}
              </span>
            </h4>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {tText({
                am: 'አስተናጋጅ ወይም ሼፍ በመምረጥ አንድ ወይም ከዚያ በላይ ጠረጴዛ/ክፍሎችን ይመድቡ።',
                or: 'Keessummeessaa ykn sheefii filachuun minjaala/kutaa tokko ykn isaa ol ramadaa.',
                ti: 'ኣስተናጋጅ ወይ ሼፍ ብምምራጽ ሓደ ወይ ልዕሊኡ ጠረጴዛታት/ክፍልታት መድቡ።',
                sid: 'Owaataancho woy qishaancho doorte mitte woy roore xarapheeza/kifilla uyi.',
                en: 'Select a waiter or chef and assign one or multiple tables or rooms.',
                fr: 'Sélectionnez un serveur ou un chef et assignez une ou plusieurs tables ou chambres.',
                de: 'Wählen Sie einen Kellner oder Koch und weisen Sie einen oder mehrere Tische oder Zimmer zu.',
                it: 'Seleziona un cameriere o uno chef e assegna uno o più tavoli o camere.',
                zh: '选择服务员或厨师，并为其分配一个或多个餐桌或客房。',
                ar: 'اختر نادلاً أو طاهياً وقم بتعيين طاولة أو غرفة واحدة أو أكثر.',
              })}
            </p>
          </div>

          <form onSubmit={handleAssignLocations} className="space-y-4">
            {/* Step 1: Staff Role */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-300 block">
                {tText({
                  am: '1. የስራ ዘርፍ',
                  or: '1. Gahee Hojii',
                  ti: '1. ናይ ስራሕ ዘርፊ',
                  sid: '1. Loosu Gara',
                  en: '1. Staff Role',
                  fr: '1. Rôle du Personnel',
                  de: '1. Mitarbeiterrolle',
                  it: '1. Ruolo Personale',
                  zh: '1. 员工职位',
                  ar: '1. دور الموظف',
                })}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 border border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('waiter');
                    setSelectedStaffName('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    selectedRole === 'waiter'
                      ? 'bg-yellow-400 text-black'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{tRole('Waiter')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('chef');
                    setSelectedStaffName('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    selectedRole === 'chef'
                      ? 'bg-orange-400 text-black'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>{tRole('Chef')}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Select Staff */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-300 block">
                {selectedRole === 'waiter'
                  ? tText({
                      am: '2. አስተናጋጅ ይምረጡ',
                      or: '2. Keessummeessaa Filadhu',
                      ti: '2. ኣስተናጋጅ ምረጽ',
                      sid: '2. Owaataancho Doori',
                      en: '2. Select Waiter',
                      fr: '2. Choisir le Serveur',
                      de: '2. Kellner Auswählen',
                      it: '2. Seleziona Cameriere',
                      zh: '2. 选择服务员',
                      ar: '2. اختر النادل',
                    })
                  : tText({
                      am: '2. ሼፍ ይምረጡ',
                      or: '2. Sheefii Filadhu',
                      ti: '2. ሼፍ ምረጽ',
                      sid: '2. Qishaancho Doori',
                      en: '2. Select Chef',
                      fr: '2. Choisir le Chef',
                      de: '2. Koch Auswählen',
                      it: '2. Seleziona Chef',
                      zh: '2. 选择厨师',
                      ar: '2. اختر الطاهي',
                    })}
              </label>
              <select
                value={selectedStaffName}
                onChange={(e) => setSelectedStaffName(e.target.value)}
                required
                className="w-full bg-[#181818] border border-white/15 rounded-lg text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
              >
                <option value="">
                  {selectedRole === 'waiter'
                    ? tText({
                        am: '-- አስተናጋጅ ይምረጡ --',
                        or: '-- Keessummeessaa Filadhu --',
                        ti: '-- ኣስተናጋጅ ምረጽ --',
                        sid: '-- Owaataancho Doori --',
                        en: '-- Choose Waiter --',
                        fr: '-- Choisir un Serveur --',
                        de: '-- Kellner Wählen --',
                        it: '-- Scegli Cameriere --',
                        zh: '-- 请选择服务员 --',
                        ar: '-- اختر النادل --',
                      })
                    : tText({
                        am: '-- ሼፍ ይምረጡ --',
                        or: '-- Sheefii Filadhu --',
                        ti: '-- ሼፍ ምረጽ --',
                        sid: '-- Qishaancho Doori --',
                        en: '-- Choose Chef --',
                        fr: '-- Choisir un Chef --',
                        de: '-- Koch Wählen --',
                        it: '-- Scegli Chef --',
                        zh: '-- 请选择厨师 --',
                        ar: '-- اختر الطاهي --',
                      })}
                </option>
                {selectableStaff.map((s, idx) => {
                  const count = shiftAssignments.filter(
                    (a) =>
                      a.active &&
                      a.staffRole === selectedRole &&
                      a.staffName.toLowerCase() === s.name.toLowerCase()
                  ).length;
                  return (
                    <option key={`${selectedRole}-${s.name}-${idx}`} value={s.name}>
                      {s.name} (PIN: {s.pin}) — {count} {tText({
                        am: 'ቦታ',
                        or: 'ramadame',
                        ti: 'ቦታ',
                        sid: 'uyinoha',
                        en: 'assigned',
                        fr: 'assigné(s)',
                        de: 'zugewiesen',
                        it: 'assegnati',
                        zh: '已分配',
                        ar: 'مُعيَّن',
                      })}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Step 3: Shift Period */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-300 block">
                {tText({
                  am: '3. የፈረቃ ሰዓት',
                  or: '3. Yeroo Shifftii',
                  ti: '3. ሰዓት ፈረቓ',
                  sid: '3. Shifftete Saate',
                  en: '3. Shift Window',
                  fr: '3. Créneau de Poste',
                  de: '3. Schichtzeitfenster',
                  it: '3. Fascia Oraria Turno',
                  zh: '3. 班次时段',
                  ar: '3. فترة المناوبة',
                })}
              </label>
              <select
                value={shiftPeriod}
                onChange={(e) => setShiftPeriod(e.target.value as ShiftPeriod)}
                className="w-full bg-[#181818] border border-white/15 rounded-lg text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
              >
                {SHIFT_PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {getShiftLabel(p.value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Locations (Tables or Rooms) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-300">
                  {tText({
                    am: '4. ጠረጴዛ ወይም ክፍል ይምረጡ',
                    or: '4. Minjaala ykn Kutaa',
                    ti: '4. ጠረጴዛ ወይ ክፍሊ ምረጽ',
                    sid: '4. Xarapheezunna Kifilla',
                    en: '4. Tables & Rooms',
                    fr: '4. Tables & Chambres',
                    de: '4. Tische & Zimmer',
                    it: '4. Tavoli & Camere',
                    zh: '4. 餐桌与客房',
                    ar: '4. الطاولات والغرف',
                  })}
                </label>
                <div className="flex gap-1 bg-black/50 p-0.5 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setLocationTypeFilter('table')}
                    className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer ${
                      locationTypeFilter === 'table'
                        ? 'bg-white text-black'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {tText({
                      am: 'ጠረጴዛዎች',
                      or: 'Minjaalota',
                      ti: 'ጠረጴዛታት',
                      sid: 'Xarapheezuwa',
                      en: 'Tables',
                      fr: 'Tables',
                      de: 'Tische',
                      it: 'Tavoli',
                      zh: '餐桌',
                      ar: 'الطاولات',
                    })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationTypeFilter('room')}
                    className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer ${
                      locationTypeFilter === 'room'
                        ? 'bg-white text-black'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {tText({
                      am: 'ክፍሎች',
                      or: 'Kutaalee',
                      ti: 'ክፍልታት',
                      sid: 'Kifilla',
                      en: 'Rooms',
                      fr: 'Chambres',
                      de: 'Zimmer',
                      it: 'Camere',
                      zh: '客房',
                      ar: 'الغرف',
                    })}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {allKnownLocations
                  .filter((l) => l.type === locationTypeFilter)
                  .map((loc) => {
                    const locKey = normalizeLocationKey(loc.label);
                    const isSelected = selectedLocations.some(
                      (s) => normalizeLocationKey(s) === locKey
                    );
                    const isRecentlyAssigned = Boolean(recentlyAssignedLocs[locKey]);
                    const currentHolder = shiftAssignments.find(
                      (a) =>
                        a.active &&
                        a.staffRole === selectedRole &&
                        locationsMatch(a.location, loc.label)
                    );
                    return (
                      <button
                        key={loc.label}
                        type="button"
                        onClick={() => toggleQuickLocation(loc.label)}
                        className={`shift-table-card relative px-2.5 py-2 rounded-lg text-left border cursor-pointer ${
                          isSelected
                            ? 'bg-[#C1FF00] text-black border-[#C1FF00] shift-table-card-selected'
                            : 'bg-[#181818] text-stone-200 border-white/10 hover:border-white/30'
                        } ${isRecentlyAssigned ? 'shift-table-card-assigned ring-2 ring-[#F4C22B]/80' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-mono font-black block truncate">
                            {loc.label}
                          </span>
                          {isRecentlyAssigned && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#F4C22B] shrink-0 animate-ping"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <span
                          className={`text-[10px] block truncate ${
                            isSelected ? 'text-black/75 font-semibold' : 'text-stone-500'
                          }`}
                        >
                          {currentHolder
                            ? currentHolder.staffName
                            : tText({
                                am: 'ነጻ',
                                or: 'Banaa',
                                ti: 'ናጻ',
                                sid: 'Fano',
                                en: 'Unassigned',
                                fr: 'Libre',
                                de: 'Frei',
                                it: 'Libero',
                                zh: '未分配',
                                ar: 'غير معين',
                              })}
                        </span>
                      </button>
                    );
                  })}
              </div>

              <input
                type="text"
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                placeholder={
                  locationTypeFilter === 'table'
                    ? tText({
                        am: 'ተጨማሪ ጠረጴዛ (ለምሳሌ: Table 12, VIP 1)',
                        or: 'Minjaala dabalataa (fkf: Table 12, VIP 1)',
                        ti: 'ተወሳኺ ጠረጴዛ (ንምሳሌ: Table 12, VIP 1)',
                        sid: 'Ledote xarapheeza (lawishsha: Table 12, VIP 1)',
                        en: 'Custom table (e.g. Table 12, VIP 1)',
                        fr: 'Table personnalisée (ex. Table 12, VIP 1)',
                        de: 'Eigener Tisch (z.B. Table 12, VIP 1)',
                        it: 'Tavolo personalizzato (es. Table 12, VIP 1)',
                        zh: '自定义餐桌 (如 Table 12, VIP 1)',
                        ar: 'طاولة مخصصة (مثل Table 12, VIP 1)',
                      })
                    : tText({
                        am: 'ተጨማሪ ክፍል (ለምሳሌ: Room 205, Suite A)',
                        or: 'Kutaa dabalataa (fkf: Room 205, Suite A)',
                        ti: 'ተወሳኺ ክፍሊ (ንምሳሌ: Room 205, Suite A)',
                        sid: 'Ledote kifila (lawishsha: Room 205, Suite A)',
                        en: 'Custom room (e.g. Room 205, Suite A)',
                        fr: 'Chambre personnalisée (ex. Room 205, Suite A)',
                        de: 'Eigenes Zimmer (z.B. Room 205, Suite A)',
                        it: 'Camera personalizzata (es. Room 205, Suite A)',
                        zh: '自定义客房 (如 Room 205, Suite A)',
                        ar: 'غرفة مخصصة (مثل Room 205, Suite A)',
                      })
                }
                className="w-full bg-[#181818] border border-white/15 rounded-lg text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
              />
            </div>

            {/* Step 5: Optional Note & Conflict rule */}
            <div className="space-y-2">
              <input
                type="text"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder={tText({
                  am: 'ማስታወሻ (አማራጭ) - ለምሳሌ: የቪአይፒ ክፍል',
                  or: 'Yaadannoo dabalataa (dirqama miti)...',
                  ti: 'መዘኻኸሪ (ኣማራጺ)...',
                  sid: 'Ledote qaagiishsha...',
                  en: 'Optional shift note...',
                  fr: 'Note de poste facultative...',
                  de: 'Optionale Schichtnotiz...',
                  it: 'Nota turno facoltativa...',
                  zh: '可选班次备注...',
                  ar: 'ملاحظة مناوبة اختيارية...',
                })}
                className="w-full bg-[#181818] border border-white/15 rounded-lg text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
              />

              <label className="flex items-center gap-2 text-[11px] text-stone-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replaceExistingSameRole}
                  onChange={(e) => setReplaceExistingSameRole(e.target.checked)}
                  className="accent-[#C1FF00]"
                />
                <span>
                  {tText({
                    am: 'በተመሳሳይ ቦታ ላይ የነበረውን የቀድሞ ምደባ በዚህ ይተካ',
                    or: 'Ramaddii duraanii bakka walfakkaataa irra ture kanaaan bakka buusi',
                    ti: 'ኣብ ተመሳሳሊ ቦታ ዝነበረ ቀዳማይ ምደባ ብዚ ተክእ',
                    sid: 'Mitto bayichira noo albi biddishsha konninni riqiwi',
                    en: 'Replace existing same-role assignment on selected locations',
                    fr: 'Remplacer l’affectation existante du même rôle sur ces emplacements',
                    de: 'Vorherige Zuweisung derselben Rolle an ausgewählten Orten ersetzen',
                    it: 'Sostituisci l’assegnazione esistente dello stesso ruolo sui luoghi scelti',
                    zh: '替换所选位置上同职位的现有分配',
                    ar: 'استبدال التعيين الحالي لنفس الدور في المواقع المحددة',
                  })}
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
            >
              {tText({
                am: `ምደባውን አስቀምጥ (${selectedLocations.length} የተመረጠ)`,
                or: `Ramaddii Olkaa'i (${selectedLocations.length} filatame)`,
                ti: `ምደባ ኣቐምጥ (${selectedLocations.length} ተመሪጹ)`,
                sid: `Biddishsha Suuqi (${selectedLocations.length} dooramino)`,
                en: `Save Shift Assignment (${selectedLocations.length} selected)`,
                fr: `Enregistrer le Poste (${selectedLocations.length} sélectionné(s))`,
                de: `Schicht Speichern (${selectedLocations.length} gewählt)`,
                it: `Salva Assegnazione (${selectedLocations.length} selezionati)`,
                zh: `保存排班分配 (已选 ${selectedLocations.length} 项)`,
                ar: `حفظ تعيين المناوبة (${selectedLocations.length} محدد)`,
              })}
            </button>
          </form>
        </div>

        {/* Right: Roster / Coverage Matrix */}
        <div className="lg:col-span-8 bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tText({
                  am: 'በሰራተኛ ስም፣ ጠረጴዛ ወይም ክፍል ይፈልጉ...',
                  or: 'Maqaa hojjetaa, minjaala ykn kutaan barbaadi...',
                  ti: 'ብስም ሰራሕተኛ፣ ጠረጴዛ ወይ ክፍሊ ድለ...',
                  sid: 'Loosaanchu suʼminni, xarapheezunni woy kifilunni hasi...',
                  en: 'Search by staff, table, or room...',
                  fr: 'Rechercher par employé, table ou chambre...',
                  de: 'Nach Mitarbeiter, Tisch oder Zimmer suchen...',
                  it: 'Cerca per personale, tavolo o camera...',
                  zh: '按员工、餐桌或客房搜索...',
                  ar: 'ابحث بالموظف أو الطاولة أو الغرفة...',
                })}
                className="w-full bg-[#181818] border border-white/15 rounded-lg text-white text-xs py-2.5 pl-8 pr-3 outline-none focus:border-[#C1FF00]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {viewMode === 'roster' && (
                <>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-[#181818] border border-white/15 rounded-lg text-xs text-white font-semibold px-2.5 py-2 outline-none cursor-pointer"
                  >
                    <option value="all">
                      {tText({
                        am: 'ሁሉም ሚናዎች',
                        or: 'Gahee Hunda',
                        ti: 'ኩሎም ተራታት',
                        sid: 'Baala Loosu Gara',
                        en: 'All Roles',
                        fr: 'Tous les Rôles',
                        de: 'Alle Rollen',
                        it: 'Tutti i Ruoli',
                        zh: '所有职位',
                        ar: 'جميع الأدوار',
                      })}
                    </option>
                    <option value="waiter">{tRole('Waiter')}</option>
                    <option value="chef">{tRole('Chef')}</option>
                  </select>

                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value as any)}
                    className="bg-[#181818] border border-white/15 rounded-lg text-xs text-white font-semibold px-2.5 py-2 outline-none cursor-pointer"
                  >
                    <option value="all">
                      {tText({
                        am: 'ሁሉም ፈረቃዎች',
                        or: 'Shifftii Hunda',
                        ti: 'ኩሎም ፈረቓታት',
                        sid: 'Baalanti Shiffte',
                        en: 'All Shifts',
                        fr: 'Tous les Postes',
                        de: 'Alle Schichten',
                        it: 'Tutti i Turni',
                        zh: '所有班次',
                        ar: 'جميع المناوبات',
                      })}
                    </option>
                    {SHIFT_PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {getShiftLabel(p.value)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-[#181818] border border-white/15 rounded-lg text-xs text-white font-semibold px-2.5 py-2 outline-none cursor-pointer"
                  >
                    <option value="all">
                      {tText({
                        am: 'ሁሉም ሁኔታ',
                        or: 'Haala Hunda',
                        ti: 'ኩሉ ኩነታት',
                        sid: 'Baalanka Gara',
                        en: 'All Status',
                        fr: 'Tous les Statuts',
                        de: 'Alle Status',
                        it: 'Tutti gli Stati',
                        zh: '所有状态',
                        ar: 'جميع الحالات',
                      })}
                    </option>
                    <option value="active">
                      {tText({
                        am: 'ንቁ ብቻ',
                        or: 'Nuti Qofa',
                        ti: 'ንጡፍ ጥራይ',
                        sid: 'Nqo Calla',
                        en: 'Active Only',
                        fr: 'Actifs Seulement',
                        de: 'Nur Aktive',
                        it: 'Solo Attivi',
                        zh: '仅生效中',
                        ar: 'النشطة فقط',
                      })}
                    </option>
                    <option value="paused">
                      {tText({
                        am: 'የቆመ',
                        or: 'Dhaabate',
                        ti: 'ደው ዝበለ',
                        sid: 'Uurrinoha',
                        en: 'Paused Only',
                        fr: 'En Pause Seulement',
                        de: 'Nur Pausiert',
                        it: 'Solo in Pausa',
                        zh: '仅已暂停',
                        ar: 'الموقوفة فقط',
                      })}
                    </option>
                  </select>
                </>
              )}

              {shiftAssignments.length > 0 && !confirmResetAll && (
                <button
                  type="button"
                  onClick={() => setConfirmResetAll(true)}
                  className="px-3 py-2 bg-red-600/15 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  {tText({
                    am: 'ሁሉንም አጽዳ',
                    or: 'Hunda Haqi',
                    ti: 'ኩሉ ኣጽሪ',
                    sid: 'Baala Huni',
                    en: 'Reset Shift',
                    fr: 'Réinitialiser',
                    de: 'Zurücksetzen',
                    it: 'Reimposta Turni',
                    zh: '清空排班',
                    ar: 'إعادة ضبط المناوبة',
                  })}
                </button>
              )}

              {confirmResetAll && (
                <div className="flex items-center gap-1.5 bg-red-950/70 border border-red-500/50 px-2.5 py-1 rounded-lg">
                  <span className="text-[11px] text-red-200 font-semibold">
                    {tText({
                      am: 'እርግጠኛ ነዎት?',
                      or: 'Hunda haquu?',
                      ti: 'ርግጸኛ ዲኹም?',
                      sid: 'Baala huno?',
                      en: 'Clear all?',
                      fr: 'Tout effacer ?',
                      de: 'Alles löschen?',
                      it: 'Cancellare tutto?',
                      zh: '全部清空?',
                      ar: 'مسح الكل؟',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveShiftAssignments([]);
                      setConfirmResetAll(false);
                      showNotice(
                        'success',
                        tText({
                          am: 'ሁሉም የፈረቃ ምደባዎች ተሰርዘዋል።',
                          or: 'Ramaddiin shifftii hundi haqameera.',
                          ti: 'ኩሎም ምደባታት ፈረቓ ተሰሪዞም።',
                          sid: 'Baalanti shifftete biddishshi hoonamino.',
                          en: 'All shift assignments cleared.',
                          fr: 'Toutes les affectations ont été effacées.',
                          de: 'Alle Schichtzuweisungen wurden gelöscht.',
                          it: 'Tutte le assegnazioni turno sono state cancellate.',
                          zh: '所有班次分配已清空。',
                          ar: 'تم مسح جميع تعيينات المناوبات.',
                        })
                      );
                    }}
                    className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold cursor-pointer"
                  >
                    {tText({
                      am: 'አዎ',
                      or: 'Eeyyee',
                      ti: 'እወ',
                      sid: 'Ee',
                      en: 'Yes',
                      fr: 'Oui',
                      de: 'Ja',
                      it: 'Sì',
                      zh: '是',
                      ar: 'نعم',
                    })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetAll(false)}
                    className="px-2 py-0.5 bg-white/10 text-stone-200 rounded text-[11px] cursor-pointer"
                  >
                    {tText({
                      am: 'ተው',
                      or: 'Dhiisi',
                      ti: 'ግደፍ',
                      sid: 'Aguri',
                      en: 'No',
                      fr: 'Non',
                      de: 'Nein',
                      it: 'No',
                      zh: '否',
                      ar: 'لا',
                    })}
                  </button>
                </div>
              )}
            </div>
          </div>

          {viewMode === 'roster' ? (
            filteredAssignments.length === 0 ? (
              <div className="text-center py-14 space-y-2 border border-dashed border-white/10 rounded-xl">
                <Users className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="text-sm font-bold text-stone-400">
                  {tText({
                    am: 'ምንም የተመዘገበ የፈረቃ ምደባ አልተገኘም',
                    or: 'Ramaddiin shifftii galmaa’e hin argamne',
                    ti: 'ዝተመዝገበ ምደባ ፈረቓ ኣይተረኽበን',
                    sid: 'Borreessamino shifftete biddishshi dino',
                    en: 'No shift assignments match your filters',
                    fr: 'Aucune affectation ne correspond aux filtres',
                    de: 'Keine Schichtzuweisungen entsprechen dem Filter',
                    it: 'Nessun turno corrisponde ai filtri',
                    zh: '没有符合筛选条件的班次分配',
                    ar: 'لا توجد تعيينات مناوبة تطابق عوامل التصفية',
                  })}
                </p>
                <p className="text-xs text-stone-500">
                  {tText({
                    am: 'በግራ በኩል ባለው ቅጽ ለጠረጴዛዎች እና ለክፍሎች አስተናጋጆችንና ሼፎችን ይመድቡ።',
                    or: 'Unka bitaa irra jiruun keessummeessaa fi sheefii minjaala/kutaaf ramadaa.',
                    ti: 'በቲ ኣብ ጸጋም ዘሎ ቅጥዒ ንጠረጴዛታትን ክፍልታትን ኣስተናጋጃትን ሼፋትን መድቡ።',
                    sid: 'Guraanni qixxeessinoonni kifatenni owaataanonne qishaano uyi.',
                    en: 'Use the assignment panel on the left to designate waiters and chefs to tables or rooms.',
                    fr: 'Utilisez le panneau à gauche pour assigner serveurs et chefs aux tables ou chambres.',
                    de: 'Nutzen Sie das Zuweisungsfeld links, um Kellner und Köche Tischen/Zimmern zuzuweisen.',
                    it: 'Usa il pannello a sinistra per assegnare camerieri e chef a tavoli o camere.',
                    zh: '使用左侧面板为餐桌或客房分配服务员和厨师。',
                    ar: 'استخدم لوحة التعيين على الجانب لتخصيص النادلين والطهاة للطاولات أو الغرف.',
                  })}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-stone-400 font-mono text-[11px]">
                      <th className="py-2.5 pr-3">
                        {tText({
                          am: 'ሰራተኛ',
                          or: 'Hojjetaa',
                          ti: 'ሰራሕተኛ',
                          sid: 'Loosaancho',
                          en: 'Staff Member',
                          fr: 'Membre',
                          de: 'Mitarbeiter',
                          it: 'Personale',
                          zh: '员工',
                          ar: 'الموظف',
                        })}
                      </th>
                      <th className="py-2.5 pr-3">
                        {tText({
                          am: 'ሚና',
                          or: 'Gahee',
                          ti: 'ተራ',
                          sid: 'Loosu Gara',
                          en: 'Role',
                          fr: 'Rôle',
                          de: 'Rolle',
                          it: 'Ruolo',
                          zh: '职位',
                          ar: 'الدور',
                        })}
                      </th>
                      <th className="py-2.5 pr-3">
                        {tText({
                          am: 'ጠረጴዛ / ክፍል',
                          or: 'Minjaala / Kutaa',
                          ti: 'ጠረጴዛ / ክፍሊ',
                          sid: 'Xarapheeza / Kifila',
                          en: 'Table / Room',
                          fr: 'Table / Chambre',
                          de: 'Tisch / Zimmer',
                          it: 'Tavolo / Camera',
                          zh: '餐桌 / 客房',
                          ar: 'طاولة / غرفة',
                        })}
                      </th>
                      <th className="py-2.5 pr-3">
                        {tText({
                          am: 'ፈረቃ',
                          or: 'Shifftii',
                          ti: 'ፈረቓ',
                          sid: 'Shiffte',
                          en: 'Shift',
                          fr: 'Poste',
                          de: 'Schicht',
                          it: 'Turno',
                          zh: '班次',
                          ar: 'المناوبة',
                        })}
                      </th>
                      <th className="py-2.5 pr-3">
                        {tText({
                          am: 'ሁኔታ',
                          or: 'Haala',
                          ti: 'ኩነታት',
                          sid: 'Gara',
                          en: 'Status',
                          fr: 'Statut',
                          de: 'Status',
                          it: 'Stato',
                          zh: '状态',
                          ar: 'الحالة',
                        })}
                      </th>
                      <th className="py-2.5 text-right">
                        {tText({
                          am: 'እርምጃ',
                          or: 'Tarkaanfii',
                          ti: 'ስጉምቲ',
                          sid: 'Looso',
                          en: 'Actions',
                          fr: 'Actions',
                          de: 'Aktionen',
                          it: 'Azioni',
                          zh: '操作',
                          ar: 'إجراءات',
                        })}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAssignments.map((ta) => {
                      const activeOrderCount = activeOrders.filter((o) =>
                        locationsMatch(o.location, ta.location)
                      ).length;
                      const isRowAssigned = Boolean(recentlyAssignedIds[ta.id]);
                      return (
                        <tr
                          key={ta.id}
                          className={`hover:bg-white/[0.03] transition-colors ${
                            isRowAssigned ? 'shift-row-assigned' : ''
                          }`}
                        >
                          <td className="py-3 pr-3">
                            <span className="font-bold text-white block">{ta.staffName}</span>
                            {ta.notes && (
                              <span className="text-[11px] text-stone-500 block">{ta.notes}</span>
                            )}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`font-semibold ${
                                ta.staffRole === 'chef' ? 'text-orange-400' : 'text-yellow-400'
                              }`}
                            >
                              {ta.staffRole === 'chef' ? tRole('Chef') : tRole('Waiter')}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <span className="font-mono font-black text-white">{ta.location}</span>
                            <span className="text-stone-500 text-[11px] ml-2 font-mono tabular-nums">
                              · {activeOrderCount} {tText({
                                am: 'ንቁ',
                                or: 'nuti',
                                ti: 'ንጡፍ',
                                sid: 'nqo',
                                en: 'active',
                                fr: 'actif(s)',
                                de: 'aktiv',
                                it: 'attivi',
                                zh: '活动',
                                ar: 'نشط',
                              })}
                            </span>
                          </td>
                          <td className="py-3 pr-3 font-mono text-stone-300">
                            <span>{getShiftLabel(ta.shiftPeriod)}</span>
                            <span className="text-stone-500 block text-[10px] tabular-nums">
                              {ta.date}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(ta.id)}
                              className={`text-xs font-bold cursor-pointer px-2.5 py-1 rounded-md border whitespace-nowrap ${
                                ta.active
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-stone-800 text-stone-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {ta.active
                                ? tText({
                                    am: 'ንቁ',
                                    or: 'Nuti',
                                    ti: 'ንጡፍ',
                                    sid: 'Nqo',
                                    en: 'Active',
                                    fr: 'Actif',
                                    de: 'Aktiv',
                                    it: 'Attivo',
                                    zh: '生效中',
                                    ar: 'نشط',
                                  })
                                : tText({
                                    am: 'ቆሟል',
                                    or: 'Dhaabate',
                                    ti: 'ደው ዝበለ',
                                    sid: 'Uurrino',
                                    en: 'Paused',
                                    fr: 'En Pause',
                                    de: 'Pausiert',
                                    it: 'In Pausa',
                                    zh: '已暂停',
                                    ar: 'موقوف',
                                  })}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(ta.id)}
                              aria-label={`${ta.staffName} — ${ta.location}`}
                              className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Coverage Matrix View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/15 text-stone-400 font-mono text-[11px]">
                    <th className="py-2.5 pr-3">
                      {tText({
                        am: 'ቦታ (ጠረጴዛ / ክፍል)',
                        or: 'Iddoo (Minjaala / Kutaa)',
                        ti: 'ቦታ (ጠረጴዛ / ክፍሊ)',
                        sid: 'Bayicho (Xarapheeza / Kifila)',
                        en: 'Location',
                        fr: 'Emplacement',
                        de: 'Standort',
                        it: 'Posizione',
                        zh: '位置',
                        ar: 'الموقع',
                      })}
                    </th>
                    <th className="py-2.5 pr-3">
                      {tText({
                        am: 'ንቁ ትዕዛዞች',
                        or: 'Ajajoota Nuti',
                        ti: 'ንጡፋት ትእዛዛት',
                        sid: 'Nqo Ajaja',
                        en: 'Active Orders',
                        fr: 'Commandes Actives',
                        de: 'Aktive Bestellungen',
                        it: 'Ordini Attivi',
                        zh: '活动订单',
                        ar: 'الطلبات النشطة',
                      })}
                    </th>
                    <th className="py-2.5 pr-3">
                      {tText({
                        am: 'የተመደበ አስተናጋጅ',
                        or: 'Keessummeessaa Ramadame',
                        ti: 'ዝተመደበ ኣስተናጋጅ',
                        sid: 'Uyinoonni Owaataancho',
                        en: 'Assigned Waiter',
                        fr: 'Serveur Assigné',
                        de: 'Zugewiesener Kellner',
                        it: 'Cameriere Assegnato',
                        zh: '已分配服务员',
                        ar: 'النادل المعين',
                      })}
                    </th>
                    <th className="py-2.5">
                      {tText({
                        am: 'የተመደበ ሼፍ',
                        or: 'Sheefii Ramadame',
                        ti: 'ዝተመደበ ሼፍ',
                        sid: 'Uyinoonni Qishaancho',
                        en: 'Assigned Chef',
                        fr: 'Chef Assigné',
                        de: 'Zugewiesener Koch',
                        it: 'Chef Assegnato',
                        zh: '已分配厨师',
                        ar: 'الطاهي المعين',
                      })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMatrixLocations.map((loc) => {
                    const assignedWaiter = shiftAssignments.find(
                      (a) =>
                        a.active && a.staffRole === 'waiter' && locationsMatch(a.location, loc.label)
                    );
                    const assignedChef = shiftAssignments.find(
                      (a) =>
                        a.active && a.staffRole === 'chef' && locationsMatch(a.location, loc.label)
                    );
                    const locOrderCount = activeOrders.filter((o) =>
                      locationsMatch(o.location, loc.label)
                    ).length;
                    const isMatrixLocAssigned = Boolean(recentlyAssignedLocs[normalizeLocationKey(loc.label)]);

                    return (
                      <tr
                        key={loc.label}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          isMatrixLocAssigned ? 'shift-row-assigned' : ''
                        }`}
                      >
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed
                              className={`w-3.5 h-3.5 ${
                                loc.type === 'room' ? 'text-purple-400' : 'text-[#C1FF00]'
                              }`}
                            />
                            <span className="font-mono font-bold text-white">{loc.label}</span>
                            <span className="text-[11px] text-stone-500">
                              · {loc.type === 'room'
                                ? tText({
                                    am: 'ክፍል',
                                    or: 'Kutaa',
                                    ti: 'ክፍሊ',
                                    sid: 'Kifila',
                                    en: 'Room',
                                    fr: 'Chambre',
                                    de: 'Zimmer',
                                    it: 'Camera',
                                    zh: '客房',
                                    ar: 'غرفة',
                                  })
                                : tText({
                                    am: 'ጠረጴዛ',
                                    or: 'Minjaala',
                                    ti: 'ጠረጴዛ',
                                    sid: 'Xarapheeza',
                                    en: 'Table',
                                    fr: 'Table',
                                    de: 'Tisch',
                                    it: 'Tavolo',
                                    zh: '餐桌',
                                    ar: 'طاولة',
                                  })}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 font-mono tabular-nums">
                          <span className={locOrderCount > 0 ? 'text-amber-300 font-bold' : 'text-stone-500'}>
                            {locOrderCount}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <select
                            value={assignedWaiter?.staffName || ''}
                            onChange={(e) =>
                              handleQuickMatrixAssign(loc.label, 'waiter', e.target.value)
                            }
                            className={`w-full max-w-[200px] bg-[#181818] border rounded-lg text-xs p-1.5 outline-none cursor-pointer ${
                              assignedWaiter
                                ? 'border-yellow-400/40 text-yellow-300 font-bold'
                                : 'border-white/10 text-stone-400'
                            }`}
                          >
                            <option value="">
                              {tText({
                                am: '-- አልተመደበም --',
                                or: '-- Hin Ramadamne --',
                                ti: '-- ኣይተመደበን --',
                                sid: '-- Dino --',
                                en: '-- Unassigned --',
                                fr: '-- Non Assigné --',
                                de: '-- Nicht Zugewiesen --',
                                it: '-- Non Assegnato --',
                                zh: '-- 未分配 --',
                                ar: '-- غير معين --',
                              })}
                            </option>
                            {waitersList.map((w, idx) => (
                              <option key={`mtx-w-${loc.label}-${w.name}-${idx}`} value={w.name}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5">
                          <select
                            value={assignedChef?.staffName || ''}
                            onChange={(e) =>
                              handleQuickMatrixAssign(loc.label, 'chef', e.target.value)
                            }
                            className={`w-full max-w-[200px] bg-[#181818] border rounded-lg text-xs p-1.5 outline-none cursor-pointer ${
                              assignedChef
                                ? 'border-orange-400/40 text-orange-300 font-bold'
                                : 'border-white/10 text-stone-400'
                            }`}
                          >
                            <option value="">
                              {tText({
                                am: '-- አልተመደበም --',
                                or: '-- Hin Ramadamne --',
                                ti: '-- ኣይተመደበን --',
                                sid: '-- Dino --',
                                en: '-- Unassigned --',
                                fr: '-- Non Assigné --',
                                de: '-- Nicht Zugewiesen --',
                                it: '-- Non Assegnato --',
                                zh: '-- 未分配 --',
                                ar: '-- غير معين --',
                              })}
                            </option>
                            {chefsList.map((c, idx) => (
                              <option key={`mtx-c-${loc.label}-${c.name}-${idx}`} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
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
    </div>
  );
}
