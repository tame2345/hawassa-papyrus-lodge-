/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem } from '../types';
import {
  Sparkles,
  Send,
  Plus,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Utensils,
} from 'lucide-react';

interface CategoryChip {
  id: string;
  label: string;
  icon?: string;
}

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendedItemIds?: string[];
  suggestedFollowUps?: string[];
  isError?: boolean;
}

interface MenuAiAssistantProps {
  menuItems: MenuItem[];
  categories: CategoryChip[];
  appLang: string;
  guestLocation: string;
  activeQueueCount: number;
  serviceChargeRate: number;
  vatRate: number;
  onAddToCart: (item: MenuItem) => void;
  onFocusMenuItem: (item: MenuItem) => void;
}

export default function MenuAiAssistant({
  menuItems,
  categories,
  appLang,
  guestLocation,
  activeQueueCount,
  serviceChargeRate,
  vatRate,
  onAddToCart,
  onFocusMenuItem,
}: MenuAiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const isAm = appLang === 'am';

  const starterPrompts = isAm
    ? [
        'ለዛሬ ምርጥ ምግብ ምን ትመክረኛለህ?',
        'የጾም / የአትክልት ምግቦች የትኞቹ ናቸው?',
        'የባህል ምግቦቹን እና የሽከላ ጥብስን አብራራልኝ',
        'ቀዝቃዛ መጠጦች እና ጁስ ምን አለ?',
        'ከ500 ብር በታች ያሉ ምግቦችን አሳየኝ',
      ]
    : [
        'What signature dish do you recommend?',
        'Which fasting / vegan dishes are available?',
        'Explain the traditional Ethiopian dishes on the menu',
        'What fresh juices or cold drinks do you have?',
        'Show me great options under 500 Birr',
      ];

  useEffect(() => {
    if (chatScrollRef.current && isOpen) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    setIsOpen(true);
    setInputText('');

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/menu-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.slice(-8).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          menuItems: menuItems.map((m) => ({
            id: m.id,
            cat: m.cat,
            nameAm: m.nameAm,
            nameEn: m.nameEn,
            price: m.price,
            desc: m.desc,
            available: m.available,
            customizable: m.customizable,
          })),
          categories: categories.map((c) => ({ id: c.id, label: c.label })),
          appLang,
          guestLocation,
          activeQueueCount,
          serviceChargeRate,
          vatRate,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error ||
            (isAm
              ? 'ይቅርታ፣ አሁን መልስ ማግኘት አልተቻለም። እባክዎ ደግመው ይሞክሩ።'
              : 'Could not reach the menu assistant right now. Please try again.')
        );
      }

      const assistantMsg: AssistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.reply || '',
        recommendedItemIds: Array.isArray(data.recommendedItemIds) ? data.recommendedItemIds : [],
        suggestedFollowUps: Array.isArray(data.suggestedFollowUps) ? data.suggestedFollowUps : [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : isAm
          ? 'ችግር ተፈጥሯል። እባክዎ ደግመው ይሞክሩ።'
          : 'Something went wrong. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: msg,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = (item: MenuItem) => {
    onAddToCart(item);
    setRecentlyAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setRecentlyAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1800);
  };

  return (
    <div
      id="menu-ai-assistant-panel"
      className="relative z-10 bg-[#fcfbf7] border border-[#ebe5d8] rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5 text-stone-900"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-3 cursor-pointer select-none min-w-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#b21f1f] text-[#f4c22b] flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-stone-900 leading-tight truncate">
              {isAm ? 'የሜኑ AI ረዳት (AI Menu Assistant)' : 'AI Menu Assistant'}
            </h3>
            <p className="text-[11px] text-stone-600 font-medium truncate">
              {isAm
                ? 'ስለ ምግቦች፣ ቅመሞች፣ ዋጋ ወይም የጾም አማራጮች ይጠይቁ — ወዲያውኑ ይመክርዎታል'
                : 'Ask about dishes, ingredients, prices, fasting options, or get tailored picks'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setInputText('');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-bold text-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
              title={isAm ? 'ንግግር አጽዳ' : 'Reset chat'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAm ? 'አዲስ' : 'Reset'}</span>
            </button>
          )}
          <button
            type="button"
            id="btn-toggle-menu-ai"
            onClick={() => setIsOpen((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
              isOpen
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-[#f4c22b] hover:bg-yellow-400 text-stone-950 border-[#cf9d12]'
            }`}
          >
            <span>{isOpen ? (isAm ? 'ዝጋ' : 'Hide') : isAm ? 'AI ረዳት ክፈት' : 'Ask AI'}</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Starter Chips (always visible so guests can start in 1 tap right on the menu) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {starterPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage(prompt)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-[#f4c22b]/25 border border-stone-200 hover:border-[#f4c22b] text-[11px] font-bold text-stone-800 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Expandable Chat History & Input */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3 pt-1"
          >
            <div
              ref={chatScrollRef}
              className="bg-white border border-stone-200 rounded-2xl p-3.5 sm:p-4 max-h-[380px] overflow-y-auto space-y-3.5"
            >
              {messages.length === 0 ? (
                <div className="py-5 text-center space-y-1.5 text-stone-500">
                  <Utensils className="w-6 h-6 mx-auto text-[#b21f1f]" />
                  <p className="text-xs font-bold text-stone-800">
                    {isAm
                      ? 'ሰላም! የሃዋሳ ፓፒረስ ሎጅ AI ሜኑ ረዳት ነኝ።'
                      : 'Welcome! I am the Hawassa Papyrus Lodge AI Menu Guide.'}
                  </p>
                  <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                    {isAm
                      ? 'ስለ ማንኛውም ምግብ ይዘት፣ ስለ ባህላዊ ምግቦች፣ ስለ በጀትዎ ወይም ምን መብላት እንዳለብዎት ይጠይቁኝ።'
                      : 'Ask me to explain any dish, suggest fasting/spicy/mild meals, compare prices, or recommend drinks.'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const recItems = (msg.recommendedItemIds || [])
                    .map((id) => menuItems.find((m) => m.id === id))
                    .filter((m): m is MenuItem => Boolean(m));

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      } space-y-2`}
                    >
                      <div
                        className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-[#b21f1f] text-white font-semibold rounded-br-sm'
                            : msg.isError
                            ? 'bg-red-50 border border-red-200 text-red-800 font-semibold rounded-bl-sm'
                            : 'bg-[#fcfbf7] border border-stone-200 text-stone-800 font-medium rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Recommended Dish Action Cards */}
                      {recItems.length > 0 && (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                          {recItems.map((item) => {
                            const justAdded = Boolean(recentlyAddedIds[item.id]);
                            const displayName = isAm
                              ? item.nameAm
                              : item.nameEn || item.nameAm;
                            const secondaryName = isAm ? item.nameEn : item.nameAm;

                            return (
                              <div
                                key={item.id}
                                className="bg-[#fcfbf7] border border-stone-200 hover:border-[#f4c22b] rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                    <img
                                      src={item.image}
                                      alt={displayName}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      }}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-stone-900 truncate">
                                      {displayName}
                                    </p>
                                    {secondaryName && (
                                      <p className="text-[10px] text-stone-500 truncate">
                                        {secondaryName}
                                      </p>
                                    )}
                                    <p className="text-[11px] font-mono font-black text-[#b21f1f] tabular-nums">
                                      {item.price} {isAm ? 'ብር' : 'ETB'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onFocusMenuItem(item)}
                                    className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer transition-colors"
                                    title={isAm ? 'ሜኑ ላይ እይ' : 'View on menu'}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdd(item)}
                                    className={`px-2.5 py-2 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                                      justAdded
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-[#f4c22b] hover:bg-yellow-400 text-stone-950 border border-[#cf9d12]'
                                    }`}
                                  >
                                    {justAdded ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{isAm ? 'ታክሏል' : 'Added'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{isAm ? 'ጨምር' : 'Add'}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Follow-up prompt suggestions */}
                      {msg.role === 'assistant' &&
                        msg.suggestedFollowUps &&
                        msg.suggestedFollowUps.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {msg.suggestedFollowUps.map((followUp, fIdx) => (
                              <button
                                key={fIdx}
                                type="button"
                                disabled={isLoading}
                                onClick={() => sendMessage(followUp)}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#f4c22b]/30 border border-stone-200 text-[10px] font-bold text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {followUp}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs font-bold text-stone-500 bg-[#fcfbf7] border border-stone-200 rounded-2xl px-3.5 py-2.5 w-fit">
                  <Sparkles className="w-4 h-4 text-[#b21f1f] animate-spin" />
                  <span>
                    {isAm ? 'ሜኑውን እያጣራሁ ነው...' : 'Checking the menu for you...'}
                  </span>
                </div>
              )}
            </div>

            {/* Chat Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isAm
                    ? 'ስለ ምግቦች፣ ዋጋ፣ ቅመም ወይም ምርጫ ይጠይቁ...'
                    : 'Ask about any dish, ingredients, budget, or recommendation...'
                }
                className="flex-1 bg-white border border-stone-300 focus:border-[#b21f1f] rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-900 placeholder-stone-400 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-[#b21f1f] hover:bg-[#8c1414] disabled:bg-stone-300 text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAm ? 'ጠይቅ' : 'Send'}</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
