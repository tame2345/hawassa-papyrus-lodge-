/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, OrderItem, MenuItem, OrderType } from '../types';
import { Plus, Minus, Trash2, X, Search, Save, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OrderAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  menuItems: MenuItem[];
  onSave: (updatedOrder: Order) => void;
  serviceChargeRate: number;
  vatRate: number;
  appLang?: string;
}

export default function OrderAdjustmentModal({
  isOpen,
  onClose,
  order,
  menuItems,
  onSave,
  serviceChargeRate,
  vatRate,
}: OrderAdjustmentModalProps) {
  const { appLang, tText, currency, isRtl } = useLanguage();
  const [adjustedLocation, setAdjustedLocation] = useState('');
  const [adjustedOrderType, setAdjustedOrderType] = useState<OrderType>('dine');
  const [adjustedPhone, setAdjustedPhone] = useState('');
  const [adjustedAddress, setAdjustedAddress] = useState('');
  const [adjustedTip, setAdjustedTip] = useState(0);
  const [adjustedItems, setAdjustedItems] = useState<OrderItem[]>([]);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Localized UI strings (10 languages)
  const textDict = {
    title: tText({
      am: '📝 የትዕዛዝ ማስተካከያ ፓነል',
      or: '📝 Paanelii Sirreeffama Ajajaa',
      ti: '📝 ፓነል ምምዕርራይ ትእዛዝ',
      sid: '📝 Hajaaju Biddisha Paanele',
      en: '📝 Order Adjustment & Modification',
      fr: '📝 Modification de la commande',
      de: '📝 Bestellanpassung & Änderung',
      it: '📝 Modifica e regolazione ordine',
      zh: '📝 订单调整与修改',
      ar: '📝 تعديل وضبط الطلب',
    }),
    subtitle: tText({
      am: 'ትዕዛዙን እንደገና ይመልከቱ፣ እቃዎችን ይቀንሱ/ይጨምሩ',
      or: 'Ajaja irra deebi’ii ilaali, meeshaalee hir’isi ykn dabali',
      ti: 'ትእዛዝ ደጊምኩም ርኣዩ፣ ኣቕሑ ቀንሱ ወይ ወስኹ',
      sid: 'Hajaajo wirro la’i, uduunne ajji woy ledi',
      en: 'Review and alter order items, quantities, or location details',
      fr: 'Vérifiez et modifiez les articles, quantités ou le lieu',
      de: 'Bestellartikel, Mengen oder Standortdetails prüfen und ändern',
      it: 'Rivedi e modifica articoli, quantità o posizione',
      zh: '查看并修改订单菜品、数量或位置详情',
      ar: 'راجع وعدّل أصناف الطلب أو الكميات أو تفاصيل الموقع',
    }),
    location: tText({
      am: '📍 ጠረጴዛ / ክፍል ቁጥር',
      or: '📍 Lakkoofsa Minjaalaa / Kutaa',
      ti: '📍 ጠረጴዛ / ቁጽሪ ክፍሊ',
      sid: '📍 Xarapheeza / Kifile Kiiro',
      en: '📍 Table / Room Location',
      fr: '📍 Emplacement Table / Chambre',
      de: '📍 Tisch- / Zimmerstandort',
      it: '📍 Posizione Tavolo / Camera',
      zh: '📍 餐桌 / 房间位置',
      ar: '📍 موقع الطاولة / الغرفة',
    }),
    dine_in: tText({
      am: '📍 በሎጁ (Dine-In)',
      or: '📍 Loomii Keessatti (Dine-In)',
      ti: '📍 ኣብ ሎጅ (Dine-In)',
      sid: '📍 Loojaho Giddo (Dine-In)',
      en: '📍 Dine-In / Table',
      fr: '📍 Sur place / Table',
      de: '📍 Vor Ort / Tisch',
      it: '📍 Al tavolo',
      zh: '📍 堂食 / 餐桌',
      ar: '📍 تناول في المكان / طاولة',
    }),
    delivery: tText({
      am: '🛵 ዴሊቨሪ (Delivery)',
      or: '🛵 Geejjiba (Delivery)',
      ti: '🛵 ዴሊቨሪ (Delivery)',
      sid: '🛵 Soyaanchu (Delivery)',
      en: '🛵 Delivery Service',
      fr: '🛵 Livraison',
      de: '🛵 Lieferservice',
      it: '🛵 Consegna a domicilio',
      zh: '🛵 外送服务',
      ar: '🛵 خدمة التوصيل',
    }),
    phone: tText({
      am: 'ስልክ ቁጥር',
      or: 'Lakkoofsa Bilbilaa',
      ti: 'ቁጽሪ ስልኪ',
      sid: 'Bilbilu Kiiro',
      en: 'Phone Number',
      fr: 'Numéro de téléphone',
      de: 'Telefonnummer',
      it: 'Numero di telefono',
      zh: '电话号码',
      ar: 'رقم الهاتف',
    }),
    address: tText({
      am: 'የመድረሻ አድራሻ',
      or: 'Teessoo Geessii',
      ti: 'ኣድራሻ መብጽሒ',
      sid: 'Illishshu Teesso',
      en: 'Delivery Address',
      fr: 'Adresse de livraison',
      de: 'Lieferadresse',
      it: 'Indirizzo di consegna',
      zh: '送达地址',
      ar: 'عنوان التوصيل',
    }),
    tip: tText(
      {
        am: 'የቲፕ/ጉርሻ መጠን ({curr})',
        or: 'Hanga Tiippii ({curr})',
        ti: 'መጠን ቲፕ ({curr})',
        sid: 'Tiippete Bikka ({curr})',
        en: 'Staff Tip ({curr})',
        fr: 'Pourboire ({curr})',
        de: 'Trinkgeld ({curr})',
        it: 'Mancia ({curr})',
        zh: '小费 ({curr})',
        ar: 'إكرامية ({curr})',
      },
      { curr: currency }
    ),
    items_title: tText({
      am: '📋 በትዕዛዝ ውስጥ ያሉ ምግቦች/እቃዎች',
      or: '📋 Nyaataafi Meeshaalee Ajajaman',
      ti: '📋 ኣብ ትእዛዝ ዘለዉ ምግብታት',
      sid: '📋 Hajaaju Giddo Noo Sagale',
      en: '📋 Selected Order Items',
      fr: '📋 Articles sélectionnés',
      de: '📋 Ausgewählte Bestellartikel',
      it: '📋 Articoli selezionati',
      zh: '📋 已选订单菜品',
      ar: '📋 أصناف الطلب المختارة',
    }),
    add_items: tText({
      am: '🔍 አዲስ እቃ ጨምር',
      or: '🔍 Meeshaa Haaraa Dabali',
      ti: '🔍 ሓድሽ ኣቕሓ ወስኽ',
      sid: '🔍 Haaro Uduunne Ledi',
      en: '🔍 Add More Items from Menu',
      fr: '🔍 Ajouter des articles du menu',
      de: '🔍 Weitere Artikel hinzufügen',
      it: '🔍 Aggiungi dal menu',
      zh: '🔍 从菜单添加更多菜品',
      ar: '🔍 إضافة أصناف أخرى من القائمة',
    }),
    search_placeholder: tText({
      am: 'በስም ወይም በካቴጎሪ ፈልግ...',
      or: 'Maqaa ykn gosaan barbaadi...',
      ti: 'ብሽም ወይ ብምድብ ድለ...',
      sid: 'Suumunni woy gaamunni hasi...',
      en: 'Search items by name or category...',
      fr: 'Rechercher par nom ou catégorie...',
      de: 'Nach Name oder Kategorie suchen...',
      it: 'Cerca per nome o categoria...',
      zh: '按名称或分类搜索...',
      ar: 'ابحث بالاسم أو الفئة...',
    }),
    subtotal: tText({
      am: 'ንዑስ ድምር',
      or: 'Ida’ama Xiqqaa',
      ti: 'ንኡስ ድምር',
      sid: 'Shiima Xaphooma',
      en: 'Subtotal',
      fr: 'Sous-total',
      de: 'Zwischensumme',
      it: 'Subtotale',
      zh: '小计',
      ar: 'المجموع الفرعي',
    }),
    service_charge: tText(
      {
        am: 'የአገልግሎት ክፍያ ({rate}%)',
        or: 'Kaffaltii Tajaajilaa ({rate}%)',
        ti: 'ክፍሊት ኣገልግሎት ({rate}%)',
        sid: 'Owaante Baato ({rate}%)',
        en: 'Service Charge ({rate}%)',
        fr: 'Frais de service ({rate}%)',
        de: 'Servicegebühr ({rate}%)',
        it: 'Servizio ({rate}%)',
        zh: '服务费 ({rate}%)',
        ar: 'رسوم الخدمة ({rate}%)',
      },
      { rate: serviceChargeRate }
    ),
    vat: tText(
      {
        am: 'ቫት / VAT ({rate}%)',
        or: 'VAT ({rate}%)',
        ti: 'ቫት / VAT ({rate}%)',
        sid: 'VAT ({rate}%)',
        en: 'VAT ({rate}%)',
        fr: 'TVA ({rate}%)',
        de: 'MwSt ({rate}%)',
        it: 'IVA ({rate}%)',
        zh: '增值税 ({rate}%)',
        ar: 'ضريبة القيمة المضافة ({rate}%)',
      },
      { rate: vatRate }
    ),
    total: tText({
      am: 'ጠቅላላ ክፍያ',
      or: 'Kaffaltii Waliigalaa',
      ti: 'ጠቕላላ ክፍሊት',
      sid: 'Xaphooma Baato',
      en: 'Grand Total',
      fr: 'Total général',
      de: 'Gesamtbetrag',
      it: 'Totale complessivo',
      zh: '总计',
      ar: 'الإجمالي الكلي',
    }),
    cancel: tText({
      am: 'ይቅር',
      or: 'Haqi',
      ti: 'ይትረፍ',
      sid: 'Aguri',
      en: 'Cancel',
      fr: 'Annuler',
      de: 'Abbrechen',
      it: 'Annulla',
      zh: '取消',
      ar: 'إلغاء',
    }),
    save: tText({
      am: 'ማስተካከያውን አስቀምጥ',
      or: 'Sirreeffama Olkaa’i',
      ti: 'ምምዕርራይ ዓቅብ',
      sid: 'Biddisha Suuqi',
      en: 'Save Modifications',
      fr: 'Enregistrer les modifications',
      de: 'Änderungen speichern',
      it: 'Salva modifiche',
      zh: '保存修改',
      ar: 'حفظ التعديلات',
    }),
    no_items: tText({
      am: 'በትዕዛዝዎ ውስጥ ምንም እቃ የለም!',
      or: 'Ajaja keessan keessa meeshaan hin jiru!',
      ti: 'ኣብ ትእዛዝኩም ዝኾነ ኣቕሓ የለን!',
      sid: 'Hajaajikki giddo mittu uduunnino dino!',
      en: 'No items remain in this order!',
      fr: 'Aucun article dans cette commande !',
      de: 'Keine Artikel in dieser Bestellung!',
      it: 'Nessun articolo in questo ordine!',
      zh: '此订单中暂无菜品！',
      ar: 'لا توجد أصناف متبقية في هذا الطلب!',
    }),
    added: tText({
      am: 'ተጨምሯል',
      or: 'Dabalameera',
      ti: 'ተወሲኹ',
      sid: 'Ledamino',
      en: 'Added',
      fr: 'Ajouté',
      de: 'Hinzugefügt',
      it: 'Aggiunto',
      zh: '已添加',
      ar: 'تمت الإضافة',
    }),
  };

  // Populate data when order changes
  useEffect(() => {
    if (order) {
      setAdjustedLocation(order.location || '');
      setAdjustedOrderType(order.orderType || 'dine');
      setAdjustedPhone(order.deliveryPhone || '');
      setAdjustedAddress(order.deliveryAddress || '');
      setAdjustedTip(order.tip || 0);
      setAdjustedItems([...order.items]);
      setValidationError(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  // Qty helpers
  const handleIncreaseQty = (itemId: string) => {
    setAdjustedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, qty: item.qty + 1 } : item
    ));
  };

  const handleDecreaseQty = (itemId: string) => {
    setAdjustedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextQty = item.qty - 1;
        return nextQty > 0 ? { ...item, qty: nextQty } : null;
      }
      return item;
    }).filter((i): i is OrderItem => i !== null));
  };

  const handleRemoveItem = (itemId: string) => {
    setAdjustedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddMenuProduct = (product: MenuItem) => {
    setValidationError(null);
    setAdjustedItems(prev => {
      // Check if product is already in the order
      const existing = prev.find(item => item.baseId === product.id);
      if (existing) {
        return prev.map(item => 
          item.baseId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        const newItem: OrderItem = {
          id: `m-${product.id}-temp-${Date.now()}`,
          baseId: product.id,
          name: appLang === 'am' || appLang === 'ti' ? product.nameAm : product.nameEn,
          qty: 1,
          price: product.price
        };
        return [...prev, newItem];
      }
    });
  };

  // Recalculations
  const subtotal = adjustedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const sc = Math.round((subtotal * serviceChargeRate) / 100);
  const vt = Math.round(((subtotal + sc) * vatRate) / 100);
  const grandTotal = subtotal + sc + vt + Number(adjustedTip || 0);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustedItems.length === 0) {
      setValidationError(
        tText({
          am: '⚠️ እባክዎ ቢያንስ አንድ ምርት ይምረጡ!',
          or: '⚠️ Maaloo yoo xiqqaate meeshaa tokko filadhaa!',
          ti: '⚠️ በጃኹም እንተወሓደ ሓደ ኣቕሓ ምረጹ!',
          sid: '⚠️ Ballo ajjanna mitto uduunne doori!',
          en: '⚠️ Please add at least one item to the order.',
          fr: '⚠️ Veuillez ajouter au moins un article.',
          de: '⚠️ Bitte fügen Sie mindestens einen Artikel hinzu.',
          it: '⚠️ Aggiungi almeno un articolo.',
          zh: '⚠️ 请至少添加一道菜品。',
          ar: '⚠️ يرجى إضافة صنف واحد على الأقل للطلب.',
        })
      );
      return;
    }

    const updatedOrder: Order = {
      ...order,
      location: adjustedLocation,
      orderType: adjustedOrderType,
      deliveryPhone: adjustedOrderType === 'delivery' ? adjustedPhone : undefined,
      deliveryAddress: adjustedOrderType === 'delivery' ? adjustedAddress : undefined,
      items: adjustedItems,
      total: grandTotal,
      serviceCharge: sc,
      vat: vt,
      tip: Number(adjustedTip || 0)
    };

    onSave(updatedOrder);
  };

  // Filter available menu items to add
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.available) return false;
    if (!menuSearchQuery.trim()) return true;
    const q = menuSearchQuery.toLowerCase();
    return (
      item.nameAm.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.cat.toLowerCase().includes(q)
    );
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="fixed inset-0 z-[110] flex items-center justify-center bg-[#5C0A0A]/85 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#991B1B] border-2 border-[#F4C22B] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#8C1414] px-6 py-4 border-b border-[#F4C22B]/40">
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#F4C22B] rounded-full animate-pulse"></span>
              {textDict.title} <span className="text-stone-950 font-mono text-xs font-black bg-[#F4C22B] px-2 py-0.5 rounded border border-[#CF9D12]">{order.id}</span>
            </h3>
            <p className="text-[10px] text-[#FDE68A] uppercase font-mono mt-0.5">{textDict.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-[#F4C22B] bg-[#7A1212] hover:bg-[#B21F1F] border border-[#F4C22B]/40 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content - Two Column Layout */}
        <div className={`p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
          
          {/* Column 1: Order Details & Edit Items (8 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Delivery / Table Settings */}
            <div className="bg-[#7A1212] border border-[#F4C22B]/40 p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustedOrderType('dine')}
                  className={`py-2 px-3 text-[10px] uppercase font-black tracking-wider transition-all border flex items-center justify-center gap-2 rounded-lg cursor-pointer ${
                    adjustedOrderType === 'dine'
                      ? 'bg-[#F4C22B] text-stone-950 border-[#CF9D12]'
                      : 'bg-[#8C1414] text-white/90 border-[#F4C22B]/30 hover:border-[#F4C22B]'
                  }`}
                >
                  {textDict.dine_in}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustedOrderType('delivery')}
                  className={`py-2 px-3 text-[10px] uppercase font-black tracking-wider transition-all border flex items-center justify-center gap-2 rounded-lg cursor-pointer ${
                    adjustedOrderType === 'delivery'
                      ? 'bg-[#F4C22B] text-stone-950 border-[#CF9D12]'
                      : 'bg-[#8C1414] text-white/90 border-[#F4C22B]/30 hover:border-[#F4C22B]'
                  }`}
                >
                  {textDict.delivery}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-[#FDE68A] font-bold uppercase block mb-1">
                    {textDict.location}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#B21F1F]">
                      <MapPin size={12} />
                    </span>
                    <input
                      type="text"
                      value={adjustedLocation}
                      onChange={(e) => setAdjustedLocation(e.target.value)}
                      placeholder={tText({
                        am: 'ምሳሌ፡ ጠረጴዛ 05 / ክፍል 204',
                        or: 'Fkn. Minjaala 05 / Kutaa 204',
                        ti: 'ንኣብነት ጠረጴዛ 05 / ክፍሊ 204',
                        sid: 'Lawishsha: Xarapheeza 05 / Kifile 204',
                        en: 'e.g. Table 05 / Room 204',
                        fr: 'ex. Table 05 / Chambre 204',
                        de: 'z.B. Tisch 05 / Zimmer 204',
                        it: 'es. Tavolo 05 / Camera 204',
                        zh: '例如：05号桌 / 204房',
                        ar: 'مثال: طاولة 05 / غرفة 204',
                      })}
                      className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-xs font-bold p-2.5 pl-9 outline-none rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-[#FDE68A] font-bold uppercase block mb-1">
                    {textDict.tip}
                  </label>
                  <input
                    type="number"
                    value={adjustedTip || ''}
                    onChange={(e) => setAdjustedTip(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-xs font-bold p-2.5 outline-none rounded-lg font-mono"
                  />
                </div>
              </div>

              {adjustedOrderType === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F4C22B]/25 animate-fadeIn">
                  <div>
                    <label className="text-[9px] font-mono text-[#FDE68A] font-bold uppercase block mb-1">
                      {textDict.phone}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#B21F1F]">
                        <Phone size={12} />
                      </span>
                      <input
                        type="tel"
                        value={adjustedPhone}
                        onChange={(e) => setAdjustedPhone(e.target.value)}
                        placeholder="09..."
                        className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-xs font-bold p-2.5 pl-9 outline-none rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-[#FDE68A] font-bold uppercase block mb-1">
                      {textDict.address}
                    </label>
                    <input
                      type="text"
                      value={adjustedAddress}
                      onChange={(e) => setAdjustedAddress(e.target.value)}
                      placeholder={tText({
                        am: 'የመንገድ ስም ወይም ምልክት...',
                        or: 'Maqaa daandii ykn mallattoo...',
                        ti: 'ሽም መንገዲ ወይ ምልክት...',
                        sid: 'Doogote suumo woy malaate...',
                        en: 'Street name, landmark...',
                        fr: 'Nom de rue, point de repère...',
                        de: 'Straßenname, Orientierungspunkt...',
                        it: 'Via, punto di riferimento...',
                        zh: '街道名称、地标...',
                        ar: 'اسم الشارع، معلم قريب...',
                      })}
                      className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-xs font-bold p-2.5 outline-none rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* List of current order items */}
            <div className="bg-[#7A1212] border border-[#F4C22B]/40 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-black uppercase text-[#F4C22B] border-b border-[#F4C22B]/25 pb-2">
                {textDict.items_title}
              </h4>

              {adjustedItems.length === 0 ? (
                <p className="text-[#FDE68A] text-xs text-center py-6 font-semibold">
                  {textDict.no_items}
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {adjustedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-[#8C1414] border border-[#F4C22B]/35 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-[#FDE68A] font-mono">{item.price} {currency} × {item.qty}</p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center bg-[#7A1212] border border-[#F4C22B]/45 rounded-lg overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDecreaseQty(item.id)}
                            className="px-2 py-1 hover:bg-[#B21F1F] text-white transition-colors cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-2.5 text-xs font-black font-mono text-[#F4C22B]">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseQty(item.id)}
                            className="px-2 py-1 hover:bg-[#B21F1F] text-white transition-colors cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-black text-[#A7F3D0] min-w-[55px] text-right">
                          {item.price * item.qty} {currency}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-[#FEF08A] hover:text-white transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Column 2: Add New Menu Items & Billing (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Add more items */}
            <div className="bg-[#7A1212] border border-[#F4C22B]/40 p-4 rounded-xl space-y-3 flex flex-col max-h-[280px]">
              <h4 className="text-xs font-black uppercase text-[#F4C22B] border-b border-[#F4C22B]/25 pb-2">
                {textDict.add_items}
              </h4>

              {/* Search */}
              <div className="relative shrink-0">
                <span className="absolute left-2.5 top-2.5 text-[#B21F1F]">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder={textDict.search_placeholder}
                  className="w-full bg-white border-2 border-[#F4C22B] text-stone-900 placeholder-stone-400 text-[11px] font-bold p-2 pl-7.5 outline-none rounded-lg"
                />
              </div>

              {/* Search Results list */}
              <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-xs">
                {filteredMenuItems.map((prod) => {
                  const alreadyInOrder = adjustedItems.some(i => i.baseId === prod.id);
                  return (
                    <div 
                      key={prod.id}
                      className="bg-[#8C1414] hover:bg-[#B21F1F] p-2 border border-[#F4C22B]/30 rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white text-[11px] truncate">
                          {appLang === 'am' || appLang === 'ti' ? prod.nameAm : prod.nameEn}
                        </p>
                        <p className="text-[9px] text-[#FDE68A] font-mono">
                          {prod.price} {currency} • <span className="capitalize">{prod.cat}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddMenuProduct(prod)}
                        className={`py-1 px-2.5 rounded text-[9px] font-black uppercase cursor-pointer flex items-center gap-1 transition-colors ${
                          alreadyInOrder 
                            ? 'bg-emerald-400 text-stone-950 border border-white/60 hover:bg-white' 
                            : 'bg-[#F4C22B] hover:bg-white text-stone-950'
                        }`}
                      >
                        <Plus size={10} />
                        {alreadyInOrder
                          ? textDict.added
                          : tText({
                              am: 'ጨምር',
                              or: 'Dabali',
                              ti: 'ወስኽ',
                              sid: 'Ledi',
                              en: 'Add',
                              fr: 'Ajouter',
                              de: 'Hinzufügen',
                              it: 'Aggiungi',
                              zh: '添加',
                              ar: 'إضافة',
                            })}
                      </button>
                    </div>
                  );
                })}

                {filteredMenuItems.length === 0 && (
                  <p className="text-[#FDE68A] text-[10px] text-center py-4 uppercase font-mono font-bold">
                    {tText({
                      am: 'ምንም ተዛማጅ ምግብ አልተገኘም',
                      or: 'Meeshaan walsimu hin argamne',
                      ti: 'ዝተዛመደ ኣቕሓ ኣይተረኽበን',
                      sid: 'Xaadooshshu uduunni dino',
                      en: 'No matching items found',
                      fr: 'Aucun article correspondant',
                      de: 'Keine passenden Artikel gefunden',
                      it: 'Nessun articolo corrispondente',
                      zh: '未找到匹配菜品',
                      ar: 'لم يتم العثور على أصناف مطابقة',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Bill Summary and action */}
            <div className="bg-[#7A1212] border-2 border-[#F4C22B] p-5 rounded-2xl space-y-4 mt-auto">
              <h4 className="text-[10px] font-mono tracking-wider font-black uppercase text-[#F4C22B]">
                {tText({
                  am: '💰 ሂሳብ ማጠቃለያ',
                  or: '💰 CUUNFAA KAFFALTII',
                  ti: '💰 ጸብጻብ ሕሳብ',
                  sid: '💰 BAATU XAPHOOMA',
                  en: '💰 BILLING SUMMARY',
                  fr: '💰 RÉSUMÉ DE FACTURATION',
                  de: '💰 ABRECHNUNGSÜBERSICHT',
                  it: '💰 RIEPILOGO CONTO',
                  zh: '💰 账单汇总',
                  ar: '💰 ملخص الفاتورة',
                })}
              </h4>

              {validationError && (
                <div className="bg-red-950/90 border border-amber-300 text-amber-200 px-3 py-2 rounded-lg text-[11px] font-bold">
                  {validationError}
                </div>
              )}

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-white">
                  <span>{textDict.subtotal}</span>
                  <span>{subtotal} {currency}</span>
                </div>
                <div className="flex justify-between text-[#FDE68A]">
                  <span>{textDict.service_charge}</span>
                  <span>+ {sc} {currency}</span>
                </div>
                <div className="flex justify-between text-[#FDE68A]">
                  <span>{textDict.vat}</span>
                  <span>+ {vt} {currency}</span>
                </div>
                {Number(adjustedTip) > 0 && (
                  <div className="flex justify-between text-[#FDE68A]">
                    <span>{textDict.tip}</span>
                    <span>+ {adjustedTip} {currency}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-[#F4C22B]/40 flex justify-between text-sm font-black text-[#F4C22B]">
                  <span className="font-sans font-black uppercase">{textDict.total}</span>
                  <span className="text-base">{grandTotal} {currency}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full bg-[#F4C22B] hover:bg-white text-stone-950 text-xs font-black uppercase py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 border border-[#CF9D12]"
                >
                  <Save size={14} />
                  {textDict.save}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-[#8C1414] hover:bg-[#B21F1F] text-white border border-[#F4C22B]/45 text-xs font-black uppercase py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  {textDict.cancel}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
