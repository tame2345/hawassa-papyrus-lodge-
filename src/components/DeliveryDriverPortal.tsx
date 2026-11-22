import React, { useState } from 'react';
import { AssistanceCall, DeliveryDriverState, Order, StaffMember } from '../types';
import { processAndUploadReceiptImage } from '../utils/imageUpload';
import { Bell, Camera, CheckCircle2, Eye, KeyRound, LogOut, MapPin, Navigation, Phone, ShieldCheck, Truck, Upload, X } from 'lucide-react';

interface DeliveryDriverPortalProps {
  currentUser: StaffMember;
  orders: Order[];
  assistanceCalls?: AssistanceCall[];
  driverStates: DeliveryDriverState[];
  currency: string;
  onLogout: () => void;
  onToggleMyDuty: (status: DeliveryDriverState['status']) => void;
  onAcceptPickupOrder: (orderId: string) => void;
  onMarkArrived: (orderId: string) => void;
  onCompleteVerifiedHandover: (
    orderId: string,
    enteredPin: string,
    proofPhotoUrl: string,
    cashCollected: boolean
  ) => boolean;
  onReturnToLodge: (lastOrderId?: string) => void;
  onResolveAlert?: (id: string) => void;
  wifiWidget?: React.ReactNode;
  showToast: (msg: string) => void;
}

export default function DeliveryDriverPortal({
  currentUser,
  orders,
  assistanceCalls = [],
  driverStates,
  currency,
  onLogout,
  onToggleMyDuty,
  onAcceptPickupOrder,
  onMarkArrived,
  onCompleteVerifiedHandover,
  onReturnToLodge,
  onResolveAlert,
  wifiWidget,
  showToast,
}: DeliveryDriverPortalProps) {
  const [pinInput, setPinInput] = useState('');
  const [proofPhoto, setProofPhoto] = useState('');
  const [cashCollectedCheck, setCashCollectedCheck] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [handoverError, setHandoverError] = useState('');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  const myCleanName = (currentUser?.name || '').trim().toLowerCase();
  const myState: DeliveryDriverState =
    driverStates.find((d) => d.staffName.trim().toLowerCase() === myCleanName) || {
      staffName: currentUser.name,
      status: 'available',
      completedTrips: 0,
    };

  const deliveryOrders = orders.filter(
    (o) => o.orderType === 'delivery' && o.status !== 'Cancelled'
  );

  // Orders currently assigned to this courier that are not yet Delivered
  const myActiveOrder = deliveryOrders.find(
    (o) =>
      (o.deliveryDriverName || '').trim().toLowerCase() === myCleanName &&
      o.deliveryStatus !== 'Delivered'
  );

  // Most recent delivered order awaiting Return-to-Lodge confirmation
  const awaitingReturnOrder = !myActiveOrder
    ? deliveryOrders.find(
        (o) =>
          (o.deliveryDriverName || '').trim().toLowerCase() === myCleanName &&
          o.deliveryStatus === 'Delivered' &&
          !o.deliveryReturnedAt
      )
    : undefined;

  // Unassigned delivery orders ready or preparing in kitchen
  const availableQueue = deliveryOrders.filter(
    (o) =>
      o.deliveryStatus !== 'Delivered' &&
      (!o.deliveryDriverName || o.deliveryDriverName.trim() === '')
  );

  const myCompletedOrders = deliveryOrders.filter(
    (o) =>
      (o.deliveryDriverName || '').trim().toLowerCase() === myCleanName &&
      o.deliveryStatus === 'Delivered'
  );

  const totalCashCollectedByMe = myCompletedOrders
    .filter((o) => o.deliveryCashCollected)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    setHandoverError('');
    try {
      const url = await processAndUploadReceiptImage(file);
      setProofPhoto(url);
    } finally {
      setIsUploadingProof(false);
      e.target.value = '';
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myActiveOrder) return;
    setHandoverError('');

    const cleanPin = pinInput.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      setHandoverError('⚠️ ከደንበኛው የተቀበሉትን ትክክለኛ ባለ 4 አሃዝ የርክክብ ኮድ (PIN) ያስገቡ!');
      return;
    }
    if (!proofPhoto) {
      setHandoverError('📸 ለድርጅቱ እና ለደንበኛው እምነት የርክክብ ፎቶ (Proof Photo) ማንሳት ወይም መጫን ግዴታ ነው!');
      return;
    }
    const needsCash = myActiveOrder.payment === 'cash' && myActiveOrder.status !== 'Paid';
    if (needsCash && !cashCollectedCheck) {
      setHandoverError(`💵 ከደንበኛው ${myActiveOrder.total} ${currency} ጥሬ ገንዘብ መቀበልዎን ያረጋግጡ!`);
      return;
    }

    const ok = onCompleteVerifiedHandover(myActiveOrder.id, cleanPin, proofPhoto, needsCash ? cashCollectedCheck : false);
    if (ok) {
      setPinInput('');
      setProofPhoto('');
      setCashCollectedCheck(false);
      setHandoverError('');
    } else {
      setHandoverError('❌ ያስገቡት PIN ከደንበኛው ሚስጥራዊ ኮድ ጋር አልተመሳሰለም! እባክዎ ከደንበኛው እንደገና ይጠይቁ።');
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-20 text-left">
      {/* Header Hero */}
      <div className="papyrus-menu-hero border-b-4 p-5 sm:p-6 rounded-3xl space-y-4 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#f4c22b] shadow-lg shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="hero-gold-badge px-2.5 py-0.5 border font-mono text-[10px] uppercase font-black tracking-widest rounded-full">
                  🛵 DELIVERY COURIER PORTAL
                </span>
                <span className="hero-subglass px-2.5 py-0.5 border rounded-full text-[10px] font-mono font-bold">
                  {currentUser.vehicleType || 'Motorbike'} {currentUser.plateNumber ? `· ${currentUser.plateNumber}` : ''}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white mt-1 tracking-tight">
                የዴሊቨሪ አድራሽ መስኮት <span className="text-[#f4c22b]">· {currentUser.name}</span>
              </h2>
              <p className="text-xs text-white/85 font-mono">
                📍 ቀጠና (Zone): {currentUser.deliveryZone || 'Hawassa'} · 📞 {currentUser.phone || 'Registered'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="hero-logout-btn border px-4 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ውጣ / LOGOUT</span>
          </button>
        </div>

        {/* Duty Readiness Toggle Bar */}
        <div className="hero-subglass border p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-[#f4c22b] font-black uppercase block">
              DUTY READINESS STATUS (የስራ ዝግጁነት ሁኔታ)
            </span>
            <p className="text-xs text-white font-bold mt-0.5">
              {myState.status === 'available'
                ? '🟢 ዝግጁ ነዎት — ማናጀሩና ሲስተሙ አዲስ ትዕዛዝ ሊመድቡልዎ ይችላሉ'
                : myState.status === 'on_delivery'
                ? '🛵 በዴሊቨሪ ጉዞ ላይ ነዎት — ሲጨርሱ ወደ ሎጅ መመለስዎን ያረጋግጡ'
                : '🔴 ከስራ ውጪ (Off Duty) ነዎት — ትዕዛዝ ለመቀበል "ዝግጁ ነኝ" የሚለውን ያብሩ'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onToggleMyDuty('available')}
              disabled={myState.status === 'available'}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                myState.status === 'available'
                  ? 'bg-emerald-500 text-stone-950 border-emerald-300 shadow-md'
                  : 'bg-black/40 text-white border-white/25 hover:bg-emerald-600'
              }`}
            >
              🟢 ዝግጁ ነኝ (Ready)
            </button>
            <button
              type="button"
              onClick={() => onToggleMyDuty('offline')}
              disabled={myState.status === 'offline' || Boolean(myActiveOrder)}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                myState.status === 'offline'
                  ? 'bg-stone-200 text-stone-950 border-white'
                  : 'bg-black/40 text-white/85 border-white/25 hover:bg-red-700 disabled:opacity-40'
              }`}
            >
              🔴 እረፍት / Off
            </button>
          </div>
        </div>
      </div>

      {wifiWidget}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block">የሚጠብቁ ትዕዛዞች (Queue)</span>
          <span className="text-2xl font-mono font-black text-[#b21f1f] tabular-nums">{availableQueue.length}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block">የእኔ ንቁ ጉዞ (Active)</span>
          <span className="text-2xl font-mono font-black text-amber-700 tabular-nums">{myActiveOrder ? '1 Active' : 'None'}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block">ያደረስኳቸው (Delivered)</span>
          <span className="text-2xl font-mono font-black text-emerald-700 tabular-nums">{myCompletedOrders.length}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block">የተሰበሰበ ካሽ (Cash)</span>
          <span className="text-2xl font-mono font-black text-stone-900 tabular-nums">
            {totalCashCollectedByMe} {currency}
          </span>
        </div>
      </div>

      {/* Kitchen Ready Alerts Strictly for Delivery Staff */}
      {(() => {
        const deliveryAlerts = assistanceCalls.filter(
          (c) =>
            c.active !== false &&
            c.targetRole === 'delivery' &&
            (!c.targetWaiter || c.targetWaiter.trim().toLowerCase() === myCleanName)
        );
        if (deliveryAlerts.length === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#b21f1f]" />
                <h3 className="text-xs sm:text-sm font-black text-stone-900">
                  🍲 ከኩሽና የደረሱ የዴሊቨሪ ማንቂያዎች (Kitchen Ready for Delivery)
                </h3>
              </div>
              <span className="text-xs font-mono font-black text-[#b21f1f] tabular-nums">
                {deliveryAlerts.length} Alert{deliveryAlerts.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {deliveryAlerts.map((al) => {
                const ordMatch = al.orderId ? orders.find((o) => o.id === al.orderId) : undefined;
                const canClaim = Boolean(ordMatch && !myActiveOrder && (!ordMatch.deliveryDriverName || ordMatch.deliveryDriverName.trim().toLowerCase() === myCleanName));
                return (
                  <div key={al.id} className="bg-white border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-stone-900">
                        {al.orderId || 'Delivery'} · {al.location} · <span className="font-mono text-stone-500">{al.time}</span>
                      </p>
                      {al.message && <p className="text-[11px] text-stone-700 mt-0.5">{al.message}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canClaim && ordMatch && (
                        <button
                          type="button"
                          onClick={() => {
                            if (myState.status === 'offline') {
                              showToast('⚠️ መጀመሪያ ከላይ "ዝግጁ ነኝ (Ready)" የሚለውን ያብሩ!');
                              return;
                            }
                            onAcceptPickupOrder(ordMatch.id);
                          }}
                          className="bg-[#b21f1f] hover:bg-[#8c1414] text-white text-xs font-black px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          🛵 አንሳና ውሰድ (Pick Up)
                        </button>
                      )}
                      {onResolveAlert && (
                        <button
                          type="button"
                          onClick={() => onResolveAlert(al.id)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          ✓ ተቀብያለሁ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Return To Lodge Confirmation Card (After Delivering) */}
      {awaitingReturnOrder && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block bg-emerald-700 text-white text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase">
              ✓ ORDER {awaitingReturnOrder.id} DELIVERED &amp; PIN VERIFIED
            </span>
            <h3 className="text-base font-black text-stone-900">
              🏁 ትዕዛዙ በትክክል ደርሷል! ወደ ሎጅ ሲመለሱ ከታች ያለውን ቁልፍ ይጫኑ
            </h3>
            <p className="text-xs text-stone-700 font-medium">
              ይህንን ሲጫኑ ለማናጀሩ መመለስዎን ያሳውቃል እንዲሁም ለቀጣይ ትዕዛዝ "ዝግጁ" ይሆናሉ።
            </p>
          </div>
          <button
            type="button"
            onClick={() => onReturnToLodge(awaitingReturnOrder.id)}
            className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md cursor-pointer transition-all"
          >
            🏁 ወደ ሎጅ ተመልሻለሁ — ለቀጣይ ዝግጁ ነኝ
          </button>
        </div>
      )}

      {/* Active Delivery Mission & Trust Verification Handover */}
      {myActiveOrder && (
        <div className="bg-white border-2 border-[#b21f1f] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#b21f1f] text-white font-mono font-black text-xs px-3 py-1 rounded-full">
                  🛵 ACTIVE MISSION · {myActiveOrder.id}
                </span>
                <span className="bg-[#f4c22b] text-stone-950 font-mono font-black text-xs px-2.5 py-1 rounded-full uppercase">
                  {myActiveOrder.deliveryStatus || 'Assigned'}
                </span>
                <span className="bg-stone-100 text-stone-800 font-mono font-bold text-xs px-2.5 py-1 rounded-full">
                  Kitchen: {myActiveOrder.cookingStatus === 'Completed' ? '🍲 Ready ✓' : myActiveOrder.cookingStatus || myActiveOrder.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-stone-900 flex items-center gap-1.5 pt-1">
                <MapPin className="w-5 h-5 text-[#b21f1f] shrink-0" />
                <span>{myActiveOrder.deliveryAddress || myActiveOrder.location}</span>
              </h3>
              {myActiveOrder.deliveryMode === 'partner' && myActiveOrder.deliveryPartnerName && (
                <div className="mt-2 bg-sky-50 border border-sky-300 rounded-xl px-3 py-2 text-xs text-sky-950 flex flex-wrap items-center gap-2">
                  <span className="font-black">🤝 Partner: {myActiveOrder.deliveryPartnerName}</span>
                  {myActiveOrder.deliveryPartnerTrackingCode && (
                    <span className="font-mono font-black bg-sky-700 text-white px-2 py-0.5 rounded text-[10px]">
                      {myActiveOrder.deliveryPartnerTrackingCode}
                    </span>
                  )}
                  {myActiveOrder.deliveryPartnerPhone && (
                    <a href={`tel:${myActiveOrder.deliveryPartnerPhone}`} className="font-mono underline font-bold">
                      📞 {myActiveOrder.deliveryPartnerPhone}
                    </a>
                  )}
                </div>
              )}
              {myActiveOrder.deliveryPhone && (
                <a
                  href={`tel:${myActiveOrder.deliveryPhone}`}
                  className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-mono font-black text-xs px-3 py-1.5 rounded-xl mt-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  ደንበኛው ጋር ደውል: {myActiveOrder.deliveryPhone}
                </a>
              )}
            </div>

            <div className="text-right bg-stone-50 border border-stone-200 rounded-2xl p-3">
              <span className="text-[10px] font-mono uppercase text-stone-500 block font-bold">ጠቅላላ ሂሳብ</span>
              <span className="text-xl font-mono font-black text-[#b21f1f] tabular-nums block">
                {myActiveOrder.total} {currency}
              </span>
              <span
                className={`text-[11px] font-black block ${
                  myActiveOrder.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {myActiveOrder.status === 'Paid'
                  ? '✓ ቀድሞ ተከፍሏል (PAID)'
                  : myActiveOrder.payment === 'cash'
                  ? `💵 ሲደርስ ${myActiveOrder.total} ${currency} ይቀበሉ`
                  : `⏳ ${String(myActiveOrder.payment || '').toUpperCase()} PENDING`}
              </span>
            </div>
          </div>

          {/* Items list */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-1.5">
            <span className="text-[10px] font-mono uppercase font-black text-stone-500 block">የተያዙ ምግብና መጠጦች (ORDER ITEMS):</span>
            <div className="flex flex-wrap gap-2">
              {myActiveOrder.items.map((it, idx) => (
                <span key={idx} className="bg-white border border-stone-300 text-stone-900 font-bold text-xs px-2.5 py-1 rounded-xl">
                  {it.qty} × {it.name}
                </span>
              ))}
            </div>
          </div>

          {/* Step Actions */}
          <div className="flex flex-wrap gap-2.5">
            {(!myActiveOrder.deliveryStatus || myActiveOrder.deliveryStatus === 'Assigned' || myActiveOrder.deliveryStatus === 'Waiting Driver') && (
              <button
                type="button"
                onClick={() => onAcceptPickupOrder(myActiveOrder.id)}
                className="flex-1 min-w-[220px] bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs py-3 px-4 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>🛵 ከኩሽና ተቀብዬ ወጥቻለሁ (Picked Up · On Way)</span>
              </button>
            )}

            {myActiveOrder.deliveryStatus === 'Picked Up' && (
              <button
                type="button"
                onClick={() => onMarkArrived(myActiveOrder.id)}
                className="flex-1 min-w-[220px] bg-sky-600 hover:bg-sky-700 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>📍 ደንበኛው ቦታ ደርሻለሁ (Mark Arrived at Customer)</span>
              </button>
            )}
          </div>

          {/* Customer-Courier-Organization Trust Handover Verification Form */}
          {(myActiveOrder.deliveryStatus === 'Picked Up' || myActiveOrder.deliveryStatus === 'Arrived') && (
            <form
              onSubmit={handleVerifySubmit}
              className="bg-[#FFFDF9] border-2 border-[#f4c22b] rounded-2xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-start gap-2.5 border-b border-amber-200 pb-3">
                <ShieldCheck className="w-6 h-6 text-[#b21f1f] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-stone-900 uppercase">
                    🔐 የደንበኛ እና የድርጅቱ እምነት ማረጋገጫ ርክክብ (Verified Handover)
                  </h4>
                  <p className="text-xs text-stone-700 mt-0.5">
                    ትዕዛዙን ከማስረከብዎ በፊት ደንበኛው ስልኩ ላይ የሚያየውን <strong className="text-[#b21f1f]">ባለ 4 አሃዝ ሚስጥር PIN</strong> ይጠይቁና <strong className="text-[#b21f1f]">የርክክብ ፎቶ</strong> ያንሱ።
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-black uppercase text-[#b21f1f] block mb-1.5">
                    <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                    የደንበኛው ሚስጥር PIN ኮድ (4-Digit Customer PIN) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    inputMode="numeric"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setHandoverError('');
                    }}
                    placeholder="ለምሳሌ፡ 4821"
                    className="w-full bg-white border-2 border-stone-300 focus:border-[#b21f1f] text-stone-950 font-mono text-2xl font-black text-center tracking-[0.5em] py-3 rounded-xl outline-none tabular-nums"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-black uppercase text-[#b21f1f] block">
                    📸 የርክክብ ማረጋገጫ ፎቶ (Proof of Delivery Photo) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="bg-[#b21f1f] hover:bg-[#8c1414] text-white font-black text-xs py-3 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                      <Camera className="w-4 h-4 shrink-0" />
                      <span>{isUploadingProof ? '...' : 'በካሜራ አንሳ'}</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleProofUpload} />
                    </label>
                    <label className="bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 font-black text-xs py-3 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>{isUploadingProof ? '...' : 'ፎቶ ጫን'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
                    </label>
                  </div>
                  {proofPhoto && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 p-2 rounded-xl">
                      <img src={proofPhoto} alt="Delivery proof preview" className="w-14 h-14 rounded-lg object-cover border border-emerald-400" referrerPolicy="no-referrer" />
                      <span className="text-xs font-black text-emerald-900 flex-1">✓ የርክክብ ፎቶ ተያይዟል</span>
                      <button type="button" onClick={() => setProofPhoto('')} className="text-red-600 text-xs font-black cursor-pointer px-2 py-1">አስወግድ</button>
                    </div>
                  )}
                </div>
              </div>

              {myActiveOrder.payment === 'cash' && myActiveOrder.status !== 'Paid' && (
                <label className="flex items-center gap-2.5 bg-amber-50 border border-amber-300 rounded-xl p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cashCollectedCheck}
                    onChange={(e) => {
                      setCashCollectedCheck(e.target.checked);
                      setHandoverError('');
                    }}
                    className="w-5 h-5 accent-[#b21f1f] cursor-pointer"
                  />
                  <span className="text-xs font-black text-stone-900">
                    💵 ከደንበኛው <span className="text-[#b21f1f] font-mono">{myActiveOrder.total} {currency}</span> ጥሬ ገንዘብ በሙሉ ተቀብያለሁ (Cash Collected for Lodge Cashier)
                  </span>
                </label>
              )}

              {handoverError && (
                <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-black px-3.5 py-2.5 rounded-xl">
                  {handoverError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>✅ በPIN እና በፎቶ አረጋግጥና አስረክብ (Verify &amp; Complete Handover)</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Available Orders Queue Ready / Preparing */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#b21f1f] uppercase block">AVAILABLE DELIVERY QUEUE</span>
            <h3 className="text-sm sm:text-base font-black text-stone-900">
              📦 ለዴሊቨሪ የቀረቡ ትዕዛዞች (Waiting / Kitchen Ready Orders)
            </h3>
          </div>
          <span className="font-mono text-xs font-black bg-stone-100 text-stone-800 px-3 py-1 rounded-full border border-stone-200 tabular-nums">
            {availableQueue.length} Orders
          </span>
        </div>

        {availableQueue.length === 0 ? (
          <div className="py-10 text-center text-stone-500 text-xs font-mono border border-dashed border-stone-200 rounded-2xl">
            በአሁኑ ሰዓት ያልተመደበ አዲስ የዴሊቨሪ ትዕዛዝ የለም።
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {availableQueue.map((ord) => {
              const isKitchenReady = ord.cookingStatus === 'Completed' || ord.status === 'Completed';
              return (
                <div
                  key={ord.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isKitchenReady ? 'bg-emerald-50/70 border-emerald-300' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#b21f1f]">{ord.id}</span>
                        <span
                          className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                            isKitchenReady
                              ? 'bg-emerald-700 text-white'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isKitchenReady ? '🍲 ኩሽና ዝግጁ ነው (READY)' : '⏳ እየተሰራ ነው (Preparing)'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-stone-900 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#b21f1f] shrink-0" />
                        {ord.deliveryAddress || ord.location}
                      </p>
                      {ord.deliveryMode === 'partner' && ord.deliveryPartnerName && (
                        <p className="text-[10px] font-mono font-black text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-lg inline-block mt-1">
                          🤝 Partner: {ord.deliveryPartnerName} {ord.deliveryPartnerTrackingCode ? `(${ord.deliveryPartnerTrackingCode})` : ''}
                        </p>
                      )}
                      {ord.deliveryPhone && (
                        <a
                          href={`tel:${ord.deliveryPhone}`}
                          className="text-[11px] font-mono font-bold text-[#b21f1f] hover:underline mt-0.5 inline-flex items-center gap-1"
                        >
                          📞 {ord.deliveryPhone}
                        </a>
                      )}
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-stone-900 tabular-nums">{ord.total} {currency}</span>
                      <span className="text-[10px] text-stone-600 block uppercase">
                        {ord.status === 'Paid' ? 'Paid ✓' : `${ord.payment}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-700 flex flex-wrap gap-1.5">
                    {ord.items.map((it, idx) => (
                      <span key={idx} className="bg-white border border-stone-200 px-2 py-0.5 rounded-lg font-semibold">
                        {it.qty} × {it.name}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(myActiveOrder)}
                    onClick={() => {
                      if (myState.status === 'offline') {
                        showToast('⚠️ መጀመሪያ ከላይ "ዝግጁ ነኝ (Ready)" የሚለውን ያብሩ!');
                        return;
                      }
                      onAcceptPickupOrder(ord.id);
                    }}
                    className="w-full bg-[#b21f1f] hover:bg-[#8c1414] disabled:bg-stone-300 disabled:text-stone-500 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer transition-all"
                  >
                    {myActiveOrder
                      ? '⏳ መጀመሪያ ያለዎትን ትዕዛዝ ያስረክቡ'
                      : '🛵 ትዕዛዙን ተቀብዬ አደርሳለሁ (Accept & Deliver)'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Trips Log */}
      {myCompletedOrders.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-3 shadow-sm">
          <h3 className="text-sm font-black text-stone-900 border-b border-stone-200 pb-2">
            ✅ በተሳካ ሁኔታ ያደረሷቸው ትዕዛዞች (My Delivered History)
          </h3>
          <div className="space-y-2.5">
            {myCompletedOrders.slice(0, 12).map((ord) => (
              <div key={ord.id} className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-[#b21f1f]">{ord.id}</span>
                    <span className="font-bold text-stone-900">{ord.deliveryAddress || ord.location}</span>
                    {ord.deliveryVerifiedByPin && (
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        🔐 PIN Verified
                      </span>
                    )}
                    {ord.customerConfirmedReceipt && (
                      <span className="bg-sky-100 text-sky-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-sky-200">
                        🎉 Customer Confirmed
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                    Delivered: {ord.deliveryDeliveredAt || ord.time}
                    {ord.deliveryReturnedAt ? ` · Returned: ${ord.deliveryReturnedAt}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-stone-900 tabular-nums">{ord.total} {currency}</span>
                  {ord.deliveryProofPhoto && (
                    <button
                      type="button"
                      onClick={() => setPreviewProofUrl(ord.deliveryProofPhoto!)}
                      className="text-[10px] font-mono font-bold bg-white border border-stone-300 px-2.5 py-1 rounded-lg hover:bg-stone-100 cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> ፎቶ እይ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proof Photo Lightbox */}
      {previewProofUrl && (
        <div
          onClick={() => setPreviewProofUrl(null)}
          className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3 text-stone-900 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-xs font-black">📸 Proof of Delivery Photo</span>
              <button type="button" onClick={() => setPreviewProofUrl(null)} className="p-1 rounded-lg bg-stone-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={previewProofUrl} alt="Delivery proof" className="w-full max-h-[65vh] object-contain rounded-xl bg-stone-100" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
    </div>
  );
}
