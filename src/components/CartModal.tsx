/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderItem, BankAccount, OrderType, PaymentMethod } from '../types';
import { Trash2, Smartphone, MapPin, DollarSign, HelpCircle, X, ShoppingCart, Clock, ListOrdered, Volume2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { computeLiveOrderQueue } from '../utils/orderQueue';
import { buildCartSpeechPayload, playAccessibleChime, speakAccessibleText } from '../utils/menuVoiceReader';
import { useLanguage } from '../context/LanguageContext';

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
    cashPayMode?: 'cashier_desk' | 'waiter_or_delivery';
    cashTenderedAmount?: number;
    cashPaymentRequested?: boolean;
  }) => void;
  serviceChargeRate: number;
  vatRate: number;
  banks: BankAccount[];
  initialLocation?: string;
  chapaActive?: boolean;
  chapaKey?: string;
  chapaMode?: 'live' | 'test';
  appLang?: string;
  orders?: Order[];
  onOpenLiveTracker?: () => void;
  isVoiceOverEnabled?: boolean;
  voiceSpeed?: number;
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
  orders = [],
  onOpenLiveTracker,
  isVoiceOverEnabled = false,
  voiceSpeed = 1.0
}: CartModalProps) {
  const { appLang, tText, currency, isRtl } = useLanguage();
  const [cartNotice, setCartNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [chapaNotice, setChapaNotice] = useState<string | null>(null);
  const showCartNotice = (type: 'error' | 'success', text: string) => {
    setCartNotice({ type, text });
    window.setTimeout(() => {
      setCartNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };
  const cartUiLocales = {
    cart_title: {
      am: 'የእኔ የትዕዛዝ ቅርጫት',
      en: 'My Order Cart',
      or: 'Koodii Ajaja Koo',
      ti: 'ቅርጫት ትእዛዘይ',
      sid: 'Hajajote Qarachcho',
      fr: 'Mon Panier',
      de: 'Mein Warenkorb',
      it: 'Il Mio Carrello',
      zh: '我的购物车',
      ar: 'سلة طلباتي'
    },
    cart_subtitle: {
      am: 'ትዕዛዝ እና ክፍያ ማጠቃለያ',
      en: 'Shopping Cart & Checkout',
      or: 'Cuunfaa Ajajaa dabalataa',
      ti: 'መርኣዪ ትእዛዝን ክፍሊትን',
      sid: 'Hajajonna Baatooshshu Xaphooma',
      fr: 'Panier & Paiement',
      de: 'Warenkorb & Kasse',
      it: 'Carrello & Pagamento',
      zh: '购物车与结账',
      ar: 'سلة التسوق والدفع'
    },
    empty_cart: {
      am: '🎯 ትዕዛዝዎ ባዶ ነው!',
      en: '🎯 Your cart is empty!',
      or: '🎯 Meeshaan keessan duwwaadha!',
      ti: '🎯 ኵነታት ትእዛዝኩም ጥራይ እዩ!',
      sid: '🎯 Qarachchokki mullaaho!',
      fr: '🎯 Votre panier est vide !',
      de: '🎯 Ihr Warenkorb ist leer!',
      it: '🎯 Il tuo carrello è vuoto!',
      zh: '🎯 您的购物车是空的！',
      ar: '🎯 سلة الطلبات فارغة!'
    },
    order_type: {
      am: 'የአቅርቦት ሁኔታ',
      en: 'Order Type / Delivery Option',
      or: 'Bifa tajaajilaa',
      ti: 'ዓይነት ኣቅርቦት',
      sid: 'Shiqishshu Doogo',
      fr: 'Mode de Commande',
      de: 'Bestellart',
      it: 'Modalità di Servizio',
      zh: '点餐方式 / 配送选项',
      ar: 'نوع الطلب / خيار التوصيل'
    },
    dine_in: {
      am: '📍 በሎጁ / ጠረጴዛ',
      en: '📍 Table / Dine',
      or: '📍 Loojii Keessatti',
      ti: '📍 ኣብ ሎጅ',
      sid: '📍 Loojete Giddo',
      fr: '📍 Sur Place',
      de: '📍 Vor Ort',
      it: '📍 Al Tavolo',
      zh: '📍 堂食 / 桌位',
      ar: '📍 داخل المطعم / طاولة'
    },
    delivery: {
      am: '🛵 ዴሊቨሪ',
      en: '🛵 Delivery',
      or: '🛵 Deelivarii',
      ti: '🛵 ዴሊቨሪ',
      sid: '🛵 Iillishsha',
      fr: '🛵 Livraison',
      de: '🛵 Lieferung',
      it: '🛵 Consegna',
      zh: '🛵 外送配送',
      ar: '🛵 خدمة التوصيل'
    },
    room_number: {
      am: 'የክፍል / ጠረጴዛ ቁጥር',
      en: 'Room / Table Number',
      or: 'Lakkoofsa Kutaa / Minjaalaa',
      ti: 'ቁጽሪ ክፍሊ / ጠረጴዛ',
      sid: 'Kiflete / Xarapheezu Kiiro',
      fr: 'Numéro de Chambre / Table',
      de: 'Zimmer- / Tischnummer',
      it: 'Numero di Camera / Tavolo',
      zh: '房间号 / 桌号',
      ar: 'رقم الغرفة / الطاولة'
    },
    phone_number: {
      am: 'ስልክ ቁጥር',
      en: 'Phone Number',
      or: 'Lakkoofsa Bilbilaa',
      ti: 'ቁጽሪ ስልኪ',
      sid: 'Bilbilu Kiiro',
      fr: 'Numéro de Téléphone',
      de: 'Telefonnummer',
      it: 'Numero di Telefono',
      zh: '电话号码',
      ar: 'رقم الهاتف'
    },
    delivery_address: {
      am: 'የመድረሻ አድራሻ',
      en: 'Delivery Address',
      or: 'Teessoo Deelivarii',
      ti: 'ኣድራሻ መድረሻ',
      sid: 'Iillishshu Basa',
      fr: 'Adresse de Livraison',
      de: 'Lieferadresse',
      it: 'Indirizzo di Consegna',
      zh: '送货地址',
      ar: 'عنوان التوصيل'
    },
    tip: {
      am: 'ለአስተናጋጅዎ የቲፕ/ጉርሻ ስጦታ (Tip Staff)',
      en: 'Tip Our Waiters & Chefs',
      or: 'Eebba tajaajilaaf (Tip)',
      ti: 'ንሰራሕተኛታት ጉርሻ (Tip)',
      sid: 'Owaataanoonna Qishaanote Gursha (Tip)',
      fr: 'Laisser un Pourboire',
      de: 'Trinkgeld',
      it: 'Lascia una Mancia',
      zh: '给服务员与厨师小费',
      ar: 'إكرامية للنادل والطهاة'
    },
    payment_method: {
      am: 'የክፍያ አማራጭ',
      en: 'Payment Method',
      or: 'Filannoo Kaffaltii',
      ti: 'መርኣዪ ክፍሊት',
      sid: 'Baatooshshu Doogo',
      fr: 'Mode de Paiement',
      de: 'Zahlungsmethode',
      it: 'Metodo di Pagamento',
      zh: '支付方式',
      ar: 'طريقة الدفع'
    },
    cash: {
      am: '💵 በካሽ (ጥሬ ገንዘብ)',
      en: '💵 Cash / Cashier',
      or: '💵 Kaashii (Maallaqa)',
      ti: '💵 ብጥረ ገንዘብ (Cash)',
      sid: '💵 Kaashe / Womaasha',
      fr: '💵 Espèces / Caisse',
      de: '💵 Bar / Kasse',
      it: '💵 Contanti / Cassa',
      zh: '💵 现金 / 收银台',
      ar: '💵 نقداً / الصندوق'
    },
    bank: {
      am: '🏦 የባንክ አካውንት',
      en: '🏦 Bank / Telebirr',
      or: '🏦 Kaffaltii Baankii',
      ti: '🏦 ብባንኪ አካውንት',
      sid: '🏦 Baanke / Telebirr',
      fr: '🏦 Transfert Bancaire',
      de: '🏦 Banküberweisung',
      it: '🏦 Bonifico',
      zh: '🏦 银行转账 / Telebirr',
      ar: '🏦 تحويل بنكي / Telebirr'
    },
    chapa_secure: {
      am: '💳 ቻፓ ፖርታል (ፈጣን ክፍያ)',
      en: '💳 Chapa Pay Portal',
      or: '💳 Kaffaltii Chapaa',
      ti: '💳 ቻፓ ክፍሊት',
      sid: '💳 Chapa Raho Baatooshshe',
      fr: '💳 Chapa Direct',
      de: '💳 Chapa Pay',
      it: '💳 Pagamento Chapa',
      zh: '💳 Chapa 在线支付',
      ar: '💳 بوابة الدفع Chapa'
    },
    place_order_btn: {
      am: 'ትዕዛዙን ጨርስ (PLACE ORDER) ⚡',
      en: 'PLACE ORDER NOW ⚡',
      or: 'AJAJA XUMURI ⚡',
      ti: 'ትእዛዝ ጨርስ ⚡',
      sid: 'AJAJA XURSI ⚡',
      fr: 'VALIDER LA COMMANDE ⚡',
      de: 'JETZT BESTELLEN ⚡',
      it: 'CONFERMA ORDINAZIONE ⚡',
      zh: '立即下单 ⚡',
      ar: 'إتمام الطلب الآن ⚡'
    },
    subtotal: {
      am: 'ንዑስ ድምር',
      en: 'Subtotal',
      or: 'Kaffaltii duraa',
      ti: 'ንኡስ ጠቕላላ',
      sid: 'Cinaancho Xaphooma',
      fr: 'Sous-total',
      de: 'Zwischensumme',
      it: 'Subtotale',
      zh: '小计',
      ar: 'المجموع الفرعي'
    },
    service_charge: {
      am: 'የአገልግሎት ክፍያ',
      en: 'Service Charge',
      or: 'Kaffaltii Tajaajilaa',
      ti: 'ክፍሊት ኣገልግሎት',
      sid: 'Owaatote Baatooshshe',
      fr: 'Frais de Service',
      de: 'Servicegebühr',
      it: 'Costi di Servizio',
      zh: '服务费',
      ar: 'رسوم الخدمة'
    },
    vat: {
      am: 'ተጨማሪ እሴት ታክስ (VAT)',
      en: 'VAT (Tax)',
      or: 'Kaffaltii Gibiraa (VAT)',
      ti: 'ተወሳኺ እሴት ታክስ',
      sid: 'VAT Giwira',
      fr: 'TVA',
      de: 'Umsatzsteuer (MwSt.)',
      it: 'IVA',
      zh: '增值税 (VAT)',
      ar: 'ضريبة القيمة المضافة'
    },
    tip_label: {
      am: 'ጉርሻ',
      en: 'Tip Added',
      or: 'Tip dabalata',
      ti: 'ጉርሻ',
      sid: 'Gursha (Tip)',
      fr: 'Pourboire',
      de: 'Trinkgeld',
      it: 'Mancia',
      zh: '小费',
      ar: 'الإكرامية'
    },
    grand_total: {
      am: 'ጠቅላላ ሂሳብ',
      en: 'Grand Total',
      or: 'Waliigala Kaffaltii',
      ti: 'ጠቕላላ ሒሳብ',
      sid: 'Xaphooma Baatooshshe',
      fr: 'Total Général',
      de: 'Gesamtsumme',
      it: 'Totale Complessivo',
      zh: '总计',
      ar: 'المجموع الكلي'
    },
    ref_placeholder: {
      am: 'የባንክ ማረጋገጫ ቁጥር (Txn Ref)',
      en: 'Input Bank Txn Reference Number',
      or: 'Koodii baankii galchi',
      ti: 'ቁጽሪ መረጋገጺ ባንኪ',
      sid: 'Baankete Buuxote Kiiro Eessi',
      fr: 'Numéro de Référence',
      de: 'Überweisungsreferenz',
      it: 'Riferimento Transazione',
      zh: '输入银行交易参考号',
      ar: 'أدخل رقم مرجع المعاملة البنكية'
    },
    receipt_upload: {
      am: 'የክፍያ ደረሰኝ ፎቶ (ከተፈለገ)',
      en: 'Upload Receipt Screenshot (Optional)',
      or: 'Waraqaa kaffaltii ergi',
      ti: 'ስእሊ ደረሰኝ ክፍሊት',
      sid: 'Baatooshshu Risiite Suura (Dooramannoho)',
      fr: 'Télécharger le Reçu (Optionnel)',
      de: 'Überweisungsbeleg (Optional)',
      it: 'Carica Ricevuta Bancaria (Opzionale)',
      zh: '上传付款凭证截图（可选）',
      ar: 'تحميل صورة إيصال الدفع (اختياري)'
    },
    receipt_comment_placeholder: {
      am: 'ተጨማሪ ማሳሰቢያ እዚህ ይጻፉ...',
      en: 'Any checkout comments for staff...',
      or: 'Yaada dabalataa...',
      ti: 'ተወሳኺ ምሳሰቢ...',
      sid: 'Owaataanote ledote hedo...',
      fr: 'Notes pour le personnel...',
      de: 'Anmerkungen für das Personal...',
      it: 'Commenti o note...',
      zh: '给工作人员的备注说明...',
      ar: 'أضف ملاحظات إضافية للطاقم...'
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
  const [cashPayMode, setCashPayMode] = useState<'cashier_desk' | 'waiter_or_delivery'>('cashier_desk');
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('');

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
          showCartNotice('error', `❌ ${error.message}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('lodge-media')
          .getPublicUrl(fileName);

        if (!publicUrl) {
          throw new Error("Could not retrieve public URL for uploaded receipt.");
        }

        setReceiptScreenshot(publicUrl);
        showCartNotice('success', tText({
          am: '📸 ደረሰኝ በተሳካ ሁኔታ ተጭኗል!',
          or: '📸 Waraqaan kaffaltii milkiin ol-fe\'ameera!',
          ti: '📸 ደረሰኝ ብዓወት ተዓኒኑ!',
          sid: '📸 Rasiidete misile keereenni qassamino!',
          en: '📸 Receipt image uploaded successfully.',
          fr: '📸 Image du reçu téléversée avec succès.',
          de: '📸 Belegbild erfolgreich hochgeladen.',
          it: '📸 Ricevuta caricata con successo.',
          zh: '📸 付款凭证已成功上传。',
          ar: '📸 تم رفع صورة الإيصال بنجاح.'
        }));
      } catch (err: any) {
        console.error("Receipt upload failed:", err);
        showCartNotice('error', `❌ ${err.message || err}`);
      }
    }
  };

  useEffect(() => {
    if (isOpen && banks.length > 0) {
      setSelectedBankId(banks[0].id);
    }
  }, [isOpen, banks]);

  const liveQueue = useMemo(() => computeLiveOrderQueue(orders), [orders]);
  const ordersAheadNow = liveQueue.activeKitchenQueue.length;
  const projectedPosition = ordersAheadNow + 1;
  const estimatedWaitNow = Math.max(8, ordersAheadNow * 5 + 8);

  const playCartChime = (kind: Parameters<typeof playAccessibleChime>[0]) => {
    if (!isVoiceOverEnabled) return;
    playAccessibleChime(kind);
  };

  const speakCartFeedback = (nativeText: string, fallbackEnText?: string, force = false) => {
    if (!isVoiceOverEnabled && !force) return;
    speakAccessibleText(nativeText, appLang, {
      rate: voiceSpeed,
      fallbackEnText,
    });
  };

  const readCartSummaryAloud = (force = false) => {
    const payload = buildCartSpeechPayload({
      cart,
      appLang,
      serviceChargeRate,
      vatRate,
    });
    const queueExtraLocalized = tText({
      am: ` በኩሽና ወረፋ ከፊትዎ ${ordersAheadNow} ትዕዛዞች አሉ፤ የእርስዎ ተራ ${projectedPosition}ኛ ነው።`,
      or: ` Toora kushinaa keessaa dura keessan ajajni ${ordersAheadNow} jira; dabareen keessan lakk. ${projectedPosition} dha.`,
      ti: ` ኣብ ወረፋ ክሽነ ቅድሜኹም ${ordersAheadNow} ትእዛዛት ኣለዉ፤ ተራኹም መበል ${projectedPosition} እዩ።`,
      sid: ` Kushinete boora aana albaanni ${ordersAheadNow} hajajubba no; atihu ${projectedPosition}kki bayichoho.`,
      en: ` Kitchen queue: ${ordersAheadNow} orders ahead, your estimated spot is number ${projectedPosition}, estimated wait ${estimatedWaitNow} minutes.`,
      fr: ` File cuisine : ${ordersAheadNow} commandes devant vous, votre place estimée est numéro ${projectedPosition}, attente ${estimatedWaitNow} min.`,
      de: ` Küchenwarteschlange: ${ordersAheadNow} Bestellungen vor Ihnen, Position ${projectedPosition}, Wartezeit ca. ${estimatedWaitNow} Min.`,
      it: ` Coda cucina: ${ordersAheadNow} ordini prima di te, posizione stimata n. ${projectedPosition}, attesa ${estimatedWaitNow} min.`,
      zh: ` 厨房队列：前方有 ${ordersAheadNow} 个订单，您的预计顺位是第 ${projectedPosition} 位，预计等待 ${estimatedWaitNow} 分钟。`,
      ar: ` طابور المطبخ: ${ordersAheadNow} طلبات قبلك، ترتيبك المتوقع ${projectedPosition} والانتظار المقدر ${estimatedWaitNow} دقيقة.`
    });
    const queueExtraEn = ` Kitchen queue: ${ordersAheadNow} orders ahead, your estimated spot is number ${projectedPosition}, estimated wait ${estimatedWaitNow} minutes.`;
    const nativeWithQueue = cart.length > 0 ? `${payload.nativeText}${queueExtraLocalized}` : payload.nativeText;
    const enWithQueue = cart.length > 0 ? `${payload.fallbackEnText}${queueExtraEn}` : payload.fallbackEnText;
    if (isVoiceOverEnabled || force) {
      playAccessibleChime('select');
    }
    speakCartFeedback(nativeWithQueue, enWithQueue, force);
  };

  useEffect(() => {
    if (isOpen && isVoiceOverEnabled) {
      const timer = setTimeout(() => {
        readCartSummaryAloud(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const serviceCharge = Math.round((subtotal * serviceChargeRate) / 100);
  const vat = Math.round(((subtotal + serviceCharge) * vatRate) / 100);

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
      const msg = tText({
        am: 'የእርስዎ የትዕዛዝ ቅርጫት ባዶ ነው!',
        or: 'Koodiin ajaja keessanii duwwaadha!',
        ti: 'ቅርጫት ትእዛዝኩም ጥራይ እዩ!',
        sid: 'Hajajote qarachchokki mullaaho!',
        en: 'Your order cart is empty.',
        fr: 'Votre panier est vide.',
        de: 'Ihr Warenkorb ist leer.',
        it: 'Il tuo carrello è vuoto.',
        zh: '您的购物车是空的。',
        ar: 'سلة طلباتك فارغة.'
      });
      playCartChime('alert');
      speakCartFeedback(msg, 'Your order cart is empty.');
      showCartNotice('error', msg);
      return;
    }

    if (orderType === 'dine' && !location.trim()) {
      const msg = tText({
        am: 'እባክዎ የጠረጴዛ ወይም ክፍል ቁጥር ያስገቡ።',
        or: 'Maaloo lakkoofsa minjaalaa ykn kutaa galchaa.',
        ti: 'በጃኹም ቁጽሪ ጠረጴዛ ወይ ክፍሊ የእትዉ።',
        sid: 'Eegganno xarapheezu woy kiflete kiiro eessi.',
        en: 'Please provide table or room number.',
        fr: 'Veuillez indiquer votre numéro de table ou chambre.',
        de: 'Bitte geben Sie eine Tisch- oder Zimmernummer an.',
        it: 'Inserisci il numero di tavolo o camera.',
        zh: '请输入桌号或房间号。',
        ar: 'يرجى إدخال رقم الطاولة أو الغرفة.'
      });
      playCartChime('alert');
      speakCartFeedback(msg, 'Please provide table or room number.');
      showCartNotice('error', msg);
      return;
    }

    if (orderType === 'delivery') {
      if (!phone.trim()) {
        const msg = tText({
          am: 'እባክዎ ስልክ ቁጥር ያስገቡ።',
          or: 'Maaloo lakkoofsa bilbilaa galchaa.',
          ti: 'በጃኹም ቁጽሪ ስልኪ የእትዉ።',
          sid: 'Eegganno bilibilu kiiro eessi.',
          en: 'Phone number is required for delivery.',
          fr: 'Le numéro de téléphone est requis pour la livraison.',
          de: 'Telefonnummer für die Lieferung erforderlich.',
          it: 'Numero di telefono obbligatorio per la consegna.',
          zh: '外送需要填写电话号码。',
          ar: 'رقم الهاتف مطلوب للتوصيل.'
        });
        playCartChime('alert');
        speakCartFeedback(msg, 'Phone number is required for delivery.');
        showCartNotice('error', msg);
        return;
      }
      if (!address.trim()) {
        const msg = tText({
          am: 'እባክዎ የመድረሻ አድራሻ ያስገቡ።',
          or: 'Maaloo teessoo deelivarii galchaa.',
          ti: 'በጃኹም ኣድራሻ መድረሻ የእትዉ።',
          sid: 'Eegganno iillishshu teesso eessi.',
          en: 'Delivery address is required.',
          fr: 'L’adresse de livraison est requise.',
          de: 'Lieferadresse ist erforderlich.',
          it: 'Indirizzo di consegna obbligatorio.',
          zh: '需要填写送货地址。',
          ar: 'عنوان التوصيل مطلوب.'
        });
        playCartChime('alert');
        speakCartFeedback(msg, 'Delivery address is required.');
        showCartNotice('error', msg);
        return;
      }
    }

    if (payment === 'bank') {
      if (!selectedBankId) {
        const msg = tText({
          am: 'እባክዎ መጀመሪያ የባንክ አካውንት ይምረጡ።',
          or: 'Maaloo dura herrega baankii filadhaa.',
          ti: 'በጃኹም ቅድሚ ኹሉ ናይ ባንኪ ኣካውንት ምረጹ።',
          sid: 'Eegganno balaxxe baankete akawunte doori.',
          en: 'Please select a bank account first.',
          fr: 'Veuillez d’abord sélectionner un compte bancaire.',
          de: 'Bitte wählen Sie zuerst ein Bankkonto aus.',
          it: 'Seleziona prima un conto bancario.',
          zh: '请先选择收款银行账户。',
          ar: 'يرجى اختيار الحساب البنكي أولاً.'
        });
        playCartChime('alert');
        speakCartFeedback(msg, 'Please select a bank account.');
        showCartNotice('error', msg);
        return;
      }
      if (!bankRef.trim()) {
        const msg = tText({
          am: 'እባክዎ የባንክ ማረጋገጫ ቁጥር (Txn Ref) ያስገቡ።',
          or: 'Maaloo lakkoofsa mirkaneessa baankii galchaa.',
          ti: 'በጃኹም ቁጽሪ መረጋገጺ ባንኪ የእትዉ።',
          sid: 'Eegganno baankete buuxote kiiro eessi.',
          en: 'Please input bank transaction reference number.',
          fr: 'Veuillez saisir la référence de transaction bancaire.',
          de: 'Bitte geben Sie die Transaktionsreferenz ein.',
          it: 'Inserisci il numero di riferimento bancario.',
          zh: '请输入银行交易参考号。',
          ar: 'يرجى إدخال رقم مرجع التحويل البنكي.'
        });
        playCartChime('alert');
        speakCartFeedback(msg, 'Please input bank transaction reference number.');
        showCartNotice('error', msg);
        return;
      }
    }

    if (payment === 'chapa') {
      if (!chapaEmail.trim()) {
        const msg = tText({
          am: 'እባክዎ የቻፓ ኢሜይል ያስገቡ።',
          or: 'Maaloo iimeelii Chapa galchaa.',
          ti: 'በጃኹም ናይ ቻፓ ኢሜይል የእትዉ።',
          sid: 'Eegganno Chapa imeele eessi.',
          en: 'Chapa billing email is required.',
          fr: 'L’e-mail de facturation Chapa est requis.',
          de: 'Chapa-Rechnungs-E-Mail erforderlich.',
          it: 'Email di fatturazione Chapa richiesta.',
          zh: '需要填写 Chapa 账单邮箱。',
          ar: 'البريد الإلكتروني لفوترة Chapa مطلوب.'
        });
        playCartChime('alert');
        speakCartFeedback(msg, 'Chapa billing email is required.');
        showCartNotice('error', msg);
        return;
      }
      if (!chapaFirstName.trim() || !chapaLastName.trim()) {
        const msg = tText({
          am: 'እባክዎ ስም እና የአያት ስም ያስገቡ።',
          or: 'Maaloo maqaa fi maqaa akaakayyuu galchaa.',
          ti: 'በጃኹም ስምን ስም ኣቦን የእትዉ።',
          sid: 'Eegganno su’manna annu su’ma eessi.',
          en: 'First and last name are required.',
          fr: 'Le prénom et le nom sont requis.',
          de: 'Vor- und Nachname sind erforderlich.',
          it: 'Nome e cognome obbligatori.',
          zh: '需要填写名和姓。',
          ar: 'الاسم الأول والأخير مطلوبان.'
        });
        playCartChime('alert');
        speakCartFeedback(msg, 'First and last name are required.');
        showCartNotice('error', msg);
        return;
      }
      setChapaNotice(null);
      setShowChapaGateway(true);
      return;
    }

    if (payment === 'cash' && cashTenderedInput.trim() !== '') {
      const parsedCash = Number(cashTenderedInput);
      if (Number.isNaN(parsedCash) || parsedCash < grandTotal) {
        const msg = tText({
          am: `⚠️ የገባው የጥሬ ገንዘብ መጠን ከጠቅላላው ሂሳብ (${grandTotal} ${currency}) ያንሳል።`,
          en: `⚠️ Tendered cash cannot be less than grand total (${grandTotal} ${currency}).`,
          or: `⚠️ Maallaqni galchitan waliigala (${grandTotal} ${currency}) gadi ta’uu hin qabu.`,
          ti: `⚠️ ዝኣተወ ጥረ ገንዘብ ካብ ጠቕላላ ሒሳብ (${grandTotal} ${currency}) ክንእስ የብሉን።`,
          sid: `⚠️ Eessinoonni kaashi xaphooma (${grandTotal} ${currency}) woroonni ikka hasiissanno.`,
          fr: `⚠️ Le montant remis ne peut pas être inférieur au total (${grandTotal} ${currency}).`,
          de: `⚠️ Der gegebene Betrag darf nicht unter ${grandTotal} ${currency} liegen.`,
          it: `⚠️ L’importo in contanti non può essere inferiore a ${grandTotal} ${currency}.`,
          zh: `⚠️ 支付现金额度不能少于总额 ${grandTotal} ${currency}。`,
          ar: `⚠️ لا يمكن أن يكون المبلغ النقدي أقل من الإجمالي (${grandTotal} ${currency}).`
        });
        playCartChime('alert');
        speakCartFeedback(msg, `Tendered cash cannot be less than ${grandTotal} ${currency}.`);
        showCartNotice('error', msg);
        return;
      }
    }

    executeOrderPlacement();
  };

  const executeOrderPlacement = (customRef?: string) => {
    const parsedCashTendered =
      payment === 'cash' && cashTenderedInput.trim() !== '' && !Number.isNaN(Number(cashTenderedInput))
        ? Number(cashTenderedInput)
        : undefined;

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
      receiptComment: payment === 'bank' || payment === 'cash'
        ? (receiptComment.trim() || undefined)
        : (payment === 'chapa' ? `Chapa Secure Verified. Billing: ${chapaFirstName} ${chapaLastName} (${chapaEmail})` : undefined),
      cashPayMode: payment === 'cash' ? cashPayMode : undefined,
      cashTenderedAmount: parsedCashTendered,
      cashPaymentRequested: payment === 'cash',
    });

    // Reset screenshot & comment after order placing
    setReceiptScreenshot('');
    setReceiptComment('');
    setCashTenderedInput('');
    setChapaFirstName('');
    setChapaLastName('');
    onClose();
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="fixed inset-0 bg-[#5C0A0A]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-stone-200 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] text-stone-900">
        
        {/* Yellow, White, Red top accent header banner */}
        <div className="h-2 w-full bg-gradient-to-r from-yellow-400 via-red-600 to-yellow-400"></div>

        <div className="p-4 sm:p-5 border-b border-stone-200 bg-[#b21f1f] text-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#f4c22b] text-stone-900 flex items-center justify-center font-bold shadow-md shrink-0">
              <ShoppingCart className="w-5 h-5 text-stone-900" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                {cartUiLocales.cart_title[appLang as keyof typeof cartUiLocales.cart_title] || cartUiLocales.cart_title.en}
              </h3>
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-yellow-200/90 font-bold">
                {cartUiLocales.cart_subtitle[appLang as keyof typeof cartUiLocales.cart_subtitle] || cartUiLocales.cart_subtitle.en}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-cart-read-summary"
              onClick={() => readCartSummaryAloud(true)}
              aria-label={tText({
                am: 'ቅርጫቱን በድምፅ አንብብ',
                or: 'Qarxaa sagaleedhaan dubbisi',
                ti: 'ዘምቢል ብድምጺ ኣንብብ',
                sid: 'Qaajjisha huuroteenni nabbawi',
                en: 'Read Cart Summary Aloud',
                fr: 'Lire le panier à voix haute',
                de: 'Warenkorb vorlesen',
                it: 'Leggi il carrello ad alta voce',
                zh: '语音朗读购物车摘要',
                ar: 'قراءة ملخص السلة بصوت عالٍ'
              })}
              className="px-3 py-1.5 rounded-full bg-[#f4c22b] hover:bg-yellow-300 text-stone-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Volume2 className="w-4 h-4" />
              <span>{tText({
                am: 'አንብብ',
                or: 'Dubbisi',
                ti: 'ኣንብብ',
                sid: 'Nabbawi',
                en: 'Read',
                fr: 'Lire',
                de: 'Vorlesen',
                it: 'Leggi',
                zh: '朗读',
                ar: 'قراءة'
              })}</span>
            </button>
            <button 
              onClick={onClose} 
              aria-label={tText({
                am: 'ቅርጫት ዝጋ',
                or: 'Qarxaa cufi',
                ti: 'ዘምቢል ዕጸው',
                sid: 'Qaajjisha cufi',
                en: 'Close Cart',
                fr: 'Fermer le panier',
                de: 'Warenkorb schließen',
                it: 'Chiudi carrello',
                zh: '关闭购物车',
                ar: 'إغلاق السلة'
              })}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              id="btn-close-cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar bg-white">
          {cartNotice && (
            <div
              role="alert"
              className={`rounded-2xl px-3.5 py-2.5 text-xs font-bold border flex items-center justify-between gap-2 ${
                cartNotice.type === 'error'
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <span>{cartNotice.text}</span>
              <button
                type="button"
                onClick={() => setCartNotice(null)}
                className="p-0.5 rounded hover:bg-black/5 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          {/* Cart items list styled like menu cards */}
          {cart.length === 0 ? (
            <div className="py-12 text-center text-stone-500 font-bold border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 p-6">
              <span className="text-3xl block mb-2">🛒</span>
              {cartUiLocales.empty_cart[appLang as keyof typeof cartUiLocales.empty_cart] || cartUiLocales.empty_cart.en}
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase text-[#b21f1f] font-black tracking-widest block">
                {tText({
                  am: 'የተመረጡ የምግብና መጠጥ አይነቶች',
                  or: 'NYAATAA FI DHUGAATII FILATAMAN',
                  ti: 'ዝተመርጹ መግብን መስተን',
                  sid: 'DOORANTINO SAGALENNA AGATTO',
                  en: 'SELECTED MENU ITEMS',
                  fr: 'ARTICLES SÉLECTIONNÉS',
                  de: 'AUSGEWÄHLTE ARTIKEL',
                  it: 'ARTICOLI SELEZIONATI',
                  zh: '已选菜品与饮品',
                  ar: 'الأصناف المختارة'
                })}
              </span>
              {cart.map((item, idx) => (
                <div key={idx} className="bg-stone-50 text-stone-900 rounded-2xl p-3.5 flex justify-between items-center shadow-sm border border-stone-200 transition-all hover:border-[#b21f1f]">
                  <div className="pr-2">
                    <h5 className="text-xs sm:text-sm font-black tracking-tight text-stone-900">{item.name}</h5>
                    <p className="text-[11px] text-stone-600 font-mono font-bold mt-0.5">
                      {item.qty} × {item.price} {currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono text-xs font-black bg-[#f4c22b] text-stone-900 px-3 py-1 rounded-xl shadow-sm">
                      {item.qty * item.price} {currency}
                    </span>
                    <button 
                      id={`delete-cart-item-${idx}`}
                      onClick={() => {
                        onRemoveItem(item.id);
                        playCartChime('step');
                        const removedNative = tText({
                          am: `${item.name} ከቅርጫት ተሰርዟል።`,
                          or: `${item.name} qarxaa keessaa haqameera.`,
                          ti: `${item.name} ካብ ዘምቢል ተሰሪዙ።`,
                          sid: `${item.name} qaajjishunni hoongeessiinoonni.`,
                          en: `Removed ${item.name} from cart.`,
                          fr: `${item.name} retiré du panier.`,
                          de: `${item.name} aus dem Warenkorb entfernt.`,
                          it: `${item.name} rimosso dal carrello.`,
                          zh: `已从购物车移除 ${item.name}。`,
                          ar: `تمت إزالة ${item.name} من السلة.`
                        });
                        speakCartFeedback(removedNative, `Removed ${item.name} from cart.`);
                      }} 
                      aria-label={`${tText({ am: 'አስወግድ', or: 'Haqi', ti: 'ኣወግድ', sid: 'Huni', en: 'Remove', fr: 'Retirer', de: 'Entfernen', it: 'Rimuovi', zh: '移除', ar: 'إزالة' })} ${item.name}`}
                      className="p-1.5 text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-xl transition-colors cursor-pointer"
                      title={tText({ am: 'አስወግድ', or: 'Haqi', ti: 'ኣወግድ', sid: 'Huni', en: 'Remove item', fr: 'Retirer l’article', de: 'Artikel entfernen', it: 'Rimuovi articolo', zh: '移除菜品', ar: 'إزالة الصنف' })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIVE KITCHEN QUEUE PREVIEW WHILE ORDERING */}
          <div className="bg-[#fcfbf7] border border-[#ebe5d8] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-stone-900">
                <ListOrdered className="w-4 h-4 text-[#b21f1f] shrink-0" />
                <span>
                  {tText({
                    am: 'የቀጥታ ኩሽና ወረፋ ሁኔታ (Live Queue Check)',
                    or: 'Haala Toora Kushiinaa Kallattii',
                    ti: 'ቀጥታ ኩነታት ወረፋ ክሽነ',
                    sid: 'Kishinete Xooxxote Deeta (Live)',
                    en: 'Live Kitchen Queue Check',
                    fr: 'File d’Attente Cuisine en Direct',
                    de: 'Live-Küchenwarteschlange',
                    it: 'Stato Coda Cucina in Diretta',
                    zh: '实时厨房排队状态',
                    ar: 'حالة قائمة انتظار المطبخ المباشرة'
                  })}
                </span>
              </div>
              {onOpenLiveTracker && (
                <button
                  type="button"
                  onClick={onOpenLiveTracker}
                  className="text-[11px] font-black text-[#b21f1f] hover:underline cursor-pointer shrink-0"
                >
                  {tText({
                    am: 'ላይቭ ቦርድ ይመልከቱ →',
                    or: 'Boordii Kallattii Ilaali →',
                    ti: 'ቀጥታ ሰሌዳ ርአ →',
                    sid: 'Laayivi Boorde Lai →',
                    en: 'View Live Board →',
                    fr: 'Voir le Tableau Live →',
                    de: 'Live-Board ansehen →',
                    it: 'Vedi Bacheca Live →',
                    zh: '查看实时看板 →',
                    ar: 'عرض اللوحة المباشرة ←'
                  })}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white border border-stone-200 rounded-xl p-2">
                <span className="text-[10px] text-stone-500 font-bold block">
                  {tText({
                    am: 'ከፊትዎ ያሉ',
                    or: 'Fuuldura Kee',
                    ti: 'ቅድሜኻ ዘለዉ',
                    sid: 'Albakki Noore',
                    en: 'Ahead Now',
                    fr: 'Avant vous',
                    de: 'Vor Ihnen',
                    it: 'Prima di te',
                    zh: '前方订单',
                    ar: 'قبلك الآن'
                  })}
                </span>
                <span className="text-base font-mono font-black text-[#b21f1f] tabular-nums">
                  {ordersAheadNow}
                </span>
              </div>
              <div className="bg-[#f4c22b]/20 border border-[#f4c22b] rounded-xl p-2">
                <span className="text-[10px] text-stone-800 font-bold block">
                  {tText({
                    am: 'የእርስዎ ተራ',
                    or: 'Toora Kee',
                    ti: 'ተራኻ',
                    sid: 'Ati Xooxxo',
                    en: 'Your Spot',
                    fr: 'Votre Rang',
                    de: 'Ihr Platz',
                    it: 'Il tuo Posto',
                    zh: '您的排位',
                    ar: 'دورك'
                  })}
                </span>
                <span className="text-base font-mono font-black text-stone-900 tabular-nums">
                  #{projectedPosition}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-2">
                <span className="text-[10px] text-stone-500 font-bold block">
                  {tText({
                    am: 'ግምታዊ ጊዜ',
                    or: 'Yeroo Tilmaamaa',
                    ti: 'ግምታዊ ግዜ',
                    sid: 'Hedo Yanna',
                    en: 'Est. Wait',
                    fr: 'Attente Est.',
                    de: 'Wartezeit',
                    it: 'Attesa St.',
                    zh: '预计等待',
                    ar: 'الانتظار المقدر'
                  })}
                </span>
                <span className="text-base font-mono font-black text-stone-800 tabular-nums">
                  ~{estimatedWaitNow}m
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 font-semibold leading-snug">
              {ordersAheadNow === 0
                ? tText({
                    am: '🎯 ከእርስዎ በፊት ምንም ትዕዛዝ የለም — አሁን ካዘዙ #1ኛ ተራ ላይ ይሆናሉ!',
                    or: '🎯 Ajajni fuuldura kee hin jiru — yoo amma ajajje #1 taata!',
                    ti: '🎯 ቅድሜኻ ዝኾነ ትእዛዝ የለን — ሕጂ እንተኣዚዝካ #1 ክትከውን ኢኻ!',
                    sid: '🎯 Albakki ajaju dino — xa ajajittoro #1 ikkatto!',
                    en: '🎯 0 orders ahead right now — ordering now makes you #1 in line!',
                    fr: '🎯 0 commande devant vous — vous serez n°1 en commandant maintenant !',
                    de: '🎯 Keine Bestellung vor Ihnen — Sie sind sofort Nr. 1!',
                    it: '🎯 0 ordini prima di te — ordinando ora sarai #1 in fila!',
                    zh: '🎯 前方无等待订单 — 现在下单即刻排第 1 位！',
                    ar: '🎯 لا توجد طلبات قبلك الآن — طلبك سيكون رقم 1!'
                  })
                : tText({
                    am: `⏳ በአሁኑ ሰዓት ${ordersAheadNow} ትዕዛዝ(ዞች) ከፊትዎ አሉ (${liveQueue.preparingOrders.length} እየተዘጋጁ፣ ${liveQueue.pendingOrders.length} ወረፋ ላይ) — አሁን ካዘዙ #${projectedPosition}ኛው ትዕዛዝ ላይ ይሆናሉ።`,
                    or: `⏳ Amma ajaja ${ordersAheadNow} fuuldura kee jira (${liveQueue.preparingOrders.length} qophaa'aa jira, ${liveQueue.pendingOrders.length} toora irra) — ajajni kee #${projectedPosition} ta'a.`,
                    ti: `⏳ ሕጂ ${ordersAheadNow} ትእዛዝ(ታት) ቅድሜኻ ኣለዉ (${liveQueue.preparingOrders.length} ይዳለዉ ኣለዉ፣ ${liveQueue.pendingOrders.length} ኣብ ወረፋ) — ተራኻ #${projectedPosition} ክኸውን እዩ።`,
                    sid: `⏳ Xa ${ordersAheadNow} ajaja albakki no (${liveQueue.preparingOrders.length} qixxaawanni no, ${liveQueue.pendingOrders.length} xooxxote aana) — ajajikki #${projectedPosition} ikkanno.`,
                    en: `⏳ ${ordersAheadNow} order(s) ahead (${liveQueue.preparingOrders.length} preparing, ${liveQueue.pendingOrders.length} queued) — your order will be #${projectedPosition} in line.`,
                    fr: `⏳ ${ordersAheadNow} commande(s) devant vous (${liveQueue.preparingOrders.length} en préparation, ${liveQueue.pendingOrders.length} en attente) — vous serez #${projectedPosition}.`,
                    de: `⏳ ${ordersAheadNow} Bestellung(en) vor Ihnen (${liveQueue.preparingOrders.length} in Zubereitung, ${liveQueue.pendingOrders.length} wartend) — Ihr Platz: #${projectedPosition}.`,
                    it: `⏳ ${ordersAheadNow} ordini prima di te (${liveQueue.preparingOrders.length} in preparazione, ${liveQueue.pendingOrders.length} in coda) — sarai #${projectedPosition}.`,
                    zh: `⏳ 前方有 ${ordersAheadNow} 个订单（${liveQueue.preparingOrders.length} 制作中，${liveQueue.pendingOrders.length} 排队中）— 您的订单排第 #${projectedPosition} 位。`,
                    ar: `⏳ يوجد ${ordersAheadNow} طلبات قبلك (${liveQueue.preparingOrders.length} قيد التحضير، ${liveQueue.pendingOrders.length} في الانتظار) — طلبك سيكون رقم #${projectedPosition}.`
                  })}
            </p>
          </div>

          {/* Delivery Configuration */}
          <div className="border-t border-stone-200 pt-4">
            <label className="text-[10px] font-mono uppercase text-[#b21f1f] block mb-2 font-black tracking-wider">
              {cartUiLocales.order_type[appLang as keyof typeof cartUiLocales.order_type] || cartUiLocales.order_type.en}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button 
                id="btn-type-dine-react"
                onClick={() => {
                  setOrderType('dine');
                  playCartChime('step');
                  const dineMsg = tText({
                    am: 'በሎጁ ወይም ጠረጴዛ ላይ መመገብ ተመርጧል።',
                    or: 'Mana keessa taa’anii nyaachuun filatameera.',
                    ti: 'ኣብ ውሽጢ ምምጋብ ተመሪጹ።',
                    sid: 'Lojete giddo itate doorantino.',
                    en: 'Table or room dine-in selected.',
                    fr: 'Sur place / chambre sélectionné.',
                    de: 'Vor Ort / Zimmer gewählt.',
                    it: 'Servizio al tavolo o in camera selezionato.',
                    zh: '已选择堂食或客房送餐。',
                    ar: 'تم اختيار تناول الطعام في المطعم أو الغرفة.'
                  });
                  speakCartFeedback(dineMsg, 'Table or room dine-in selected.');
                }}
                className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  orderType === 'dine' 
                    ? 'bg-[#b21f1f] text-white border-2 border-[#8c1414] shadow-md scale-[1.01]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {cartUiLocales.dine_in[appLang as keyof typeof cartUiLocales.dine_in] || cartUiLocales.dine_in.en}
              </button>
              <button 
                id="btn-type-delivery-react"
                onClick={() => {
                  setOrderType('delivery');
                  playCartChime('step');
                  const delivMsg = tText({
                    am: 'ዴሊቨሪ አገልግሎት ተመርጧል።',
                    or: 'Tajaajilli deelivarii filatameera.',
                    ti: 'ኣገልግሎት ዴሊቨሪ ተመሪጹ።',
                    sid: 'Iillishshu owaante doorantino.',
                    en: 'Delivery option selected.',
                    fr: 'Option livraison sélectionnée.',
                    de: 'Lieferoption ausgewählt.',
                    it: 'Opzione consegna selezionata.',
                    zh: '已选择外送配送。',
                    ar: 'تم اختيار خدمة التوصيل.'
                  });
                  speakCartFeedback(delivMsg, 'Delivery option selected.');
                }}
                className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  orderType === 'delivery' 
                    ? 'bg-[#b21f1f] text-white border-2 border-[#8c1414] shadow-md scale-[1.01]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {cartUiLocales.delivery[appLang as keyof typeof cartUiLocales.delivery] || cartUiLocales.delivery.en}
              </button>
            </div>
          </div>

          {/* Table/Room logic */}
          {orderType === 'dine' && (
            <div className="bg-stone-50 p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
              <label className="text-[9.5px] font-mono uppercase text-[#b21f1f] font-black">
                {cartUiLocales.room_number[appLang as keyof typeof cartUiLocales.room_number] || cartUiLocales.room_number.en}
              </label>
              <input 
                type="text"
                id="cart-table-no"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={tText({
                  am: 'ለምሳሌ፡ Room 101 ወይንም Table 5',
                  or: 'Fkn: Room 101 ykn Table 5',
                  ti: 'ንኣብነት፡ Room 101 ወይ Table 5',
                  sid: 'Lawishsha: Room 101 woy Table 5',
                  en: 'e.g. Room 101 or Table 5',
                  fr: 'ex. Chambre 101 ou Table 5',
                  de: 'z.B. Zimmer 101 oder Tisch 5',
                  it: 'es. Camera 101 o Tavolo 5',
                  zh: '例如：Room 101 或 Table 5',
                  ar: 'مثال: Room 101 أو Table 5'
                })}
                className="w-full bg-white border border-stone-300 text-stone-900 font-black text-center text-sm p-2.5 rounded-xl outline-none focus:border-[#b21f1f] focus:ring-1 focus:ring-[#b21f1f]"
              />
            </div>
          )}

          {/* Delivery form logic */}
          {orderType === 'delivery' && (
            <div className="bg-stone-50 p-3.5 border border-stone-200 rounded-2xl space-y-3">
              <div>
                <label className="text-[9.5px] font-mono uppercase text-[#b21f1f] block mb-1 font-black">
                  {cartUiLocales.phone_number[appLang as keyof typeof cartUiLocales.phone_number] || cartUiLocales.phone_number.en} *
                </label>
                <input 
                  type="tel"
                  id="cart-delivery-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full bg-white border border-stone-300 text-stone-900 font-mono text-xs p-2.5 rounded-xl outline-none focus:border-[#b21f1f] focus:ring-1 focus:ring-[#b21f1f]"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-mono uppercase text-[#b21f1f] block mb-1 font-black">
                  {cartUiLocales.delivery_address[appLang as keyof typeof cartUiLocales.delivery_address] || cartUiLocales.delivery_address.en} *
                </label>
                <textarea 
                  id="cart-delivery-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={tText({
                    am: 'የሰፈር ስም፣ የቤት ቁጥር ወይም መለያ ምልክት...',
                    or: 'Maqaa ganda, lakk. manaa ykn mallattoo...',
                    ti: 'ስም ሰፈር፣ ቁጽሪ ገዛ ወይ መለለዪ...',
                    sid: 'Olluu su’ma, minete kiiro woy malaate...',
                    en: 'Neighborhood name, House No or landmarks...',
                    fr: 'Quartier, numéro ou point de repère...',
                    de: 'Stadtteil, Hausnummer oder Orientierungspunkte...',
                    it: 'Quartiere, numero civico o punti di riferimento...',
                    zh: '街道名称、门牌号或地标信息...',
                    ar: 'اسم الحي، رقم المنزل أو أقرب معلم...'
                  })}
                  rows={2}
                  className="w-full bg-white border border-stone-300 text-stone-900 text-xs p-2.5 rounded-xl outline-none focus:border-[#b21f1f] focus:ring-1 focus:ring-[#b21f1f] resize-none"
                />
              </div>
            </div>
          )}

          {/* Tipping inputs */}
          <div className="border-t border-stone-200 pt-4">
            <label className="text-[10px] font-mono uppercase text-[#b21f1f] block mb-2 font-black tracking-wider">
              {cartUiLocales.tip[appLang as keyof typeof cartUiLocales.tip] || cartUiLocales.tip.en}
            </label>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[0, 5, 10, 15].map(p => (
                <button
                  key={p}
                  id={`btn-tip-${p}-react`}
                  onClick={() => { setTipPercent(p); setCustomTip(''); }}
                  className={`py-2 text-[11px] font-black rounded-xl uppercase transition-all cursor-pointer ${
                    tipPercent === p 
                      ? 'bg-[#b21f1f] text-white border-2 border-[#8c1414] shadow-md scale-[1.01]' 
                      : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                  }`}
                >
                  {p === 0 ? tText({
                    am: 'የለም',
                    or: 'Hin jiru',
                    ti: 'የለን',
                    sid: 'Dino',
                    en: 'None',
                    fr: 'Aucun',
                    de: 'Keins',
                    it: 'Nessuno',
                    zh: '无小费',
                    ar: 'لا يوجد'
                  }) : `${p}%`}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[9.5px] font-mono uppercase text-stone-600 font-bold shrink-0">
                {tText({
                  am: `ተለዋዋጭ መጠን (${currency})፦`,
                  or: `Hanga biraa (${currency}):`,
                  ti: `ተወሳኺ መጠን (${currency})፦`,
                  sid: `Wole Bikka (${currency}):`,
                  en: `Custom Amount (${currency}):`,
                  fr: `Montant personnalisé (${currency}) :`,
                  de: `Eigener Betrag (${currency}):`,
                  it: `Importo personalizzato (${currency}):`,
                  zh: `自定义金额 (${currency})：`,
                  ar: `مبلغ مخصص (${currency}):`
                })}
              </span>
              <input 
                type="number"
                value={customTip}
                onChange={(e) => {
                  setCustomTip(e.target.value);
                  setTipPercent(-1);
                }}
                placeholder={`0 ${currency}`}
                className="flex-1 bg-white border border-stone-300 text-stone-900 font-mono text-xs p-2 rounded-xl outline-none focus:border-[#b21f1f] focus:ring-1 focus:ring-[#b21f1f]"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t border-stone-200 pt-4">
            <label className="text-[10px] font-mono uppercase text-[#b21f1f] block mb-2 font-black tracking-wider">
              {cartUiLocales.payment_method[appLang as keyof typeof cartUiLocales.payment_method] || cartUiLocales.payment_method.en}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                id="btn-pay-cash-react"
                onClick={() => {
                  setPayment('cash');
                  playCartChime('step');
                  const cashMsg = tText({
                    am: 'በጥሬ ገንዘብ መክፈል ተመርጧል።',
                    or: 'Kaffaltiin maallaqa callaa filatameera.',
                    ti: 'ብጥረ ገንዘብ ምኽፋል ተመሪጹ።',
                    sid: 'Anga womaashinni baata doorantino.',
                    en: 'Cash payment selected.',
                    fr: 'Paiement en espèces sélectionné.',
                    de: 'Barzahlung ausgewählt.',
                    it: 'Pagamento in contanti selezionato.',
                    zh: '已选择现金支付。',
                    ar: 'تم اختيار الدفع نقداً.'
                  });
                  speakCartFeedback(cashMsg, 'Cash payment selected.');
                }}
                className={`py-2.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer ${
                  payment === 'cash' 
                    ? 'bg-[#b21f1f] text-white border-2 border-[#8c1414] shadow-md scale-[1.01]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {cartUiLocales.cash[appLang as keyof typeof cartUiLocales.cash] || cartUiLocales.cash.en}
              </button>
              <button 
                type="button"
                id="btn-pay-bank-react"
                onClick={() => {
                  setPayment('bank');
                  playCartChime('step');
                  const bankMsg = tText({
                    am: 'በባንክ ወይም በቴሌብር መክፈል ተመርጧል።',
                    or: 'Baankii ykn Telebirriin kaffaluun filatameera.',
                    ti: 'ብባንኪ ወይ ብቴሌብር ምኽፋል ተመሪጹ።',
                    sid: 'Baanketenni woy Telebirritenni baata doorantino.',
                    en: 'Bank or Telebirr transfer selected.',
                    fr: 'Virement bancaire ou Telebirr sélectionné.',
                    de: 'Banküberweisung oder Telebirr ausgewählt.',
                    it: 'Bonifico bancario o Telebirr selezionato.',
                    zh: '已选择银行转账或 Telebirr。',
                    ar: 'تم اختيار التحويل البنكي أو Telebirr.'
                  });
                  speakCartFeedback(bankMsg, 'Bank or Telebirr transfer selected.');
                }}
                className={`py-2.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer ${
                  payment === 'bank' 
                    ? 'bg-[#b21f1f] text-white border-2 border-[#8c1414] shadow-md scale-[1.01]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {cartUiLocales.bank[appLang as keyof typeof cartUiLocales.bank] || cartUiLocales.bank.en}
              </button>
              <button 
                type="button"
                id="btn-pay-chapa-react"
                onClick={() => {
                  if (!chapaActive) {
                    const inactiveMsg = tText({
                      am: 'የቻፓ ክፍያ ገና በአስተዳዳሪ አልተከፈተም።',
                      or: 'Kaffaltiin Chapa bulchaadhaan amma hin banamne.',
                      ti: 'ክፍሊት ቻፓ ብምምሕዳር ገና ኣይተኸፍተን።',
                      sid: 'Chapa baatooshshi xa geeshsha ganu diramme di-fannamino.',
                      en: 'Chapa Payment gateway has not been activated yet by administrators.',
                      fr: 'La passerelle Chapa n’est pas encore activée.',
                      de: 'Das Chapa-Zahlungsportal wurde noch nicht aktiviert.',
                      it: 'Il gateway Chapa non è ancora stato attivato.',
                      zh: '管理员尚未启用 Chapa 支付网关。',
                      ar: 'لم يتم تفعيل بوابة الدفع Chapa بعد من قبل الإدارة.'
                    });
                    playCartChime('alert');
                    speakCartFeedback(inactiveMsg, 'Chapa Payment gateway has not been activated yet.');
                    showCartNotice('error', inactiveMsg);
                    return;
                  }
                  setPayment('chapa');
                  playCartChime('step');
                  const chapaMsg = tText({
                    am: 'የቻፓ ፈጣን ክፍያ ተመርጧል።',
                    or: 'Kaffaltiin Chapa ariifachiisaa filatameera.',
                    ti: 'ቅልጡፍ ክፍሊት ቻፓ ተመሪጹ።',
                    sid: 'Chapa raho baatooshshi doorantino.',
                    en: 'Chapa online payment selected.',
                    fr: 'Paiement en ligne Chapa sélectionné.',
                    de: 'Chapa Online-Zahlung ausgewählt.',
                    it: 'Pagamento online Chapa selezionato.',
                    zh: '已选择 Chapa 在线支付。',
                    ar: 'تم اختيار الدفع الإلكتروني عبر Chapa.'
                  });
                  speakCartFeedback(chapaMsg, 'Chapa online payment selected.');
                }}
                className={`py-2.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer relative ${
                  !chapaActive ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  payment === 'chapa' 
                    ? 'bg-cyan-600 text-white border-2 border-cyan-700 shadow-md scale-[1.01]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {cartUiLocales.chapa_secure[appLang as keyof typeof cartUiLocales.chapa_secure] || cartUiLocales.chapa_secure.en}
              </button>
            </div>
          </div>

          {/* Cash Payment Request & Cashier Counter Sync Block */}
          {payment === 'cash' && (
            <div className="bg-emerald-50/90 p-3.5 border border-emerald-300 rounded-2xl space-y-3 text-stone-900">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                <span className="text-[10px] font-mono uppercase text-emerald-900 font-black tracking-wider">
                  💵 {tText({
                    am: 'በካሽ መክፈያ እና የካሸር መጠየቂያ (CASHIER REQUEST)',
                    or: 'GAAFFII KAASHII FI KAASHEERA (CASHIER REQUEST)',
                    ti: 'ሕቶ ክፍሊት ጥረ ገንዘብን ካሸርን',
                    sid: 'KAASHETE BAATOOSHSHU XA’MO',
                    en: 'CASH PAYMENT & CASHIER REQUEST',
                    fr: 'DEMANDE DE PAIEMENT EN ESPÈCES',
                    de: 'BARZAHLUNG & KASSENANFRAGE',
                    it: 'RICHIESTA PAGAMENTO IN CONTANTI',
                    zh: '现金支付与收银台请求',
                    ar: 'طلب الدفع نقداً عبر الصندوق'
                  })}
                </span>
                <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[8.5px] font-mono font-black">
                  LIVE SYNC
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-cash-mode-desk"
                  onClick={() => setCashPayMode('cashier_desk')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cashPayMode === 'cashier_desk'
                      ? 'bg-[#b21f1f] text-white border-[#8c1414] shadow-sm'
                      : 'bg-white text-stone-800 border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  <span className="text-xs font-black block">
                    🏪 {tText({
                      am: 'በካሸር ዴስክ መክፈል',
                      en: 'Pay at Cashier Desk',
                      or: 'Kaasheera Biratti Kaffali',
                      ti: 'ኣብ ካሸር ዴስክ ክፈሉ',
                      sid: 'Kaasheeru Ulaa Baati',
                      fr: 'Payer à la Caisse',
                      de: 'An der Kasse zahlen',
                      it: 'Paga alla Cassa',
                      zh: '前往收银台付款',
                      ar: 'الدفع في صندوق الكاشير'
                    })}
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${cashPayMode === 'cashier_desk' ? 'text-yellow-200' : 'text-stone-500'}`}>
                    {tText({
                      am: 'ወደ ካሸሩ የመክፈያ ጥያቄ እና ቲኬት ይልካል',
                      en: 'Sends instant Cash Bill Request & Ticket to Cashier',
                      or: 'Gaaffii kaffaltii kaashii kallattiin kaasheeraaf erga',
                      ti: 'ናብ ካሸር ብቐጥታ ናይ ክፍሊት ሕቶ ይልእኽ',
                      sid: 'Kaasheeraho kaashu baatooshshu xa’mo soyi',
                      fr: 'Envoie une demande de paiement directe au caissier',
                      de: 'Sendet direkte Barzahlungsanfrage an die Kasse',
                      it: 'Invia richiesta di pagamento diretta al cassiere',
                      zh: '向收银台发送实时现金收款请求',
                      ar: 'يرسل طلب دفع نقدي فوري إلى الكاشير'
                    })}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-cash-mode-waiter"
                  onClick={() => setCashPayMode('waiter_or_delivery')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cashPayMode === 'waiter_or_delivery'
                      ? 'bg-[#b21f1f] text-white border-[#8c1414] shadow-sm'
                      : 'bg-white text-stone-800 border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  <span className="text-xs font-black block">
                    🏃 {tText({
                      am: 'በአስተናጋጅ / ሲደርስ በካሽ',
                      en: 'Pay Waiter / On Delivery',
                      or: 'Keessummeessaaf / Yeroo Gahu',
                      ti: 'ንኣስተናጋጅ / ምስ በጽሐ',
                      sid: 'Loosaanchoho / Iilliro',
                      fr: 'Au serveur / À la livraison',
                      de: 'Beim Kellner / Bei Lieferung',
                      it: 'Al cameriere / Alla consegna',
                      zh: '交由服务员 / 货到付现',
                      ar: 'للنادل / عند التسليم'
                    })}
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${cashPayMode === 'waiter_or_delivery' ? 'text-yellow-200' : 'text-stone-500'}`}>
                    {tText({
                      am: 'ከምግብ አቅርቦት ጋር በጥሬ ገንዘብ መክፈል',
                      en: 'Pay cash when served; synced with Cashier register',
                      or: 'Yeroo dhiyaatu kaashiin kaffali; kaasheera waliin walqabata',
                      ti: 'ምግቢ ምስ ቀረበ ብጥረ ገንዘብ ክፈሉ',
                      sid: 'Sagale shiqqi yito kaashinni baati',
                      fr: 'Payez en espèces au service ; synchronisé caisse',
                      de: 'Bar bei Übergabe zahlen; mit Kasse synchronisiert',
                      it: 'Paga in contanti al servizio; sincronizzato cassa',
                      zh: '送达时现金支付，同步记入收银台',
                      ar: 'ادفع نقداً عند الاستلام مع المزامنة مع الكاشير'
                    })}
                  </span>
                </button>
              </div>

              {/* Tendered cash / change helper */}
              <div className="bg-white border border-emerald-200 rounded-xl p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-mono uppercase text-emerald-900 font-black">
                    💸 {tText({
                      am: `የሚከፍሉት ብር / መልስ ማዘጋጃ (${currency})`,
                      en: `Cash Note You Will Pay With (${currency}, Optional)`,
                      or: `Maallaqa Kaffaltan (${currency}, Filannoo)`,
                      ti: `ዝኸፍሉሉ ገንዘብ (${currency}, ኣማራጺ)`,
                      sid: `Baatatto Womaashi Bikka (${currency})`,
                      fr: `Montant remis (${currency}, Optionnel)`,
                      de: `Gegebener Barbetrag (${currency}, Optional)`,
                      it: `Contanti consegnati (${currency}, Opzionale)`,
                      zh: `预计支付现金额 (${currency}，可选)`,
                      ar: `المبلغ النقدي المدفوع (${currency}، اختياري)`
                    })}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCashTenderedInput(String(grandTotal))}
                    className="text-[10px] font-mono font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    ✓ {tText({ am: 'ትክክለኛ ሂሳብ', en: 'Exact', or: 'Sirrii', ti: 'ልክዕ', sid: 'Likki', fr: 'Exact', de: 'Passend', it: 'Esatto', zh: '刚好', ar: 'المبلغ بالضبط' })} ({grandTotal})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    placeholder={`${grandTotal} ${currency}`}
                    className="flex-1 min-w-[120px] bg-stone-50 border border-stone-300 text-stone-900 font-mono font-bold text-xs p-2 rounded-xl outline-none focus:border-emerald-600"
                  />
                  {[500, 1000, 2000].filter((n) => n >= grandTotal).map((noteAmt) => (
                    <button
                      key={noteAmt}
                      type="button"
                      onClick={() => setCashTenderedInput(String(noteAmt))}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-black border cursor-pointer transition-colors ${
                        Number(cashTenderedInput) === noteAmt
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      {noteAmt}
                    </button>
                  ))}
                </div>

                {cashTenderedInput.trim() !== '' && !Number.isNaN(Number(cashTenderedInput)) && (
                  <div className={`text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                    Number(cashTenderedInput) >= grandTotal
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span>
                      {Number(cashTenderedInput) >= grandTotal
                        ? tText({
                            am: 'መልስ (Change Due):',
                            en: 'Change Cashier Will Prepare:',
                            or: 'Deebii (Change):',
                            ti: 'መልሲ (Change):',
                            sid: 'Qolamanno Womaashi:',
                            fr: 'Monnaie à rendre :',
                            de: 'Rückgeld:',
                            it: 'Resto dovuto:',
                            zh: '收银台需找零：',
                            ar: 'الباقي المستحق:'
                          })
                        : tText({
                            am: 'የጎደለ መጠን:',
                            en: 'Shortfall:',
                            or: 'Hanqina:',
                            ti: 'ዝጎደለ:',
                            sid: 'Ajinohu:',
                            fr: 'Manquant :',
                            de: 'Fehlbetrag:',
                            it: 'Mancante:',
                            zh: '差额：',
                            ar: 'النقص:'
                          })}
                    </span>
                    <span className="font-black">
                      {Math.abs(Number(cashTenderedInput) - grandTotal)} {currency}
                    </span>
                  </div>
                )}

                <input
                  type="text"
                  value={receiptComment}
                  onChange={(e) => setReceiptComment(e.target.value)}
                  placeholder={tText({
                    am: 'ለካሸር / ለአስተናጋጅ ማሳሰቢያ (ከተፈለገ)...',
                    en: 'Optional note for Cashier or Waiter...',
                    or: 'Yaada dabalataa kaasheeraaf (yoo jiraate)...',
                    ti: 'ንካሸር ወይ ኣስተናጋጅ ተወሳኺ መዘኻኸሪ...',
                    sid: 'Kaasheeraho ledote hedo...',
                    fr: 'Note optionnelle pour le caissier...',
                    de: 'Optionale Notiz für die Kasse...',
                    it: 'Nota opzionale per il cassiere...',
                    zh: '给收银员的备注（可选）...',
                    ar: 'ملاحظة اختيارية للكاشير...'
                  })}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs p-2 rounded-xl outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Bank Transfer block */}
          {payment === 'bank' && (
            <div className="bg-stone-50 p-3.5 border border-stone-200 rounded-2xl space-y-3">
              <p className="text-[10px] text-[#b21f1f] leading-tight uppercase font-mono font-bold">
                {tText({
                  am: 'መጀመሪያ መክፈል የሚፈልጉትን አካውንት ይምረጡ፤ ያስተላለፉበትን የማረጋገጫ ቁጥር ይጻፉ።',
                  or: 'Jalqaba herrega baankii filadhaa, itti aansuun lakkoofsa mirkaneessaa galchaa.',
                  ti: 'ቅድም መጀመሪያ ዝኸፍሉሉ ኣካውንት ምረጹ፤ ድሕሪኡ ቁጽሪ መረጋገጺ ኣእትዉ።',
                  sid: 'Umo baankete akkawunte doori, gedensaanni buuxote kiiro borreessi.',
                  en: 'Select payment destination bank account first, then enter transaction reference code.',
                  fr: 'Sélectionnez d’abord le compte bancaire puis saisissez la référence de transaction.',
                  de: 'Wählen Sie zuerst ein Zielkonto und geben Sie dann die Transaktionsreferenz ein.',
                  it: 'Seleziona prima il conto bancario poi inserisci il codice di riferimento.',
                  zh: '请先选择收款银行账户，然后输入交易参考号。',
                  ar: 'اختر الحساب البنكي المستلم أولاً، ثم أدخل رقم مرجع المعاملة.'
                })}
              </p>
              <div className="space-y-2 text-xs text-stone-900">
                {banks.map((b) => (
                  <div 
                    key={b.id} 
                    id={`bank-row-select-${b.id}`}
                    onClick={() => setSelectedBankId(b.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      selectedBankId === b.id 
                        ? 'bg-amber-100/80 border-amber-500 shadow-sm' 
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <p className="font-black text-xs text-[#b21f1f] tracking-tight">{b.name}</p>
                    <p className="font-mono text-[10px] text-stone-800 font-bold">A/C: {b.number}</p>
                    <p className="text-[9.5px] text-stone-600 mt-0.5">
                      {tText({
                        am: 'ባለቤት፦',
                        or: 'Abbaa Herregaa:',
                        ti: 'ዋና:',
                        sid: 'Anna:',
                        en: 'Holder:',
                        fr: 'Titulaire :',
                        de: 'Inhaber:',
                        it: 'Intestatario:',
                        zh: '户名：',
                        ar: 'صاحب الحساب:'
                      })} {b.holder}
                    </p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <label className="text-[9.5px] font-mono uppercase text-[#b21f1f] block mb-1 font-black">
                  {cartUiLocales.ref_placeholder[appLang as keyof typeof cartUiLocales.ref_placeholder] || cartUiLocales.ref_placeholder.en} *
                </label>
                <input 
                  type="text"
                  id="checkout-bank-ref-field"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="CBE-XXXXXXXXX"
                  required
                  className="w-full bg-white border border-stone-300 text-stone-900 font-mono text-xs p-2.5 rounded-xl outline-none focus:border-[#b21f1f] focus:ring-1 focus:ring-[#b21f1f]"
                />
              </div>

              {/* Receipt / Screenshot Attachment section */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <label className="text-[9.5px] font-mono uppercase text-[#b21f1f] block font-black">
                  {cartUiLocales.receipt_upload[appLang as keyof typeof cartUiLocales.receipt_upload] || cartUiLocales.receipt_upload.en}
                </label>
                
                {/* Real File Input for upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300 hover:border-[#b21f1f] py-2.5 px-3 text-[10px] font-mono font-black uppercase text-center rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                    📸 {tText({
                      am: 'ፎቶ ወይም እስክሪንሻት ይጫኑ',
                      or: 'Suuraa / Ragaa Kaffaltii Fe’i',
                      ti: 'ስእሊ ወይ ስክሪንሾት ጽዓን',
                      sid: 'Suura Woy Iiskriinshoote Fea',
                      en: 'Upload Screenshot / Proof',
                      fr: 'Télécharger une Capture / Preuve',
                      de: 'Screenshot / Beleg hochladen',
                      it: 'Carica Screenshot / Ricevuta',
                      zh: '上传截图 / 付款凭证',
                      ar: 'تحميل لقطة شاشة / إثبات الدفع'
                    })}
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
                  <p className="text-[8.5px] font-mono text-stone-500 uppercase font-bold">
                    {tText({
                      am: 'በቀላሉ ለመሞከር ማረጋገጫ ይምረጡ፦',
                      or: 'Yaalii salphaaf ragaa fakkeenyaa filadhu:',
                      ti: 'ብቐሊሉ ንምፍታን መረጋገጺ ምረጽ፦',
                      sid: 'Shota garraahate buuxo doori:',
                      en: 'To test easily, pick simulated proof receipt:',
                      fr: 'Pour tester rapidement, choisissez un reçu simulé :',
                      de: 'Zum schnellen Testen Beispielbeleg wählen:',
                      it: 'Per testare facilmente, scegli una ricevuta simulata:',
                      zh: '为方便测试，可选择模拟付款凭证：',
                      ar: 'للاختبار السريع، اختر إيصالاً تجريبياً:'
                    })}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[8.5px] font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptScreenshot('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600');
                        showCartNotice('success', tText({
                          am: '✅ የ CBE ባንክ የሙከራ ደረሰኝ ተያይዟል።',
                          or: '✅ Ragaan yaalii Baankii CBE walitti qabameera.',
                          ti: '✅ ናይ CBE ባንኪ ናይ ፈተነ ደረሰኝ ተኣታትዩ።',
                          sid: '✅ CBE Baankete garraahu risiite qabsiisiinoonni.',
                          en: '✅ Simulated CBE Bank receipt attached.',
                          fr: '✅ Reçu CBE simulé joint.',
                          de: '✅ Simulierter CBE-Beleg angehängt.',
                          it: '✅ Ricevuta CBE simulata allegata.',
                          zh: '✅ 已附加模拟 CBE 银行回执。',
                          ar: '✅ تم إرفاق إيصال بنك CBE التجريبي.'
                        }));
                      }}
                      className="py-1.5 bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-400 text-stone-800 hover:text-[#b21f1f] rounded-xl text-[8.5px] font-bold transition-all cursor-pointer"
                    >
                      📱 {tText({
                        am: 'የ CBE መተግበሪያ ደረሰኝ',
                        or: 'Suuraa App CBE',
                        ti: 'ደረሰኝ መተግበሪ CBE',
                        sid: 'CBE App Suura',
                        en: 'CBE App screenshot',
                        fr: 'Capture App CBE',
                        de: 'CBE-App-Screenshot',
                        it: 'Screenshot App CBE',
                        zh: 'CBE 应用截图',
                        ar: 'لقطة تطبيق CBE'
                      })}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptScreenshot('https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600');
                        showCartNotice('success', tText({
                          am: '✅ የቴሌብር የሙከራ ደረሰኝ ተያይዟል።',
                          or: '✅ Ragaan yaalii Telebirr walitti qabameera.',
                          ti: '✅ ናይ ቴሌብር ናይ ፈተነ ደረሰኝ ተኣታትዩ።',
                          sid: '✅ Telebirru garraahu risiite qabsiisiinoonni.',
                          en: '✅ Simulated Telebirr receipt attached.',
                          fr: '✅ Reçu Telebirr simulé joint.',
                          de: '✅ Simulierter Telebirr-Beleg angehängt.',
                          it: '✅ Ricevuta Telebirr simulata allegata.',
                          zh: '✅ 已附加模拟 Telebirr 回执。',
                          ar: '✅ تم إرفاق إيصال Telebirr التجريبي.'
                        }));
                      }}
                      className="py-1.5 bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-400 text-stone-800 hover:text-[#b21f1f] rounded-xl text-[8.5px] font-bold transition-all cursor-pointer"
                    >
                      📲 {tText({
                        am: 'የቴሌብር ደረሰኝ ማረጋገጫ',
                        or: 'Ragaa Telebirr',
                        ti: 'መረጋገጺ ቴሌብር',
                        sid: 'Telebirru Risiite',
                        en: 'Telebirr Receipt proof',
                        fr: 'Preuve Reçu Telebirr',
                        de: 'Telebirr-Beleg',
                        it: 'Prova Ricevuta Telebirr',
                        zh: 'Telebirr 付款回执',
                        ar: 'إثبات إيصال Telebirr'
                      })}
                    </button>
                  </div>
                </div>

                {/* Paste URL Input field */}
                <div>
                  <input 
                    type="text"
                    value={receiptScreenshot}
                    onChange={(e) => setReceiptScreenshot(e.target.value)}
                    placeholder={tText({
                      am: 'ወይም የምስል አድራሻ (URL) እዚህ ይለጥፉ...',
                      or: 'ykn URL suuraa asitti maxxansi...',
                      ti: 'ወይ ናይ ስእሊ ሊንክ (URL) ኣብዚ የእትዉ...',
                      sid: 'woy suuraho URL konne qabsiisi...',
                      en: 'or paste Screenshot Image URL...',
                      fr: 'ou collez l’URL de l’image...',
                      de: 'oder Bild-URL einfügen...',
                      it: 'oppure incolla URL immagine...',
                      zh: '或粘贴截图图片 URL...',
                      ar: 'أو الصق رابط صورة الإيصال...'
                    })}
                    className="w-full bg-white border border-stone-300 text-stone-800 font-mono text-[9.5px] p-2 rounded-xl outline-none"
                  />
                </div>

                {/* Screenshot preview */}
                {receiptScreenshot && (
                  <div className="bg-white p-2.5 border border-amber-400 rounded-xl relative text-center shadow-sm">
                    <p className="text-[8.5px] uppercase font-mono text-[#b21f1f] mb-1 font-bold">
                      {tText({
                        am: 'የተያያዘ የክፍያ ማረጋገጫ ቅድመ እይታ',
                        or: 'Ilaalcha Duraa Ragaa Kaffaltii',
                        ti: 'ቅድመ ምርኣይ ዝተኣታተወ ደረሰኝ',
                        sid: 'Qabsiisiinoonni Baatooshshu Buuxo',
                        en: 'Attached Payment Proof Preview',
                        fr: 'Aperçu de la preuve de paiement',
                        de: 'Vorschau des Zahlungsbelegs',
                        it: 'Anteprima ricevuta allegata',
                        zh: '已附加付款凭证预览',
                        ar: 'معاينة إثبات الدفع المرفق'
                      })}
                    </p>
                    <img 
                      src={receiptScreenshot} 
                      className="max-h-24 mx-auto object-contain border border-stone-200 rounded-lg" 
                      alt="Payment Receipt Preview" 
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      type="button"
                      onClick={() => setReceiptScreenshot('')}
                      className="absolute top-1 right-1 text-[8px] font-mono text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md hover:bg-red-200 cursor-pointer"
                    >
                      {tText({
                        am: 'አስወግድ',
                        or: 'HAQI',
                        ti: 'ኣወግድ',
                        sid: 'HUNI',
                        en: 'REMOVE',
                        fr: 'SUPPRIMER',
                        de: 'ENTFERNEN',
                        it: 'RIMUOVI',
                        zh: '移除',
                        ar: 'إزالة'
                      })}
                    </button>
                  </div>
                )}
              </div>

              {/* Receipt Comments */}
              <div className="pt-2 border-t border-stone-200">
                <label className="text-[9.5px] font-mono uppercase text-[#b21f1f] block mb-1 font-black">
                  {tText({
                    am: 'ተጨማሪ ማሳሰቢያ ወይንም አስተያየት እዚህ ይጻፉ',
                    or: 'Yaada ykn Hubachiisa Dabalataa',
                    ti: 'ተወሳኺ መተሓሳሰቢ ወይ ርእይቶ',
                    sid: 'Ledote Hedo Woy Qoratto',
                    en: 'Receipt Remarks & Notes',
                    fr: 'Remarques et Notes de Reçu',
                    de: 'Beleg-Hinweise & Notizen',
                    it: 'Note e Commenti sulla Ricevuta',
                    zh: '收据备注与说明',
                    ar: 'ملاحظات وتعليقات الإيصال'
                  })}
                </label>
                <input 
                  type="text"
                  placeholder={cartUiLocales.receipt_comment_placeholder[appLang as keyof typeof cartUiLocales.receipt_comment_placeholder] || cartUiLocales.receipt_comment_placeholder.en}
                  value={receiptComment}
                  onChange={(e) => setReceiptComment(e.target.value)}
                  className="w-full bg-white border border-stone-300 text-stone-900 text-xs p-2.5 rounded-xl outline-none focus:border-[#b21f1f] focus:ring-1 focus:ring-[#b21f1f]"
                />
              </div>
            </div>
          )}

          {/* Chapa Secure Checkout configuration */}
          {payment === 'chapa' && (
            <div className="bg-cyan-50 p-4 border border-cyan-300 space-y-3.5 rounded-2xl relative overflow-hidden text-stone-900">
              <div className="flex justify-between items-center border-b border-cyan-200 pb-1.5">
                <span className="text-[9.5px] text-cyan-900 font-mono font-black tracking-widest uppercase block">
                  🔌 {tText({
                    am: 'ቻፓ ደህንነቱ የተጠበቀ ክፍያ (CHAPA)',
                    or: 'KAFFALTII AMANSIISAA CHAPA',
                    ti: 'ውሑስ ክፍሊት ቻፓ (CHAPA)',
                    sid: 'CHAPA KEERAANCHU BAATOOSHSHA',
                    en: 'CHAPA SECURE CHECKOUT',
                    fr: 'PAIEMENT SÉCURISÉ CHAPA',
                    de: 'SICHERER CHAPA-CHECKOUT',
                    it: 'CHECKOUT SICURO CHAPA',
                    zh: 'CHAPA 安全结账',
                    ar: 'الدفع الآمن عبر CHAPA'
                  })}
                </span>
                <span className="bg-cyan-200 text-cyan-900 px-2 py-0.5 rounded-md text-[8px] font-mono font-black">
                  {chapaMode === 'live'
                    ? tText({ am: 'ቀጥታ (LIVE)', or: 'KALLATTII (LIVE)', ti: 'ቀጥታ (LIVE)', sid: 'LIVE', en: 'LIVE DEPLOY', fr: 'EN DIRECT', de: 'LIVE-BETRIEB', it: 'ATTIVO (LIVE)', zh: '正式环境', ar: 'تشغيل فعلي' })
                    : tText({ am: 'የሙከራ ሲሙሌተር', or: 'YAALII (SANDBOX)', ti: 'ፈተነ (SANDBOX)', sid: 'SANDBOX', en: 'SANDBOX SIMULATOR', fr: 'MODE TEST (SANDBOX)', de: 'SANDBOX-MODUS', it: 'AMBIENTE TEST', zh: '沙盒测试环境', ar: 'وضع الاختبار' })}
                </span>
              </div>

              <div className="space-y-3 text-stone-800">
                <p className="text-[10.5px] text-stone-700 leading-relaxed font-semibold">
                  {tText({
                    am: 'በኢትዮጵያ ቀዳሚ በሆነው የቻፓ ክፍያ (telebirr, CBE birr, Mobile money እና ካርድ) ደረሰኝዎን በቀላሉ እዚህ ይክፈሉ።',
                    or: 'Kaffaltii Chapa (Telebirr, CBE Birr, Mobile Money fi Kaardii) fayyadamuun salphaatti kaffalaa.',
                    ti: 'ብቻፓ ክፍሊት (Telebirr, CBE Birr, Mobile Money እና ካርድ) ሒሳብኩም ብቐሊሉ ኣብዚ ክፈሉ።',
                    sid: 'Chapa baatooshshinni (Telebirr, CBE Birr, Mobile money nna Kaarde) shota ikkitino doogonni konne baati.',
                    en: 'Pay seamlessly via Chapa using Telebirr, CBE Birr, Mobile Money, or bank cards.',
                    fr: 'Payez facilement via Chapa avec Telebirr, CBE Birr, Mobile Money ou carte bancaire.',
                    de: 'Bezahlen Sie bequem über Chapa mit Telebirr, CBE Birr, Mobile Money oder Karte.',
                    it: 'Paga comodamente tramite Chapa con Telebirr, CBE Birr, Mobile Money o carta.',
                    zh: '通过 Chapa 使用 Telebirr、CBE Birr、移动支付或银行卡轻松完成付款。',
                    ar: 'ادفع بسهولة عبر Chapa باستخدام Telebirr أو CBE Birr أو المحافظ أو البطاقة.'
                  })}
                </p>

                <div>
                  <label className="text-[8.5px] font-mono uppercase text-stone-600 block mb-1 font-bold">
                    {tText({
                      am: 'የቻፓ ክፍያ አስፈጻሚው ኢሜይል (EMAIL)*',
                      or: 'IIMEELII KAFFALTII CHAPA (EMAIL)*',
                      ti: 'ናይ ቻፓ ክፍሊት ኢሜይል (EMAIL)*',
                      sid: 'CHAPA BAATOOSHHU IMEELE (EMAIL)*',
                      en: 'CHAPA BILLING EMAIL*',
                      fr: 'E-MAIL DE FACTURATION CHAPA*',
                      de: 'CHAPA-RECHNUNGS-E-MAIL*',
                      it: 'EMAIL DI FATTURAZIONE CHAPA*',
                      zh: 'CHAPA 账单邮箱*',
                      ar: 'البريد الإلكتروني لفوترة CHAPA*'
                    })}
                  </label>
                  <input 
                    type="email"
                    required
                    value={chapaEmail}
                    onChange={(e) => setChapaEmail(e.target.value)}
                    placeholder="guest@papyrus.com"
                    className="w-full bg-white border border-stone-300 text-stone-900 text-xs p-2.5 outline-none focus:border-cyan-600 rounded-xl font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] font-mono uppercase text-stone-600 block mb-1 font-bold">
                      {tText({
                        am: 'የመጀመሪያ ስም (FIRST NAME)*',
                        or: 'MAQAA DURA (FIRST NAME)*',
                        ti: 'ቀዳማይ ስም (FIRST NAME)*',
                        sid: 'UMU SU’MA (FIRST NAME)*',
                        en: 'FIRST NAME*',
                        fr: 'PRÉNOM*',
                        de: 'VORNAME*',
                        it: 'NOME*',
                        zh: '名字*',
                        ar: 'الاسم الأول*'
                      })}
                    </label>
                    <input 
                      type="text"
                      required
                      value={chapaFirstName}
                      onChange={(e) => setChapaFirstName(e.target.value)}
                      placeholder={tText({ am: 'ስም', or: 'Maqaa', ti: 'ስም', sid: 'Su’ma', en: 'First name', fr: 'Prénom', de: 'Vorname', it: 'Nome', zh: '名', ar: 'الاسم الأول' })}
                      className="w-full bg-white border border-stone-300 text-stone-900 text-xs p-2.5 outline-none focus:border-cyan-600 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] font-mono uppercase text-stone-600 block mb-1 font-bold">
                      {tText({
                        am: 'የአያት ስም (LAST NAME)*',
                        or: 'MAQAA ABBAA (LAST NAME)*',
                        ti: 'ስም ኣቦ (LAST NAME)*',
                        sid: 'ANNU SU’MA (LAST NAME)*',
                        en: 'LAST NAME*',
                        fr: 'NOM*',
                        de: 'NACHNAME*',
                        it: 'COGNOME*',
                        zh: '姓氏*',
                        ar: 'الاسم الأخير*'
                      })}
                    </label>
                    <input 
                      type="text"
                      required
                      value={chapaLastName}
                      onChange={(e) => setChapaLastName(e.target.value)}
                      placeholder={tText({ am: 'የአያት ስም', or: 'Maqaa abbaa', ti: 'ስም ኣቦ', sid: 'Annu su’ma', en: 'Last name', fr: 'Nom', de: 'Nachname', it: 'Cognome', zh: '姓', ar: 'الاسم الأخير' })}
                      className="w-full bg-white border border-stone-300 text-stone-900 text-xs p-2.5 outline-none focus:border-cyan-600 rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-cyan-200 rounded-xl text-[9.5px] text-stone-800 space-y-1">
                  <div className="flex justify-between text-stone-900 font-bold">
                    <span>
                      {tText({
                        am: 'ጠቅላላ የሚከፈል ሂሳብ መጠን:',
                        or: 'Waliigala Kaffaltii:',
                        ti: 'ጠቕላላ ዝኽፈል ሒሳብ:',
                        sid: 'Xaphooma Baatammanni Womaasha:',
                        en: 'Total Amount Due:',
                        fr: 'Montant total à payer :',
                        de: 'Gesamtbetrag:',
                        it: 'Totale da pagare:',
                        zh: '应付总额：',
                        ar: 'المبلغ الإجمالي المستحق:'
                      })}
                    </span>
                    <span className="font-mono text-cyan-900 font-black">{grandTotal} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {tText({
                        am: 'የሲስተም ሁኔታ:',
                        or: 'Haala Siistamaa:',
                        ti: 'ኩነታት ሲስተም:',
                        sid: 'Siistamete Deeta:',
                        en: 'System State:',
                        fr: 'État du système :',
                        de: 'Systemstatus:',
                        it: 'Stato sistema:',
                        zh: '系统状态：',
                        ar: 'حالة النظام:'
                      })}
                    </span>
                    {chapaKey ? (
                      <span className="text-emerald-700 font-bold font-mono">
                        ✔️ {tText({
                          am: 'የኤፒአይ ቁልፍ ተገናኝቷል',
                          or: 'Furtuun API walqabateera',
                          ti: 'ቁልፊ API ተራኺቡ',
                          sid: 'API Qulfi Qabsiisiinoonni',
                          en: 'API KEY CONNECTED',
                          fr: 'CLÉ API CONNECTÉE',
                          de: 'API-SCHLÜSSEL VERBUNDEN',
                          it: 'CHIAVE API CONNESSA',
                          zh: 'API 密钥已连接',
                          ar: 'مفتاح API متصل'
                        })}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold font-mono">
                        ⚠️ {tText({
                          am: 'የቻፓ ማሳያ ሙከራ ንቁ ነው',
                          or: 'Yaaliin Chapa Demo hojii irra jira',
                          ti: 'ናይ ቻፓ መርኣዪ ፈተነ ንጡፍ እዩ',
                          sid: 'CHAPA GARRAAHU MODE NQO',
                          en: 'CHAPA DEMO EMULATOR ACTIVE',
                          fr: 'ÉMULATEUR DÉMO CHAPA ACTIF',
                          de: 'CHAPA-DEMO-EMULATOR AKTIV',
                          it: 'EMULATORE DEMO CHAPA ATTIVO',
                          zh: 'CHAPA 演示模拟器运行中',
                          ar: 'محاكي Chapa التجريبي نشط'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal footer containing compliant pricing blocks */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 text-stone-900 space-y-2 rounded-b-3xl">
          <div className="flex justify-between text-xs font-mono text-stone-600">
            <span>{cartUiLocales.subtotal[appLang as keyof typeof cartUiLocales.subtotal] || cartUiLocales.subtotal.en}</span>
            <span className="font-bold text-stone-900">{subtotal} {currency}</span>
          </div>
          <div className="flex justify-between text-xs font-mono text-stone-600">
            <span>{cartUiLocales.service_charge[appLang as keyof typeof cartUiLocales.service_charge] || cartUiLocales.service_charge.en} ({serviceChargeRate}%)</span>
            <span className="font-bold text-stone-900">{serviceCharge} {currency}</span>
          </div>
          <div className="flex justify-between text-xs font-mono text-stone-600">
            <span>{cartUiLocales.vat[appLang as keyof typeof cartUiLocales.vat] || cartUiLocales.vat.en} ({vatRate}%)</span>
            <span className="font-bold text-stone-900">{vat} {currency}</span>
          </div>
          <div className="flex justify-between text-xs font-mono text-[#b21f1f]">
            <span>{cartUiLocales.tip_label[appLang as keyof typeof cartUiLocales.tip_label] || cartUiLocales.tip_label.en}</span>
            <span className="font-bold">{tipAmount} {currency}</span>
          </div>
          <div className="flex justify-between items-center border-t border-stone-200 pt-2.5 mt-1">
            <span className="font-black uppercase tracking-wider text-sm sm:text-base text-[#b21f1f]">
              {cartUiLocales.grand_total[appLang as keyof typeof cartUiLocales.grand_total] || cartUiLocales.grand_total.en}
            </span>
            <span className="font-mono font-black text-xl text-[#b21f1f]">{grandTotal} {currency}</span>
          </div>

          <button 
            id="checkout-confirm-btn"
            onClick={handleSubmit}
            className="w-full bg-[#b21f1f] hover:bg-[#8c1414] text-white font-black uppercase text-xs sm:text-sm tracking-wider py-3.5 mt-3 transition-all rounded-2xl border-2 border-[#8c1414] shadow-lg shrink-0 font-sans cursor-pointer active:scale-95"
          >
            {payment === 'cash' && cashPayMode === 'cashier_desk'
              ? tText({
                  am: '💵 ትዕዛዝ ላክ እና የካሽ መክፈያ ጥያቄ ወደ ካሸር አስተላልፍ ⚡',
                  en: '💵 PLACE ORDER & REQUEST CASH PAYMENT AT CASHIER ⚡',
                  or: '💵 AJAJA ERGI & GAAFFII KAASHII KAASHEERAAF ERGI ⚡',
                  ti: '💵 ትእዛዝ ስደድን ናይ ካሽ ሕቶ ናብ ካሸር ለኣኽን ⚡',
                  sid: '💵 HAJAJA SOYINNA KAASHETE XA’MO KAASHEERAHO SOYI ⚡',
                  fr: '💵 COMMANDER & DEMANDER LE PAIEMENT EN CAISSE ⚡',
                  de: '💵 BESTELLEN & BARZAHLUNG AN DER KASSE ANFORDERN ⚡',
                  it: '💵 ORDINA E RICHIEDI PAGAMENTO IN CASSA ⚡',
                  zh: '💵 下单并向收银台发送现金付款请求 ⚡',
                  ar: '💵 إرسال الطلب وطلب الدفع نقداً في الصندوق ⚡'
                })
              : (cartUiLocales.place_order_btn[appLang as keyof typeof cartUiLocales.place_order_btn] || cartUiLocales.place_order_btn.en)}
          </button>
        </div>

      </div>

      {/* CHAPA SECURE CHECKOUT PORTAL EMULATOR */}
      {showChapaGateway && (
        <div className="absolute inset-0 bg-[#991B1B] z-50 flex flex-col font-sans text-white select-none">
          {/* Top Bar */}
          <div className="bg-[#8C1414] px-4 py-3 border-b border-[#F4C22B]/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[#F4C22B] text-base font-extrabold animate-pulse">⚡</span>
              <span className="font-mono text-xs font-black tracking-widest text-white">
                {tText({
                  am: 'ቻፓ ደህንነቱ የተጠበቀ ክፍያ',
                  or: 'KAFFALTII AMANSIISAA CHAPA',
                  ti: 'ውሑስ ክፍሊት ቻፓ',
                  sid: 'CHAPA KEERAANCHU BAATOOSHSHA',
                  en: 'CHAPA SECURE CHECKOUT',
                  fr: 'PAIEMENT SÉCURISÉ CHAPA',
                  de: 'SICHERER CHAPA-CHECKOUT',
                  it: 'CHECKOUT SICURO CHAPA',
                  zh: 'CHAPA 安全结账',
                  ar: 'الدفع الآمن عبر CHAPA'
                })}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setShowChapaGateway(false)}
              className="text-white/80 hover:text-[#F4C22B] transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chapaNotice && (
              <div
                role="alert"
                className={`rounded-xl px-3.5 py-2.5 text-xs font-bold border flex items-center justify-between gap-2 ${
                  chapaNotice.type === 'error'
                    ? 'bg-[#7F1D1D] border-[#F4C22B] text-[#FEF08A]'
                    : 'bg-[#065F46] border-emerald-300 text-white'
                }`}
              >
                <span>{chapaNotice.text}</span>
                <button
                  type="button"
                  onClick={() => setChapaNotice(null)}
                  className="p-0.5 rounded hover:bg-white/10 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Payment Brand and Merchant */}
            <div className="bg-[#7A1212] border border-[#F4C22B]/45 p-4 rounded-xl text-center space-y-1 relative overflow-hidden">
              <span className="text-[10px] text-[#FDE68A] font-mono uppercase tracking-widest block">
                {tText({
                  am: 'የነጋዴ ክፍያ መጠየቂያ',
                  or: 'Gaaffii Kaffaltii Daldalaa',
                  ti: 'ሕቶ ክፍሊት ነጋዳይ',
                  sid: 'Daddalaanchu Baatooshshu Xa’mo',
                  en: 'Merchant Billing Request',
                  fr: 'Demande de Facturation Marchand',
                  de: 'Händler-Zahlungsanforderung',
                  it: 'Richiesta di Addebito Esercente',
                  zh: '商户账单请求',
                  ar: 'طلب فاتورة التاجر'
                })}
              </span>
              <h3 className="text-sm font-black uppercase text-[#F4C22B]">PAPYRUS LODGE & RESORT</h3>
              <p className="text-[10px] text-white/80">
                {tText({ am: 'መለያ ቁጥር፦', or: 'Lakkoofsa:', ti: 'መለለዪ:', sid: 'Kiiro:', en: 'Reference:', fr: 'Référence :', de: 'Referenz:', it: 'Riferimento:', zh: '参考号：', ar: 'المرجع:' })} CHAP-TXN-{Date.now().toString().slice(-6)}
              </p>
              <div className="pt-2">
                <span className="text-2xl font-mono font-black text-white">{grandTotal} <span className="text-[#F4C22B] text-sm font-black">{currency}</span></span>
              </div>
            </div>

            {/* Customer details verification */}
            <div className="bg-[#7A1212] border border-[#F4C22B]/35 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#FDE68A]">
                  {tText({ am: 'ከፋይ፦', or: 'Kaffalaa:', ti: 'ከፋሊ:', sid: 'Baataanchu:', en: 'Billed to:', fr: 'Facturé à :', de: 'Rechnung an:', it: 'Intestato a:', zh: '付款人：', ar: 'الفاتورة إلى:' })}
                </span>
                <span className="font-bold text-white">{chapaFirstName} {chapaLastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FDE68A]">
                  {tText({ am: 'ኢሜይል፦', or: 'Iimeelii:', ti: 'ኢሜይል:', sid: 'Imeele:', en: 'Email address:', fr: 'E-mail :', de: 'E-Mail:', it: 'Email:', zh: '邮箱地址：', ar: 'البريد الإلكتروني:' })}
                </span>
                <span className="font-mono text-white/95">{chapaEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FDE68A]">
                  {tText({ am: 'የክፍያ ሁኔታ፦', or: 'Haala Kaffaltii:', ti: 'ኩነታት መንገዲ:', sid: 'Doogote Deeta:', en: 'Gateway Mode:', fr: 'Mode passerelle :', de: 'Gateway-Modus:', it: 'Modalità gateway:', zh: '网关模式：', ar: 'وضع البوابة:' })}
                </span>
                <span className="font-bold text-[#F4C22B] font-mono text-[10px]">
                  {chapaMode === 'live'
                    ? tText({ am: 'ቀጥታ ክፍያ', or: 'KALLATTII (LIVE)', ti: 'ቀጥታ ክፍሊት', sid: 'LIVE', en: 'LIVE DEPLOYMENT', fr: 'DÉPLOIEMENT LIVE', de: 'LIVE-BETRIEB', it: 'AMBIENTE LIVE', zh: '正式环境', ar: 'تشغيل فعلي' })
                    : tText({ am: 'የሙከራ ሳንድቦክስ', or: 'YAALII SANDBOX', ti: 'ፈተነ SANDBOX', sid: 'SANDBOX GARRAAHO', en: 'SANDBOX TEST ENVIRONMENT', fr: 'ENVIRONNEMENT DE TEST', de: 'SANDBOX-TESTUMGEBUNG', it: 'AMBIENTE TEST SANDBOX', zh: '沙盒测试环境', ar: 'بيئة اختبار Sandbox' })}
                </span>
              </div>
            </div>

            {/* Lodge Bank Selector */}
            <div className="space-y-1 bg-[#7A1212] border border-[#F4C22B]/40 p-3 rounded-lg text-xs">
              <label id="lbl-lodge-bank-chapa" className="text-[10px] font-mono text-[#FDE68A] uppercase block font-black">
                🏥 {tText({
                  am: 'የሎጁ የባንክ አካውንት:',
                  or: 'Herrega Baankii Loojii:',
                  ti: 'ናይ ሎጅ ባንኪ ኣካውንት:',
                  sid: 'Lojete Baankete Akkawunte:',
                  en: 'Lodge Merchant Bank:',
                  fr: 'Compte bancaire du Lodge :',
                  de: 'Händler-Bankkonto der Lodge:',
                  it: 'Banca dell’Esercente:',
                  zh: '度假村收款银行账户：',
                  ar: 'حساب البنك الخاص بالمنتجع:'
                })}
              </label>
              <select 
                id="select-lodge-bank-chapa"
                value={chapaSelectedLodgeBankId}
                onChange={(e) => setChapaSelectedLodgeBankId(e.target.value)}
                className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 font-mono text-xs p-2 rounded-lg outline-none font-bold"
              >
                {banks.length === 0 ? (
                  <option value="">
                    {tText({
                      am: 'ምንም የባንክ አካውንት አልተመዘገበም',
                      or: 'Herregni baankii hin galmoofne',
                      ti: 'ዝተመዝገበ ባንኪ ኣካውንት የለን',
                      sid: 'Borreessantino Baanke Dino',
                      en: 'No Bank Registered',
                      fr: 'Aucune banque enregistrée',
                      de: 'Keine Bank registriert',
                      it: 'Nessuna banca registrata',
                      zh: '暂无已登记银行账户',
                      ar: 'لا يوجد حساب بنكي مسجل'
                    })}
                  </option>
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
              <span className="text-[9px] font-mono text-[#FDE68A] uppercase tracking-wider block font-bold">
                {tText({
                  am: 'የመክፈያ ዘዴ ይምረጡ',
                  or: 'Karaan Kaffaltii Filadhu',
                  ti: 'መንገዲ ክፍሊት ምረጹ',
                  sid: 'Baatooshshu Doogo Doori',
                  en: 'Select Channel',
                  fr: 'Sélectionnez le canal',
                  de: 'Zahlungskanal wählen',
                  it: 'Seleziona canale',
                  zh: '选择支付渠道',
                  ar: 'اختر قناة الدفع'
                })}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setSelectedChapaMethod('telebirr')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none cursor-pointer ${
                    selectedChapaMethod === 'telebirr' 
                      ? 'bg-[#F4C22B] border-white text-stone-950 font-black' 
                      : 'bg-[#7A1212] border-[#F4C22B]/35 text-white hover:bg-[#B21F1F]'
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
                      ? 'bg-[#F4C22B] border-white text-stone-950 font-black' 
                      : 'bg-[#7A1212] border-[#F4C22B]/35 text-white hover:bg-[#B21F1F]'
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
                      ? 'bg-[#F4C22B] border-white text-stone-950 font-black' 
                      : 'bg-[#7A1212] border-[#F4C22B]/35 text-white hover:bg-[#B21F1F]'
                  }`}
                >
                  <span className="text-xl">💳</span>
                  <span className="text-[9.5px] font-black uppercase tracking-tight">
                    {tText({ am: 'አዋሽ / ካርድ', or: 'Awash / Kaardii', ti: 'ኣዋሽ / ካርድ', sid: 'Awash / Kaarde', en: 'Awash / Card', fr: 'Awash / Carte', de: 'Awash / Karte', it: 'Awash / Carta', zh: '银行卡', ar: 'بطاقة / Awash' })}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-[#7A1212] border border-[#F4C22B]/40 rounded-xl space-y-3.5">
              <div className="space-y-2">
                <p className="text-[10px] text-white leading-relaxed font-bold">
                  {tText({
                    am: 'አካውንትዎን ያገናኙ (የስልክ ወይም የአካውንት ቁጥር)',
                    or: 'Herrega keessan walqabsiisaa (Bilbila / Herrega)',
                    ti: 'ኣካውንትኹም ኣራኽቡ (ቁጽሪ ስልኪ / ኣካውንት)',
                    sid: 'Akkawuntekki Qabsiisi',
                    en: 'Connect security wallet / Account credentials',
                    fr: 'Connectez votre portefeuille / compte',
                    de: 'Wallet / Kontodaten verbinden',
                    it: 'Collega il tuo portafoglio / conto',
                    zh: '关联支付钱包 / 账户信息',
                    ar: 'ربط المحفظة / بيانات الحساب'
                  })}
                </p>
                <div className="flex gap-1.5">
                  <span className="bg-[#F4C22B] border border-[#CF9D12] text-stone-950 px-2.5 py-1.5 rounded text-xs select-none flex items-center font-mono font-black">ACC</span>
                  <input 
                    type="text" 
                    value={chapaAccountNumber}
                    onChange={(e) => setChapaAccountNumber(e.target.value)}
                    placeholder={tText({
                      am: 'ቁጥር ያስገቡ (09xxxxxxxx / 10002345)',
                      or: 'Lakkoofsa galchi (09xxxxxxxx)',
                      ti: 'ቁጽሪ የእትዉ (09xxxxxxxx)',
                      sid: 'Kiiro eessi (09xxxxxxxx)',
                      en: 'Enter number (e.g. 09xxxxxxxx / 10002345)',
                      fr: 'Entrez le numéro (ex. 09xxxxxxxx)',
                      de: 'Nummer eingeben (z.B. 09xxxxxxxx)',
                      it: 'Inserisci numero (es. 09xxxxxxxx)',
                      zh: '输入账号或手机号 (09xxxxxxxx)',
                      ar: 'أدخل الرقم (مثال: 09xxxxxxxx)'
                    })} 
                    className="flex-grow bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 font-mono text-xs p-1.5 outline-none rounded font-bold"
                  />
                </div>
              </div>

              {/* User Balance Input Section */}
              <div className="space-y-1.5 border-t border-[#F4C22B]/25 pt-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#FDE68A] font-bold uppercase">
                    💰 {tText({
                      am: 'የእርስዎ አካውንት ቀሪ ሂሳብ:',
                      or: 'Haftee Herrega Keessanii:',
                      ti: 'ቀሪ ሒሳብ ኣካውንትኹም:',
                      sid: 'Akkawuntekki Gati Womaasha:',
                      en: 'Current Balance:',
                      fr: 'Solde actuel :',
                      de: 'Aktuelles Guthaben:',
                      it: 'Saldo attuale:',
                      zh: '当前账户余额：',
                      ar: 'الرصيد الحالي:'
                    })}
                  </span>
                  <span className="font-mono text-[9px] text-[#F4C22B] font-bold">{currency}</span>
                </div>
                <input 
                  type="number"
                  value={chapaUserBalance}
                  onChange={(e) => setChapaUserBalance(e.target.value)}
                  placeholder={tText({
                    am: 'ምን ያህል ቀሪ ሂሳብ አለዎት?',
                    or: 'Haftee meeqa qabdu?',
                    ti: 'ክንደይ ቀሪ ሒሳብ ኣለኩም?',
                    sid: 'Mee’o womaasha afidhootto?',
                    en: 'Enter available balance',
                    fr: 'Saisissez votre solde disponible',
                    de: 'Verfügbares Guthaben eingeben',
                    it: 'Inserisci il saldo disponibile',
                    zh: '输入可用余额',
                    ar: 'أدخل الرصيد المتاح'
                  })}
                  className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 font-mono text-xs p-1.5 outline-none rounded font-bold"
                />
                <div className="flex gap-1.5 pt-1">
                  {(['1000', '5000', '25000', '100000'] as const).map((amt) => (
                    <button 
                      key={amt}
                      type="button" 
                      onClick={() => setChapaUserBalance(amt)}
                      className="text-[9px] bg-[#8C1414] border border-[#F4C22B]/40 px-2 py-0.5 rounded text-white hover:bg-[#F4C22B] hover:text-stone-950 font-bold cursor-pointer"
                    >
                      {Number(amt) / 1000}K {currency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secure PIN Input Section */}
              <div className="space-y-1.5 border-t border-[#F4C22B]/25 pt-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#FDE68A] font-bold uppercase">
                    🔑 {tText({
                      am: 'የሚስጥር ቁጥር (PIN):',
                      or: 'Lakkoofsa Iccitii (PIN):',
                      ti: 'ምስጢራዊ ቁጽሪ (PIN):',
                      sid: 'Maaxote Kiiro (PIN):',
                      en: 'Secure Auth PIN:',
                      fr: 'Code PIN sécurisé :',
                      de: 'Sicherheits-PIN:',
                      it: 'PIN di sicurezza:',
                      zh: '安全支付 PIN 码：',
                      ar: 'رمز الحماية (PIN):'
                    })}
                  </span>
                  <span className="font-mono text-[9px] text-[#FEF08A] font-bold">
                    {tText({ am: 'አስፈላጊ', or: 'DIRQAMA', ti: 'ኣድላዪ', sid: 'HASIISANNONO', en: 'REQUIRED', fr: 'REQUIS', de: 'ERFORDERLICH', it: 'OBBLIGATORIO', zh: '必填', ar: 'مطلوب' })}
                  </span>
                </div>
                <input 
                  type="password"
                  maxLength={6}
                  value={chapaUserPin}
                  onChange={(e) => setChapaUserPin(e.target.value)}
                  placeholder={tText({
                    am: 'የሚስጥር ቁጥርዎን ያስገቡ (PIN)',
                    or: 'Lakkoofsa iccitii galchi (PIN)',
                    ti: 'ምስጢራዊ ቁጽሪ የእትዉ (PIN)',
                    sid: 'PIN borreessi',
                    en: 'Enter your PIN',
                    fr: 'Saisissez votre code PIN',
                    de: 'PIN eingeben',
                    it: 'Inserisci il PIN',
                    zh: '请输入支付 PIN 码',
                    ar: 'أدخل رمز PIN الخاص بك'
                  })}
                  className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 font-mono text-xs p-1.5 outline-none rounded font-bold"
                />
              </div>

              {/* Real-time Math validation */}
              {(() => {
                const bal = Number(chapaUserBalance) || 0;
                const diff = bal - grandTotal;
                const isInsufficient = diff < 0;
                return (
                  <div className={`p-2 rounded text-[10px] font-mono uppercase ${isInsufficient ? 'bg-[#7F1D1D] text-[#FEF08A] border border-[#F4C22B]' : 'bg-[#065F46] text-[#ECFDF5] border border-emerald-300'}`}>
                    <p>
                      {tText({ am: 'ቀሪ ሂሳብ:', or: 'Haftee:', ti: 'ቀሪ ሒሳብ:', sid: 'Gati Womaasha:', en: 'Your Balance:', fr: 'Votre solde :', de: 'Ihr Guthaben:', it: 'Tuo saldo:', zh: '当前余额：', ar: 'رصيدك:' })} {bal} {currency}
                    </p>
                    <p>
                      {tText({ am: 'የክፍያ ሂሳብ:', or: 'Kaffaltii:', ti: 'ዝኽፈል ሒሳብ:', sid: 'Baatooshshu Bikka:', en: 'Billing Cost:', fr: 'Montant facturé :', de: 'Rechnungsbetrag:', it: 'Importo:', zh: '账单金额：', ar: 'مبلغ الفاتورة:' })} {grandTotal} {currency}
                    </p>
                    {isInsufficient ? (
                      <p className="font-black text-[#FEF08A] pt-1">
                        ⚠️ {tText({
                          am: 'ማስጠንቀቂያ፡ አካውንትዎ ላይ በቂ ቀሪ ሂሳብ የለም!',
                          or: 'Akeekkachiisa: Herrega keessan irratti maallaqni gahaan hin jiru!',
                          ti: 'መጠንቀቕታ፡ ኣብ ኣካውንትኹም እኹል ቀሪ ሒሳብ የለን!',
                          sid: 'Qorophisha: Akkawuntekki aana ikkado womaashi dino!',
                          en: 'Warning: Insufficient funds in your account!',
                          fr: 'Attention : solde insuffisant sur votre compte !',
                          de: 'Warnung: Unzureichendes Guthaben auf Ihrem Konto!',
                          it: 'Attenzione: saldo insufficiente sul conto!',
                          zh: '警告：您的账户余额不足！',
                          ar: 'تحذير: الرصيد غير كافٍ في حسابك!'
                        })}
                      </p>
                    ) : (
                      <p className="font-black pt-1">
                        ✅ {tText({
                          am: `በቂ ሂሳብ አለዎት! ከክፍያ በኋላ ቀሪ: ${diff} ${currency}`,
                          or: `Maallaqa gahaa qabdu! Kaffaltii booda: ${diff} ${currency}`,
                          ti: `እኹል ሒሳብ ኣለኩም! ዝተርፍ: ${diff} ${currency}`,
                          sid: `Ikkado womaasha afidhootto! Baatootto gedensaanni gatinohu: ${diff} ${currency}`,
                          en: `Sufficient funds! Remaining after payment: ${diff} ${currency}`,
                          fr: `Solde suffisant ! Restant après paiement : ${diff} ${currency}`,
                          de: `Ausreichendes Guthaben! Restbetrag: ${diff} ${currency}`,
                          it: `Saldo sufficiente! Rimanenza dopo il pagamento: ${diff} ${currency}`,
                          zh: `余额充足！支付后剩余：${diff} ${currency}`,
                          ar: `الرصيد كافٍ! المتبقي بعد الدفع: ${diff} ${currency}`
                        })}
                      </p>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Bottom pay action */}
          <div className="p-4 bg-[#8C1414] border-t border-[#F4C22B]/50">
            <button 
              type="button"
              onClick={() => {
                if (!chapaAccountNumber.trim()) {
                  setChapaNotice({
                    type: 'error',
                    text: tText({
                      am: '⚠️ እባክዎ የእርስዎን አካውንት ወይም ስልክ ቁጥር ያስገቡ!',
                      or: '⚠️ Maaloo lakkoofsa herregaa ykn bilbilaa galchaa!',
                      ti: '⚠️ በጃኹም ቁጽሪ ኣካውንት ወይ ስልኪ የእትዉ!',
                      sid: '⚠️ Eegganno akkawunte woy bilbilu kiiro eessi!',
                      en: '⚠️ Account or phone number is required.',
                      fr: '⚠️ Le numéro de compte ou de téléphone est requis.',
                      de: '⚠️ Konto- oder Telefonnummer erforderlich.',
                      it: '⚠️ Numero di conto o telefono obbligatorio.',
                      zh: '⚠️ 请输入账户或手机号码。',
                      ar: '⚠️ رقم الحساب أو الهاتف مطلوب.'
                    })
                  });
                  return;
                }
                const balanceNum = Number(chapaUserBalance) || 0;
                if (balanceNum < grandTotal) {
                  setChapaNotice({
                    type: 'error',
                    text: tText({
                      am: '⚠️ የተሞላው ቀሪ ሂሳብ ከሚከፈለው ጠቅላላ ሂሳብ ያንሳል! መክፈል አይቻልም።',
                      or: '⚠️ Hafteen galchitan kaffaltii waliigalaa gadi dha! Kaffaluun hin danda’amu.',
                      ti: '⚠️ ዝተመልአ ቀሪ ሒሳብ ካብ ጠቕላላ ክፍሊት ይንእስ! ምኽፋል ኣይከኣልን።',
                      sid: '⚠️ Gati womaashi baatooshshunni ajino! Baata dandiinannikkiti.',
                      en: '⚠️ Insufficient funds in connected account.',
                      fr: '⚠️ Fonds insuffisants sur le compte connecté.',
                      de: '⚠️ Unzureichendes Guthaben auf dem verbundenen Konto.',
                      it: '⚠️ Fondi insufficienti sul conto collegato.',
                      zh: '⚠️ 关联账户余额不足，无法完成支付。',
                      ar: '⚠️ الرصيد في الحساب المرتبط غير كافٍ.'
                    })
                  });
                  return;
                }
                if (!chapaUserPin.trim() || chapaUserPin.length < 4) {
                  setChapaNotice({
                    type: 'error',
                    text: tText({
                      am: '⚠️ እባክዎ ቢያንስ 4 ዲጂት የሚስጥር ቁጥር (PIN) ያስገቡ!',
                      or: '⚠️ Maaloo lakkoofsa iccitii yoo xiqqaate dijiitii 4 galchaa!',
                      ti: '⚠️ በጃኹም እንተወሓደ 4 ዲጂት ምስጢራዊ ቁጽሪ (PIN) የእትዉ!',
                      sid: '⚠️ Eegganno ajjanna 4 dijiitete PIN eessi!',
                      en: '⚠️ Secure PIN must be at least 4 digits.',
                      fr: '⚠️ Le code PIN doit comporter au moins 4 chiffres.',
                      de: '⚠️ Die Sicherheits-PIN muss mindestens 4 Ziffern haben.',
                      it: '⚠️ Il PIN deve contenere almeno 4 cifre.',
                      zh: '⚠️ 安全 PIN 码至少需要 4 位数字。',
                      ar: '⚠️ يجب أن يتكون رمز PIN من 4 أرقام على الأقل.'
                    })
                  });
                  return;
                }

                setChapaNotice(null);
                const mockTxn = 'CHAP-REF-' + Math.floor(100000 + Math.random() * 900000);
                setShowChapaGateway(false);
                executeOrderPlacement(mockTxn);
              }}
              className="w-full bg-[#F4C22B] hover:bg-white text-stone-950 font-black uppercase text-xs tracking-wider py-3.5 transition-all shadow-md rounded-xl cursor-pointer text-center border border-[#CF9D12]"
            >
              {tText({
                am: `አሁኑኑ ${grandTotal} ${currency} በደህንነት ይክፈሉ`,
                or: `AMMAA ${grandTotal} ${currency} NAGAAN KAFFALI`,
                ti: `ሕጂ ${grandTotal} ${currency} ብውሑስ ክፈሉ`,
                sid: `XA ${grandTotal} ${currency} KEERAANCHIMMATENNI BAATI`,
                en: `SECURELY PAY ${grandTotal} ${currency} NOW`,
                fr: `PAYER ${grandTotal} ${currency} EN TOUTE SÉCURITÉ`,
                de: `JETZT SICHER ${grandTotal} ${currency} BEZAHLEN`,
                it: `PAGA ORA IN SICUREZZA ${grandTotal} ${currency}`,
                zh: `立即安全支付 ${grandTotal} ${currency}`,
                ar: `ادفع الآن بأمان ${grandTotal} ${currency}`
              })}
            </button>
            <p className="text-center text-[9px] text-[#FDE68A] font-mono mt-2 uppercase tracking-tight">
              {tText({
                am: 'በቻፓ ሴኪዩሪቲ ኮር የተረጋገጠ • SSL ጥበቃ',
                or: 'Chapa Security Core’n Mirkanaa’e • SSL',
                ti: 'ብቻፓ ሴኪዩሪቲ ኮር ዝተረጋገጸ • SSL',
                sid: 'Chapa Security Core Buuxxino • SSL',
                en: 'Verified by Chapa Security Core • SSL Enabled',
                fr: 'Vérifié par Chapa Security Core • SSL activé',
                de: 'Verifiziert durch Chapa Security Core • SSL aktiviert',
                it: 'Verificato da Chapa Security Core • SSL attivo',
                zh: '由 Chapa 安全核心认证 • 已启用 SSL 加密',
                ar: 'معتمد من Chapa Security Core • محمي بتقنية SSL'
              })}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
