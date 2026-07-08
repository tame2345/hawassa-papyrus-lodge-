/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, OrderItem, MenuItem, OrderType } from '../types';
import { Plus, Minus, Trash2, X, Search, Save, ShoppingCart, MapPin, Phone, HelpCircle } from 'lucide-react';

interface OrderAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  menuItems: MenuItem[];
  onSave: (updatedOrder: Order) => void;
  serviceChargeRate: number;
  vatRate: number;
  appLang: string;
}

export default function OrderAdjustmentModal({
  isOpen,
  onClose,
  order,
  menuItems,
  onSave,
  serviceChargeRate,
  vatRate,
  appLang
}: OrderAdjustmentModalProps) {
  const [adjustedLocation, setAdjustedLocation] = useState('');
  const [adjustedOrderType, setAdjustedOrderType] = useState<OrderType>('dine');
  const [adjustedPhone, setAdjustedPhone] = useState('');
  const [adjustedAddress, setAdjustedAddress] = useState('');
  const [adjustedTip, setAdjustedTip] = useState(0);
  const [adjustedItems, setAdjustedItems] = useState<OrderItem[]>([]);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Localized UI strings
  const textDict = {
    title: appLang === 'am' ? '📝 የትዕዛዝ ማስተካከያ ፓነል' : '📝 Order Adjustment & Modification',
    subtitle: appLang === 'am' ? 'ትዕዛዙን እንደገና ይመልከቱ፣ እቃዎችን ይቀንሱ/ይጨምሩ' : 'Review and alter order items, quantities, or location details',
    location: appLang === 'am' ? '📍 ጠረጴዛ / ክፍል ቁጥር (Location/Room)' : '📍 Table / Room Location',
    order_type: appLang === 'am' ? 'የአቅርቦት ሁኔታ (Service Type)' : 'Service Type',
    dine_in: appLang === 'am' ? '📍 በሎጁ / Dine-In' : '📍 Dine-In / Table',
    delivery: appLang === 'am' ? '🛵 ዴሊቨሪ / Delivery' : '🛵 Delivery Service',
    phone: appLang === 'am' ? 'ስልክ ቁጥር (Phone)' : 'Phone Number',
    address: appLang === 'am' ? 'የመድረሻ አድራሻ (Address)' : 'Delivery Address',
    tip: appLang === 'am' ? 'የቲፕ/ጉርሻ መጠን (Tip Staff)' : 'Staff Tip (ETB)',
    items_title: appLang === 'am' ? '📋 በትዕዛዝ ውስጥ ያሉ ምግቦች/እቃዎች' : '📋 Selected Order Items',
    add_items: appLang === 'am' ? '🔍 አዲስ እቃ ጨምር (Add Food / Beverages)' : '🔍 Add More Items from Menu',
    search_placeholder: appLang === 'am' ? 'በስም ወይም በካቴጎሪ ፈልግ...' : 'Search items by name or category...',
    subtotal: appLang === 'am' ? 'ንዑስ ድምር' : 'Subtotal',
    service_charge: appLang === 'am' ? `የአገልግሎት ክፍያ (${serviceChargeRate}%)` : `Service Charge (${serviceChargeRate}%)`,
    vat: appLang === 'am' ? `ቫት / VAT (${vatRate}%)` : `VAT (${vatRate}%)`,
    total: appLang === 'am' ? 'ጠቅላላ ክፍያ' : 'Grand Total',
    cancel: appLang === 'am' ? 'ይቅር (Cancel)' : 'Cancel',
    save: appLang === 'am' ? 'ማስተካከያውን አስቀምጥ (Save Modifications)' : 'Save Modifications',
    no_items: appLang === 'am' ? 'በትዕዛዝዎ ውስጥ ምንም እቃ የለም!' : 'No items remain in this order!',
    added: appLang === 'am' ? 'ተጨምሯል' : 'Added'
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
          name: appLang === 'am' ? product.nameAm : product.nameEn,
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
      alert(appLang === 'am' ? '⚠️ እባክዎ ቢያንስ አንድ ምርት ይምረጡ!' : '⚠️ Please add at least one item to the order.');
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#141414] px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse"></span>
              {textDict.title} <span className="text-sky-400 font-mono text-xs font-bold bg-sky-950/50 px-2 py-0.5 rounded border border-sky-500/20">{order.id}</span>
            </h3>
            <p className="text-[10px] text-white/40 uppercase font-mono mt-0.5">{textDict.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content - Two Column Layout */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 text-left">
          
          {/* Column 1: Order Details & Edit Items (8 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Delivery / Table Settings */}
            <div className="bg-[#121212] border border-white/5 p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustedOrderType('dine')}
                  className={`py-2 px-3 text-[10px] uppercase font-black tracking-wider transition-all border flex items-center justify-center gap-2 rounded-lg cursor-pointer ${
                    adjustedOrderType === 'dine'
                      ? 'bg-sky-400 text-black border-sky-400'
                      : 'bg-black/40 text-stone-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {textDict.dine_in}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustedOrderType('delivery')}
                  className={`py-2 px-3 text-[10px] uppercase font-black tracking-wider transition-all border flex items-center justify-center gap-2 rounded-lg cursor-pointer ${
                    adjustedOrderType === 'delivery'
                      ? 'bg-sky-400 text-black border-sky-400'
                      : 'bg-black/40 text-stone-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {textDict.delivery}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                    {textDict.location}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-500">
                      <MapPin size={12} />
                    </span>
                    <input
                      type="text"
                      value={adjustedLocation}
                      onChange={(e) => setAdjustedLocation(e.target.value)}
                      placeholder="e.g. Table 05 / Room 204"
                      className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-2.5 pl-9 outline-none focus:border-sky-400 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                    {textDict.tip}
                  </label>
                  <input
                    type="number"
                    value={adjustedTip || ''}
                    onChange={(e) => setAdjustedTip(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-sky-400 rounded-lg font-mono"
                  />
                </div>
              </div>

              {adjustedOrderType === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5 animate-fadeIn">
                  <div>
                    <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                      {textDict.phone}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-stone-500">
                        <Phone size={12} />
                      </span>
                      <input
                        type="tel"
                        value={adjustedPhone}
                        onChange={(e) => setAdjustedPhone(e.target.value)}
                        placeholder="09..."
                        className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-2.5 pl-9 outline-none focus:border-sky-400 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                      {textDict.address}
                    </label>
                    <input
                      type="text"
                      value={adjustedAddress}
                      onChange={(e) => setAdjustedAddress(e.target.value)}
                      placeholder="Street name, landmark..."
                      className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-sky-400 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* List of current order items */}
            <div className="bg-[#121212] border border-white/5 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-black uppercase text-white/70 border-b border-white/5 pb-2">
                {textDict.items_title}
              </h4>

              {adjustedItems.length === 0 ? (
                <p className="text-stone-500 text-xs text-center py-6 font-semibold">
                  {textDict.no_items}
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {adjustedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-black/30 border border-white/5 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">{item.price} ETB × {item.qty}</p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center bg-black/60 border border-white/10 rounded-lg overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDecreaseQty(item.id)}
                            className="px-2 py-1 hover:bg-white/5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-2.5 text-xs font-black font-mono text-sky-400">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseQty(item.id)}
                            className="px-2 py-1 hover:bg-white/5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-black text-emerald-400 min-w-[55px] text-right">
                          {item.price * item.qty} ETB
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-stone-500 hover:text-red-400 transition-colors p-1"
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
            <div className="bg-[#121212] border border-white/5 p-4 rounded-xl space-y-3 flex flex-col max-h-[280px]">
              <h4 className="text-xs font-black uppercase text-white/70 border-b border-white/5 pb-2">
                {textDict.add_items}
              </h4>

              {/* Search */}
              <div className="relative shrink-0">
                <span className="absolute left-2.5 top-2.5 text-stone-500">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder={textDict.search_placeholder}
                  className="w-full bg-black/40 border border-white/10 text-white text-[11px] p-2 pl-7.5 outline-none focus:border-sky-400 rounded-lg"
                />
              </div>

              {/* Search Results list */}
              <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-xs">
                {filteredMenuItems.map((prod) => {
                  const alreadyInOrder = adjustedItems.some(i => i.baseId === prod.id);
                  return (
                    <div 
                      key={prod.id}
                      className="bg-black/20 hover:bg-black/40 p-2 border border-white/5 rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white text-[11px] truncate">
                          {appLang === 'am' ? prod.nameAm : prod.nameEn}
                        </p>
                        <p className="text-[9px] text-stone-500 font-mono">
                          {prod.price} ETB • <span className="capitalize">{prod.cat}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddMenuProduct(prod)}
                        className={`py-1 px-2.5 rounded text-[9px] font-black uppercase cursor-pointer flex items-center gap-1 transition-colors ${
                          alreadyInOrder 
                            ? 'bg-sky-400/10 text-sky-400 border border-sky-400/20 hover:bg-sky-400 hover:text-black' 
                            : 'bg-[#C1FF00] hover:bg-white text-black'
                        }`}
                      >
                        <Plus size={10} />
                        {alreadyInOrder ? textDict.added : (appLang === 'am' ? 'ጨምር' : 'Add')}
                      </button>
                    </div>
                  );
                })}

                {filteredMenuItems.length === 0 && (
                  <p className="text-stone-600 text-[10px] text-center py-4 uppercase font-mono font-bold">
                    No matching items found
                  </p>
                )}
              </div>
            </div>

            {/* Bill Summary and action */}
            <div className="bg-black border border-white/10 p-5 rounded-2xl space-y-4 mt-auto">
              <h4 className="text-[10px] font-mono tracking-wider font-black uppercase text-stone-500">
                💰 BILLING SUMMARY (ሂሳብ ማጠቃለያ)
              </h4>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-stone-400">
                  <span>{textDict.subtotal}</span>
                  <span>{subtotal} ETB</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>{textDict.service_charge}</span>
                  <span>+ {sc} ETB</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>{textDict.vat}</span>
                  <span>+ {vt} ETB</span>
                </div>
                {Number(adjustedTip) > 0 && (
                  <div className="flex justify-between text-stone-400">
                    <span>{textDict.tip}</span>
                    <span>+ {adjustedTip} ETB</span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-black text-[#C1FF00]">
                  <span className="font-sans font-black uppercase">{textDict.total}</span>
                  <span className="text-base">{grandTotal} ETB</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  {textDict.save}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-[#141414] hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 text-xs font-black uppercase py-2.5 rounded-xl cursor-pointer transition-all"
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
