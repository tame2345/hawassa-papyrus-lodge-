import React, { useMemo, useState } from 'react';
import { OnlineRoomBooking, OnlineTableReservation, RoomBooking } from '../types';
import { BedDouble, CheckCircle2, Eye, Phone, UtensilsCrossed, X } from 'lucide-react';

interface StaffOnlineBookingsPanelProps {
  mode: 'receptionist' | 'manager' | 'waiter';
  onlineRoomBookings: OnlineRoomBooking[];
  onlineTableReservations: OnlineTableReservation[];
  roomBookings: RoomBooking[];
  currency: string;
  onConfirmRoomBooking: (id: string, roomNumber?: string) => void;
  onCheckInRoomBooking: (id: string, roomNumber: string) => void;
  onToggleRoomBookingPaid: (id: string) => void;
  onCancelRoomBooking: (id: string) => void;
  onConfirmTableReservation: (id: string, assignedTable?: string) => void;
  onSendTablePreOrderToKitchen: (id: string, assignedTable?: string) => void;
  onUpdateTableStatus: (id: string, nextStatus: OnlineTableReservation['status'], assignedTable?: string) => void;
  onToggleTableReservationPaid: (id: string) => void;
}

const DEFAULT_ROOMS = ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112'];
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
  'Table 11',
  'Table 12',
];

export default function StaffOnlineBookingsPanel({
  mode,
  onlineRoomBookings,
  onlineTableReservations,
  roomBookings,
  currency,
  onConfirmRoomBooking,
  onCheckInRoomBooking,
  onToggleRoomBookingPaid,
  onCancelRoomBooking,
  onConfirmTableReservation,
  onSendTablePreOrderToKitchen,
  onUpdateTableStatus,
  onToggleTableReservationPaid,
}: StaffOnlineBookingsPanelProps) {
  const [sectionTab, setSectionTab] = useState<'rooms' | 'tables'>(mode === 'waiter' ? 'tables' : 'rooms');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [roomPickMap, setRoomPickMap] = useState<Record<string, string>>({});
  const [tablePickMap, setTablePickMap] = useState<Record<string, string>>({});
  const [receiptPreview, setReceiptPreview] = useState<{ url: string; title: string } | null>(null);

  const occupiedRoomsSet = useMemo(() => {
    const s = new Set<string>();
    roomBookings
      .filter((b) => b.status === 'Active' && b.roomNumber)
      .forEach((b) => s.add(b.roomNumber.trim().toLowerCase()));
    return s;
  }, [roomBookings]);

  const filteredRoomBookings = useMemo(() => {
    const base = [...onlineRoomBookings].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (statusFilter === 'all') return base;
    return base.filter((b) => b.status === 'Pending' || b.status === 'Confirmed');
  }, [onlineRoomBookings, statusFilter]);

  const filteredTableReservations = useMemo(() => {
    const base = [...onlineTableReservations].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (statusFilter === 'all') return base;
    return base.filter((r) => r.status !== 'Completed' && r.status !== 'Cancelled');
  }, [onlineTableReservations, statusFilter]);

  const pendingRoomsCount = onlineRoomBookings.filter((b) => b.status === 'Pending').length;
  const pendingTablesCount = onlineTableReservations.filter((r) => r.status === 'Pending').length;

  const showRoomSection = mode !== 'waiter' && sectionTab === 'rooms';
  const showTableSection = mode === 'waiter' || sectionTab === 'tables';

  return (
    <div className="bg-[#111214] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4 text-left text-white">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
            ONLINE RESERVATIONS QUEUE
          </span>
          <h3 className="text-sm sm:text-base font-black text-white">
            {mode === 'waiter'
              ? '🍽️ የኦንላይን ቴብል እና ምግብ ቅድመ-ትዕዛዞች (Online Table & Pre-Orders)'
              : '🌐 የኦንላይን አልጋ፣ ቴብል እና ምግብ ቦኪንግ መቆጣጠሪያ'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode !== 'waiter' && (
            <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 gap-1">
              <button
                type="button"
                onClick={() => setSectionTab('rooms')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1.5 ${
                  sectionTab === 'rooms' ? 'bg-emerald-500 text-black' : 'text-stone-300 hover:text-white'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>አልጋ ({onlineRoomBookings.length})</span>
                {pendingRoomsCount > 0 && (
                  <span className="bg-red-600 text-white text-[9px] px-1.5 rounded font-mono tabular-nums">
                    {pendingRoomsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSectionTab('tables')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1.5 ${
                  sectionTab === 'tables' ? 'bg-[#f4c22b] text-black' : 'text-stone-300 hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>ቴብል &amp; ምግብ ({onlineTableReservations.length})</span>
                {pendingTablesCount > 0 && (
                  <span className="bg-red-600 text-white text-[9px] px-1.5 rounded font-mono tabular-nums">
                    {pendingTablesCount}
                  </span>
                )}
              </button>
            </div>
          )}

          <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
              }`}
            >
              All History
            </button>
          </div>
        </div>
      </div>

      {/* SECTION A: ONLINE ROOM / BED BOOKINGS */}
      {showRoomSection && (
        filteredRoomBookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-white/10 rounded-xl">
            በአሁኑ ሰዓት ምንም የኦንላይን አልጋ ቦኪንግ ጥያቄ የለም።
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRoomBookings.map((rb) => {
              const firstVacant = DEFAULT_ROOMS.find((r) => !occupiedRoomsSet.has(r.toLowerCase())) || '101';
              const pickedRoom = roomPickMap[rb.id] || rb.assignedRoomNumber || rb.preferredRoomNumber || firstVacant;
              const isCheckedIn = rb.status === 'Checked In';
              const isCancelled = rb.status === 'Cancelled';

              return (
                <div
                  key={rb.id}
                  className="bg-black/45 border border-white/15 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#C1FF00]">{rb.id}</span>
                        <span
                          className={`text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase ${
                            rb.status === 'Checked In'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : rb.status === 'Confirmed'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : rb.status === 'Cancelled'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {rb.status}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            rb.paymentStatus === 'Paid'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {rb.paymentStatus === 'Paid' ? 'Paid ✓' : rb.paymentMethod === 'bank' ? 'Bank Transfer' : 'Pay at Desk'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-1">{rb.guestName}</h4>
                      <p className="text-[11px] text-stone-300 font-mono">
                        {rb.roomType} · {rb.guestCount} Guest{rb.guestCount > 1 ? 's' : ''} · {rb.checkInDate} → {rb.checkOutDate} ({rb.nights}N)
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px]">
                        <a href={`tel:${rb.guestPhone}`} className="text-sky-300 hover:underline font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {rb.guestPhone}
                        </a>
                        {rb.assignedRoomNumber && (
                          <span className="text-emerald-300 font-mono font-bold">
                            🛏️ Room #{rb.assignedRoomNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className="text-sm font-black text-[#f4c22b] tabular-nums block">
                        {rb.totalAmount.toLocaleString()} {currency}
                      </span>
                      {rb.receiptScreenshot && (
                        <button
                          type="button"
                          onClick={() => setReceiptPreview({ url: rb.receiptScreenshot!, title: `${rb.id} · ${rb.guestName}` })}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-sky-300 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> ደረሰኝ እይ
                        </button>
                      )}
                    </div>
                  </div>

                  {rb.notes && (
                    <p className="text-[11px] text-stone-400 italic bg-white/5 px-2.5 py-1.5 rounded-lg">
                      “{rb.notes}”
                    </p>
                  )}

                  {!isCheckedIn && !isCancelled && (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono text-stone-400 uppercase shrink-0">
                          Assign Room:
                        </label>
                        <select
                          value={pickedRoom}
                          onChange={(e) => setRoomPickMap((p) => ({ ...p, [rb.id]: e.target.value }))}
                          className="flex-1 bg-[#181818] border border-white/20 rounded-lg px-2 py-1.5 text-xs font-mono text-white outline-none"
                        >
                          {DEFAULT_ROOMS.map((rn) => (
                            <option key={rn} value={rn}>
                              Room #{rn} {occupiedRoomsSet.has(rn.toLowerCase()) ? '(Occupied)' : '(Vacant ✓)'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => onToggleRoomBookingPaid(rb.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          {rb.paymentStatus === 'Paid' ? 'Mark Unpaid' : '💳 Paid'}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {rb.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => onConfirmRoomBooking(rb.id, pickedRoom)}
                            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black py-2 px-3 rounded-lg cursor-pointer"
                          >
                            ✓ ቦኪንግ አረጋግጥ (Confirm)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onCheckInRoomBooking(rb.id, pickedRoom)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black py-2 px-3 rounded-lg cursor-pointer"
                        >
                          🛏️ ወደ አልጋ መዝግብ (Check In #{pickedRoom})
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelRoomBooking(rb.id)}
                          className="bg-red-950/60 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 text-[11px] font-bold py-2 px-3 rounded-lg cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* SECTION B: ONLINE TABLE & FOOD PRE-ORDER RESERVATIONS */}
      {showTableSection && (
        filteredTableReservations.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-white/10 rounded-xl">
            በአሁኑ ሰዓት ምንም የኦንላይን ቴብል እና ምግብ ቦኪንግ የለም።
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTableReservations.map((tr) => {
              const pickedTable = tablePickMap[tr.id] || tr.assignedTable || 'Table 01';
              const isDone = tr.status === 'Completed' || tr.status === 'Cancelled';

              return (
                <div
                  key={tr.id}
                  className="bg-black/45 border border-white/15 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#f4c22b]">{tr.id}</span>
                        <span
                          className={`text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase ${
                            tr.status === 'Seated' || tr.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : tr.status === 'In Kitchen'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                              : tr.status === 'Confirmed'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : tr.status === 'Cancelled'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {tr.status}
                        </span>
                        {tr.linkedOrderId && (
                          <span className="text-[10px] font-mono bg-orange-950 text-orange-300 px-2 py-0.5 rounded">
                            Kitchen {tr.linkedOrderId}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-white mt-1">
                        {tr.guestName} · <span className="text-stone-300 font-mono text-xs">{tr.partySize} Guests</span>
                      </h4>
                      <p className="text-[11px] text-stone-300 font-mono">
                        📅 {tr.reservationDate} · 🕒 {tr.reservationTime} · {tr.seatingZone}
                        {tr.assignedTable ? ` · ${tr.assignedTable}` : ''}
                      </p>
                      <a href={`tel:${tr.guestPhone}`} className="text-[11px] text-sky-300 hover:underline font-mono inline-flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {tr.guestPhone}
                      </a>
                    </div>

                    {tr.preOrderItems.length > 0 && (
                      <div className="text-right font-mono shrink-0">
                        <span className="text-sm font-black text-[#C1FF00] tabular-nums block">
                          {tr.totalAmount.toLocaleString()} {currency}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          {tr.paymentStatus === 'Paid' ? 'Paid ✓' : 'Pay on Arrival'}
                        </span>
                        {tr.receiptScreenshot && (
                          <button
                            type="button"
                            onClick={() => setReceiptPreview({ url: tr.receiptScreenshot!, title: `${tr.id} · ${tr.guestName}` })}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-sky-300 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> ደረሰኝ እይ
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {tr.preOrderItems.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex flex-wrap gap-1.5 text-[11px]">
                      {tr.preOrderItems.map((it, idx) => (
                        <span key={idx} className="bg-black/60 border border-white/10 px-2 py-0.5 rounded font-semibold">
                          {it.qty} × {it.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {tr.specialRequests && (
                    <p className="text-[11px] text-stone-400 italic bg-white/5 px-2.5 py-1.5 rounded-lg">
                      “{tr.specialRequests}”
                    </p>
                  )}

                  {!isDone && (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono text-stone-400 uppercase shrink-0">
                          Table:
                        </label>
                        <select
                          value={pickedTable}
                          onChange={(e) => setTablePickMap((p) => ({ ...p, [tr.id]: e.target.value }))}
                          className="flex-1 bg-[#181818] border border-white/20 rounded-lg px-2 py-1.5 text-xs font-mono text-white outline-none"
                        >
                          {DEFAULT_TABLES.map((tbl) => (
                            <option key={tbl} value={tbl}>
                              {tbl}
                            </option>
                          ))}
                        </select>
                        {tr.preOrderItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onToggleTableReservationPaid(tr.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold cursor-pointer"
                          >
                            {tr.paymentStatus === 'Paid' ? 'Paid ✓' : '💳 Mark Paid'}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {tr.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => onConfirmTableReservation(tr.id, pickedTable)}
                            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black py-2 px-3 rounded-lg cursor-pointer"
                          >
                            ✓ ቴብል አረጋግጥ ({pickedTable})
                          </button>
                        )}
                        {tr.preOrderItems.length > 0 && !tr.linkedOrderId && (
                          <button
                            type="button"
                            onClick={() => onSendTablePreOrderToKitchen(tr.id, pickedTable)}
                            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black py-2 px-3 rounded-lg cursor-pointer"
                          >
                            🍳 ምግቡን ወደ ኩሽና ላክ
                          </button>
                        )}
                        {tr.status !== 'Seated' && (
                          <button
                            type="button"
                            onClick={() => onUpdateTableStatus(tr.id, 'Seated', pickedTable)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black py-2 px-3 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>እንግዳው ደርሷል (Seated)</span>
                          </button>
                        )}
                        {tr.status === 'Seated' && (
                          <button
                            type="button"
                            onClick={() => onUpdateTableStatus(tr.id, 'Completed', pickedTable)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-2 px-3 rounded-lg cursor-pointer"
                          >
                            ✅ ተጠናቋል (Complete)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onUpdateTableStatus(tr.id, 'Cancelled', pickedTable)}
                          className="bg-red-950/60 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 text-[11px] font-bold py-2 px-3 rounded-lg cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Receipt Preview Lightbox */}
      {receiptPreview && (
        <div
          onClick={() => setReceiptPreview(null)}
          className="fixed inset-0 bg-black/80 z-[9995] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-900 border border-white/20 rounded-2xl max-w-md w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-white">{receiptPreview.title}</span>
              <button
                type="button"
                onClick={() => setReceiptPreview(null)}
                className="p-1 rounded-lg bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={receiptPreview.url}
              alt="Payment receipt"
              className="w-full max-h-[65vh] object-contain rounded-xl bg-black"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
