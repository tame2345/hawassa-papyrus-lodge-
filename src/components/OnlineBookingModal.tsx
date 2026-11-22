import React, { useEffect, useMemo, useState } from 'react';
import {
  BankAccount,
  MenuItem,
  OnlineRoomBooking,
  OnlineTableReservation,
  OrderItem,
  RoomBooking,
  TableSeatingZone,
} from '../types';
import { processAndUploadReceiptImage } from '../utils/imageUpload';
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  Search,
  Sparkles,
  Upload,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';

interface OnlineBookingModalProps {
  isOpen: boolean;
  initialTab: 'room' | 'table_food' | 'my_bookings';
  onClose: () => void;
  roomBookings: RoomBooking[];
  onlineRoomBookings: OnlineRoomBooking[];
  onlineTableReservations: OnlineTableReservation[];
  menuItems: MenuItem[];
  categories: { id: string; label: string; icon: string }[];
  banks: BankAccount[];
  serviceChargeRate: number;
  vatRate: number;
  chapaActive: boolean;
  currency: string;
  appLang: string;
  onSubmitRoomBooking: (
    payload: Omit<
      OnlineRoomBooking,
      'id' | 'time' | 'date' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'
    >
  ) => OnlineRoomBooking;
  onSubmitTableReservation: (
    payload: Omit<
      OnlineTableReservation,
      'id' | 'time' | 'date' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'
    >
  ) => OnlineTableReservation;
  onCancelRoomBooking: (id: string) => void;
  onCancelTableReservation: (id: string) => void;
  showToast: (msg: string) => void;
}

const ROOM_TIER_CATALOG = [
  {
    type: 'Single Bed',
    nameAm: 'ሲንግል ቤድ (Single Bed)',
    pricePerNight: 1500,
    capacity: 1,
    rooms: ['101', '102', '103'],
    summary: 'Cozy lake-breeze private room · Wi-Fi · Breakfast included',
  },
  {
    type: 'Double Bed',
    nameAm: 'ደብል ቤድ (Double Bed)',
    pricePerNight: 2200,
    capacity: 2,
    rooms: ['104', '105', '106'],
    summary: 'Queen bed · Balcony seating · Hot shower · Breakfast',
  },
  {
    type: 'Twin Double',
    nameAm: 'ትዊን ደብል (Twin Double)',
    pricePerNight: 2800,
    capacity: 3,
    rooms: ['107', '108'],
    summary: 'Two spacious beds · Family & friends · Garden view',
  },
  {
    type: 'Deluxe Suite',
    nameAm: 'ደሉክስ ሱዊት (Deluxe Suite)',
    pricePerNight: 3500,
    capacity: 3,
    rooms: ['109', '110'],
    summary: 'Separate lounge · Lake Hawassa terrace · Mini-bar & coffee',
  },
  {
    type: 'VIP Royal',
    nameAm: 'ቪአይፒ ሮያል (VIP Royal)',
    pricePerNight: 5000,
    capacity: 4,
    rooms: ['111', '112'],
    summary: 'Panoramic waterfront suite · VIP dining & priority concierge',
  },
];

const SEATING_ZONES: { id: TableSeatingZone; nameAm: string; desc: string }[] = [
  { id: 'Main Dining', nameAm: 'ዋናው ሬስቶራንት (Main Dining)', desc: 'Indoor classic Ethiopian dining hall' },
  { id: 'Lakeview Terrace', nameAm: 'የሐይቅ ዳር እይታ (Lakeview Terrace)', desc: 'Open-air Hawassa waterfront breeze' },
  { id: 'Garden Gazebo', nameAm: 'የአትክልት ጎጆ (Garden Gazebo)', desc: 'Shaded private family & group pavilion' },
  { id: 'VIP Lounge', nameAm: 'ቪአይፒ ላውንጅ (VIP Lounge)', desc: 'Quiet executive & celebration lounge' },
];

const QUICK_ARRIVAL_TIMES = ['12:30', '13:30', '17:30', '18:30', '19:30', '20:30'];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysIso(baseIso: string, days: number): string {
  const dt = new Date(`${baseIso}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return getTodayIso();
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diffNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T12:00:00`).getTime();
  const end = new Date(`${checkOut}T12:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 1;
  return Math.max(1, Math.round((end - start) / 86400000));
}

const MY_BOOKINGS_STORAGE_KEY = 'papyrus_my_online_booking_ids';

export default function OnlineBookingModal({
  isOpen,
  initialTab,
  onClose,
  roomBookings,
  onlineRoomBookings,
  onlineTableReservations,
  menuItems,
  categories,
  banks,
  serviceChargeRate,
  vatRate,
  chapaActive,
  currency,
  onSubmitRoomBooking,
  onSubmitTableReservation,
  onCancelRoomBooking,
  onCancelTableReservation,
  showToast,
}: OnlineBookingModalProps) {
  const [activeTab, setActiveTab] = useState<'room' | 'table_food' | 'my_bookings'>(initialTab);
  const todayIso = useMemo(() => getTodayIso(), []);
  const tomorrowIso = useMemo(() => addDaysIso(todayIso, 1), [todayIso]);

  // Saved booking IDs for instant guest lookup
  const [myBookingIds, setMyBookingIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(MY_BOOKINGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const rememberBookingId = (id: string) => {
    setMyBookingIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 25);
      try {
        localStorage.setItem(MY_BOOKINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setRoomConfirmation(null);
      setTableConfirmation(null);
    }
  }, [isOpen, initialTab]);

  // --- ROOM BOOKING STATE ---
  const [selectedRoomType, setSelectedRoomType] = useState<string>('Double Bed');
  const [preferredRoomNumber, setPreferredRoomNumber] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(todayIso);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowIso);
  const [roomGuestCount, setRoomGuestCount] = useState<number>(2);
  const [roomGuestName, setRoomGuestName] = useState<string>('');
  const [roomGuestPhone, setRoomGuestPhone] = useState<string>('');
  const [roomGuestEmail, setRoomGuestEmail] = useState<string>('');
  const [roomNotes, setRoomNotes] = useState<string>('');
  const [roomPayMethod, setRoomPayMethod] = useState<'pay_on_arrival' | 'bank' | 'chapa'>('pay_on_arrival');
  const [roomBankId, setRoomBankId] = useState<string>(banks[0]?.id || '');
  const [roomBankRef, setRoomBankRef] = useState<string>('');
  const [roomReceiptPhoto, setRoomReceiptPhoto] = useState<string>('');
  const [isUploadingRoomReceipt, setIsUploadingRoomReceipt] = useState<boolean>(false);
  const [roomConfirmation, setRoomConfirmation] = useState<OnlineRoomBooking | null>(null);

  // --- TABLE & FOOD RESERVATION STATE ---
  const [bookingMode, setBookingMode] = useState<'table_only' | 'table_and_food'>('table_and_food');
  const [resDate, setResDate] = useState<string>(todayIso);
  const [resTime, setResTime] = useState<string>('18:30');
  const [partySize, setPartySize] = useState<number>(2);
  const [seatingZone, setSeatingZone] = useState<TableSeatingZone>('Lakeview Terrace');
  const [tableGuestName, setTableGuestName] = useState<string>('');
  const [tableGuestPhone, setTableGuestPhone] = useState<string>('');
  const [tableSpecialReq, setTableSpecialReq] = useState<string>('');
  const [foodSearch, setFoodSearch] = useState<string>('');
  const [foodCat, setFoodCat] = useState<string>('all');
  const [preOrderQtyMap, setPreOrderQtyMap] = useState<Record<string, number>>({});
  const [tablePayMethod, setTablePayMethod] = useState<'pay_on_arrival' | 'bank' | 'chapa'>('pay_on_arrival');
  const [tableBankId, setTableBankId] = useState<string>(banks[0]?.id || '');
  const [tableBankRef, setTableBankRef] = useState<string>('');
  const [tableReceiptPhoto, setTableReceiptPhoto] = useState<string>('');
  const [isUploadingTableReceipt, setIsUploadingTableReceipt] = useState<boolean>(false);
  const [tableConfirmation, setTableConfirmation] = useState<OnlineTableReservation | null>(null);

  // --- MY BOOKINGS LOOKUP STATE ---
  const [lookupQuery, setLookupQuery] = useState<string>('');

  const occupiedRoomsSet = useMemo(() => {
    const s = new Set<string>();
    roomBookings
      .filter((b) => b.status === 'Active' && b.roomNumber)
      .forEach((b) => s.add(b.roomNumber.trim().toLowerCase()));
    return s;
  }, [roomBookings]);

  const activeTier = useMemo(
    () => ROOM_TIER_CATALOG.find((t) => t.type === selectedRoomType) || ROOM_TIER_CATALOG[0],
    [selectedRoomType]
  );

  const nights = useMemo(() => diffNights(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
  const roomTotalAmount = nights * activeTier.pricePerNight;

  const foodCategories = useMemo(
    () => categories.filter((c) => c.id !== 'room' && c.id !== 'venue'),
    [categories]
  );

  const availableFoodItems = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (!item.available) return false;
      if (item.cat === 'room' || item.cat === 'venue') return false;
      if (foodCat !== 'all' && item.cat !== foodCat) return false;
      if (!q) return true;
      return (
        item.nameAm.toLowerCase().includes(q) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
        (item.desc && item.desc.toLowerCase().includes(q))
      );
    });
  }, [menuItems, foodCat, foodSearch]);

  const selectedPreOrderItems: OrderItem[] = useMemo(() => {
    if (bookingMode === 'table_only') return [];
    return Object.entries(preOrderQtyMap)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => {
        const mi = menuItems.find((m) => m.id === itemId);
        if (!mi) return null;
        return {
          id: `${mi.id}-pre`,
          baseId: mi.id,
          name: `${mi.nameAm}${mi.nameEn ? ` (${mi.nameEn})` : ''}`,
          qty: Number(qty),
          price: mi.price,
        };
      })
      .filter(Boolean) as OrderItem[];
  }, [bookingMode, preOrderQtyMap, menuItems]);

  const preOrderSubtotal = useMemo(
    () => selectedPreOrderItems.reduce((sum, it) => sum + it.price * it.qty, 0),
    [selectedPreOrderItems]
  );
  const preOrderServiceCharge = Math.round((preOrderSubtotal * serviceChargeRate) / 100);
  const preOrderVat = Math.round(((preOrderSubtotal + preOrderServiceCharge) * vatRate) / 100);
  const preOrderGrandTotal = preOrderSubtotal + preOrderServiceCharge + preOrderVat;

  const myMatchedRoomBookings = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return onlineRoomBookings.filter((b) => {
      if (q) {
        const idMatch = b.id.toLowerCase().includes(q);
        const nameMatch = b.guestName.toLowerCase().includes(q);
        const phoneDigits = (b.guestPhone || '').replace(/\D/g, '');
        const phoneMatch = qDigits.length >= 4 && phoneDigits.includes(qDigits);
        return idMatch || nameMatch || phoneMatch;
      }
      return myBookingIds.includes(b.id);
    });
  }, [onlineRoomBookings, lookupQuery, myBookingIds]);

  const myMatchedTableReservations = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return onlineTableReservations.filter((r) => {
      if (q) {
        const idMatch = r.id.toLowerCase().includes(q);
        const nameMatch = r.guestName.toLowerCase().includes(q);
        const phoneDigits = (r.guestPhone || '').replace(/\D/g, '');
        const phoneMatch = qDigits.length >= 4 && phoneDigits.includes(qDigits);
        return idMatch || nameMatch || phoneMatch;
      }
      return myBookingIds.includes(r.id);
    });
  }, [onlineTableReservations, lookupQuery, myBookingIds]);

  if (!isOpen) return null;

  const handleRoomCheckInChange = (val: string) => {
    setCheckInDate(val);
    if (checkOutDate <= val) {
      setCheckOutDate(addDaysIso(val, 1));
    }
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomGuestName.trim() || !roomGuestPhone.trim()) {
      showToast('⚠️ እባክዎ ሙሉ ስምዎን እና ስልክ ቁጥርዎን ያስገቡ!');
      return;
    }
    if (roomPayMethod === 'bank' && !roomBankRef.trim() && !roomReceiptPhoto) {
      showToast('⚠️ ለባንክ ክፍያ የደረሰኝ ፎቶ ወይም Reference ቁጥር ያስገቡ።');
      return;
    }
    const created = onSubmitRoomBooking({
      roomType: activeTier.type,
      preferredRoomNumber: preferredRoomNumber || undefined,
      checkInDate,
      checkOutDate,
      nights,
      guestCount: roomGuestCount,
      guestName: roomGuestName.trim(),
      guestPhone: roomGuestPhone.trim(),
      guestEmail: roomGuestEmail.trim() || undefined,
      notes: roomNotes.trim() || undefined,
      pricePerNight: activeTier.pricePerNight,
      totalAmount: roomTotalAmount,
      paymentMethod: roomPayMethod,
      bankId: roomPayMethod === 'bank' ? roomBankId : undefined,
      bankRef: roomPayMethod === 'bank' ? roomBankRef.trim() || undefined : undefined,
      receiptScreenshot: roomPayMethod === 'bank' ? roomReceiptPhoto || undefined : undefined,
    });
    rememberBookingId(created.id);
    setRoomConfirmation(created);
    setRoomNotes('');
    setRoomBankRef('');
    setRoomReceiptPhoto('');
  };

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableGuestName.trim() || !tableGuestPhone.trim()) {
      showToast('⚠️ እባክዎ ሙሉ ስምዎን እና ስልክ ቁጥርዎን ያስገቡ!');
      return;
    }
    if (bookingMode === 'table_and_food' && selectedPreOrderItems.length === 0) {
      showToast('⚠️ ምግብ ቀድሞ ለማዘዝ ቢያንስ 1 ምግብ/መጠጥ ይምረጡ ወይም "ቴብል ብቻ (Table Only)" የሚለውን ይምረጡ።');
      return;
    }
    if (
      bookingMode === 'table_and_food' &&
      tablePayMethod === 'bank' &&
      !tableBankRef.trim() &&
      !tableReceiptPhoto
    ) {
      showToast('⚠️ ለባንክ ክፍያ የደረሰኝ ፎቶ ወይም Reference ቁጥር ያስገቡ።');
      return;
    }

    const effectivePayMethod = bookingMode === 'table_only' ? 'pay_on_arrival' : tablePayMethod;
    const created = onSubmitTableReservation({
      guestName: tableGuestName.trim(),
      guestPhone: tableGuestPhone.trim(),
      partySize,
      reservationDate: resDate,
      reservationTime: resTime,
      seatingZone,
      specialRequests: tableSpecialReq.trim() || undefined,
      bookingMode,
      preOrderItems: selectedPreOrderItems,
      preOrderSubtotal,
      serviceCharge: preOrderServiceCharge,
      vat: preOrderVat,
      totalAmount: preOrderGrandTotal,
      paymentMethod: effectivePayMethod,
      bankId: effectivePayMethod === 'bank' ? tableBankId : undefined,
      bankRef: effectivePayMethod === 'bank' ? tableBankRef.trim() || undefined : undefined,
      receiptScreenshot: effectivePayMethod === 'bank' ? tableReceiptPhoto || undefined : undefined,
    });
    rememberBookingId(created.id);
    setTableConfirmation(created);
    setPreOrderQtyMap({});
    setTableSpecialReq('');
    setTableBankRef('');
    setTableReceiptPhoto('');
  };

  return (
    <div
      className="fixed inset-0 z-[9980] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FFFDF9] text-stone-900 border-2 border-[#b21f1f] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="bg-[#991B1B] text-white px-5 py-4 flex items-center justify-between gap-3 border-b-2 border-[#f4c22b]">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#f4c22b] block">
              HAWASSA PAPYRUS LODGE · ONLINE RESERVATIONS
            </span>
            <h2 className="text-base sm:text-xl font-black tracking-tight truncate">
              🌐 ባሉበት ሆነው በኦንላይን አልጋ፣ ቴብል እና ምግብ ይያዙ
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close online booking modal"
            className="w-9 h-9 rounded-full bg-black/30 hover:bg-[#f4c22b] hover:text-stone-950 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('room')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'room'
                ? 'bg-[#b21f1f] text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>🛏️ በኦንላይን አልጋ / ክፍል (Book Room)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table_food')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'table_food'
                ? 'bg-[#b21f1f] text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>🍽️ ሳይመጡ ቴብል እና ምግብ (Table &amp; Pre-Order)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'my_bookings'
                ? 'bg-stone-900 text-[#f4c22b] shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>
              📋 የእኔ ቦኪንጎች ({myMatchedRoomBookings.length + myMatchedTableReservations.length})
            </span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: ONLINE ROOM / BED BOOKING */}
          {activeTab === 'room' && (
            roomConfirmation ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
                <div className="space-y-1">
                  <span className="text-xs font-mono font-black uppercase text-emerald-800 block">
                    ONLINE ROOM RESERVATION RECEIVED
                  </span>
                  <h3 className="text-xl font-black text-stone-900">
                    🎉 የክፍል ቦኪንግዎ በተሳካ ሁኔታ ተመዝግቧል!
                  </h3>
                  <p className="text-sm font-mono font-black text-[#b21f1f] tabular-nums">
                    መለያ ቁጥር (Booking Code): {roomConfirmation.id}
                  </p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5">
                  <p>
                    <strong>እንግዳ (Guest):</strong> {roomConfirmation.guestName} · {roomConfirmation.guestPhone}
                  </p>
                  <p>
                    <strong>ክፍል (Room Tier):</strong> {roomConfirmation.roomType}
                    {roomConfirmation.preferredRoomNumber ? ` · Preferred #${roomConfirmation.preferredRoomNumber}` : ''}
                  </p>
                  <p>
                    <strong>ቀናት (Stay):</strong> {roomConfirmation.checkInDate} → {roomConfirmation.checkOutDate} ({roomConfirmation.nights} ሌሊት)
                  </p>
                  <p className="tabular-nums">
                    <strong>ጠቅላላ ክፍያ:</strong> {roomConfirmation.totalAmount.toLocaleString()} {currency}
                  </p>
                  <p className="text-emerald-800 font-bold pt-1">
                    ሪሴብሽን መረጃዎን ወዲያውኑ አይቶ ክፍሉን ያረጋግጥልዎታል።
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRoomConfirmation(null);
                      setActiveTab('my_bookings');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-[#f4c22b] font-black text-xs cursor-pointer"
                  >
                    📋 ሁኔታውን ተከታተል (Track Status)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomConfirmation(null)}
                    className="px-5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                  >
                    + ሌላ ክፍል ይያዙ
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRoomSubmit} className="space-y-5">
                {/* Step 1: Room Category Cards */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-stone-800 tracking-wide">
                      1️⃣ የክፍል / አልጋ አይነት ይምረጡ (Select Room Category)
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500">
                      Live Availability Synced
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ROOM_TIER_CATALOG.map((tier) => {
                      const vacantInTier = tier.rooms.filter(
                        (r) => !occupiedRoomsSet.has(r.toLowerCase())
                      );
                      const isSelected = selectedRoomType === tier.type;
                      return (
                        <button
                          key={tier.type}
                          type="button"
                          onClick={() => {
                            setSelectedRoomType(tier.type);
                            setPreferredRoomNumber(vacantInTier[0] || '');
                            setRoomGuestCount((curr) => Math.min(curr, tier.capacity));
                          }}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#FFF5F5] border-2 border-[#b21f1f] shadow-sm'
                              : 'bg-white border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-stone-900">{tier.nameAm}</span>
                              <span
                                className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md tabular-nums ${
                                  vacantInTier.length > 0
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {vacantInTier.length}/{tier.rooms.length} Free
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 leading-snug">{tier.summary}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                            <span className="font-mono font-black text-[#b21f1f] tabular-nums">
                              {tier.pricePerNight.toLocaleString()} {currency} / night
                            </span>
                            <span className="text-[10px] text-stone-500 font-bold">
                              Max {tier.capacity} Guest{tier.capacity > 1 ? 's' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Stay Dates, Preferred Room & Guest Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 border border-stone-200 rounded-2xl p-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-stone-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#b21f1f]" />
                      <span>2️⃣ የቆይታ ቀናት እና ክፍል (Stay Dates)</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 uppercase block mb-1">
                          መግቢያ (Check-In) *
                        </label>
                        <input
                          type="date"
                          required
                          min={todayIso}
                          value={checkInDate}
                          onChange={(e) => handleRoomCheckInChange(e.target.value)}
                          className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 uppercase block mb-1">
                          መውጫ (Check-Out) *
                        </label>
                        <input
                          type="date"
                          required
                          min={addDaysIso(checkInDate, 1)}
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 uppercase block mb-1">
                          የእንግዳ ብዛት (Guests)
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRoomGuestCount(num)}
                              className={`flex-1 py-2 rounded-xl text-xs font-mono font-black border cursor-pointer ${
                                roomGuestCount === num
                                  ? 'bg-[#b21f1f] text-white border-[#b21f1f]'
                                  : 'bg-white text-stone-700 border-stone-300'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 uppercase block mb-1">
                          የተመረጠ ክፍል # (Optional)
                        </label>
                        <select
                          value={preferredRoomNumber}
                          onChange={(e) => setPreferredRoomNumber(e.target.value)}
                          className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                        >
                          <option value="">Any Vacant Room</option>
                          {activeTier.rooms.map((rn) => {
                            const busy = occupiedRoomsSet.has(rn.toLowerCase());
                            return (
                              <option key={rn} value={rn} disabled={busy}>
                                Room #{rn} {busy ? '(Occupied today)' : '(Vacant ✓)'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-stone-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#b21f1f]" />
                      <span>3️⃣ የእንግዳ መረጃ (Guest Contact)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 uppercase block mb-1">
                          ሙሉ ስም (Full Name) *
                        </label>
                        <input
                          type="text"
                          required
                          value={roomGuestName}
                          onChange={(e) => setRoomGuestName(e.target.value)}
                          placeholder="Abebe Bikila"
                          className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 uppercase block mb-1">
                          ስልክ ቁጥር (Phone) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={roomGuestPhone}
                          onChange={(e) => setRoomGuestPhone(e.target.value)}
                          placeholder="09xxxxxxxx"
                          className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="email"
                        value={roomGuestEmail}
                        onChange={(e) => setRoomGuestEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={roomNotes}
                        onChange={(e) => setRoomNotes(e.target.value)}
                        placeholder="ልዩ ፍላጎት / Arrival time note..."
                        className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Payment Option & Summary */}
                <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-stone-800">
                      4️⃣ የክፍያ ምርጫ (Payment Preference)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRoomPayMethod('pay_on_arrival')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                          roomPayMethod === 'pay_on_arrival'
                            ? 'bg-stone-900 text-[#f4c22b] border-stone-900'
                            : 'bg-stone-50 text-stone-700 border-stone-300'
                        }`}
                      >
                        🛎️ ሲደርሱ መክፈል (Pay at Reception)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomPayMethod('bank')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                          roomPayMethod === 'bank'
                            ? 'bg-[#b21f1f] text-white border-[#b21f1f]'
                            : 'bg-stone-50 text-stone-700 border-stone-300'
                        }`}
                      >
                        🏦 በባንክ ዝውውር (Bank Pre-Pay)
                      </button>
                      {chapaActive && (
                        <button
                          type="button"
                          onClick={() => setRoomPayMethod('chapa')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                            roomPayMethod === 'chapa'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-stone-50 text-stone-700 border-stone-300'
                          }`}
                        >
                          💳 Chapa Online
                        </button>
                      )}
                    </div>
                  </div>

                  {roomPayMethod === 'bank' && (
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                          ባንክ ይምረጡ (Bank Account)
                        </label>
                        <select
                          value={roomBankId}
                          onChange={(e) => setRoomBankId(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs font-bold outline-none"
                        >
                          {banks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} — {b.number} ({b.holder})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                          Txn Reference #
                        </label>
                        <input
                          type="text"
                          value={roomBankRef}
                          onChange={(e) => setRoomBankRef(e.target.value)}
                          placeholder="FT24..."
                          className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="w-full bg-white hover:bg-stone-100 border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#b21f1f]" />
                          <span>
                            {isUploadingRoomReceipt
                              ? 'Uploading...'
                              : roomReceiptPhoto
                              ? '✓ Receipt Attached'
                              : 'ደረሰኝ ፎቶ ጫን'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingRoomReceipt(true);
                              try {
                                const url = await processAndUploadReceiptImage(file);
                                setRoomReceiptPhoto(url);
                              } finally {
                                setIsUploadingRoomReceipt(false);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-stone-200">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-mono text-stone-600 block tabular-nums">
                        {activeTier.nameAm} · {nights} Night{nights > 1 ? 's' : ''} × {activeTier.pricePerNight.toLocaleString()} {currency}
                      </span>
                      <span className="text-lg font-mono font-black text-[#b21f1f] tabular-nums">
                        ጠቅላላ: {roomTotalAmount.toLocaleString()} {currency}
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#b21f1f] hover:bg-[#8c1414] text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all"
                    >
                      🛏️ አልጋ ቦኪንግ አረጋግጥ (Confirm Room Booking)
                    </button>
                  </div>
                </div>
              </form>
            )
          )}

          {/* TAB 2: ONLINE TABLE + FOOD PRE-ORDER RESERVATION */}
          {activeTab === 'table_food' && (
            tableConfirmation ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
                <div className="space-y-1">
                  <span className="text-xs font-mono font-black uppercase text-emerald-800 block">
                    ONLINE TABLE &amp; DINING RESERVATION CONFIRMED
                  </span>
                  <h3 className="text-xl font-black text-stone-900">
                    🎉 የቴብል እና ምግብ ቦኪንግዎ በተሳካ ሁኔታ ተመዝግቧል!
                  </h3>
                  <p className="text-sm font-mono font-black text-[#b21f1f] tabular-nums">
                    መለያ ቁጥር (Reservation Code): {tableConfirmation.id}
                  </p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5">
                  <p>
                    <strong>እንግዳ:</strong> {tableConfirmation.guestName} · {tableConfirmation.guestPhone}
                  </p>
                  <p>
                    <strong>ቀን እና ሰዓት:</strong> {tableConfirmation.reservationDate} · {tableConfirmation.reservationTime}
                  </p>
                  <p>
                    <strong>ቦታ / ሰዎች:</strong> {tableConfirmation.seatingZone} · {tableConfirmation.partySize} Guests
                  </p>
                  {tableConfirmation.preOrderItems.length > 0 && (
                    <div className="pt-1 border-t border-stone-100">
                      <strong className="block mb-1">🍽️ ቀድሞ የታዘዙ ምግቦች ({tableConfirmation.preOrderItems.length}):</strong>
                      <div className="flex flex-wrap gap-1.5">
                        {tableConfirmation.preOrderItems.map((it, i) => (
                          <span key={i} className="bg-stone-100 px-2 py-0.5 rounded font-semibold">
                            {it.qty} × {it.name}
                          </span>
                        ))}
                      </div>
                      <p className="font-mono font-black text-[#b21f1f] mt-1.5 tabular-nums">
                        Total: {tableConfirmation.totalAmount.toLocaleString()} {currency}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTableConfirmation(null);
                      setActiveTab('my_bookings');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-[#f4c22b] font-black text-xs cursor-pointer"
                  >
                    📋 ሁኔታውን ተከታተል (Track Status)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableConfirmation(null)}
                    className="px-5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                  >
                    + አዲስ ቴብል ይያዙ
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTableSubmit} className="space-y-5">
                {/* Mode Toggle: Table Only vs Table + Pre-Order Food */}
                <div className="bg-stone-100 border border-stone-200 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBookingMode('table_and_food')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black cursor-pointer transition-all ${
                      bookingMode === 'table_and_food'
                        ? 'bg-[#b21f1f] text-white shadow-sm'
                        : 'text-stone-700 hover:bg-white'
                    }`}
                  >
                    🍽️ ቴብል + ምግብ ቀድሞ ማዘዝ (Table + Pre-Order Food)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingMode('table_only')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black cursor-pointer transition-all ${
                      bookingMode === 'table_only'
                        ? 'bg-[#b21f1f] text-white shadow-sm'
                        : 'text-stone-700 hover:bg-white'
                    }`}
                  >
                    🪑 ቴብል ብቻ ማስያዝ (Reserve Table Only)
                  </button>
                </div>

                {/* Seating Zone & Date/Time/Guest Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-stone-50 border border-stone-200 rounded-2xl p-4">
                  <div className="lg:col-span-6 space-y-3">
                    <h4 className="text-xs font-black uppercase text-stone-800">
                      1️⃣ የመቀመጫ ቦታ እና ሰዓት (Zone &amp; Arrival Time)
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SEATING_ZONES.map((z) => (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => setSeatingZone(z.id)}
                          className={`text-left p-2.5 rounded-xl border cursor-pointer transition-all ${
                            seatingZone === z.id
                              ? 'bg-[#FFF5F5] border-2 border-[#b21f1f]'
                              : 'bg-white border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <span className="text-[11px] font-black text-stone-900 block">{z.nameAm}</span>
                          <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">{z.desc}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                          ቀን (Date) *
                        </label>
                        <input
                          type="date"
                          required
                          min={todayIso}
                          value={resDate}
                          onChange={(e) => setResDate(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                          መምጫ ሰዓት *
                        </label>
                        <input
                          type="time"
                          required
                          value={resTime}
                          onChange={(e) => setResTime(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                          የሰው ብዛት (Party)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          required
                          value={partySize}
                          onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-mono font-black text-center outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1 mr-1">
                        <Clock className="w-3 h-3" /> Quick Time:
                      </span>
                      {QUICK_ARRIVAL_TIMES.map((tm) => (
                        <button
                          key={tm}
                          type="button"
                          onClick={() => setResTime(tm)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                            resTime === tm
                              ? 'bg-stone-900 text-[#f4c22b] border-stone-900'
                              : 'bg-white text-stone-700 border-stone-300'
                          }`}
                        >
                          {tm}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <h4 className="text-xs font-black uppercase text-stone-800">
                      2️⃣ የደንበኛ መረጃ (Your Details)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                          ሙሉ ስም (Full Name) *
                        </label>
                        <input
                          type="text"
                          required
                          value={tableGuestName}
                          onChange={(e) => setTableGuestName(e.target.value)}
                          placeholder="Mekdes Tadesse"
                          className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                          ስልክ ቁጥር (Phone) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={tableGuestPhone}
                          onChange={(e) => setTableGuestPhone(e.target.value)}
                          placeholder="09xxxxxxxx"
                          className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                        ልዩ መመሪያ / የልደት ወይም የስብሰባ ማስታወሻ (Special Requests)
                      </label>
                      <textarea
                        rows={2}
                        value={tableSpecialReq}
                        onChange={(e) => setTableSpecialReq(e.target.value)}
                        placeholder="ለምሳሌ፡ ስንደርስ ትኩስ እንዲሆን 15 ደቂቃ ሲቀረው ይጀመር..."
                        className="w-full bg-white border border-stone-300 focus:border-[#b21f1f] rounded-xl px-3 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Food Pre-Order Menu Picker */}
                {bookingMode === 'table_and_food' && (
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black uppercase text-[#b21f1f]">
                          3️⃣ ምግብና መጠጥ ቀድሞ ይምረጡ (Pre-Order Dishes &amp; Drinks)
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          ሳይመጡ ባሉበት ሆነው የሚፈልጉትን ምግብ ከዚህ ይጨምሩ
                        </p>
                      </div>
                      <div className="relative w-full sm:w-60">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={foodSearch}
                          onChange={(e) => setFoodSearch(e.target.value)}
                          placeholder="ምግብ / መጠጥ ይፈልጉ..."
                          className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setFoodCat('all')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black shrink-0 cursor-pointer border ${
                          foodCat === 'all'
                            ? 'bg-stone-900 text-[#f4c22b] border-stone-900'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        ሁሉም (All)
                      </button>
                      {foodCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFoodCat(c.id)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-black shrink-0 cursor-pointer border flex items-center gap-1 ${
                            foodCat === c.id
                              ? 'bg-[#b21f1f] text-white border-[#b21f1f]'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          <span>{c.icon}</span>
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Dishes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {availableFoodItems.map((item) => {
                        const qty = preOrderQtyMap[item.id] || 0;
                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                              qty > 0 ? 'bg-[#FFF5F5] border-[#b21f1f]' : 'bg-stone-50 border-stone-200'
                            }`}
                          >
                            <img
                              src={item.image}
                              alt={item.nameAm}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-stone-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-stone-900 truncate">{item.nameAm}</p>
                              {item.nameEn && (
                                <p className="text-[10px] text-stone-500 truncate">{item.nameEn}</p>
                              )}
                              <span className="text-[11px] font-mono font-black text-[#b21f1f] tabular-nums">
                                {item.price} {currency}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {qty > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreOrderQtyMap((prev) => ({
                                      ...prev,
                                      [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                                    }))
                                  }
                                  className="w-7 h-7 rounded-lg bg-white border border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              )}
                              {qty > 0 && (
                                <span className="w-5 text-center font-mono text-xs font-black tabular-nums">
                                  {qty}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setPreOrderQtyMap((prev) => ({
                                    ...prev,
                                    [item.id]: (prev[item.id] || 0) + 1,
                                  }))
                                }
                                className="w-7 h-7 rounded-lg bg-[#b21f1f] hover:bg-[#8c1414] text-white flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pre-Order Payment Option */}
                    <div className="pt-3 border-t border-stone-200 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-stone-800">
                          💳 የምግብ ክፍያ ምርጫ (Payment Option)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTablePayMethod('pay_on_arrival')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                              tablePayMethod === 'pay_on_arrival'
                                ? 'bg-stone-900 text-[#f4c22b] border-stone-900'
                                : 'bg-stone-50 text-stone-700 border-stone-300'
                            }`}
                          >
                            🪑 ሲደርሱ መክፈል (Pay on Arrival)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTablePayMethod('bank')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                              tablePayMethod === 'bank'
                                ? 'bg-[#b21f1f] text-white border-[#b21f1f]'
                                : 'bg-stone-50 text-stone-700 border-stone-300'
                            }`}
                          >
                            🏦 በባንክ መክፈል (Bank Transfer)
                          </button>
                          {chapaActive && (
                            <button
                              type="button"
                              onClick={() => setTablePayMethod('chapa')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                                tablePayMethod === 'chapa'
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : 'bg-stone-50 text-stone-700 border-stone-300'
                              }`}
                            >
                              💳 Chapa Online
                            </button>
                          )}
                        </div>
                      </div>

                      {tablePayMethod === 'bank' && (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                              ባንክ
                            </label>
                            <select
                              value={tableBankId}
                              onChange={(e) => setTableBankId(e.target.value)}
                              className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs font-bold outline-none"
                            >
                              {banks.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name} — {b.number}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-stone-600 block mb-1">
                              Txn Ref #
                            </label>
                            <input
                              type="text"
                              value={tableBankRef}
                              onChange={(e) => setTableBankRef(e.target.value)}
                              placeholder="FT24..."
                              className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs font-mono outline-none"
                            />
                          </div>
                          <label className="w-full bg-white hover:bg-stone-100 border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-[#b21f1f]" />
                            <span>
                              {isUploadingTableReceipt
                                ? 'Uploading...'
                                : tableReceiptPhoto
                                ? '✓ Receipt Attached'
                                : 'ደረሰኝ ፎቶ ጫን'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploadingTableReceipt(true);
                                try {
                                  const url = await processAndUploadReceiptImage(file);
                                  setTableReceiptPhoto(url);
                                } finally {
                                  setIsUploadingTableReceipt(false);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Bar */}
                <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-stone-800 block">
                      {seatingZone} · {resDate} at {resTime} · {partySize} Guest{partySize > 1 ? 's' : ''}
                    </span>
                    {bookingMode === 'table_and_food' ? (
                      <span className="font-mono font-black text-[#b21f1f] tabular-nums block">
                        {selectedPreOrderItems.reduce((s, i) => s + i.qty, 0)} Items · Subtotal {preOrderSubtotal} + SC {preOrderServiceCharge} + VAT {preOrderVat} ={' '}
                        <strong className="text-sm">{preOrderGrandTotal.toLocaleString()} {currency}</strong>
                      </span>
                    ) : (
                      <span className="text-stone-600 block">
                        🪑 ቴብል ብቻ ማስያዣ (No Pre-Payment Required)
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#b21f1f] hover:bg-[#8c1414] text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#f4c22b]" />
                    <span>
                      {bookingMode === 'table_and_food'
                        ? '🍽️ ቴብል እና ምግብ ቦኪንግ አረጋግጥ'
                        : '🪑 ቴብል ቦኪንግ አረጋግጥ'}
                    </span>
                  </button>
                </div>
              </form>
            )
          )}

          {/* TAB 3: MY ONLINE BOOKINGS TRACKER */}
          {activeTab === 'my_bookings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between bg-stone-50 border border-stone-200 p-3.5 rounded-2xl">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="በስልክ ቁጥር (09...) ወይም በኮድ (#RB- / #TB-) ይፈልጉ..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold outline-none focus:border-[#b21f1f]"
                  />
                </div>
                {lookupQuery && (
                  <button
                    type="button"
                    onClick={() => setLookupQuery('')}
                    className="px-3 py-2 rounded-xl bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer"
                  >
                    አጽዳ
                  </button>
                )}
              </div>

              {myMatchedRoomBookings.length === 0 && myMatchedTableReservations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-300 rounded-2xl space-y-2">
                  <p className="text-sm font-black text-stone-700">
                    ምንም የተገኘ የኦንላይን ቦኪንግ የለም
                  </p>
                  <p className="text-xs text-stone-500">
                    ከላይ ባሉት ትሮች አልጋ ወይም ቴብል ያስይዙ፣ ወይም ስልክ ቁጥርዎን አስገብተው ይፈልጉ።
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myMatchedRoomBookings.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase text-[#b21f1f]">
                        🛏️ የአልጋ ቦኪንጎች ({myMatchedRoomBookings.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {myMatchedRoomBookings.map((rb) => (
                          <div
                            key={rb.id}
                            className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-black text-sm text-[#b21f1f]">{rb.id}</span>
                              <span
                                className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase ${
                                  rb.status === 'Checked In'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : rb.status === 'Confirmed'
                                    ? 'bg-sky-100 text-sky-900'
                                    : rb.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {rb.status}
                              </span>
                            </div>
                            <p className="text-xs font-black text-stone-900">
                              {rb.roomType} {rb.assignedRoomNumber ? `· Assigned Room #${rb.assignedRoomNumber}` : ''}
                            </p>
                            <p className="text-[11px] text-stone-600 font-mono tabular-nums">
                              {rb.checkInDate} → {rb.checkOutDate} ({rb.nights} Nights) · {rb.totalAmount.toLocaleString()} {currency}
                            </p>
                            <p className="text-[11px] text-stone-600">
                              {rb.guestName} · 📞 {rb.guestPhone}
                            </p>
                            {rb.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => onCancelRoomBooking(rb.id)}
                                className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
                              >
                                ✕ ቦኪንጉን ሰርዝ (Cancel)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {myMatchedTableReservations.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase text-[#b21f1f]">
                        🍽️ የቴብል እና ምግብ ቦኪንጎች ({myMatchedTableReservations.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {myMatchedTableReservations.map((tr) => (
                          <div
                            key={tr.id}
                            className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-black text-sm text-[#b21f1f]">{tr.id}</span>
                              <span
                                className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase ${
                                  tr.status === 'Seated' || tr.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : tr.status === 'In Kitchen' || tr.status === 'Confirmed'
                                    ? 'bg-sky-100 text-sky-900'
                                    : tr.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {tr.status}
                              </span>
                            </div>
                            <p className="text-xs font-black text-stone-900">
                              {tr.seatingZone} {tr.assignedTable ? `· ${tr.assignedTable}` : ''} · {tr.partySize} Guests
                            </p>
                            <p className="text-[11px] text-stone-600 font-mono">
                              📅 {tr.reservationDate} · 🕒 {tr.reservationTime}
                            </p>
                            {tr.preOrderItems.length > 0 && (
                              <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-[11px] space-y-1">
                                <span className="font-bold text-stone-800 block">
                                  🍽️ Pre-Order ({tr.preOrderItems.length} items) · {tr.totalAmount.toLocaleString()} {currency}
                                </span>
                                <p className="text-stone-600 truncate">
                                  {tr.preOrderItems.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                                </p>
                              </div>
                            )}
                            {tr.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => onCancelTableReservation(tr.id)}
                                className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
                              >
                                ✕ ቦኪንጉን ሰርዝ (Cancel)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
