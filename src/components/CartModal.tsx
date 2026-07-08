/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OrderItem, BankAccount, OrderType, PaymentMethod } from '../types';
import { Trash2, Smartphone, MapPin, DollarSign, HelpCircle, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  onRemoveItem: (id: string) => void;
  onPlaceOrder: (details: {
    location: string;
    orderType: OrderType;
    phone?: string;
    address?: string;
    tip: number;
    payment: PaymentMethod;
    bankId?: string;
    bankRef?: string;
    receiptScreenshot?: string;
    receiptComment?: string;
  }) => void;
  serviceChargeRate: number;
  vatRate: number;
  banks: BankAccount[];
  initialLocation?: string;
  chapaActive?: boolean;
  chapaKey?: string;
  chapaMode?: 'live' | 'test';
  appLang: string;
}

export default function CartModal({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onPlaceOrder,
  serviceChargeRate,
  vatRate,
  banks,
  initialLocation,
  chapaActive = true,
  chapaKey = '',
  chapaMode = 'test',
  appLang
}: CartModalProps) {
  const cartUiLocales = {
    cart_title: {
      am: 'የእኔ የትዕዛዝ ቅርጫት',
      en: 'My Order Cart',
      or: 'Koodii Ajaja Koo',
      ti: 'ቅርጫት ትእዛዘይ',
      fr: 'Mon Panier',
      de: 'Mein Warenkorb',
      it: 'Il Mio Carrello'
    },
    cart_subtitle: {
      am: 'ትዕዛዝ እና ክፍያ ማጠቃለያ',
      en: 'Shopping Cart & Checkout',
      or: 'Cuunfaa Ajajaa dabalataa',
      ti: 'መርኣዪ ትእዛዝን ክፍሊትን',
      fr: 'Panier & Paiement',
      de: 'Warenkorb & Kasse',
      it: 'Carrello & Pagamento'
    },
    empty_cart: {
      am: '🎯 ትዕዛዝዎ ባዶ ነው!',
      en: '🎯 Your cart is empty!',
      or: '🎯 Meeshaan keessan duwwaadha!',
      ti: '🎯 ኵነታት ትእዛዝኩም ጥራይ እዩ!',
      fr: '🎯 Votre panier est vide !',
      de: '🎯 Ihr Warenkorb ist leer!',
      it: '🎯 Il tuo carrello è vuoto!'
    },
    order_type: {
      am: 'የአቅርቦት ሁኔታ',
      en: 'Order Type / Delivery Option',
      or: 'Bifa tajaajilaa',
      ti: 'ዓይነት ኣቅርቦት',
      fr: 'Mode de Commande',
      de: 'Bestellart',
      it: 'Modalità di Servizio'
    },
    dine_in: {
      am: '📍 በሎጁ / Table',
      en: '📍 Table / Dine',
      or: '📍 Loojii Keessatti',
      ti: '📍 ኣብ ሎጅ',
      fr: '📍 Sur Place',
      de: '📍 Vor Ort',
      it: '📍 Al Tavolo'
    },
    delivery: {
      am: '🛵 ዴሊቨሪ / Delivery',
      en: '🛵 Delivery',
      or: '🛵 Deelivarii',
      ti: '🛵 ዴሊቨሪ',
      fr: '🛵 Livraison',
      de: '🛵 Lieferung',
      it: '🛵 Consegna'
    },
    room_number: {
      am: 'የክፍል ቁጥር',
      en: 'Room Number',
      or: 'Lakkoofsa Kutaa',
      ti: 'ቁጽሪ ክፍል',
      fr: 'Numéro de Chambre',
      de: 'Zimmernummer',
      it: 'Numero di Camera'
    },
    phone_number: {
      am: 'ስልክ ቁጥር',
      en: 'Phone Number',
      or: 'Lakkoofsa Bilbilaa',
      ti: 'ቁጽሪ ስልኪ',
      fr: 'Numéro de Téléphone',
      de: 'Telefonnummer',
      it: 'Numero di Telefono'
    },
    delivery_address: {
      am: 'የመድረሻ አድራሻ',
      en: 'Delivery Address',
      or: 'Teessoo Deelivarii',
      ti: 'ኣድራሻ መድረሻ',
      fr: 'Adresse de Livraison',
      de: 'Lieferadresse',
      it: 'Indirizzo di Consegna'
    },
    tip: {
      am: 'ለአስተናጋጅዎ የቲፕ/ጉርሻ ስጦታ (Tip Staff)',
      en: 'Tip Our Waiters & Chefs',
      or: 'Eebba tajaajilaaf (Tip)',
      ti: 'ንሰራሕተኛታት ጉርሻ (Tip)',
      fr: 'Laisser un Pourboire',
      de: 'Trinkgeld',
      it: 'Lascia una Mancia'
    },
    payment_method: {
      am: 'የክፍያ አማራጭ',
      en: 'Payment Method',
      or: 'Filannoo Kaffaltii',
      ti: 'መርኣዪ ክፍሊት',
      fr: 'Mode de Paiement',
      de: 'Zahlungsmethode',
      it: 'Metodo di Pagamento'
    },
    cash: {
      am: '💵 ጥሬ ገንዘብ',
      en: '💵 Cash On Delivery',
      or: '💵 Kaffaltii doroqo',
      ti: '💵 ጥረ ገንዘብ',
      fr: '💵 Espèces',
      de: '💵 Barzahlung',
      it: '💵 Contanti'
    },
    bank: {
      am: '🏦 የባንክ አካውንት',
      en: '🏦 Bank / Telebirr',
      or: '🏦 Kaffaltii Baankii',
      ti: '🏦 ብбаንኪ አካውንት',
      fr: '🏦 Transfert Bancaire',
      de: '🏦 Banküberweisung',
      it: '🏦 Bonifico'
    },
    chapa_secure: {
      am: '💳 ቻፓ ፖርታል (ፈጣን ክፍያ)',
      en: '💳 Chapa Pay Portal',
      or: '💳 Kaffaltii Chapaa',
      ti: '💳 ቻፓ ክፍሊት',
      fr: '💳 Chapa Direct',
      de: '💳 Chapa Pay',
      it: '💳 Pagamento Chapa'
    },
    place_order_btn: {
      am: 'ትዕዛዙን ጨርስ (PLACE ORDER) ⚡',
      en: 'PLACE ORDER NOW ⚡',
      or: 'AJAJA XUMURI ⚡',
      ti: 'ትእዛዝ ጨርስ ⚡',
      fr: 'VALIDER LA COMMANDE ⚡',
      de: 'JETZT BESTELLEN ⚡',
      it: 'CONFERMA ORDINAZIONE ⚡'
    },
    subtotal: {
      am: 'ንዑስ ድምር',
      en: 'Subtotal',
      or: 'Kaffaltii duraa',
      ti: 'ንኡስ ጠቕላላ',
      fr: 'Sous-total',
      de: 'Zwischensumme',
      it: 'Subtotale'
    },
    service_charge: {
      am: 'የአገልግሎት ክፍያ',
      en: 'Service Charge',
      or: 'Kaffaltii Tajaajilaa',
      ti: 'ክፍሊት ኣገልግሎት',
      fr: 'Frais de Service',
      de: 'Servicegebühr',
      it: 'Costi di Servizio'
    },
    vat: {
      am: 'ተጨማሪ እሴት ታክስ (VAT)',
      en: 'VAT (Tax)',
      or: 'Kaffaltii Gibiraa (VAT)',
      ti: 'ተወሳኺ እሴት ታክስ',
      fr: 'TVA',
      de: 'Umsatzsteuer (MwSt.)',
      it: 'IVA'
    },
    tip_label: {
      am: 'ጉርሻ',
      en: 'Tip Added',
      or: 'Tip dabalata',
      ti: 'ጉርሻ',
      fr: 'Pourboire',
      de: 'Trinkgeld',
      it: 'Mancia'
    },
    grand_total: {
      am: 'ጠቅላላ ሂሳብ',
      en: 'Grand Total',
      or: 'Waliigala Kaffaltii',
      ti: 'ጠቕላላ ሒሳብ',
      fr: 'Total Général',
      de: 'Gesamtsumme',
      it: 'Totale Complessivo'
    },
    ref_placeholder: {
      am: 'የባንክ ማረጋገጫ ቁጥር (Txn Ref)',
      en: 'Input Bank Txn Reference Number',
      or: 'Koodii baankii galchi',
      ti: 'ቁጽሪ መረጋገጺ ባንኪ',
      fr: 'Numéro de Référence',
      de: 'Überweisungsreferenz',
      it: 'Riferimento Transazione'
    },
    receipt_upload: {
      am: 'የክፍያ ደረሰኝ ፎቶ (ከተፈለገ)',
      en: 'Upload Receipt Screenshot (Optional)',
      or: 'Waraqaa kaffaltii ergi',
      ti: 'ስእሊ ደረሰኝ ክፍሊት',
      fr: 'Télécharger le Reçu (Optionnel)',
      de: 'Überweisungsbeleg (Optional)',
      it: 'Carica Ricevuta Bancaria (Opzionale)'
    },
    receipt_comment_placeholder: {
      am: 'ተጨማሪ ማሳሰቢያ እዚህ ይጻፉ...',
      en: 'Any checkout comments for staff...',
      or: 'Yaada dabalataa...',
      ti: 'ተወሳኺ ምሳሰቢ...',
      fr: 'Notes pour le personnel...',
      de: 'Anmerkungen für das Personal...',
      it: 'Commenti o note...'
    }
  };

  const [orderType, setOrderType] = useState<OrderType>('dine');
  const [location, setLocation] = useState('ROOM NUMBER');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [receiptScreenshot, setReceiptScreenshot] = useState('');
  const [receiptComment, setReceiptComment] = useState('');

  // Chapa specific local states
  const [chapaEmail, setChapaEmail] = useState('guest@papyrus.com');
  const [chapaFirstName, setChapaFirstName] = useState('');
  const [chapaLastName, setChapaLastName] = useState('');
  const [showChapaGateway, setShowChapaGateway] = useState(false);
  const [selectedChapaMethod, setSelectedChapaMethod] = useState<'telebirr' | 'cbe' | 'card'>('telebirr');
  const [chapaSelectedLodgeBankId, setChapaSelectedLodgeBankId] = useState<string>('');
  const [chapaUserBalance, setChapaUserBalance] = useState<string>('25000');
  const [chapaUserPin, setChapaUserPin] = useState<string>('');
  const [chapaAccountNumber, setChapaAccountNumber] = useState<string>('');

  useEffect(() => {
    if (banks && banks.length > 0 && !chapaSelectedLodgeBankId) {
      setChapaSelectedLodgeBankId(banks[0].id);
    }
  }, [banks, chapaSelectedLodgeBankId]);

  // Auto detect scanned location (QR) when modal opens or initialLocation is available
  useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        setLocation(initialLocation);
      } else {
        setLocation('ROOM NUMBER');
      }
    }
  }, [isOpen, initialLocation]);

  // Local helper for receipt upload directly to Supabase Storage
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sanitizeFileName = (name: string): string => {
        const dotIndex = name.lastIndexOf('.');
        const ext = dotIndex !== -1 ? name.substring(dotIndex) : '';
        const base = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
        const cleanBase = base
          .replace(/[^a-zA-Z0-9-_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '');
        const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
        return (cleanBase || 'file') + cleanExt;
      };

      const cleanName = sanitizeFileName(file.name);
      const fileName = `receipts/${Date.now()}_${cleanName}`;

      try {
        const { data, error } = await supabase.storage
          .from('lodge-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error("Receipt upload error details:", error);
          alert(`❌ Upload failed: ${error.message}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('lodge-media')
          .getPublicUrl(fileName);

        if (!publicUrl) {
          throw new Error("Could not retrieve public URL for uploaded receipt.");
        }

        setReceiptScreenshot(publicUrl);
        alert('📸 ደረሰኝ በተሳካ ሁኔታ ተጭኗል! / Receipt image uploaded successfully.');
      } catch (err: any) {
        console.error("Receipt upload failed:", err);
        alert(`❌ Upload failed: ${err.message || err}`);
      }
    }
  };

  useEffect(() => {
    if (isOpen && banks.length > 0) {
      setSelectedBankId(banks[0].id);
    }
  }, [isOpen, banks]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const serviceCharge = Math.round((subtotal * serviceChargeRate) / 100);
  const vat = Math.round(((subtotal + serviceCharge) * vatRate) / 100);

  // Tip calculation logic
  let tipAmount = 0;
  if (tipPercent > 0) {
    tipAmount = Math.round((subtotal * tipPercent) / 100);
  } else if (tipPercent === -1) {
    const customVal = parseFloat(customTip);
    if (!isNaN(customVal) && customVal > 0) {
      tipAmount = customVal;
    }
  }

  const grandTotal = subtotal + serviceCharge + vat + tipAmount;

  const handleSubmit = () => {
    if (cart.length === 0) {
      alert('የእርስዎ የትዕዛዝ ቅርጫት ባዶ ነው! / Order cart is empty.');
      return;
    }

    if (orderType === 'dine' && !location.trim()) {
      alert('እባክዎ የጠረጴዛ ወይም ክፍል ቁጥር ያስገቡ። / Please provide table/room.');
      return;
    }

    if (orderType === 'delivery') {
      if (!phone.trim()) {
        alert('እባክዎ ስልክ ቁጥር ያስገቡ። / Phone is required.');
        return;
      }
      if (!address.trim()) {
        alert('እባክዎ የመድረሻ አድራሻ ያስገቡ። / Address is required.');
        return;
      }
    }

    if (payment === 'bank') {
      if (!selectedBankId) {
        alert('እባክዎ መጀመሪያ ሊከፍሉበት የፈለጉትን የባንክ አካውንት ይምረጡ።');
        return;
      }
      if (!bankRef.trim()) {
        alert('እባክዎ በእንቅስቃሴ ማረጋገጫ ቁጥር ያስገቡ። / Please input bank Txn Ref.');
        return;
      }
    }

    if (payment === 'chapa') {
      if (!chapaEmail.trim()) {
        alert('እባክዎ የቻፓ ክፍያ አስፈጻሚ ኢሜይል ያስገቡ። / Email is required.');
        return;
      }
      if (!chapaFirstName.trim() || !chapaLastName.trim()) {
        alert('እባክዎ የመጀመሪያ እና የአያት ስም ያስገቡ። / First & Last name are required.');
        return;
      }
      setShowChapaGateway(true);
      return;
    }

    executeOrderPlacement();
  };

  const executeOrderPlacement = (customRef?: string) => {
    onPlaceOrder({
      location: orderType === 'dine' ? location : 'Delivery Route',
      orderType,
      phone: orderType === 'delivery' ? phone : undefined,
      address: orderType === 'delivery' ? address : undefined,
      tip: tipAmount,
      payment,
      bankId: payment === 'bank' ? (selectedBankId || undefined) : undefined,
      bankRef: payment === 'bank' ? bankRef : (payment === 'chapa' ? (customRef || 'CHAP-TXN-' + Math.floor(100000 + Math.random() * 900000)) : undefined),
      receiptScreenshot: payment === 'bank' ? (receiptScreenshot || undefined) : (payment === 'chapa' ? 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=600' : undefined),
      receiptComment: payment === 'bank' ? (receiptComment || undefined) : (payment === 'chapa' ? `Chapa Secure Verified. Billing: ${chapaFirstName} ${chapaLastName} (${chapaEmail})` : undefined)
    });

    // Reset screenshot & comment after order placing
    setReceiptScreenshot('');
    setReceiptComment('');
    setChapaFirstName('');
    setChapaLastName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] w-full max-w-md rounded-none border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Acid top accent header */}
        <div className="h-1 w-full bg-[#C1FF00]"></div>

        <div className="p-4 border-b border-white/10 flex justify-between items-center text-white">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#C1FF00]">
              {cartUiLocales.cart_title[appLang as keyof typeof cartUiLocales.cart_title] || cartUiLocales.cart_title.en}
            </h3>
            <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">
              {cartUiLocales.cart_subtitle[appLang as keyof typeof cartUiLocales.cart_subtitle] || cartUiLocales.cart_subtitle.en}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/40 hover:text-white transition-colors"
            id="btn-close-cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          
          {/* Cart items list */}
          {cart.length === 0 ? (
            <div className="py-10 text-center text-white/30 font-bold border border-dashed border-white/10 p-4">
              {cartUiLocales.empty_cart[appLang as keyof typeof cartUiLocales.empty_cart] || cartUiLocales.empty_cart.en}
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-[#181818] border border-white/5 p-3 flex justify-between items-center text-white">
                  <div>
                    <h5 className="text-xs font-black tracking-tight">{item.name}</h5>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">
                      {item.qty} × {item.price} ብር
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#C1FF00]">
                      {item.qty * item.price} ብር
                    </span>
                    <button 
                      id={`delete-cart-item-${idx}`}
                      onClick={() => onRemoveItem(item.id)} 
                      className="text-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delivery Configuration */}
          <div className="border-t border-white/10 pt-3">
            <label className="text-[10px] font-mono uppercase text-white/50 block mb-1.5 font-bold">
              {cartUiLocales.order_type[appLang as keyof typeof cartUiLocales.order_type] || cartUiLocales.order_type.en}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                id="btn-type-dine-react"
                onClick={() => setOrderType('dine')}
                className={`py-2.5 text-xs font-black uppercase tracking-wide border transition-all ${
                  orderType === 'dine' 
                    ? 'bg-[#C1FF00] text-black border-[#C1FF00]' 
                    : 'bg-[#181818] text-white border-white/10 hover:border-white/20'
                }`}
              >
                {cartUiLocales.dine_in[appLang as keyof typeof cartUiLocales.dine_in] || cartUiLocales.dine_in.en}
              </button>
              <button 
                id="btn-type-delivery-react"
                onClick={() => setOrderType('delivery')}
                className={`py-2.5 text-xs font-black uppercase tracking-wide border transition-all ${
                  orderType === 'delivery' 
                    ? 'bg-[#C1FF00] text-black border-[#C1FF00]' 
                    : 'bg-[#181818] text-white border-white/10 hover:border-white/20'
                }`}
              >
                {cartUiLocales.delivery[appLang as keyof typeof cartUiLocales.delivery] || cartUiLocales.delivery.en}
              </button>
            </div>
          </div>

          {/* Table/Room logic */}
          {orderType === 'dine' && (
            <div className="bg-[#1A1A1A] p-3 border border-white/5 space-y-1">
              <label className="text-[9px] font-mono uppercase text-white/50 font-bold">
                {cartUiLocales.room_number[appLang as keyof typeof cartUiLocales.room_number] || cartUiLocales.room_number.en}
              </label>
              <input 
                type="text"
                id="cart-table-no"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={appLang === 'am' ? 'ለምሳሌ፡ Room 101' : 'e.g. Room 101'}
                className="w-full bg-black border border-white/10 text-white font-black text-center text-sm p-2 outline-none focus:border-[#C1FF00]"
              />
            </div>
          )}

          {/* Delivery form logic */}
          {orderType === 'delivery' && (
            <div className="bg-[#1A1A1A] p-3 border border-white/5 space-y-3">
              <div>
                <label className="text-[9px] font-mono uppercase text-white/50 block mb-1 font-bold">
                  {cartUiLocales.phone_number[appLang as keyof typeof cartUiLocales.phone_number] || cartUiLocales.phone_number.en} *
                </label>
                <input 
                  type="tel"
                  id="cart-delivery-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#C1FF00]"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-white/50 block mb-1 font-bold">
                  {cartUiLocales.delivery_address[appLang as keyof typeof cartUiLocales.delivery_address] || cartUiLocales.delivery_address.en} *
                </label>
                <textarea 
                  id="cart-delivery-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={appLang === 'am' ? 'የሰፈር ስም፣ የቤት ቁጥር ወይም መለያ ምልክት...' : 'Neighborhood name, House No or landmarks...'}
                  rows={2}
                  className="w-full bg-black border border-white/10 text-white text-xs p-2 outline-none focus:border-[#C1FF00] resize-none"
                />
              </div>
            </div>
          )}

          {/* Tipping inputs */}
          <div className="border-t border-white/10 pt-3">
            <label className="text-[10px] font-mono uppercase text-white/50 block mb-1.5 font-bold">
              {cartUiLocales.tip[appLang as keyof typeof cartUiLocales.tip] || cartUiLocales.tip.en}
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[0, 5, 10, 15].map(p => (
                <button
                  key={p}
                  id={`btn-tip-${p}-react`}
                  onClick={() => { setTipPercent(p); setCustomTip(''); }}
                  className={`py-1.5 text-[11px] font-black border uppercase transition-all ${
                    tipPercent === p 
                      ? 'bg-[#C1FF00] text-black border-[#C1FF00]' 
                      : 'bg-[#181818] text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  {p === 0 ? (appLang === 'am' ? 'የለም' : 'None') : `${p}%`}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase text-white/40">
                {appLang === 'am' ? 'ተለዋዋጭ መጠን (ብር)፦' : 'Custom Amount (Birr):'}
              </span>
              <input 
                type="number"
                value={customTip}
                onChange={(e) => {
                  setCustomTip(e.target.value);
                  setTipPercent(-1);
                }}
                placeholder="Custom Birr"
                className="flex-1 bg-[#181818] border border-white/10 text-white font-mono text-xs p-1.5 outline-none focus:border-[#C1FF00]"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t border-white/10 pt-3">
            <label className="text-[10px] font-mono uppercase text-white/50 block mb-1.5 font-bold">
              {cartUiLocales.payment_method[appLang as keyof typeof cartUiLocales.payment_method] || cartUiLocales.payment_method.en}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button 
                type="button"
                id="btn-pay-cash-react"
                onClick={() => setPayment('cash')}
                className={`py-2 text-[10.5px] font-black border uppercase transition-all rounded ${
                  payment === 'cash' 
                    ? 'bg-[#C1FF00] text-black border-[#C1FF00]' 
                    : 'bg-[#181818] text-white border-white/10 hover:border-white/20'
                }`}
              >
                {cartUiLocales.cash[appLang as keyof typeof cartUiLocales.cash] || cartUiLocales.cash.en}
              </button>
              <button 
                type="button"
                id="btn-pay-bank-react"
                onClick={() => setPayment('bank')}
                className={`py-2 text-[10.5px] font-black border uppercase transition-all rounded ${
                  payment === 'bank' 
                    ? 'bg-[#C1FF00] text-black border-[#C1FF00]' 
                    : 'bg-[#181818] text-white border-white/10 hover:border-white/20'
                }`}
              >
                {cartUiLocales.bank[appLang as keyof typeof cartUiLocales.bank] || cartUiLocales.bank.en}
              </button>
              <button 
                type="button"
                id="btn-pay-chapa-react"
                onClick={() => {
                  if (!chapaActive) {
                    alert('Chapa Payment gateway has not been activated yet by administrators.');
                    return;
                  }
                  setPayment('chapa');
                }}
                className={`py-2 text-[10.5px] font-black border uppercase transition-all rounded relative ${
                  !chapaActive ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  payment === 'chapa' 
                    ? 'bg-[#00f5ff] text-black border-[#00f5ff]' 
                    : 'bg-[#181818] text-white border-white/10 hover:border-white/20'
                }`}
              >
                {cartUiLocales.chapa_secure[appLang as keyof typeof cartUiLocales.chapa_secure] || cartUiLocales.chapa_secure.en}
              </button>
            </div>
          </div>

          {/* Bank Transfer block */}
          {payment === 'bank' && (
            <div className="bg-[#1A1A1A] p-3 border border-white/5 space-y-3">
              <p className="text-[9px] text-[#C1FF00]/90 leading-tight uppercase font-mono font-bold">
                {appLang === 'am' 
                  ? 'መጀመሪያ መክፈል የሚፈልጉትን አካውንት ይምረጡ፤ ያስተላለፉበትን የማረጋገጫ ቁጥር ይጻፉ።' 
                  : 'Select payment destination bank account first, then enter transaction reference code.'}
              </p>
              <div className="space-y-1.5 text-xs text-white">
                {banks.map((b, idx) => (
                  <div 
                    key={b.id} 
                    id={`bank-row-select-${b.id}`}
                    onClick={() => setSelectedBankId(b.id)}
                    className={`p-2 border cursor-pointer select-none transition-all ${
                      selectedBankId === b.id 
                        ? 'bg-[#C1FF00]/10 border-[#C1FF00]' 
                        : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <p className="font-black text-[10px] tracking-tight">{b.name}</p>
                    <p className="font-mono text-[9px] text-white/60">A/C: {b.number}</p>
                    <p className="text-[9px] text-white/50 mt-0.5">Holder: {b.holder}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <label className="text-[9px] font-mono uppercase text-white/50 block mb-1 font-bold">
                  {cartUiLocales.ref_placeholder[appLang as keyof typeof cartUiLocales.ref_placeholder] || cartUiLocales.ref_placeholder.en} *
                </label>
                <input 
                  type="text"
                  id="checkout-bank-ref-field"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="CBE-XXXXXXXXX"
                  required
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#C1FF00]"
                />
              </div>

              {/* Receipt / Screenshot Attachment section */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <label className="text-[9px] font-mono uppercase text-white/50 block font-bold">
                  {cartUiLocales.receipt_upload[appLang as keyof typeof cartUiLocales.receipt_upload] || cartUiLocales.receipt_upload.en}
                </label>
                
                {/* Real File Input for upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="bg-black hover:bg-white/5 text-white border border-white/10 hover:border-[#C1FF00]/40 py-2 px-3 text-[10px] font-mono font-black uppercase text-center rounded flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    📸 {appLang === 'am' ? 'ፎቶ ወይም እስክሪንሻት ይጫኑ' : 'Upload Screenshot / Proof'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleReceiptUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Instant Real Mock options */}
                <div className="space-y-1">
                  <p className="text-[8px] font-mono text-white/40 uppercase">
                    {appLang === 'am' ? 'በቀላሉ ለመሞከር ማረጋገጫ ይምረጡ፦' : 'To test easily, pick simulated proof receipt:'}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptScreenshot('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600');
                        alert('✅ Simulated CBE Bank receipt attached.');
                      }}
                      className="py-1 bg-white/5 hover:bg-[#C1FF00]/10 border border-white/5 hover:border-[#C1FF00]/20 text-white hover:text-[#C1FF00] rounded text-[8px]"
                    >
                      📱 CBE App screenshot
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptScreenshot('https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600');
                        alert('✅ Simulated Telebirr receipt attached.');
                      }}
                      className="py-1 bg-white/5 hover:bg-[#C1FF00]/10 border border-white/5 hover:border-[#C1FF00]/20 text-white hover:text-[#C1FF00] rounded text-[8px]"
                    >
                      📲 Telebirr Receipt proof
                    </button>
                  </div>
                </div>

                {/* Paste URL Input field */}
                <div>
                  <input 
                    type="text"
                    value={receiptScreenshot}
                    onChange={(e) => setReceiptScreenshot(e.target.value)}
                    placeholder="or paste Screenshot Image URL..."
                    className="w-full bg-black border border-white/10 text-white/60 font-mono text-[9px] p-2 outline-none"
                  />
                </div>

                {/* Screenshot preview */}
                {receiptScreenshot && (
                  <div className="bg-black/80 p-2 border border-[#C1FF00]/20 rounded relative text-center">
                    <p className="text-[8px] uppercase font-mono text-[#C1FF00] mb-1 font-bold">Attached Payment Proof Preview</p>
                    <img 
                      src={receiptScreenshot} 
                      className="max-h-24 mx-auto object-contain border border-white/15" 
                      alt="Payment Receipt Preview" 
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      type="button"
                      onClick={() => setReceiptScreenshot('')}
                      className="absolute top-1 right-1 text-[8px] font-mono text-red-400 bg-black/60 px-1 rounded hover:text-white"
                    >
                      REMOVE
                    </button>
                  </div>
                )}
              </div>

              {/* Receipt Comments */}
              <div className="pt-2 border-t border-white/5">
                <label className="text-[9px] font-mono uppercase text-white/50 block mb-1 font-bold">
                  {appLang === 'am' ? 'ተጨማሪ ማሳሰቢያ ወይንም አስተያየት እዚህ ይጻፉ' : 'Receipt Remarks & Notes'}
                </label>
                <input 
                  type="text"
                  placeholder={cartUiLocales.receipt_comment_placeholder[appLang as keyof typeof cartUiLocales.receipt_comment_placeholder] || cartUiLocales.receipt_comment_placeholder.en}
                  value={receiptComment}
                  onChange={(e) => setReceiptComment(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white text-[10px] p-2 outline-none focus:border-[#C1FF00]"
                />
              </div>
            </div>
          )}

          {/* Chapa Secure Checkout configuration */}
          {payment === 'chapa' && (
            <div className="bg-[#0b1319] p-4 border border-[#00f5ff]/20 space-y-3.5 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#00f5ff]/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                <span className="text-[9px] text-[#00f5ff] font-mono font-black tracking-widest uppercase block">🔌 CHAPA SECURE CHECKOUT</span>
                <span className="bg-[#00f5ff]/10 text-[#00f5ff] px-2 py-0.5 rounded text-[7.5px] font-mono font-black">
                  {chapaMode === 'live' ? 'LIVE DEPLOY' : 'SANDBOX SIMULATOR'}
                </span>
              </div>

              <div className="space-y-3 text-white">
                <p className="text-[10px] text-white/70 leading-relaxed font-semibold">
                  በኢትዮጵያ ቀዳሚ በሆነው የቻፓ ክፍያ (telebirr, CBE birr, Mobile money እና ካርድ) ደረሰኝዎን በቀና መንገድ እዚህ ይክፈሉ።
                </p>

                <div>
                  <label className="text-[8px] font-mono uppercase text-white/50 block mb-1">
                    የቻፓ ክፍያ አስፈጻሚው ኢሜይል (EMAIL)*
                  </label>
                  <input 
                    type="email"
                    required
                    value={chapaEmail}
                    onChange={(e) => setChapaEmail(e.target.value)}
                    placeholder="e.g. caleb@yohannes.com"
                    className="w-full bg-black border border-white/10 text-white text-xs p-2 outline-none focus:border-[#00f5ff] rounded font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-mono uppercase text-white/50 block mb-1">
                      የመጀመሪያ ስም (FIRST NAME)*
                    </label>
                    <input 
                      type="text"
                      required
                      value={chapaFirstName}
                      onChange={(e) => setChapaFirstName(e.target.value)}
                      placeholder="Caleb"
                      className="w-full bg-black border border-white/10 text-white text-xs p-2 outline-none focus:border-[#00f5ff] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono uppercase text-white/50 block mb-1">
                      የአያት ስም (LAST NAME)*
                    </label>
                    <input 
                      type="text"
                      required
                      value={chapaLastName}
                      onChange={(e) => setChapaLastName(e.target.value)}
                      placeholder="Yohannes"
                      className="w-full bg-black border border-white/10 text-white text-xs p-2 outline-none focus:border-[#00f5ff] rounded"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-black/40 border border-white/5 rounded text-[9px] text-white/60 space-y-1">
                  <div className="flex justify-between text-white/80 font-bold">
                    <span>ጠቅላላ የሚከፈል ሂሳብ መጠን:</span>
                    <span className="font-mono text-[#00f5ff] font-black">{grandTotal} Birr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{appLang === 'am' ? 'የሲስተም ሁኔታ (System State):' : 'System State:'}</span>
                    {chapaKey ? (
                      <span className="text-emerald-400 font-bold font-mono">
                        {appLang === 'am' ? '✔️ የኤፒአይ ቁልፍ ተገናኝቷል (API KEY CONNECTED)' : '✔️ API KEY CONNECTED'}
                      </span>
                    ) : (
                      <span className="text-yellow-400 font-bold font-mono">
                        {appLang === 'am' ? '⚠️ የቻፓ ማሳያ ሙከራ ንቁ ነው (CHAPA DEMO EMULATOR active)' : '⚠️ CHAPA DEMO EMULATOR active'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal footer containing compliant pricing blocks */}
        <div className="p-4 border-t border-white/10 bg-[#141414] text-white space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-white/50">
            <span>{cartUiLocales.subtotal[appLang as keyof typeof cartUiLocales.subtotal] || cartUiLocales.subtotal.en}</span>
            <span className="font-bold text-white">{subtotal} {appLang === 'am' ? 'ብር' : 'Birr'}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-white/50">
            <span>{cartUiLocales.service_charge[appLang as keyof typeof cartUiLocales.service_charge] || cartUiLocales.service_charge.en} ({serviceChargeRate}%)</span>
            <span className="font-bold text-white">{serviceCharge} {appLang === 'am' ? 'ብር' : 'Birr'}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-white/50">
            <span>{cartUiLocales.vat[appLang as keyof typeof cartUiLocales.vat] || cartUiLocales.vat.en} ({vatRate}%)</span>
            <span className="font-bold text-white">{vat} {appLang === 'am' ? 'ብር' : 'Birr'}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-emerald-400">
            <span>{cartUiLocales.tip_label[appLang as keyof typeof cartUiLocales.tip_label] || cartUiLocales.tip_label.en}</span>
            <span className="font-bold">{tipAmount} {appLang === 'am' ? 'ብር' : 'Birr'}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 text-xs">
            <span className="font-black uppercase tracking-widest text-[#C1FF00]">
              {cartUiLocales.grand_total[appLang as keyof typeof cartUiLocales.grand_total] || cartUiLocales.grand_total.en}
            </span>
            <span className="font-mono font-black text-lg text-[#C1FF00]">{grandTotal} {appLang === 'am' ? 'ብር' : 'Birr'}</span>
          </div>

          <button 
            id="checkout-confirm-btn"
            onClick={handleSubmit}
            className="w-full bg-[#C1FF00] hover:bg-white text-black font-black uppercase text-xs tracking-wider py-3 mt-3 transition-colors shrink-0 font-sans"
          >
            {cartUiLocales.place_order_btn[appLang as keyof typeof cartUiLocales.place_order_btn] || cartUiLocales.place_order_btn.en}
          </button>
        </div>

      </div>

      {/* CHAPA SECURE CHECKOUT PORTAL EMULATOR */}
      {showChapaGateway && (
        <div className="absolute inset-0 bg-[#070b0e] z-50 flex flex-col font-sans text-white select-none">
          {/* Top Bar */}
          <div className="bg-[#0b1319] px-4 py-3 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[#00f5ff] text-base font-extrabold animate-pulse">⚡</span>
              <span className="font-mono text-xs font-black tracking-widest text-white">CHAPA SECURE CHECKOUT</span>
            </div>
            <button 
              type="button" 
              onClick={() => setShowChapaGateway(false)}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* Payment Brand and Merchant */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center space-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#00f5ff]/5 rounded-full blur-xl" />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest block">Merchant Billing request</span>
              <h3 className="text-sm font-black uppercase text-[#00f5ff]">PAPYRUS LODGE & RESORT</h3>
              <p className="text-[10px] text-white/60">Reference: CHAP-TXN-{Date.now().toString().slice(-6)}</p>
              <div className="pt-2">
                <span className="text-2xl font-mono font-black text-white">{grandTotal} <span className="text-[#00f5ff] text-sm font-black">ETB</span></span>
              </div>
            </div>

            {/* Customer details verification */}
            <div className="bg-[#0b1319] border border-white/5 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Billed to:</span>
                <span className="font-bold text-white">{chapaFirstName} {chapaLastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Email address:</span>
                <span className="font-mono text-white/80">{chapaEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Gateway Mode:</span>
                <span className="font-bold text-yellow-400 font-mono text-[10px]">{chapaMode === 'live' ? 'LIVE DEPLOYMENT' : 'SANDBOX TEST ENVIRONMENT'}</span>
              </div>
            </div>

            {/* Lodge Bank Selector */}
            <div className="space-y-1 bg-[#101920] border border-white/10 p-3 rounded-lg text-xs">
              <label id="lbl-lodge-bank-chapa" className="text-[10px] font-mono text-white/50 uppercase block font-black">🏥 የሎጁ የባንክ አካውንት (Lodge Merchant Bank):</label>
              <select 
                id="select-lodge-bank-chapa"
                value={chapaSelectedLodgeBankId}
                onChange={(e) => setChapaSelectedLodgeBankId(e.target.value)}
                className="w-full bg-black border border-white/10 text-white font-mono text-xs p-2 rounded outline-none focus:border-[#00f5ff] text-white font-bold"
              >
                {banks.length === 0 ? (
                  <option value="">ምንም የባንክ አካውንት አልተመዘገበም (No Bank Registered)</option>
                ) : (
                  banks.map(b => (
                    <option key={b.id} value={b.id} className="text-black">
                      {b.name} - {b.number} ({b.holder})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">የመክፈያ ዘዴ ይምረጡ (Select Channel)</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setSelectedChapaMethod('telebirr')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none cursor-pointer ${
                    selectedChapaMethod === 'telebirr' 
                      ? 'bg-[#005ea2]/10 border-[#00f5ff] text-[#00f5ff]' 
                      : 'bg-black/40 border-white/5 text-white/60'
                  }`}
                >
                  <span className="text-xl">📱</span>
                  <span className="text-[9.5px] font-black uppercase tracking-tight">Telebirr</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedChapaMethod('cbe')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none cursor-pointer ${
                    selectedChapaMethod === 'cbe' 
                      ? 'bg-[#800080]/10 border-[#00f5ff] text-[#00f5ff]' 
                      : 'bg-black/40 border-white/5 text-white/60'
                  }`}
                >
                  <span className="text-xl">🏦</span>
                  <span className="text-[9.5px] font-black uppercase tracking-tight">CBE Birr</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedChapaMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none cursor-pointer ${
                    selectedChapaMethod === 'card' 
                      ? 'bg-white/5 border-[#00f5ff] text-[#00f5ff]' 
                      : 'bg-black/40 border-white/5 text-white/60'
                  }`}
                >
                  <span className="text-xl">💳</span>
                  <span className="text-[9.5px] font-black uppercase tracking-tight">Awash / Card</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-3.5">
              <div className="space-y-2">
                <p className="text-[10px] text-white/70 leading-relaxed font-bold">
                  አካውንትዎን ያገናኙ (Connect security wallet / Account credentials)
                </p>
                <div className="flex gap-1.5">
                  <span className="bg-black border border-white/10 text-white/60 px-2.5 py-1.5 rounded text-xs select-none flex items-center font-mono font-bold">ACC</span>
                  <input 
                    type="text" 
                    value={chapaAccountNumber}
                    onChange={(e) => setChapaAccountNumber(e.target.value)}
                    placeholder="ቁጥር ያስገቡ (e.g. 09xxxxxxxx / 10002345)" 
                    className="flex-grow bg-black border border-white/10 text-white font-mono text-xs p-1.5 outline-none focus:border-[#00f5ff] rounded"
                  />
                </div>
              </div>

              {/* User Balance Input Section */}
              <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/60 font-bold uppercase">💰 የእርስዎ አካውንት የሂሳብ መጠን (Current Balance):</span>
                  <span className="font-mono text-[9px] text-[#00f5ff] font-bold">ETB</span>
                </div>
                <input 
                  type="number"
                  value={chapaUserBalance}
                  onChange={(e) => setChapaUserBalance(e.target.value)}
                  placeholder="ምን ያህል ቀሪ ሂሳብ አለዎት?"
                  className="w-full bg-black border border-white/10 text-[#C1FF00] font-mono text-xs p-1.5 outline-none rounded font-bold"
                />
                <div className="flex gap-1.5 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setChapaUserBalance('1000')}
                    className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-white/50 hover:text-white"
                  >
                    1K ብር
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChapaUserBalance('5000')}
                    className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-white/50 hover:text-white"
                  >
                    5K ብር
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChapaUserBalance('25000')}
                    className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-white/50 hover:text-white"
                  >
                    25K ብር
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChapaUserBalance('100000')}
                    className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-white/50 hover:text-white"
                  >
                    100K ብር
                  </button>
                </div>
              </div>

              {/* Secure PIN Input Section */}
              <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/60 font-bold uppercase">🔑 የሚስጥር ቁጥር (Secure Auth PIN):</span>
                  <span className="font-mono text-[9px] text-red-400 font-bold">REQUIRED</span>
                </div>
                <input 
                  type="password"
                  maxLength={6}
                  value={chapaUserPin}
                  onChange={(e) => setChapaUserPin(e.target.value)}
                  placeholder="የሚስጥር ቁጥርዎን ያስገቡ (PIN)"
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs p-1.5 outline-none rounded"
                />
              </div>

              {/* Real-time Math validation */}
              {(() => {
                const bal = Number(chapaUserBalance) || 0;
                const diff = bal - grandTotal;
                const isInsufficient = diff < 0;
                return (
                  <div className={`p-2 rounded text-[10px] font-mono uppercase ${isInsufficient ? 'bg-red-950/40 text-red-300 border border-red-500/10' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/10'}`}>
                    <p>ቀሪ ሂሳብ (Your Balance): {bal} ብር</p>
                    <p>የክፍያ ሂሳብ (Billing Cost): {grandTotal} ብር</p>
                    {isInsufficient ? (
                      <p className="font-black text-red-400 pt-1">⚠️ ማስጠንቀቂያ፡ አካውንትዎ ላይ በቂ ቀሪ ሂሳብ የለም!</p>
                    ) : (
                      <p className="font-black pt-1">✅ በቂ ሂሳብ አለዎት! ከክፍያ በኋላ ቀሪ: {diff} ብር</p>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Bottom pay action */}
          <div className="p-4 bg-[#0b1319] border-t border-white/15">
            <button 
              type="button"
              onClick={() => {
                if (!chapaAccountNumber.trim()) {
                  alert('⚠️ እባክዎ የእርስዎን አካውንት/ስልክ ቁጥር ያስገቡ! / Account number is required.');
                  return;
                }
                const balanceNum = Number(chapaUserBalance) || 0;
                if (balanceNum < grandTotal) {
                  alert('⚠️ የተሞላው ቀሪ የሂሳብ መጠን ከሚከፈለው ጠቅላላ ሂሳብ ያንሳል! መክፈል አይቻልም። / Insufficient funds in connected account.');
                  return;
                }
                if (!chapaUserPin.trim() || chapaUserPin.length < 4) {
                  alert('⚠️ እባክዎ የእርስዎን የሚስጥር የክፍያ ቁጥር (ቢያንስ 4 ዲጂት) ያስገቡ! / Secure PIN must be at least 4 digits.');
                  return;
                }

                alert(`💳 በቻፓ በኩል ክፍያ በተሳካ ሁኔታ ተፈጽሟል! \n\nየተመረጠ ቻናል፡ ${selectedChapaMethod.toUpperCase()}\nየተቀባይ ባንክ ID፡ ${chapaSelectedLodgeBankId || 'Lodge Merchant'}\nየተቀነሰ ክፍያ፡ ${grandTotal} ብር\nየአካውንትዎ ቀሪ ሂሳብ፡ ${balanceNum - grandTotal} ብር\n\nትዕዛዝዎ በተሳካ ሁኔታ ተመዝግቧል። / Payment fully authorized and order placed with Chapa.`);
                const mockTxn = 'CHAP-REF-' + Math.floor(100000 + Math.random() * 900000);
                setShowChapaGateway(false);
                executeOrderPlacement(mockTxn);
              }}
              className="w-full bg-[#00f5ff] hover:bg-white text-black font-black uppercase text-xs tracking-wider py-3.5 transition-all shadow-[0px_0px_20px_0px_rgba(0,245,255,0.2)] rounded-lg cursor-pointer text-center"
            >
              SECURELY PAY {grandTotal} ETB NOW
            </button>
            <p className="text-center text-[9px] text-white/30 font-mono mt-2 uppercase tracking-tight">Verified by Chapa Security Core • SSL Enabled</p>
          </div>
        </div>
      )}

    </div>
  );
}
