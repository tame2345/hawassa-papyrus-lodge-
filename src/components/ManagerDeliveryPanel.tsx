import React, { useState } from 'react';
import { DeliveryDriverState, DeliveryPartnerCompany, Order, StaffMember } from '../types';
import { processAndUploadReceiptImage } from '../utils/imageUpload';
import { Building2, Camera, CheckCircle2, Eye, Handshake, MapPin, Phone, Plus, Share2, ShieldCheck, Trash2, Truck, Upload, X } from 'lucide-react';

interface ManagerDeliveryPanelProps {
  staff: StaffMember[];
  orders: Order[];
  currency: string;
  driverStates: DeliveryDriverState[];
  partners: DeliveryPartnerCompany[];
  onRegisterDriver: (member: StaffMember) => void;
  onToggleDriverDuty: (staffName: string, status: DeliveryDriverState['status']) => void;
  onRemoveDriver: (staffName: string) => void;
  onAssignDriverToOrder: (orderId: string, driver: StaffMember) => void;
  onMarkDriverReturned: (staffName: string, orderId?: string) => void;
  onAddPartner: (partner: DeliveryPartnerCompany) => void;
  onTogglePartnerActive: (partnerId: string) => void;
  onDeletePartner: (partnerId: string) => void;
  onAssignPartnerToOrder: (orderId: string, partner: DeliveryPartnerCompany) => void;
  onUpdatePartnerDeliveryStage: (
    orderId: string,
    status: 'Picked Up' | 'Arrived' | 'Delivered',
    proofPhotoUrl?: string,
    cashCollected?: boolean
  ) => void;
  showToast: (msg: string) => void;
}

export default function ManagerDeliveryPanel({
  staff,
  orders,
  currency,
  driverStates,
  partners,
  onRegisterDriver,
  onToggleDriverDuty,
  onRemoveDriver,
  onAssignDriverToOrder,
  onMarkDriverReturned,
  onAddPartner,
  onTogglePartnerActive,
  onDeletePartner,
  onAssignPartnerToOrder,
  onUpdatePartnerDeliveryStage,
  showToast,
}: ManagerDeliveryPanelProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorbike 🏍️');
  const [plateNumber, setPlateNumber] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('Hawassa Central & Piazza');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('hawassa');
  const [photo, setPhoto] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});
  const [dispatchTabByOrder, setDispatchTabByOrder] = useState<Record<string, 'internal' | 'partner'>>({});
  const [partnerSelections, setPartnerSelections] = useState<Record<string, string>>({});
  const [partnerProofPhotos, setPartnerProofPhotos] = useState<Record<string, string>>({});
  const [partnerCashChecks, setPartnerCashChecks] = useState<Record<string, boolean>>({});
  const [uploadingPartnerOrderId, setUploadingPartnerOrderId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'active' | 'delivered' | 'all'>('active');
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Ethiopian Partner Collaboration Add Form
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);
  const [pNameAm, setPNameAm] = useState('');
  const [pNameEn, setPNameEn] = useState('');
  const [pServiceType, setPServiceType] = useState<DeliveryPartnerCompany['serviceType']>('food_courier');
  const [pPhone, setPPhone] = useState('');
  const [pWhatsapp, setPWhatsapp] = useState('');
  const [pCities, setPCities] = useState('Hawassa, Addis Ababa');
  const [pFee, setPFee] = useState('120');
  const [pCommission, setPCommission] = useState('12');
  const [pNotes, setPNotes] = useState('');

  const drivers = staff.filter(
    (s) =>
      (s.role || '').toLowerCase() === 'delivery' ||
      (s.accessPrivilege || '').toLowerCase() === 'delivery'
  );

  const deliveryOrders = orders.filter(
    (o) => o.orderType === 'delivery' && o.status !== 'Cancelled'
  );

  const activeDeliveryOrders = deliveryOrders.filter((o) => o.deliveryStatus !== 'Delivered');
  const deliveredOrders = deliveryOrders.filter((o) => o.deliveryStatus === 'Delivered');
  const displayedOrders =
    orderFilter === 'active'
      ? activeDeliveryOrders
      : orderFilter === 'delivered'
      ? deliveredOrders
      : deliveryOrders;

  const getDriverState = (staffName: string): DeliveryDriverState => {
    const clean = staffName.trim().toLowerCase();
    return (
      driverStates.find((d) => d.staffName.trim().toLowerCase() === clean) || {
        staffName,
        status: 'available',
        completedTrips: 0,
      }
    );
  };

  const readyDriversCount = drivers.filter((d) => getDriverState(d.name).status === 'available').length;
  const onRoadDriversCount = drivers.filter((d) => getDriverState(d.name).status === 'on_delivery').length;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await processAndUploadReceiptImage(file);
      setPhoto(url);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedPin = pin.trim();
    const trimmedUser = (username.trim() || trimmedName.toLowerCase().replace(/\s+/g, '_')).toLowerCase();
    const trimmedPass = password.trim() || trimmedPin;

    if (!trimmedName || !trimmedPhone) {
      showToast('⚠️ እባክዎ የዴሊቨሪ ሰራተኛውን ስምና ስልክ ቁጥር ያስገቡ።');
      return;
    }
    if (!/^\d{4}$/.test(trimmedPin)) {
      showToast('⚠️ የመግቢያ PIN ትክክለኛ ባለ 4 አሃዝ ቁጥር መሆን አለበት (e.g. 4455)።');
      return;
    }
    if (staff.some((s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      showToast('⚠️ በዚህ ስም የተመዘገበ ሰራተኛ ቀድሞውኑ አለ። እባክዎ ሙሉ ስም ይለዩ።');
      return;
    }

    const newMember: StaffMember = {
      name: trimmedName,
      role: 'delivery',
      accessPrivilege: 'delivery',
      pin: trimmedPin,
      active: true,
      phone: trimmedPhone,
      photo:
        photo ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      hireDate: new Date().toISOString().split('T')[0],
      vehicleType,
      plateNumber: plateNumber.trim() || 'No Plate',
      deliveryZone: deliveryZone.trim() || 'Hawassa',
      info: `Delivery Courier · ${vehicleType}${plateNumber.trim() ? ` (${plateNumber.trim()})` : ''}`,
      username: trimmedUser,
      password: trimmedPass,
      securityAnswer: securityAnswer.trim() || 'hawassa',
    };

    onRegisterDriver(newMember);
    setName('');
    setPhone('');
    setPlateNumber('');
    setPin('');
    setUsername('');
    setPassword('');
    setPhoto('');
  };

  const handleAddPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNameEn.trim() && !pNameAm.trim()) {
      showToast('⚠️ እባክዎ የዴሊቨሪ ድርጅቱን ስም ያስገቡ።');
      return;
    }
    if (!pPhone.trim()) {
      showToast('⚠️ እባክዎ የድርጅቱን ስልክ ቁጥር ያስገቡ።');
      return;
    }
    const newPartner: DeliveryPartnerCompany = {
      id: `et-partner-${Date.now()}`,
      nameAm: pNameAm.trim() || pNameEn.trim(),
      nameEn: pNameEn.trim() || pNameAm.trim(),
      serviceType: pServiceType,
      coverageCities: pCities.split(',').map((c) => c.trim()).filter(Boolean).join(', ') || 'Hawassa',
      phone: pPhone.trim(),
      whatsapp: (pWhatsapp.trim() || pPhone.trim()).replace(/[^\d+]/g, ''),
      baseFeeBirr: Math.max(0, Number(pFee) || 120),
      commissionPercent: Math.max(0, Math.min(50, Number(pCommission) || 10)),
      active: true,
      notes: pNotes.trim() || 'Ethiopian Partner Logistics Network',
    };
    onAddPartner(newPartner);
    setPNameAm('');
    setPNameEn('');
    setPPhone('');
    setPWhatsapp('');
    setPNotes('');
    setShowAddPartnerForm(false);
  };

  const activePartners = partners.filter((p) => p.active);

  const buildPartnerDispatchSlip = (ord: Order, partner?: DeliveryPartnerCompany) => {
    const pName = ord.deliveryPartnerName || partner?.nameEn || 'Delivery Partner';
    return [
      `HAWASSA PAPYRUS LODGE — PARTNER DISPATCH`,
      `Order: ${ord.id}`,
      `Partner: ${pName} (${ord.deliveryPartnerTrackingCode || 'HPL-PRT'})`,
      `Address: ${ord.deliveryAddress || ord.location}`,
      `Customer Phone: ${ord.deliveryPhone || 'N/A'}`,
      `Items: ${ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}`,
      `Amount: ${ord.total} ${currency} (${ord.status === 'Paid' ? 'PAID' : 'COLLECT ON DELIVERY'})`,
      `Customer Handover PIN: ${ord.deliveryPinCode || 'Required'}`,
    ].join('\n');
  };

  const copyPartnerDispatchSlip = (ord: Order, partner?: DeliveryPartnerCompany) => {
    const text = buildPartnerDispatchSlip(ord, partner);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast('📋 የዴሊቨሪ ካምፓኒ Dispatch Slip ተቀድቷል!'),
        () => showToast('✅ Dispatch slip prepared for partner courier!')
      );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#121212] border border-white/10 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-white/50 uppercase block">የተመዘገቡ አድራሾች (DRIVERS)</span>
            <span className="text-2xl font-mono font-black text-white tabular-nums">{drivers.length}</span>
          </div>
          <span className="text-2xl">🛵</span>
        </div>
        <div className="bg-emerald-950/25 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-emerald-300 uppercase block">ዝግጁ የሆኑ (READY NOW)</span>
            <span className="text-2xl font-mono font-black text-emerald-400 tabular-nums">{readyDriversCount}</span>
          </div>
          <span className="text-2xl">🟢</span>
        </div>
        <div className="bg-amber-950/25 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-amber-300 uppercase block">በመንገድ / ንቁ ትዕዛዝ</span>
            <span className="text-2xl font-mono font-black text-amber-400 tabular-nums">
              {onRoadDriversCount} / {activeDeliveryOrders.length}
            </span>
          </div>
          <span className="text-2xl">📦</span>
        </div>
        <div className="bg-sky-950/25 border border-sky-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-sky-300 uppercase block">በPIN የተረጋገጡ (VERIFIED)</span>
            <span className="text-2xl font-mono font-black text-sky-400 tabular-nums">
              {deliveredOrders.filter((o) => o.deliveryVerifiedByPin).length}
            </span>
          </div>
          <span className="text-2xl">🔐</span>
        </div>
      </div>

      {/* Main Split: Driver Registration + Live Fleet + Dispatch Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Driver Registration Form */}
        <div className="lg:col-span-4 bg-[#121212] border border-white/10 p-5 rounded-2xl space-y-4">
          <div className="border-b border-white/10 pb-2.5">
            <span className="text-[9px] font-mono text-yellow-400 font-bold uppercase tracking-widest block">
              COURIER REGISTRATION
            </span>
            <h3 className="text-sm font-black text-white uppercase mt-0.5 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-yellow-400" />
              የዴሊቨሪ ሰራተኛ መመዝገቢያ
            </h3>
            <p className="text-[11px] text-white/60 mt-1">
              ለደንበኞች ትዕዛዝ የሚያደርሱ የሞተር/ባጃጅ/መኪና አድራሾችን እዚህ ይመዝግቡ።
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">ሙሉ ስም (Full Name) *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ለምሳሌ፡ አቤል ተስፋዬ"
                className="w-full bg-[#181818] border border-white/15 text-white text-xs font-bold p-2.5 rounded-lg outline-none focus:border-yellow-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">ስልክ ቁጥር (Phone) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full bg-[#181818] border border-white/15 text-white font-mono text-xs font-bold p-2.5 rounded-lg outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">4-Digit PIN *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4455"
                  className="w-full bg-[#181818] border border-white/15 text-yellow-300 font-mono text-xs font-black p-2.5 rounded-lg outline-none focus:border-yellow-400 text-center tracking-widest"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">የመጓጓዣ አይነት (Vehicle)</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 text-white text-xs font-bold p-2.5 rounded-lg outline-none focus:border-yellow-400"
                >
                  <option value="Motorbike 🏍️">ሞተር ሳይክል (Motorbike)</option>
                  <option value="Bajaj / TukTuk 🛺">ባጃጅ (Bajaj)</option>
                  <option value="Van / Car 🚐">መኪና (Car / Van)</option>
                  <option value="Bicycle 🚲">ብስክሌት (Bicycle)</option>
                  <option value="On Foot 🚶">በእግር / ቅርብ አካባቢ</option>
                </select>
              </div>
              <div>
                <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">የሰሌዳ ቁጥር (Plate #)</label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="ET-3-B1290"
                  className="w-full bg-[#181818] border border-white/15 text-white font-mono text-xs font-bold p-2.5 rounded-lg outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">የስራ ቀጠና (Delivery Zone)</label>
              <input
                type="text"
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value)}
                placeholder="Hawassa Piazza, Tabor, Lakefront..."
                className="w-full bg-[#181818] border border-white/15 text-white text-xs font-bold p-2.5 rounded-lg outline-none focus:border-yellow-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="abel_deliv"
                  className="w-full bg-[#181818] border border-white/15 text-white font-mono text-xs p-2.5 rounded-lg outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Pass123!"
                  className="w-full bg-[#181818] border border-white/15 text-white font-mono text-xs p-2.5 rounded-lg outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[9.5px] font-mono text-white/60 uppercase block mb-1">የመመለሻ ጥያቄ መልስ (Security City)</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="hawassa"
                className="w-full bg-[#181818] border border-white/15 text-white text-xs p-2 rounded-lg outline-none focus:border-yellow-400"
              />
            </div>

            {/* Courier Photo Capture / Upload */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-mono text-white/60 uppercase block">የአድራሹ ፎቶ (Courier Photo)</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="bg-[#181818] hover:bg-white/10 border border-dashed border-yellow-400/40 text-yellow-300 text-[10px] font-mono font-bold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? '...' : 'ካሜራ (Camera)'}</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <label className="bg-[#181818] hover:bg-white/10 border border-dashed border-white/25 text-white text-[10px] font-mono font-bold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? '...' : 'ፋይል ጫን (Upload)'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              {photo && (
                <div className="flex items-center gap-2.5 bg-black/50 p-2 rounded-lg border border-emerald-500/30">
                  <img src={photo} alt="Courier" className="w-10 h-10 rounded-full object-cover border border-emerald-400" referrerPolicy="no-referrer" />
                  <span className="text-[10px] text-emerald-300 font-bold flex-1">✓ ፎቶ ተዘጋጅቷል</span>
                  <button type="button" onClick={() => setPhoto('')} className="text-xs text-red-400 hover:text-red-300 cursor-pointer font-bold">✕</button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-yellow-400 hover:bg-white text-black font-mono text-xs uppercase font-black tracking-wider rounded-xl cursor-pointer transition-all shadow-md"
            >
              🛵 ዴሊቨሪ አድራሽ መዝግብ (REGISTER DRIVER)
            </button>
          </form>
        </div>

        {/* Right: Live Driver Fleet + Dispatch & Trust Audit */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Courier Roster */}
          <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">
                  ACTIVE COURIER ROSTER
                </span>
                <h3 className="text-sm font-black text-white uppercase mt-0.5">
                  🟢 ዝግጁ የሆኑ እና በመስክ ላይ ያሉ የዴሊቨሪ ሰዎች (Live Fleet)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold tabular-nums">
                {readyDriversCount} Ready / {drivers.length} Total
              </span>
            </div>

            {drivers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/50 text-xs font-mono">
                እስካሁን የተመዘገበ የዴሊቨሪ ሰራተኛ የለም — በግራ በኩል ባለው ቅጽ ይመዝግቡ።
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {drivers.map((drv) => {
                  const st = getDriverState(drv.name);
                  const isReady = st.status === 'available';
                  const isOnRoad = st.status === 'on_delivery';
                  return (
                    <div
                      key={drv.name}
                      className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                        isReady
                          ? 'bg-emerald-950/15 border-emerald-500/30'
                          : isOnRoad
                          ? 'bg-amber-950/15 border-amber-500/35'
                          : 'bg-black/40 border-white/10 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={drv.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={drv.name}
                            className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{drv.name}</p>
                            <p className="text-[10px] font-mono text-yellow-300 font-bold truncate">
                              {drv.vehicleType || 'Motorbike'} {drv.plateNumber ? `· ${drv.plateNumber}` : ''}
                            </p>
                            <p className="text-[10px] font-mono text-white/60 truncate">
                              📍 {drv.deliveryZone || 'Hawassa'} · PIN: <span className="text-white font-bold">{drv.pin}</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase shrink-0 border ${
                            isReady
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isOnRoad
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-white/10 text-white/60 border-white/15'
                          }`}
                        >
                          {isReady ? '🟢 ዝግጁ (READY)' : isOnRoad ? '🛵 በጉዞ (ON TRIP)' : '⚫ ከስራ ውጪ'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] font-mono">
                        <div className="flex items-center gap-3 text-white/75">
                          <a href={`tel:${drv.phone}`} className="text-sky-300 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {drv.phone || 'N/A'}
                          </a>
                          <span className="tabular-nums text-white/60">
                            Trips: <strong className="text-white">{st.completedTrips || 0}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isOnRoad ? (
                            <button
                              type="button"
                              onClick={() => onMarkDriverReturned(drv.name, st.activeOrderId)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-2.5 py-1 rounded text-[9px] uppercase cursor-pointer"
                            >
                              🏁 ተመለሰ / Ready
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onToggleDriverDuty(drv.name, isReady ? 'offline' : 'available')}
                              className="bg-white/10 hover:bg-white/20 text-white font-bold px-2.5 py-1 rounded text-[9px] uppercase cursor-pointer"
                            >
                              {isReady ? 'Set Offline' : 'Set Ready'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveDriver(drv.name)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded cursor-pointer"
                            title="Remove Driver"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dispatch & Trust Verification Ledger */}
          <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[9px] font-mono text-sky-400 font-bold uppercase tracking-widest block">
                  DISPATCH & CUSTOMER-COURIER TRUST AUDIT
                </span>
                <h3 className="text-sm font-black text-white uppercase mt-0.5 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-sky-400" />
                  የዴሊቨሪ ትዕዛዞች ስርጭት እና የርክክብ ማረጋገጫ
                </h3>
              </div>

              <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 font-mono text-[10px] gap-1">
                {(['active', 'delivered', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOrderFilter(f)}
                    className={`px-2.5 py-1 rounded uppercase font-bold cursor-pointer ${
                      orderFilter === f ? 'bg-yellow-400 text-black' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {f === 'active'
                      ? `ንቁ (${activeDeliveryOrders.length})`
                      : f === 'delivered'
                      ? `የደረሱ (${deliveredOrders.length})`
                      : `ሁሉም (${deliveryOrders.length})`}
                  </button>
                ))}
              </div>
            </div>

            {displayedOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/50 text-xs font-mono">
                በዚህ ማጣሪያ ውስጥ ምንም የዴሊቨሪ ትዕዛዝ አልተገኘም።
              </div>
            ) : (
              <div className="space-y-3">
                {displayedOrders.map((ord) => {
                  const stage = ord.deliveryStatus || 'Waiting Driver';
                  const kitchenStage = ord.cookingStatus || ord.status;
                  const selectedName = assignSelections[ord.id] || ord.deliveryDriverName || '';

                  return (
                    <div
                      key={ord.id}
                      className={`p-4 rounded-xl border space-y-3 ${
                        stage === 'Delivered'
                          ? 'bg-emerald-950/15 border-emerald-500/30'
                          : kitchenStage === 'Completed'
                          ? 'bg-amber-950/15 border-yellow-400/40'
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-yellow-300">{ord.id}</span>
                            <span className="text-[10px] font-mono bg-white/10 text-white px-2 py-0.5 rounded uppercase">
                              Kitchen: {kitchenStage === 'Completed' ? '🍲 Ready ✓' : kitchenStage}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase border ${
                                stage === 'Delivered'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : stage === 'Arrived' || stage === 'Picked Up'
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  : stage === 'Assigned'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-red-500/20 text-red-300 border-red-500/40'
                              }`}
                            >
                              Delivery: {stage}
                            </span>
                            {ord.deliveryPinCode && (
                              <span className="text-[10px] font-mono font-black bg-[#7A1212] text-[#F4C22B] border border-[#F4C22B]/50 px-2 py-0.5 rounded tabular-nums">
                                🔐 Handover PIN: {ord.deliveryPinCode}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-white flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                              {ord.deliveryAddress || ord.location}
                            </span>
                            {ord.deliveryPhone && (
                              <a href={`tel:${ord.deliveryPhone}`} className="text-sky-300 font-mono hover:underline flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {ord.deliveryPhone}
                              </a>
                            )}
                          </p>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-sm font-black text-white tabular-nums block">
                            {ord.total} {currency}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              ord.status === 'Paid' ? 'text-emerald-400' : 'text-amber-300'
                            }`}
                          >
                            {ord.status === 'Paid' ? '✓ PAID' : `${String(ord.payment || 'cash').toUpperCase()} (${ord.status})`}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-white/75 bg-black/30 p-2.5 rounded-lg border border-white/5 flex flex-wrap gap-2">
                        {ord.items.map((it, idx) => (
                          <span key={idx} className="bg-white/5 px-2 py-0.5 rounded font-bold">
                            {it.qty} × {it.name}
                          </span>
                        ))}
                      </div>

                      {/* Dispatch Assign Bar (Internal Fleet OR Ethiopian Delivery Partner Company) OR Trust Verification Audit Strip */}
                      {stage !== 'Delivered' ? (
                        <div className="space-y-2.5 pt-1 border-t border-white/10">
                          {ord.deliveryMode === 'partner' && ord.deliveryPartnerName && (
                            <div className="bg-sky-950/35 border border-sky-500/40 rounded-xl p-3 space-y-2.5 text-[11px]">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <span className="font-black text-sky-300 flex items-center gap-1.5">
                                    <Handshake className="w-3.5 h-3.5" />
                                    Partner Dispatch: {ord.deliveryPartnerName}
                                  </span>
                                  <span className="font-mono text-[10px] text-white/75 block">
                                    Waybill: <strong className="text-yellow-300">{ord.deliveryPartnerTrackingCode}</strong> · Tel: {ord.deliveryPartnerPhone || 'N/A'} · Fee: {ord.deliveryPartnerFee ?? 0} {currency}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => copyPartnerDispatchSlip(ord, partners.find((p) => p.id === ord.deliveryPartnerId))}
                                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                                  >
                                    <Share2 className="w-3 h-3" /> Copy Slip
                                  </button>
                                  {(() => {
                                    const matchedPartner = partners.find((p) => p.id === ord.deliveryPartnerId);
                                    const waRaw = (matchedPartner?.whatsapp || ord.deliveryPartnerPhone || '').replace(/[^\d]/g, '');
                                    if (!waRaw) return null;
                                    const waNum = waRaw.startsWith('0') ? `251${waRaw.slice(1)}` : waRaw;
                                    const slipText = buildPartnerDispatchSlip(ord, matchedPartner);
                                    return (
                                      <a
                                        href={`https://wa.me/${waNum}?text=${encodeURIComponent(slipText)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                                      >
                                        WhatsApp
                                      </a>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Partner Delivery Lifecycle Progression Controls */}
                              <div className="pt-2 border-t border-sky-400/20 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onUpdatePartnerDeliveryStage(ord.id, 'Picked Up')}
                                    className={`text-[10px] font-mono font-black px-2.5 py-1.5 rounded-lg cursor-pointer border transition-all ${
                                      stage === 'Picked Up'
                                        ? 'bg-sky-400 text-black border-sky-300'
                                        : 'bg-black/40 hover:bg-white/10 text-sky-200 border-sky-500/30'
                                    }`}
                                  >
                                    📦 1. Picked Up (ተረክቧል)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onUpdatePartnerDeliveryStage(ord.id, 'Arrived')}
                                    className={`text-[10px] font-mono font-black px-2.5 py-1.5 rounded-lg cursor-pointer border transition-all ${
                                      stage === 'Arrived'
                                        ? 'bg-amber-400 text-black border-amber-300'
                                        : 'bg-black/40 hover:bg-white/10 text-amber-200 border-amber-500/30'
                                    }`}
                                  >
                                    📍 2. Arrived (ደርሷል)
                                  </button>
                                  <label className="text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer flex items-center gap-1">
                                    <Camera className="w-3 h-3 text-yellow-300" />
                                    <span>
                                      {uploadingPartnerOrderId === ord.id
                                        ? 'Uploading...'
                                        : partnerProofPhotos[ord.id]
                                        ? '✓ Proof Photo Attached'
                                        : '📸 Proof Photo (Optional)'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploadingPartnerOrderId(ord.id);
                                        try {
                                          const url = await processAndUploadReceiptImage(file);
                                          setPartnerProofPhotos((prev) => ({ ...prev, [ord.id]: url }));
                                        } finally {
                                          setUploadingPartnerOrderId(null);
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </label>
                                  {partnerProofPhotos[ord.id] && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLightboxPhoto({
                                          url: partnerProofPhotos[ord.id],
                                          title: `Partner Proof Draft — ${ord.id}`,
                                        })
                                      }
                                      className="text-[10px] font-mono text-sky-300 underline cursor-pointer"
                                    >
                                      Preview
                                    </button>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  {ord.payment === 'cash' && ord.status !== 'Paid' ? (
                                    <label className="flex items-center gap-2 text-[10px] font-mono text-amber-200 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(partnerCashChecks[ord.id])}
                                        onChange={(e) =>
                                          setPartnerCashChecks((prev) => ({ ...prev, [ord.id]: e.target.checked }))
                                        }
                                        className="w-4 h-4 accent-emerald-400 cursor-pointer"
                                      />
                                      <span>💵 Partner Collected {ord.total} {currency} Cash</span>
                                    </label>
                                  ) : (
                                    <span className="text-[10px] font-mono text-white/55">
                                      ✅ Payment cleared / Customer receives live updates
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={uploadingPartnerOrderId === ord.id}
                                    onClick={() => {
                                      onUpdatePartnerDeliveryStage(
                                        ord.id,
                                        'Delivered',
                                        partnerProofPhotos[ord.id],
                                        Boolean(partnerCashChecks[ord.id])
                                      );
                                      setPartnerProofPhotos((prev) => {
                                        const next = { ...prev };
                                        delete next[ord.id];
                                        return next;
                                      });
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-mono font-black text-[10px] px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    3. Mark Partner Delivered
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                            <button
                              type="button"
                              onClick={() => setDispatchTabByOrder((prev) => ({ ...prev, [ord.id]: 'internal' }))}
                              className={`px-2.5 py-1 rounded-md font-black cursor-pointer border ${
                                (dispatchTabByOrder[ord.id] || (ord.deliveryMode === 'partner' ? 'partner' : 'internal')) === 'internal'
                                  ? 'bg-yellow-400 text-black border-yellow-300'
                                  : 'bg-black/40 text-white/70 border-white/10'
                              }`}
                            >
                              🛵 የሎጁ አድራሽ (Internal Fleet)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDispatchTabByOrder((prev) => ({ ...prev, [ord.id]: 'partner' }))}
                              className={`px-2.5 py-1 rounded-md font-black cursor-pointer border ${
                                (dispatchTabByOrder[ord.id] || (ord.deliveryMode === 'partner' ? 'partner' : 'internal')) === 'partner'
                                  ? 'bg-sky-400 text-black border-sky-300'
                                  : 'bg-black/40 text-white/70 border-white/10'
                              }`}
                            >
                              🤝 የኢትዮጵያ ዴሊቨሪ ካምፓኒ (Partner)
                            </button>
                          </div>

                          {(dispatchTabByOrder[ord.id] || (ord.deliveryMode === 'partner' ? 'partner' : 'internal')) === 'internal' ? (
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                              <select
                                value={selectedName}
                                onChange={(e) => setAssignSelections((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                                className="flex-1 bg-[#181818] border border-white/20 text-white text-xs font-bold p-2 rounded-lg outline-none focus:border-yellow-400"
                              >
                                <option value="">-- ዝግጁ የዴሊቨሪ አድራሽ ይምረጡ (Select Courier) --</option>
                                {drivers.map((drv) => {
                                  const st = getDriverState(drv.name);
                                  return (
                                    <option key={drv.name} value={drv.name}>
                                      {st.status === 'available' ? '🟢' : st.status === 'on_delivery' ? '🛵' : '⚫'} {drv.name} ({drv.vehicleType || 'Motorbike'}) — {drv.phone}
                                    </option>
                                  );
                                })}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const driverObj = drivers.find((d) => d.name === selectedName);
                                  if (!driverObj) {
                                    showToast('⚠️ እባክዎ መጀመሪያ የዴሊቨሪ አድራሽ ይምረጡ።');
                                    return;
                                  }
                                  onAssignDriverToOrder(ord.id, driverObj);
                                }}
                                className="bg-yellow-400 hover:bg-white text-black font-mono font-black text-xs px-4 py-2 rounded-lg uppercase cursor-pointer shrink-0"
                              >
                                {ord.deliveryDriverName ? '🔄 አድራሽ ቀይር (Reassign)' : '🛵 ለአድራሽ መድብ (Dispatch)'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                              <select
                                value={partnerSelections[ord.id] || ord.deliveryPartnerId || ''}
                                onChange={(e) => setPartnerSelections((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                                className="flex-1 bg-[#181818] border border-sky-400/40 text-white text-xs font-bold p-2 rounded-lg outline-none focus:border-sky-400"
                              >
                                <option value="">-- አጋር የኢትዮጵያ ዴሊቨሪ ድርጅት ይምረጡ (Select Partner Company) --</option>
                                {activePartners.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    🤝 {p.nameEn} ({p.nameAm}) · {p.baseFeeBirr} {currency} · 📞 {p.phone}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const pid = partnerSelections[ord.id] || ord.deliveryPartnerId;
                                  const partnerObj = partners.find((p) => p.id === pid);
                                  if (!partnerObj) {
                                    showToast('⚠️ እባክዎ መጀመሪያ አጋር የዴሊቨሪ ካምፓኒ ይምረጡ።');
                                    return;
                                  }
                                  onAssignPartnerToOrder(ord.id, partnerObj);
                                }}
                                className="bg-sky-400 hover:bg-white text-black font-mono font-black text-xs px-4 py-2 rounded-lg uppercase cursor-pointer shrink-0"
                              >
                                🤝 በካምፓኒ ላክ (Partner Dispatch)
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 font-black text-emerald-300">
                              <ShieldCheck className="w-4 h-4 shrink-0" />
                              <span>
                                በአድራሽ {ord.deliveryDriverName || ord.deliveryPartnerName || 'Courier'} ደርሷል
                                {ord.deliveryDeliveredAt ? ` · ${ord.deliveryDeliveredAt}` : ''}
                              </span>
                              {ord.deliveryVerifiedByPin && (
                                <span className="bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded font-mono text-[9.5px] border border-emerald-400/30">
                                  ✓ PIN Verified
                                </span>
                              )}
                              {ord.deliveryCashCollected && (
                                <span className="bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded font-mono text-[9.5px] border border-yellow-400/30">
                                  💵 Cash Collected
                                </span>
                              )}
                              {ord.customerConfirmedReceipt && (
                                <span className="bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded font-mono text-[9.5px] border border-sky-400/30">
                                  🎉 Customer Confirmed
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-white/60">
                              {ord.deliveryReturnedAt
                                ? `🏁 ወደ ሎጅ የተመለሰበት ሰዓት: ${ord.deliveryReturnedAt}`
                                : '⏳ አድራሹ ወደ ሎጅ መመለሱን እየተጠበቀ ነው'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {ord.deliveryProofPhoto && (
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxPhoto({
                                    url: ord.deliveryProofPhoto!,
                                    title: `Delivery Proof — ${ord.id}`,
                                    subtitle: `Courier: ${ord.deliveryDriverName || ord.deliveryPartnerName || 'Driver'} · Address: ${ord.deliveryAddress || ord.location}`,
                                  })
                                }
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer border border-white/15"
                              >
                                <Eye className="w-3.5 h-3.5 text-yellow-300" />
                                <span>📸 የርክክብ ፎቶ እይ</span>
                              </button>
                            )}
                            {ord.deliveryDriverName && !ord.deliveryReturnedAt && (
                              <button
                                type="button"
                                onClick={() => onMarkDriverReturned(ord.deliveryDriverName!, ord.id)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-[10px] px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                                ተመልሷል (Returned)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ethiopian Delivery Partner Companies Collaboration Section */}
          <div className="bg-[#121212] border border-sky-500/30 p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-mono text-sky-400 font-bold uppercase tracking-widest">
                    ETHIOPIAN LOGISTICS COLLABORATION HUB
                  </span>
                  <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 tabular-nums">
                    🟢 {activePartners.length}/{partners.length} Active
                  </span>
                </div>
                <h3 className="text-sm font-black text-white uppercase mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  🤝 የኢትዮጵያ ዴሊቨሪ ካምፓኒዎች ትብብር (Ethiopian Delivery Partners)
                </h3>
                <p className="text-[11px] text-white/60 mt-0.5">
                  ከቤዩ (BeU), ዴሊቨር አዲስ, ዘይራይድ, ፈረስ, ትኩስ እና የሀዋሳ ሞተር ህብረት ስራ ማህበራት ጋር ትዕዛዝ ያስተላልፉ።
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPartnerForm((prev) => !prev)}
                className="bg-sky-400 hover:bg-white text-black font-mono font-black text-[10px] px-3 py-2 rounded-xl uppercase cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {showAddPartnerForm ? 'ቅጹን ዝጋ' : 'አዲስ አጋር ድርጅት ጨምር'}
              </button>
            </div>
            {activePartners.length === 0 && partners.length > 0 && (
              <div className="bg-amber-950/35 border border-amber-500/40 text-amber-200 text-[11px] font-mono px-3 py-2 rounded-xl">
                ⚠️ በአሁኑ ጊዜ ምንም Active የሆነ የኢትዮጵያ አጋር ድርጅት የለም። ለመላክ ከታች ያለውን ⏸ PAUSED የሚለውን በመንካት ACTIVE ያድርጉ።
              </div>
            )}

            {showAddPartnerForm && (
              <form onSubmit={handleAddPartnerSubmit} className="bg-black/50 border border-sky-500/30 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={pNameEn}
                  onChange={(e) => setPNameEn(e.target.value)}
                  placeholder="Company Name (English)"
                  className="bg-[#181818] border border-white/15 text-white text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <input
                  type="text"
                  value={pNameAm}
                  onChange={(e) => setPNameAm(e.target.value)}
                  placeholder="የድርጅቱ ስም (በአማርኛ)"
                  className="bg-[#181818] border border-white/15 text-white text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <select
                  value={pServiceType}
                  onChange={(e) => setPServiceType(e.target.value as DeliveryPartnerCompany['serviceType'])}
                  className="bg-[#181818] border border-white/15 text-white text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                >
                  <option value="food_courier">🍔 Food Courier</option>
                  <option value="ride_hailing_express">🚖 Ride Express</option>
                  <option value="local_hawassa_coop">🛵 Hawassa Local Coop</option>
                  <option value="postal_parcel">📦 Parcel / Express</option>
                </select>
                <input
                  type="tel"
                  required
                  value={pPhone}
                  onChange={(e) => setPPhone(e.target.value)}
                  placeholder="Dispatch Phone (+251...)"
                  className="bg-[#181818] border border-white/15 text-white font-mono text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <input
                  type="tel"
                  value={pWhatsapp}
                  onChange={(e) => setPWhatsapp(e.target.value)}
                  placeholder="WhatsApp Number (Optional)"
                  className="bg-[#181818] border border-white/15 text-white font-mono text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <input
                  type="text"
                  value={pCities}
                  onChange={(e) => setPCities(e.target.value)}
                  placeholder="Cities (Hawassa, Addis...)"
                  className="bg-[#181818] border border-white/15 text-white text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <input
                  type="number"
                  min={0}
                  value={pFee}
                  onChange={(e) => setPFee(e.target.value)}
                  placeholder="Base Fee (ETB)"
                  className="bg-[#181818] border border-white/15 text-white font-mono text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={pCommission}
                  onChange={(e) => setPCommission(e.target.value)}
                  placeholder="Commission %"
                  className="bg-[#181818] border border-white/15 text-white font-mono text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <input
                  type="text"
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                  placeholder="Collaboration Notes"
                  className="bg-[#181818] border border-white/15 text-white text-xs p-2 rounded-lg outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="sm:col-span-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs py-2.5 rounded-lg uppercase cursor-pointer"
                >
                  ✅ አጋር የዴሊቨሪ ድርጅት አስቀምጥ (Save Partner Company)
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                    partner.active ? 'bg-sky-950/15 border-sky-500/35' : 'bg-black/40 border-white/10 opacity-65'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-white">{partner.nameEn}</p>
                      <p className="text-[11px] font-bold text-yellow-300">{partner.nameAm}</p>
                      <p className="text-[10px] font-mono text-white/60 mt-0.5">
                        📍 {Array.isArray(partner.coverageCities) ? partner.coverageCities.join(', ') : partner.coverageCities}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTogglePartnerActive(partner.id)}
                      className={`text-[9px] font-mono font-black px-2 py-1 rounded-full cursor-pointer border ${
                        partner.active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/10 text-white/60 border-white/15'
                      }`}
                    >
                      {partner.active ? '🟢 ACTIVE' : '⏸ PAUSED'}
                    </button>
                  </div>

                  {partner.notes && (
                    <p className="text-[10px] text-white/70 bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                      {partner.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 text-[10px] font-mono">
                    <div className="flex items-center gap-2.5">
                      <a href={`tel:${partner.phone}`} className="text-sky-300 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {partner.phone}
                      </a>
                      <span className="text-emerald-300 font-bold">
                        {partner.baseFeeBirr} {currency} · {partner.commissionPercent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {partner.whatsapp && (
                        <a
                          href={`https://wa.me/${partner.whatsapp.replace(/[^\d]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 px-2 py-0.5 rounded font-bold"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeletePartner(partner.id)}
                        className="p-1 text-red-400 hover:text-red-300 rounded cursor-pointer"
                        title="Delete Partner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Proof of Delivery Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border-2 border-yellow-400/60 rounded-2xl max-w-lg w-full p-4 space-y-3 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <h4 className="text-sm font-black text-yellow-300">{lightboxPhoto.title}</h4>
                {lightboxPhoto.subtitle && (
                  <p className="text-[11px] font-mono text-white/70">{lightboxPhoto.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black rounded-xl overflow-hidden flex justify-center border border-white/10">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
