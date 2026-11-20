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
import { useLanguage } from '../context/LanguageContext';

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
  appLang: propAppLang,
  guestLocation,
  activeQueueCount,
  serviceChargeRate,
  vatRate,
  onAddToCart,
  onFocusMenuItem,
}: MenuAiAssistantProps) {
  const { appLang: ctxLang, t, tText, currency, isRtl } = useLanguage();
  const appLang = ctxLang || propAppLang;
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const starterPrompts = [
    tText({
      am: 'ለዛሬ ምርጥ ምግብ ምን ትመክረኛለህ?',
      en: 'What signature dish do you recommend?',
      or: 'Nyaata addaa kam naaf gorsita?',
      ti: 'ንሎሚ ብሉጽ መግቢ እንታይ ትመኽረኒ?',
      sid: 'Techcho baxxino sagale hiittoonni amaaltatto?',
      fr: 'Quel plat signature recommandez-vous ?',
      de: 'Welches Spezialgericht empfehlen Sie?',
      it: 'Quale piatto speciale consigli?',
      zh: '今天推荐什么招牌菜？',
      ar: 'ما الطبق المميز الذي تنصح به اليوم؟',
    }),
    tText({
      am: 'የጾም / የአትክልት ምግቦች የትኞቹ ናቸው?',
      en: 'Which fasting / vegan dishes are available?',
      or: 'Nyaanni tsoomii / kuduraa kamfaatu jira?',
      ti: 'ናይ ጾም / ኣትክልቲ መግብታት ኣየኖት እዮም?',
      sid: 'Tsoomu / ataakiltu sagale hiikkuri no?',
      fr: 'Quels plats véganes sont disponibles ?',
      de: 'Welche veganen Gerichte gibt es?',
      it: 'Quali piatti vegani sono disponibili?',
      zh: '有哪些素食或斋戒菜品？',
      ar: 'ما الأطباق النباتية المتوفرة؟',
    }),
    tText({
      am: 'የባህል ምግቦቹን እና የሽከላ ጥብስን አብራራልኝ',
      en: 'Explain the traditional Ethiopian dishes on the menu',
      or: 'Nyaata aadaa Itoophiyaa meenuu irra jiran naaf ibsi',
      ti: 'ባህላዊ መግብታት ኢትዮጵያ ኣብርሃለይ',
      sid: 'Budu sagale xapho leellishie',
      fr: 'Expliquez-moi les plats éthiopiens traditionnels',
      de: 'Erklären Sie die traditionellen Gerichte',
      it: 'Spiegami i piatti tradizionali etiopi',
      zh: '请介绍一下埃塞俄比亚传统菜',
      ar: 'اشرح لي الأطباق الإثيوبية التقليدية',
    }),
    tText({
      am: 'ቀዝቃዛ መጠጦች እና ጁስ ምን አለ?',
      en: 'What fresh juices or cold drinks do you have?',
      or: 'Juusii fi dhugaatii qabbanaa\'aa maal qabdu?',
      ti: 'ዝሑል መስተን ጁስን እንታይ ኣሎ?',
      sid: 'Qabbana\'aa ago\'nna juuse ma no?',
      fr: 'Quels jus frais ou boissons fraîches avez-vous ?',
      de: 'Welche frischen Säfte oder kalten Getränke gibt es?',
      it: 'Quali succhi freschi o bevande fredde avete?',
      zh: '有哪些鲜榨果汁或冷饮？',
      ar: 'ما العصائر الطازجة والمشروبات الباردة المتوفرة؟',
    }),
    tText({
      am: 'ከ500 ብር በታች ያሉ ምግቦችን አሳየኝ',
      en: 'Show me great options under 500 Birr',
      or: 'Nyaata qarshii 500 gadi ta\'an naaf agarsiisi',
      ti: 'ትሕቲ 500 ብር ዘለዉ መግብታት ኣርእየኒ',
      sid: '500 Birr woroonni noo sagale leellishie',
      fr: 'Montrez-moi des options à moins de 500 ETB',
      de: 'Zeigen Sie Gerichte unter 500 Birr',
      it: 'Mostrami piatti sotto i 500 Birr',
      zh: '显示500比尔以下的推荐菜品',
      ar: 'أظهر لي خيارات أقل من 500 بر',
    }),
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
            tText({
              am: 'ይቅርታ፣ አሁን መልስ ማግኘት አልተቻለም። እባክዎ ደግመው ይሞክሩ።',
              en: 'Could not reach the menu assistant right now. Please try again.',
              or: 'Dhiifama, gargaaraa meenuu amma argachuu hin dandeenye. Irra deebi\'aa yaalaa.',
              ti: 'ይቕሬታ፣ ሕጂ መልሲ ምርካብ ኣይተኻእለን። በጃኹም ደጊምኩም ፈትኑ።',
              sid: 'Maaro, xa dawaro afi\'ra didinoommo. Higaanni wo\'naali.',
              fr: 'Impossible de joindre l\'assistant menu pour le moment.',
              de: 'Menü-Assistent derzeit nicht erreichbar.',
              it: 'Impossibile raggiungere l\'assistente menu al momento.',
              zh: '暂时无法连接菜单助手，请重试。',
              ar: 'تعذر الوصول إلى مساعد القائمة حالياً. يرجى المحاولة مرة أخرى.',
            })
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
          : tText({
              am: 'ችግር ተፈጥሯል። እባክዎ ደግመው ይሞክሩ።',
              en: 'Something went wrong. Please try again.',
              or: 'Rakkoon uumameera. Maaloo irra deebi\'aa yaalaa.',
              ti: 'ጸገም ተፈጢሩ። በጃኹም ደጊምኩም ፈትኑ።',
              sid: 'Qarrubbu kalaqamino. Maaloo marro wo\'naali.',
              fr: 'Une erreur s\'est produite. Veuillez réessayer.',
              de: 'Etwas ist schiefgelaufen. Bitte erneut versuchen.',
              it: 'Qualcosa è andato storto. Riprova.',
              zh: '出现错误，请重试。',
              ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
            });

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
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative z-10 bg-[#fcfbf7] border border-[#ebe5d8] rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5 text-stone-900"
    >
      {/* Compact Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-2.5 cursor-pointer select-none min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-[#b21f1f] text-[#f4c22b] flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 leading-tight truncate">
              {t('ai.title')}
            </h3>
            <p className="text-[10px] text-stone-500 font-medium truncate">
              {t('ai.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setInputText('');
              }}
              className="px-2 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
              title={t('ai.reset')}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">{t('ai.reset')}</span>
            </button>
          )}
          <button
            type="button"
            id="btn-toggle-menu-ai"
            onClick={() => setIsOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer border ${
              isOpen
                ? 'bg-[#b21f1f] hover:bg-[#8c1414] text-white border-[#8c1414]'
                : 'bg-[#f4c22b] hover:bg-yellow-400 text-stone-950 border-[#cf9d12]'
            }`}
          >
            <span>{isOpen ? t('ai.hide') : t('ai.open')}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Starter Chips, Chat History & Input */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-2.5 pt-1"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessage(prompt)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-[#f4c22b]/25 border border-stone-200 hover:border-[#f4c22b] text-[10px] font-bold text-stone-800 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div
              ref={chatScrollRef}
              className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-3.5 max-h-[340px] overflow-y-auto space-y-3"
            >
              {messages.length === 0 ? (
                <div className="py-5 text-center space-y-1.5 text-stone-500">
                  <Utensils className="w-6 h-6 mx-auto text-[#b21f1f]" />
                  <p className="text-xs font-bold text-stone-800">
                    {tText({
                      am: 'ሰላም! የሃዋሳ ፓፒረስ ሎጅ AI ሜኑ ረዳት ነኝ።',
                      en: 'Welcome! I am the Hawassa Papyrus Lodge AI Menu Guide.',
                      or: 'Baga nagaan dhuftan! Ani Gargaaraa Meenuu AI Hawaasaa Paappiras Loojiiti.',
                      ti: 'ሰላም! ናይ ሃዋሳ ፓፒረስ ሎጅ AI ሜኑ ሓጋዚ እየ።',
                      sid: 'Keere! Ani Hawaasa Paappiras Looje AI Meenuu Kaa\'laanchooti.',
                      fr: 'Bienvenue ! Je suis le guide menu IA du Hawassa Papyrus Lodge.',
                      de: 'Willkommen! Ich bin der KI-Menüführer der Hawassa Papyrus Lodge.',
                      it: 'Benvenuto! Sono la guida menu IA di Hawassa Papyrus Lodge.',
                      zh: '欢迎！我是阿瓦萨 Papyrus 度假村 AI 菜单向导。',
                      ar: 'أهلاً بك! أنا مرشد القائمة الذكي لمنتجع هاواسا بابيروس.',
                    })}
                  </p>
                  <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                    {tText({
                      am: 'ስለ ማንኛውም ምግብ ይዘት፣ ስለ ባህላዊ ምግቦች፣ ስለ በጀትዎ ወይም ምን መብላት እንዳለብዎት ይጠይቁኝ።',
                      en: 'Ask me to explain any dish, suggest fasting/spicy/mild meals, compare prices, or recommend drinks.',
                      or: 'Waa\'ee nyaata kamiyyuu, nyaata tsoomii/mi\'aa, gatii ykn dhugaatii na gaafadhaa.',
                      ti: 'ብዛዕባ ዝኾነ መግቢ፣ ናይ ጾም ወይ ቅመም ምርጫታትን ዋጋን ሕተቱኒ።',
                      sid: 'Ayya sagale, tsoomu sagale, waaganna ago xa\'me.',
                      fr: 'Demandez-moi d\'expliquer un plat, des options véganes ou épicées, ou des boissons.',
                      de: 'Fragen Sie nach Gerichten, veganen/scharfen Optionen, Preisen oder Getränken.',
                      it: 'Chiedimi informazioni su piatti, opzioni vegane o piccanti, prezzi o bevande.',
                      zh: '向我咨询菜品介绍、素食/辣度选择、价格对比或饮品推荐。',
                      ar: 'اسألني عن أي طبق أو الخيارات النباتية أو الحارة أو الأسعار والمشروبات.',
                    })}
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
                            // Keep menu dish names as-is per user preference
                            const displayName = item.nameAm || item.nameEn || 'Menu Item';
                            const secondaryName = item.nameEn && item.nameEn !== item.nameAm ? item.nameEn : '';

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
                                      {item.price} {currency}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onFocusMenuItem(item)}
                                    className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer transition-colors"
                                    title={t('menu.browse_btn')}
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
                                        <span>{t('ai.added')}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{t('ai.add')}</span>
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
                  <span>{t('ai.checking')}</span>
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
                placeholder={t('ai.placeholder')}
                className="flex-1 bg-white border border-stone-300 focus:border-[#b21f1f] rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-900 placeholder-stone-400 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-[#b21f1f] hover:bg-[#8c1414] disabled:bg-stone-300 text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('ai.send')}</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
