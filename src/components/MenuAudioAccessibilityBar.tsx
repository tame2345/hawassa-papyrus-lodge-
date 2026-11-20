/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  RotateCcw,
  ShoppingCart,
  FolderOpen,
  ListMusic,
  Mic,
  MicOff,
  Send,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Plus,
  Check,
  Loader2,
  Bell,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { MenuItem, OrderItem, PromoBanner } from '../types';
import {
  buildCartSpeechPayload,
  buildDishSpeechPayload,
  getAccessibleString,
  playAccessibleChime,
  pauseAccessibleSpeech,
  resumeAccessibleSpeech,
  speakAccessibleText,
  stopAccessibleSpeech,
} from '../utils/menuVoiceReader';
import {
  BrowserSpeechRecognition,
  getRecognitionLocale,
  getSpeechRecognitionCtor,
  processVoiceOrderCommand,
  supportsMediaRecording,
  transcribeRecordedAudio,
  VoiceHistoryTurn,
  VoiceOrderResponse,
} from '../utils/voiceOrderEngine';
import { useLanguage } from '../context/LanguageContext';

interface MenuCategoryChip {
  id: string;
  label: string;
  icon?: string;
}

interface MenuAudioAccessibilityBarProps {
  appLang: string;
  isVoiceOverEnabled: boolean;
  onToggleVoiceOver: () => void;
  voiceSpeed: number;
  onChangeVoiceSpeed: (speed: number) => void;
  categories: MenuCategoryChip[];
  categoryTranslations: Record<string, Record<string, string>>;
  menuItems: MenuItem[];
  promoBanners: PromoBanner[];
  guestLocation: string;
  modifierOptions?: Record<string, unknown>;
  selectedCategory: string;
  selectedMenuCardId: string | null;
  menuSearchQuery: string;
  showSoldOutItems: boolean;
  onSelectCategory: (catId: string) => void;
  onSelectDish: (item: MenuItem) => void;
  onOrderDish: (item: MenuItem) => void;
  onVoiceExecuteResult: (result: VoiceOrderResponse) => void;
  onOpenMenuSection?: () => void;
  onEnsureVoiceOverOn?: () => void;
  pendingVoiceCommand?: string | null;
  onClearPendingVoiceCommand?: () => void;
  onOpenCart: () => void;
  onCallWaiter: () => void;
  cart: OrderItem[];
  serviceChargeRate: number;
  vatRate: number;
  getTranslatedItemFields: (item: MenuItem) => {
    name: string;
    desc: string;
    categoryLabel: string;
    isDrink: boolean;
    isCustomizable: boolean;
    qariaLabel: string;
    injeraLabel: string;
    daboCount: number;
    qty: number;
  };
  externalTranscript?: string;
}

export default function MenuAudioAccessibilityBar({
  appLang: propAppLang,
  isVoiceOverEnabled,
  onToggleVoiceOver,
  voiceSpeed,
  onChangeVoiceSpeed,
  categories,
  categoryTranslations,
  menuItems,
  promoBanners,
  guestLocation,
  modifierOptions,
  selectedCategory,
  selectedMenuCardId,
  menuSearchQuery,
  showSoldOutItems,
  onSelectCategory,
  onSelectDish,
  onOrderDish,
  onVoiceExecuteResult,
  onOpenMenuSection,
  onEnsureVoiceOverOn,
  pendingVoiceCommand,
  onClearPendingVoiceCommand,
  onOpenCart,
  onCallWaiter,
  cart,
  serviceChargeRate,
  vatRate,
  getTranslatedItemFields,
  externalTranscript,
}: MenuAudioAccessibilityBarProps) {
  const { appLang: ctxLang, tText, currency, isRtl } = useLanguage();
  const appLang = ctxLang || propAppLang || 'en';

  const [tourMode, setTourMode] = useState<'idle' | 'full' | 'category'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourQueue, setTourQueue] = useState<MenuItem[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [showMoreAudioTools, setShowMoreAudioTools] = useState(false);

  // Interactive Voice Ordering States
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'transcribing' | 'thinking'>('idle');
  const [spokenInputText, setSpokenInputText] = useState('');
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [lastVoiceError, setLastVoiceError] = useState('');
  const [micBlockedReason, setMicBlockedReason] = useState<'none' | 'iframe_policy' | 'browser_denied' | 'unsupported'>('none');
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryTurn[]>([]);
  const [lastVoiceResponse, setLastVoiceResponse] = useState<VoiceOrderResponse | null>(null);
  const [justAddedChipMap, setJustAddedChipMap] = useState<Record<string, boolean>>({});

  const tourActiveRef = useRef(false);
  const tourQueueRef = useRef<MenuItem[]>([]);
  const tourRunIdRef = useRef(0);
  const voiceSpeedRef = useRef(voiceSpeed);
  const appLangRef = useRef(appLang);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const interimTextRef = useRef('');
  const commandInputRef = useRef<HTMLInputElement | null>(null);

  const pickLang = (dict: Record<string, string>, code = appLangRef.current) =>
    dict[code] || dict.en || '';

  useEffect(() => {
    voiceSpeedRef.current = voiceSpeed;
  }, [voiceSpeed]);

  useEffect(() => {
    appLangRef.current = appLang;
  }, [appLang]);

  useEffect(() => {
    if (externalTranscript && !tourActiveRef.current && voiceStatus === 'idle') {
      setLiveTranscript(externalTranscript);
    }
  }, [externalTranscript, voiceStatus]);

  const currentViewItems = useMemo(() => {
    const q = menuSearchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesAvail = showSoldOutItems || item.available;
      if (!matchesAvail) return false;
      if (q !== '') {
        return (
          item.nameAm.toLowerCase().includes(q) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
          (item.desc && item.desc.toLowerCase().includes(q))
        );
      }
      return item.cat === selectedCategory;
    });
  }, [menuItems, menuSearchQuery, selectedCategory, showSoldOutItems]);

  const fullMenuOrderedItems = useMemo(() => {
    const ordered: MenuItem[] = [];
    const seen = new Set<string>();
    for (const cat of categories) {
      for (const item of menuItems) {
        if (item.cat === cat.id && (showSoldOutItems || item.available) && !seen.has(item.id)) {
          ordered.push(item);
          seen.add(item.id);
        }
      }
    }
    for (const item of menuItems) {
      if ((showSoldOutItems || item.available) && !seen.has(item.id)) {
        ordered.push(item);
        seen.add(item.id);
      }
    }
    return ordered;
  }, [categories, menuItems, showSoldOutItems]);

  const activeDish = useMemo(() => {
    if (tourMode !== 'idle' && tourQueue[tourIndex]) {
      return tourQueue[tourIndex];
    }
    return (
      currentViewItems.find((i) => i.id === selectedMenuCardId) ||
      currentViewItems[0] ||
      fullMenuOrderedItems[0] ||
      null
    );
  }, [tourMode, tourQueue, tourIndex, currentViewItems, selectedMenuCardId, fullMenuOrderedItems]);

  const latestHelpersRef = useRef({
    onSelectCategory,
    onSelectDish,
    getTranslatedItemFields,
    categoryTranslations,
    categories,
    onVoiceExecuteResult,
    onOpenMenuSection,
    onEnsureVoiceOverOn,
    cart,
    menuItems,
    promoBanners,
    guestLocation,
    modifierOptions,
    serviceChargeRate,
    vatRate,
    voiceHistory,
  });
  latestHelpersRef.current = {
    onSelectCategory,
    onSelectDish,
    getTranslatedItemFields,
    categoryTranslations,
    categories,
    onVoiceExecuteResult,
    onOpenMenuSection,
    onEnsureVoiceOverOn,
    cart,
    menuItems,
    promoBanners,
    guestLocation,
    modifierOptions,
    serviceChargeRate,
    vatRate,
    voiceHistory,
  };

  const cleanupMicCapture = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopTour = (silent = false) => {
    tourRunIdRef.current += 1;
    tourActiveRef.current = false;
    setTourMode('idle');
    setIsPaused(false);
    stopAccessibleSpeech();
    if (!silent) {
      playAccessibleChime('tour_end');
      const stopMsg = pickLang({
        am: 'የድምፅ ንባብ ቆሟል።',
        or: 'Dubbisni sagalee dhaabbateera.',
        ti: 'ናይ ድምጺ ንባብ ደው ኢሉ።',
        sid: 'Hasaawu nabbawa uurrino.',
        en: 'Audio reading stopped.',
        fr: 'Lecture audio arrêtée.',
        de: 'Audiowiedergabe gestoppt.',
        it: 'Lettura audio interrotta.',
        zh: '语音导览已停止。',
        ar: 'تم إيقاف القراءة الصوتية.',
      });
      setLiveTranscript(stopMsg);
    }
  };

  useEffect(() => {
    return () => {
      tourRunIdRef.current += 1;
      tourActiveRef.current = false;
      cleanupMicCapture();
      stopAccessibleSpeech();
    };
  }, []);

  const speakSingleDish = (item: MenuItem, idx?: number, total?: number) => {
    const { getTranslatedItemFields: getFields } = latestHelpersRef.current;
    const fields = getFields(item);
    const payload = buildDishSpeechPayload({
      item,
      appLang: appLangRef.current,
      translatedName: fields.name,
      translatedDesc: fields.desc,
      categoryLabel: fields.categoryLabel,
      indexInList: idx,
      totalInList: total,
      isDrink: fields.isDrink,
      isCustomizable: fields.isCustomizable,
      currentQty: fields.qty,
      qariaLabel: fields.qariaLabel,
      injeraLabel: fields.injeraLabel,
      daboCount: fields.daboCount,
    });

    setLiveTranscript(payload.nativeText);
    playAccessibleChime('step');

    const el = document.getElementById(`menu-card-item-${item.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    speakAccessibleText(payload.nativeText, appLangRef.current, {
      rate: voiceSpeedRef.current,
      fallbackEnText: payload.fallbackEnText,
    });
  };

  const speakTourItemAt = (index: number, runId: number) => {
    if (!tourActiveRef.current || tourRunIdRef.current !== runId) return;

    const queue = tourQueueRef.current;
    if (index >= queue.length) {
      tourActiveRef.current = false;
      setTourMode('idle');
      setIsPaused(false);
      playAccessibleChime('tour_end');
      const finishEn = 'Finished reading the menu. Tap Speak to Order whenever you are ready.';
      const finishMsg = pickLang({
        am: 'የሙሉ ሜኑ ንባብ ተጠናቋል። ለማዘዝ "በድምፅ እዘዝ" ይጫኑ።',
        or: 'Dubbisni meenuu xumurameera. Yeroo qophooftan "Sagaleedhaan Ajaji" cuqaasaa.',
        ti: 'ንባብ ምሉእ ሜኑ ተወዲኡ። ንምእዛዝ "ብድምጺ ኣዝዝ" ጠውቑ።',
        sid: 'Menunnita nabbawa gooffino. Hajajate "Hasaawunni Hajaji" ganni.',
        en: finishEn,
        fr: 'Lecture du menu terminée. Appuyez sur Commander par la Voix quand vous êtes prêt.',
        de: 'Menüvorlesung beendet. Tippen Sie auf Per Sprache bestellen, sobald Sie bereit sind.',
        it: 'Lettura del menu completata. Tocca Ordina con la Voce quando sei pronto.',
        zh: '菜单朗读完毕。准备好后请点击“语音点餐”。',
        ar: 'انتهت قراءة القائمة. اضغط على "اطلب بالصوت" عندما تكون جاهزاً.',
      });
      setLiveTranscript(finishMsg);
      speakAccessibleText(finishMsg, appLangRef.current, {
        rate: voiceSpeedRef.current,
        fallbackEnText: finishEn,
      });
      return;
    }

    const item = queue[index];
    setTourIndex(index);

    const {
      onSelectCategory: selectCat,
      onSelectDish: selectDish,
      getTranslatedItemFields: getFields,
    } = latestHelpersRef.current;

    selectCat(item.cat);
    selectDish(item);

    setTimeout(() => {
      if (!tourActiveRef.current || tourRunIdRef.current !== runId) return;
      const cardEl = document.getElementById(`menu-card-item-${item.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 90);

    const fields = getFields(item);
    const payload = buildDishSpeechPayload({
      item,
      appLang: appLangRef.current,
      translatedName: fields.name,
      translatedDesc: fields.desc,
      categoryLabel: fields.categoryLabel,
      indexInList: index,
      totalInList: queue.length,
      isDrink: fields.isDrink,
      isCustomizable: fields.isCustomizable,
      currentQty: fields.qty,
      qariaLabel: fields.qariaLabel,
      injeraLabel: fields.injeraLabel,
      daboCount: fields.daboCount,
    });

    setLiveTranscript(payload.nativeText);
    playAccessibleChime('step');

    speakAccessibleText(payload.nativeText, appLangRef.current, {
      rate: voiceSpeedRef.current,
      fallbackEnText: payload.fallbackEnText,
      onEnd: () => {
        if (tourActiveRef.current && tourRunIdRef.current === runId) {
          setTimeout(() => {
            if (tourActiveRef.current && tourRunIdRef.current === runId) {
              speakTourItemAt(index + 1, runId);
            }
          }, 420);
        }
      },
      onError: () => {
        if (tourActiveRef.current && tourRunIdRef.current === runId) {
          tourActiveRef.current = false;
          setTourMode('idle');
          setIsPaused(false);
        }
      },
    });
  };

  const startTour = (mode: 'full' | 'category') => {
    const queue = mode === 'full' ? fullMenuOrderedItems : currentViewItems;
    if (queue.length === 0) {
      playAccessibleChime('alert');
      const noItemsEn = 'No menu items available to read in this section.';
      const noItemsMsg = pickLang(
        {
          am: 'በዚህ ክፍል የሚነበብ ምግብ የለም።',
          or: 'Kutaa kana keessa nyaanni dubbifamu hin jiru.',
          ti: 'ኣብዚ ክፍሊ ዝንበብ ምግቢ የለን።',
          sid: 'Konne bayichira nabbawantanno sagale dino.',
          en: noItemsEn,
          fr: 'Aucun plat disponible à lire dans cette section.',
          de: 'In diesem Abschnitt sind keine Gerichte zum Vorlesen verfügbar.',
          it: 'Nessun piatto disponibile da leggere in questa sezione.',
          zh: '此部分暂无可供朗读的菜品。',
          ar: 'لا توجد أصناف متاحة للقراءة في هذا القسم.',
        },
        appLang,
      );
      setLiveTranscript(noItemsMsg);
      speakAccessibleText(noItemsMsg, appLang, { rate: voiceSpeed, fallbackEnText: noItemsEn });
      return;
    }

    if (!isVoiceOverEnabled) {
      onToggleVoiceOver();
    }

    tourRunIdRef.current += 1;
    const runId = tourRunIdRef.current;
    tourQueueRef.current = queue;
    tourActiveRef.current = true;
    setTourQueue(queue);
    setTourMode(mode);
    setIsPaused(false);
    setTourIndex(0);

    playAccessibleChime('tour_start');
    const introEn =
      mode === 'full'
        ? `Starting full Hawassa Papyrus menu audio guide. ${queue.length} items.`
        : `Reading selected category. ${queue.length} items.`;

    const introText = pickLang(
      mode === 'full'
        ? {
            am: `ሙሉ የሃዋሳ ፓፒረስ ሜኑ ንባብ ተጀምሯል። ${queue.length} ዝርዝሮች አሉ።`,
            or: `Qajeelfamni sagalee meenuu Paappiras guutuun jalqabeera. Gosoota ${queue.length}.`,
            ti: `ምሉእ ናይ ሃዋሳ ፓፒረስ ሜኑ ንባብ ተጀሚሩ። ${queue.length} ዝርዝራት ኣለዉ።`,
            sid: `Woʼma Hawaasi Papyrus menu nabbawa hanaffino. ${queue.length} xapho no.`,
            en: introEn,
            fr: `Démarrage du guide audio du menu Papyrus. ${queue.length} plats.`,
            de: `Start des vollständigen Papyrus-Menü-Audioguides. ${queue.length} Artikel.`,
            it: `Avvio della guida audio del menu Papyrus. ${queue.length} piatti.`,
            zh: `开始朗读帕皮鲁斯完整菜单，共 ${queue.length} 个项目。`,
            ar: `بدء الدليل الصوتي الكامل لقائمة بايروس. ${queue.length} أصناف.`,
          }
        : {
            am: `የተመረጠው ምድብ ንባብ ተጀምሯል። ${queue.length} ዝርዝሮች አሉ።`,
            or: `Ramaddiin filatame dubbifamaa jira. Gosoota ${queue.length}.`,
            ti: `ዝተመረጸ ምድብ ይንበብ ኣሎ። ${queue.length} ዝርዝራት ኣለዉ።`,
            sid: `Dooramino kifila nabbawantanni no. ${queue.length} xapho no.`,
            en: introEn,
            fr: `Lecture de la catégorie sélectionnée. ${queue.length} plats.`,
            de: `Ausgewählte Kategorie wird vorgelesen. ${queue.length} Artikel.`,
            it: `Lettura della categoria selezionata. ${queue.length} piatti.`,
            zh: `正在朗读所选分类，共 ${queue.length} 个项目。`,
            ar: `قراءة الفئة المحددة. ${queue.length} أصناف.`,
          },
      appLang,
    );
    setLiveTranscript(introText);
    speakAccessibleText(introText, appLang, {
      rate: voiceSpeed,
      fallbackEnText: introEn,
      onEnd: () => {
        if (tourActiveRef.current && tourRunIdRef.current === runId) {
          speakTourItemAt(0, runId);
        }
      },
    });
  };

  const handlePauseResume = () => {
    if (tourMode === 'idle') return;
    if (isPaused) {
      setIsPaused(false);
      resumeAccessibleSpeech();
      playAccessibleChime('select');
    } else {
      setIsPaused(true);
      pauseAccessibleSpeech();
      playAccessibleChime('step');
    }
  };

  const stepDish = (dir: -1 | 1) => {
    if (tourMode !== 'idle') {
      stopTour(true);
    }
    const list = currentViewItems.length > 0 ? currentViewItems : fullMenuOrderedItems;
    if (list.length === 0) return;

    const currentIdx = activeDish ? list.findIndex((i) => i.id === activeDish.id) : -1;
    let nextIdx = currentIdx === -1 ? 0 : currentIdx + dir;
    if (nextIdx < 0) nextIdx = list.length - 1;
    if (nextIdx >= list.length) nextIdx = 0;

    const nextItem = list[nextIdx];
    onSelectCategory(nextItem.cat);
    onSelectDish(nextItem);
    speakSingleDish(nextItem, nextIdx, list.length);
  };

  const handleRepeatDish = () => {
    if (tourMode !== 'idle') {
      stopTour(true);
    }
    if (!activeDish) return;
    const list = currentViewItems.length > 0 ? currentViewItems : fullMenuOrderedItems;
    const idx = list.findIndex((i) => i.id === activeDish.id);
    speakSingleDish(activeDish, idx >= 0 ? idx : undefined, list.length);
  };

  const handleReadCart = () => {
    if (tourMode !== 'idle') {
      stopTour(true);
    }
    const payload = buildCartSpeechPayload({
      cart,
      appLang,
      serviceChargeRate,
      vatRate,
    });
    setLiveTranscript(payload.nativeText);
    playAccessibleChime('select');
    speakAccessibleText(payload.nativeText, appLang, {
      rate: voiceSpeed,
      fallbackEnText: payload.fallbackEnText,
    });
  };

  // Helper to detect explicit blind/accessibility open-menu or read-menu speech locally as instant / offline backup
  const detectLocalMenuNavigationIntent = (text: string): 'open_menu' | 'read_menu' | null => {
    const clean = text.trim().toLowerCase();
    const mentionsOpenMenu =
      clean.includes('ሜኑ') ||
      clean.includes('ክፈት') ||
      clean.includes('ከፍተ') ||
      clean.includes('ምግብ ማዘዝ') ||
      clean.includes('open menu') ||
      clean.includes('open the menu') ||
      clean.includes('order food') ||
      clean.includes('start voice') ||
      clean.includes('meenuu bani') ||
      clean.includes('menu öffnen') ||
      clean.includes('ouvrir le menu') ||
      clean.includes('apri il menu') ||
      clean.includes('打开菜单') ||
      clean.includes('افتح القائمة');
    const mentionsRead =
      clean.includes('አንብብ') ||
      clean.includes('ንገረኝ') ||
      clean.includes('ዘርዝር') ||
      clean.includes('read menu') ||
      clean.includes('read the menu') ||
      clean.includes('read all') ||
      clean.includes('dubbisi') ||
      clean.includes('vorlesen') ||
      clean.includes('lire le menu') ||
      clean.includes('اقرأ القائمة');
    // Check if they appear to name a specific dish from the catalog — if so, let AI parse the exact order!
    const hasSpecificDish = latestHelpersRef.current.menuItems.some((m) => {
      const am = m.nameAm.trim().toLowerCase();
      const en = (m.nameEn || '').trim().toLowerCase();
      return (am.length >= 3 && clean.includes(am)) || (en.length >= 3 && clean.includes(en));
    });
    if (hasSpecificDish) return null;
    if (mentionsRead && !clean.includes('ክፈት') && !clean.includes('ከፍተ')) return 'read_menu';
    if (mentionsOpenMenu) return 'open_menu';
    if (mentionsRead) return 'read_menu';
    return null;
  };

  // Core Voice Command Dispatcher (handles spoken mic transcript OR quick button / typed command)
  const submitVoiceCommand = async (rawCommand: string, viaVoice = false) => {
    const cleanText = rawCommand.trim();
    if (!cleanText) return;

    if (tourMode !== 'idle') {
      stopTour(true);
    }

    const latest = latestHelpersRef.current;
    const isVoiceSession = viaVoice || cleanText === '__OPEN_MENU_VOICE_MODE__';

    // Instant sentinel from Entry "Open Menu & Order by Voice" button
    if (cleanText === '__OPEN_MENU_VOICE_MODE__') {
      latest.onEnsureVoiceOverOn?.();
      latest.onOpenMenuSection?.();
      const availableCats = latest.categories.map((c) => c.label).slice(0, 4).join(', ');
      const welcomeEn = `Digital menu is open. Categories include ${availableCats}. Say any dish name to order, or tap Read Menu to hear every dish.`;
      const welcomeNative = pickLang({
        am: `ዲጂታል ሜኑ ተከፍቷል! ምግቦች፣ መጠጦች እና ባህላዊ ምግቦች አሉ። የሚፈልጉትን ምግብ ስም ይናገሩ ወይም "ሜኑ አንብብ" የሚለውን ይጫኑ።`,
        or: `Meenuun dijitaalaa banameera! Maqaa nyaataa dubbadhaa ykn "Meenuu Dubbisi" cuqaasaa.`,
        ti: `ዲጂታል ሜኑ ተኸፊቱ ኣሎ! ዝደለኹምዎ ምግቢ ተዛረቡ ወይ "ሜኑ ኣንብብ" ጠውቑ።`,
        sid: `Diijitaale meenuu fanamino! Hashatto sagale suʼma hasaawi woy "Menu Nabbawi" ganni.`,
        en: welcomeEn,
        fr: `Le menu numérique est ouvert. Dites un plat pour commander ou appuyez sur Lire le Menu.`,
        de: `Das digitale Menü ist geöffnet. Sagen Sie ein Gericht oder tippen Sie auf Menü Vorlesen.`,
        it: `Il menu digitale è aperto. Pronuncia un piatto per ordinare o tocca Leggi Menu.`,
        zh: `数字菜单已打开。请说出菜品名称下单，或点击“朗读菜单”。`,
        ar: `تم فتح القائمة الرقمية. قل اسم الطبق للطلب أو اضغط على قراءة القائمة.`,
      });
      setLastVoiceError('');
      setLastUserSpeech('');
      setLastVoiceResponse({
        spokenReply: welcomeNative,
        englishSummary: welcomeEn,
        intent: 'open_menu',
        itemsToAdd: [],
        itemIdsToRemove: [],
        recommendedItemIds: latest.menuItems.filter((m) => m.available).slice(0, 4).map((m) => m.id),
        suggestedQuickReplies: [
          pickLang({
            am: 'ሜኑውን አንብብልኝ',
            or: 'Meenuu naaf dubbisi',
            ti: 'ሜኑ ኣንብበለይ',
            sid: 'Menu nabbawae',
            en: 'Read the menu',
            fr: 'Lire le menu',
            de: 'Menü vorlesen',
            it: 'Leggi il menu',
            zh: '朗读菜单',
            ar: 'اقرأ القائمة',
          }),
        ],
      });
      setLiveTranscript(welcomeNative);
      playAccessibleChime('tour_start');
      speakAccessibleText(welcomeNative, appLangRef.current, {
        rate: voiceSpeedRef.current,
        fallbackEnText: welcomeEn,
      });
      return;
    }

    setLastVoiceError('');
    setLastUserSpeech(cleanText);
    setSpokenInputText('');
    setVoiceStatus('thinking');

    const localMenuIntent = detectLocalMenuNavigationIntent(cleanText);

    try {
      const result = await processVoiceOrderCommand({
        transcript: cleanText,
        history: latest.voiceHistory,
        menuItems: latest.menuItems,
        categories: latest.categories,
        cart: latest.cart,
        promoBanners: latest.promoBanners,
        appLang: appLangRef.current,
        guestLocation: latest.guestLocation,
        serviceChargeRate: latest.serviceChargeRate,
        vatRate: latest.vatRate,
        modifierOptions: latest.modifierOptions,
      });

      setLastVoiceResponse(result);
      setVoiceHistory((prev) => [
        ...prev.slice(-4),
        { role: 'user', text: cleanText },
        { role: 'assistant', text: result.spokenReply || result.englishSummary },
      ]);

      // Apply structured actions (add/remove cart items, focus category, open cart, call waiter, open menu)
      latest.onVoiceExecuteResult(result);

      if (result.intent === 'open_menu' || localMenuIntent === 'open_menu') {
        latest.onOpenMenuSection?.();
      }

      if (result.intent === 'read_menu') {
        latest.onOpenMenuSection?.();
        setVoiceStatus('idle');
        startTour('full');
        return;
      }

      const spokenText = result.spokenReply || result.englishSummary;
      if (spokenText) {
        setLiveTranscript(spokenText);
        if (latest.isVoiceOverEnabled || isVoiceSession) {
          if (result.itemsToAdd.length > 0) {
            playAccessibleChime('added');
          } else {
            playAccessibleChime('select');
          }
          speakAccessibleText(spokenText, appLangRef.current, {
            rate: voiceSpeedRef.current,
            fallbackEnText: result.englishSummary || spokenText,
          });
        }
      }
    } catch (err: unknown) {
      // Seamless local fallback if user asked to open or read the menu even without server AI
      if (localMenuIntent === 'read_menu') {
        latest.onOpenMenuSection?.();
        setVoiceStatus('idle');
        startTour('full');
        return;
      }
      if (localMenuIntent === 'open_menu') {
        latest.onOpenMenuSection?.();
        const fallbackEn = 'Digital menu is now open. Tell me what food or drink you would like to order, or tap Read Menu to hear all dishes.';
        const fallbackNative = pickLang({
          am: 'ሜኑው ተከፍቷል! ምግቦች፣ መጠጦች እና ባህላዊ ምግቦች ዝግጁ ናቸው። የሚፈልጉትን ምግብ ስም ይናገሩ ወይም "ሜኑ አንብብ" ይጫኑ።',
          or: 'Meenuun banameera! Nyaata barbaaddan dubbadhaa ykn "Meenuu Dubbisi" cuqaasaa.',
          ti: 'ሜኑ ተኸፊቱ ኣሎ! ዝደለኹምዎ ምግቢ ተዛረቡ ወይ "ሜኑ ኣንብብ" ጠውቑ።',
          sid: 'Meenuu fanamino! Hashatto sagale hasaawi woy "Menu Nabbawi" ganni.',
          en: fallbackEn,
          fr: 'Le menu est ouvert. Dites ce que vous souhaitez commander ou appuyez sur Lire le Menu.',
          de: 'Das Menü ist geöffnet. Sagen Sie, was Sie bestellen möchten, oder tippen Sie auf Menü Vorlesen.',
          it: 'Il menu è aperto. Di cosa desideri ordinare o tocca Leggi Menu.',
          zh: '菜单已打开。请说出您想点的菜品，或点击“朗读菜单”。',
          ar: 'القائمة مفتوحة الآن. أخبرني بما تريد طلبه أو اضغط على قراءة القائمة.',
        });
        setLastVoiceResponse({
          spokenReply: fallbackNative,
          englishSummary: fallbackEn,
          intent: 'open_menu',
          itemsToAdd: [],
          itemIdsToRemove: [],
          recommendedItemIds: latest.menuItems.filter((m) => m.available).slice(0, 4).map((m) => m.id),
          suggestedQuickReplies: [],
        });
        setLiveTranscript(fallbackNative);
        if (latest.isVoiceOverEnabled || isVoiceSession) {
          playAccessibleChime('tour_start');
          speakAccessibleText(fallbackNative, appLangRef.current, {
            rate: voiceSpeedRef.current,
            fallbackEnText: fallbackEn,
          });
        }
        return;
      }

      const errMsg =
        err instanceof Error
          ? err.message
          : pickLang({
              am: 'የድምፅ ትዕዛዙን ማስኬድ አልተቻለም። እባክዎ ደግመው ይሞክሩ።',
              or: 'Ajaja sagalee amma hojiirra oolchuun hin dandaʼamne. Irra deebiʼii yaali.',
              ti: 'ናይ ድምጺ ትእዛዝ ክስራሕ ኣይከኣለን። በጃኹም ደጊምኩም ፈትኑ።',
              sid: 'Hasaawu ajaja loosate di-dandiinoonni. Marro woʼnaali.',
              en: 'Could not process voice order right now. Please try again.',
              fr: 'Impossible de traiter la commande vocale. Veuillez réessayer.',
              de: 'Sprachbestellung konnte derzeit nicht verarbeitet werden. Bitte erneut versuchen.',
              it: 'Impossibile elaborare l’ordine vocale ora. Riprova.',
              zh: '暂时无法处理语音点餐，请重试。',
              ar: 'تعذر معالجة الطلب الصوتي الآن. يرجى المحاولة مرة أخرى.',
            });
      setLastVoiceError(errMsg);
      setLiveTranscript(errMsg);
      if (latest.isVoiceOverEnabled || isVoiceSession) {
        playAccessibleChime('alert');
        speakAccessibleText(errMsg, appLangRef.current, {
          rate: voiceSpeedRef.current,
          fallbackEnText: errMsg,
        });
      }
    } finally {
      setVoiceStatus('idle');
    }
  };

  // Auto-execute pending voice command passed from the Entry page launcher
  useEffect(() => {
    if (pendingVoiceCommand && pendingVoiceCommand.trim()) {
      const cmd = pendingVoiceCommand;
      onClearPendingVoiceCommand?.();
      void submitVoiceCommand(cmd, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingVoiceCommand]);

  // Helper: Show actionable non-blocking recovery guidance when mic permission/policy blocks access
  const handleMicAccessBlocked = (err?: unknown) => {
    cleanupMicCapture();
    setVoiceStatus('idle');
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    const errName = err instanceof Error ? err.name : '';
    const errMsg = err instanceof Error ? err.message.toLowerCase() : '';
    const isPolicyOrPermission =
      errName === 'NotAllowedError' ||
      errName === 'PermissionDeniedError' ||
      errName === 'SecurityError' ||
      errMsg.includes('permission') ||
      errMsg.includes('policy') ||
      errMsg.includes('denied') ||
      errMsg.includes('not allowed');

    if (inIframe && isPolicyOrPermission) {
      setMicBlockedReason('iframe_policy');
      setLastVoiceError(
        pickLang({
          am: 'ይህ የPreview መስኮት (Iframe) ማይክሮፎን ስለከለከለ "በሙሉ መስኮት ክፈት" ይጫኑ ወይም ከታች ባለው ሳጥን ይዘዙ።',
          or: 'Foddaan preview kun maayikiroofoonii waan daangessuuf "Open Full Tab" cuqaasi ykn gadiitti barreessi.',
          ti: 'እዚ Preview መስኮት ማይክሮፎን ስለዝዓገተ "Open Full Tab" ጠውቑ ወይ ኣብ ታሕቲ ጽሒፍኩም ኣዝዙ።',
          sid: 'Kuni leellishshu masikoti mayikiroofone hoolino daafira woroonni borreessite hajaji.',
          en: 'This embedded preview window restricts microphone access. Open in a full tab to speak or use the quick box below.',
          fr: 'Cette fenêtre d’aperçu restreint le microphone. Ouvrez un nouvel onglet ou saisissez ci-dessous.',
          de: 'Dieses Vorschaufenster blockiert das Mikrofon. Öffnen Sie einen Voll-Tab oder tippen Sie unten.',
          it: 'Questa finestra di anteprima limita il microfono. Apri in una scheda completa o scrivi sotto.',
          zh: '当前嵌入预览窗口限制了麦克风访问。请在新标签页打开或在下方输入框下单。',
          ar: 'نافذة المعاينة تقيد استخدام الميكروفون. افتح في تبويب كامل أو اكتب طلبك أدناه.',
        }),
      );
    } else if (isPolicyOrPermission || errName === 'NotFoundError') {
      setMicBlockedReason('browser_denied');
      setLastVoiceError(
        pickLang({
          am: 'ማይክሮፎን በብራውዘር አልተፈቀደም። ከአድራሻ አሞሌው (🔒) ማይክሮፎን ይፍቀዱ ወይም ከታች ይዘዙ።',
          or: 'Eeyyamni maayikiroofoonii biraawuzariin cufameera. Mallattoo (🔒) cuqaasii eeyyami ykn gadiitti barreessi.',
          ti: 'ብራውዘር ንማይክሮፎን ኣይፈቐደን። ካብ ምልክት (🔒) ፍቐዱ ወይ ኣብ ታሕቲ ጽሒፍኩም ኣዝዙ።',
          sid: 'Biraawuzerete mayikiroofonera hayyo dino. (🔒) ganni woy woroonni borreessi.',
          en: 'Microphone permission is blocked in your browser settings. Click the lock (🔒) icon to allow Mic, or type below.',
          fr: 'L’autorisation du microphone est bloquée. Cliquez sur l’icône (🔒) pour l’autoriser ou saisissez ci-dessous.',
          de: 'Mikrofonberechtigung ist im Browser blockiert. Über (🔒) erlauben oder unten eingeben.',
          it: 'Autorizzazione microfono bloccata nel browser. Consenti dall’icona (🔒) o scrivi sotto.',
          zh: '浏览器阻止了麦克风权限。请点击地址栏锁形图标 (🔒) 允许，或在下方输入点餐。',
          ar: 'تم حظر إذن الميكروفون في المتصفح. انقر على رمز القفل (🔒) للسماح أو اكتب أدناه.',
        }),
      );
    } else {
      setMicBlockedReason('unsupported');
      setLastVoiceError(
        pickLang({
          am: 'ቀጥታ ማይክሮፎን ማግኘት አልተቻለም። ከታች ባለው ሳጥን ወይም ፈጣን ቁልፎች ይዘዙ።',
          or: 'Maayikiroofooniin kallattiin hin argamne. Qabduu ariifataa ykn saanduqa gadiitiin ajaji.',
          ti: 'ቀጥታ ማይክሮፎን ክርከብ ኣይከኣለን። ኣብ ታሕቲ ብጽሑፍ ወይ ብቅልጡፋት መጠውቒታት ኣዝዙ።',
          sid: 'Mayikiroofone afiʼra di-dandiinoonni. Woroonni borreessite hajaji.',
          en: 'Live microphone is unavailable on this device. Use quick prompts or type your order below.',
          fr: 'Microphone indisponible sur cet appareil. Utilisez les suggestions ou tapez votre commande.',
          de: 'Live-Mikrofon auf diesem Gerät nicht verfügbar. Nutzen Sie Schnellbefehle oder tippen Sie.',
          it: 'Microfono non disponibile su questo dispositivo. Usa i comandi rapidi o scrivi sotto.',
          zh: '此设备暂不支持实时麦克风，请使用快捷指令或在下方输入点餐。',
          ar: 'الميكروفون المباشر غير متوفر على هذا الجهاز. استخدم الأوامر السريعة أو اكتب طلبك أدناه.',
        }),
      );
    }

    playAccessibleChime('alert');
    window.setTimeout(() => {
      commandInputRef.current?.focus({ preventScroll: true });
    }, 80);
  };

  // Seamless Fallback: Direct getUserMedia + MediaRecorder + Server Gemini Transcription (/api/voice-transcribe)
  const startMediaRecorderCapture = async (): Promise<void> => {
    if (!supportsMediaRecording()) {
      handleMicAccessBlocked(new Error('Unsupported'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];
      setMicBlockedReason('none');
      setLastVoiceError('');

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 400) {
          setVoiceStatus('idle');
          return;
        }
        setVoiceStatus('transcribing');
        try {
          const text = await transcribeRecordedAudio(blob, appLangRef.current);
          if (text) {
            await submitVoiceCommand(text, true);
          } else {
            setVoiceStatus('idle');
          }
        } catch (err: unknown) {
          setLastVoiceError(err instanceof Error ? err.message : 'Transcription failed.');
          setVoiceStatus('idle');
        }
      };

      setVoiceStatus('listening');
      playAccessibleChime('tour_start');
      setLiveTranscript(
        pickLang({
          am: '🎙️ እየቀዳሁ ነው... ሲጨርሱ ማይክሮፎኑን መልሰው ይጫኑ።',
          or: '🎙️ Waraabamaa jira... Yeroo xumurtu maayikiroofoonii deebiʼii cuqaasi.',
          ti: '🎙️ ይቀድሕ ኣለኹ... ምስ ወዳእኩም ማይክሮፎን መሊስኩም ጠውቑ።',
          sid: '🎙️ Qadanni noommo... Goofiro mayikiroofone marro ganni.',
          en: '🎙️ Recording... Tap the microphone again when finished speaking.',
          fr: '🎙️ Enregistrement... Appuyez à nouveau sur le micro une fois terminé.',
          de: '🎙️ Aufnahme läuft... Tippen Sie erneut auf das Mikrofon, wenn Sie fertig sind.',
          it: '🎙️ Registrazione... Tocca di nuovo il microfono quando hai finito.',
          zh: '🎙️ 正在录音... 说完后请再次点击麦克风。',
          ar: '🎙️ جارٍ التسجيل... اضغط على الميكروفون مرة أخرى عند الانتهاء.',
        }),
      );
      recorder.start();
    } catch (err: unknown) {
      handleMicAccessBlocked(err);
    }
  };

  // Start / Stop Live Microphone Recording
  const handleToggleMic = async () => {
    if (voiceStatus === 'listening') {
      // Stop capture manually so interim/recorded speech submits immediately
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          setVoiceStatus('idle');
        }
        return;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          setVoiceStatus('idle');
        }
        return;
      }
      setVoiceStatus('idle');
      return;
    }

    if (voiceStatus !== 'idle') return;

    if (tourMode !== 'idle') {
      stopTour(true);
    }
    stopAccessibleSpeech();
    setLastVoiceError('');
    setMicBlockedReason('none');
    interimTextRef.current = '';

    const SpeechRecCtor = getSpeechRecognitionCtor();
    if (SpeechRecCtor) {
      let fellBackToRecorder = false;
      try {
        const rec = new SpeechRecCtor();
        recognitionRef.current = rec;
        rec.lang = getRecognitionLocale(appLangRef.current);
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        let finalizedText = '';

        rec.onstart = () => {
          setMicBlockedReason('none');
          setVoiceStatus('listening');
          playAccessibleChime('tour_start');
          setLiveTranscript(
            pickLang({
              am: '🎙️ እያዳመጥኩ ነው... ምግብ፣ መጠጥ ወይም ጥያቄዎን ይናገሩ።',
              or: '🎙️ Dhaggeeffachaa jira... Nyaata, dhugaatii ykn gaaffii keessan dubbadhaa.',
              ti: '🎙️ እሰምዕ ኣለኹ... ምግቢ፣ መስተ ወይ ሕቶኹም ተዛረቡ።',
              sid: '🎙️ Macciishshanni noommo... Sagale, ago woy xaʼmokki hasaawi.',
              en: '🎙️ Listening... Tell me what you would like to order or ask about the menu.',
              fr: '🎙️ À l’écoute... Dites-moi ce que vous souhaitez commander ou demander.',
              de: '🎙️ Ich höre zu... Sagen Sie, was Sie bestellen oder fragen möchten.',
              it: '🎙️ In ascolto... Dimmi cosa vorresti ordinare o chiedere.',
              zh: '🎙️ 正在聆听... 请说出您想点的菜品或询问的问题。',
              ar: '🎙️ أستمع الآن... أخبرني بما ترغب في طلبه أو السؤال عنه.',
            }),
          );
        };

        rec.onresult = (event) => {
          let finalPart = '';
          let interimPart = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const phrase = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              finalPart += phrase;
            } else {
              interimPart += phrase;
            }
          }
          if (finalPart) {
            finalizedText = `${finalizedText} ${finalPart}`.trim();
          }
          const combined = `${finalizedText} ${interimPart}`.trim();
          interimTextRef.current = combined;
          if (combined) {
            setSpokenInputText(combined);
            setLastUserSpeech(combined);
          }
        };

        rec.onerror = (event) => {
          const code = event.error;
          recognitionRef.current = null;
          // If SpeechRecognition fails (common inside Chrome iframes / privacy browsers), seamlessly try getUserMedia + MediaRecorder
          if (
            !fellBackToRecorder &&
            (code === 'not-allowed' ||
              code === 'service-not-allowed' ||
              code === 'audio-capture' ||
              code === 'network')
          ) {
            fellBackToRecorder = true;
            void startMediaRecorderCapture();
            return;
          }

          setVoiceStatus('idle');
          if (code === 'no-speech') {
            setLiveTranscript(
              pickLang({
                am: 'ድምፅ አልተሰማም — ማይክሮፎኑን ደግመው ተጭነው ይናገሩ።',
                or: 'Sagaleen hin dhagaʼamne — maayikiroofoonii tuqii qulqullinaan dubbadhu.',
                ti: 'ድምጺ ኣይተሰምዐን — ማይክሮፎን ጠዊቕኩም ብንጹር ተዛረቡ።',
                sid: 'Hasaawu di-macciishshamino — mayikiroofone ganne xawaabbe hasaawi.',
                en: 'No speech detected — tap the mic and speak clearly.',
                fr: 'Aucune voix détectée — appuyez sur le micro et parlez clairement.',
                de: 'Keine Sprache erkannt — tippen Sie auf das Mikrofon und sprechen Sie deutlich.',
                it: 'Nessuna voce rilevata — tocca il microfono e parla chiaramente.',
                zh: '未检测到语音 — 请点击麦克风并清晰说话。',
                ar: 'لم يتم اكتشاف صوت — اضغط على الميكروفون وتحدث بوضوح.',
              }),
            );
          } else {
            handleMicAccessBlocked(new Error(code));
          }
        };

        rec.onend = () => {
          if (fellBackToRecorder) return;
          recognitionRef.current = null;
          const textToProcess = (finalizedText || interimTextRef.current).trim();
          if (textToProcess) {
            void submitVoiceCommand(textToProcess, true);
          } else {
            setVoiceStatus('idle');
          }
        };

        rec.start();
        return;
      } catch {
        recognitionRef.current = null;
      }
    }

    // Automatic Fallback via MediaRecorder + Gemini Audio Transcription
    await startMediaRecorderCapture();
  };

  // Global keyboard shortcuts inside the customer menu
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        stopTour(false);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (tourMode === 'idle') startTour('full');
        else handlePauseResume();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        void handleToggleMic();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleReadCart();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (activeDish) {
          onOrderDish(activeDish);
        }
        return;
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        stepDish(1);
        return;
      }
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        stepDish(-1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const activeDishName = activeDish ? getTranslatedItemFields(activeDish).name : '';
  const cartItemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const quickPromptsMap: Record<string, Array<{ label: string; query: string; icon: string }>> = {
    am: [
      { label: '✨ ምን ምን አለ?', query: 'ዛሬ ምን ምን ምግብ እና መጠጥ አለ? ከዋጋ ጋር ንገረኝ', icon: '✨' },
      { label: '🏷️ ቅናሽ / Deals', query: 'ዛሬ ምን ልዩ ቅናሽ ወይም ዲል (Deals) አለ?', icon: '🏷️' },
      { label: '🍖 ሽከላ ጥብስ እዘዝ', query: 'አንድ ሽከላ ጥብስ ወደ ቅርጫቴ ጨምርልኝ', icon: '🍖' },
      { label: '🥤 ቀዝቃዛ መጠጥ ምን አለ?', query: 'ቀዝቃዛ መጠጦች እና ጁስ ምን አለ?', icon: '🥤' },
      { label: '🛍️ ቅርጫቴን አንብብ', query: 'አሁን ቅርጫቴ ውስጥ ምን አለ?', icon: '🛍️' },
    ],
    or: [
      { label: '✨ Maal faʼa jira?', query: 'Harʼa nyaataa fi dhugaatii maal faʼa qabdu gatii waliin?', icon: '✨' },
      { label: '🏷️ Hirʼina Harʼaa', query: 'Harʼa qophii addaa fi hirʼinni maali?', icon: '🏷️' },
      { label: '🍽️ Nyaata Aadaa', query: 'Nyaata aadaa Itoophiyaa maal faʼatu jira?', icon: '🍽️' },
      { label: '🥤 Dhugaatii Qabbanaaʼaa', query: 'Juusii fi dhugaatii qabbanaaʼaa maal qabdu?', icon: '🥤' },
      { label: '🛍️ Kuusaa Koo Dubbisi', query: 'Amma kuusaa koo keessa maal jira?', icon: '🛍️' },
    ],
    ti: [
      { label: '✨ እንታይ ኣሎ?', query: 'ሎሚ እንታይ ምግብን መስተን ኣሎ ምስ ዋጋ?', icon: '✨' },
      { label: '🏷️ ናይ ሎሚ ቅናሽ', query: 'ሎሚ እንታይ ፍሉይ ቅናሽ ኣሎ?', icon: '🏷️' },
      { label: '🍽️ ባህላዊ ምግቢ', query: 'እንታይ ባህላዊ ምግብታት ይርከቡ?', icon: '🍽️' },
      { label: '🥤 ዝሑል መስተ', query: 'እንታይ ጽማቕን ዝሑል መስተን ኣሎ?', icon: '🥤' },
      { label: '🛍️ ቅርጫተይ ኣንብብ', query: 'ሕጂ ኣብ ቅርጫተይ እንታይ ኣሎ?', icon: '🛍️' },
    ],
    sid: [
      { label: '✨ Maahooti no?', query: 'Techcho ma sagalenna ago noo waagu ledo?', icon: '✨' },
      { label: '🏷️ Techcho Qaaqqu', query: 'Techcho baxxino hirro no?', icon: '🏷️' },
      { label: '🍽️ Budu Sagale', query: 'Ma budu sagale afantanno?', icon: '🍽️' },
      { label: '🥤 Qiida Ago', query: 'Ma jusiinna qiida ago no?', icon: '🥤' },
      { label: '🛍️ Koodeʼya Nabbawi', query: 'Xaa yannara koodeʼya giddo ma no?', icon: '🛍️' },
    ],
    en: [
      { label: "✨ What's on the menu?", query: 'What dishes and drinks do you have right now with prices?', icon: '✨' },
      { label: '🏷️ Today Deals', query: 'Tell me your special deals and combo offers today.', icon: '🏷️' },
      { label: '🍽️ Traditional Food', query: 'What traditional Ethiopian dishes are available?', icon: '🍽️' },
      { label: '🥤 Cold Drinks', query: 'What juices and cold drinks do you have?', icon: '🥤' },
      { label: '🛍️ Read My Cart', query: 'Read what is in my cart right now.', icon: '🛍️' },
    ],
    fr: [
      { label: '✨ Quoi au menu ?', query: 'Quels plats et boissons avez-vous avec les prix ?', icon: '✨' },
      { label: '🏷️ Offres du Jour', query: 'Quelles sont vos offres et formules du jour ?', icon: '🏷️' },
      { label: '🍽️ Plats Traditionnels', query: 'Quels plats traditionnels éthiopiens sont disponibles ?', icon: '🍽️' },
      { label: '🥤 Boissons Fraîches', query: 'Quels jus et boissons fraîches proposez-vous ?', icon: '🥤' },
      { label: '🛍️ Lire Mon Panier', query: 'Lis ce qu’il y a dans mon panier.', icon: '🛍️' },
    ],
    de: [
      { label: '✨ Was gibt es?', query: 'Welche Speisen und Getränke gibt es aktuell mit Preisen?', icon: '✨' },
      { label: '🏷️ Tagesangebote', query: 'Welche Sonderangebote und Menüs gibt es heute?', icon: '🏷️' },
      { label: '🍽️ Traditionell', query: 'Welche traditionellen äthiopischen Gerichte sind verfügbar?', icon: '🍽️' },
      { label: '🥤 Kalte Getränke', query: 'Welche Säfte und kalten Getränke haben Sie?', icon: '🥤' },
      { label: '🛍️ Warenkorb Vorlesen', query: 'Lies vor, was aktuell in meinem Warenkorb ist.', icon: '🛍️' },
    ],
    it: [
      { label: '✨ Cosa c’è nel menu?', query: 'Quali piatti e bevande avete ora con i prezzi?', icon: '✨' },
      { label: '🏷️ Offerte del Giorno', query: 'Quali offerte speciali avete oggi?', icon: '🏷️' },
      { label: '🍽️ Piatti Tradizionali', query: 'Quali piatti tradizionali etiopi sono disponibili?', icon: '🍽️' },
      { label: '🥤 Bibite Fredde', query: 'Quali succhi e bevande fredde avete?', icon: '🥤' },
      { label: '🛍️ Leggi Carrello', query: 'Leggi cosa c’è nel mio carrello adesso.', icon: '🛍️' },
    ],
    zh: [
      { label: '✨ 有什么菜品？', query: '现在有哪些菜品和饮品？请告诉我价格。', icon: '✨' },
      { label: '🏷️ 今日特惠', query: '今天有什么特别优惠和套餐？', icon: '🏷️' },
      { label: '🍽️ 埃塞传统菜', query: '有哪些埃塞俄比亚传统菜肴？', icon: '🍽️' },
      { label: '🥤 冷饮果汁', query: '有哪些果汁和冷饮？', icon: '🥤' },
      { label: '🛍️ 朗读购物车', query: '请朗读我购物车里的内容。', icon: '🛍️' },
    ],
    ar: [
      { label: '✨ ماذا في القائمة؟', query: 'ما الأطباق والمشروبات المتوفرة الآن مع الأسعار؟', icon: '✨' },
      { label: '🏷️ عروض اليوم', query: 'ما هي العروض الخاصة والوجبات اليوم؟', icon: '🏷️' },
      { label: '🍽️ أكلات تقليدية', query: 'ما الأطباق الإثيوبية التقليدية المتوفرة؟', icon: '🍽️' },
      { label: '🥤 مشروبات باردة', query: 'ما هي العصائر والمشروبات الباردة المتوفرة؟', icon: '🥤' },
      { label: '🛍️ قراءة سلتي', query: 'اقرأ ما يوجد في سلة طلباتي الآن.', icon: '🛍️' },
    ],
  };

  const quickVoicePrompts = quickPromptsMap[appLang] || quickPromptsMap.en;

  const highlightedVoiceItems = useMemo(() => {
    const ids = new Set<string>([
      ...(lastVoiceResponse?.recommendedItemIds || []),
      ...(lastVoiceResponse?.itemsToAdd?.map((a) => a.itemId) || []),
    ]);
    return Array.from(ids)
      .map((id) => menuItems.find((m) => m.id === id))
      .filter((m): m is MenuItem => Boolean(m))
      .slice(0, 4);
  }, [lastVoiceResponse, menuItems]);

  return (
    <section
      id="accessible-audio-menu-bar"
      role="region"
      dir={isRtl ? 'rtl' : 'ltr'}
      aria-label={getAccessibleString('bar_title', appLang)}
      className="relative z-10 w-full max-w-full overflow-x-clip rounded-2xl bg-[#991B1B] text-white border-2 border-[#f4c22b] p-3 sm:p-4 shadow-lg space-y-2.5"
    >
      {/* Compact Primary Strip: Title + Live Mic CTA + Audio Tour + Cart */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Compact Brand Voice Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            id="btn-voice-order-mic"
            onClick={handleToggleMic}
            disabled={voiceStatus === 'thinking' || voiceStatus === 'transcribing'}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              voiceStatus === 'listening'
                ? 'bg-[#7A1212] hover:bg-[#5C0A0A] text-[#f4c22b] ring-2 ring-[#f4c22b] animate-pulse border border-[#f4c22b]'
                : voiceStatus === 'thinking' || voiceStatus === 'transcribing'
                  ? 'bg-amber-300 text-stone-950 cursor-wait'
                  : 'bg-[#f4c22b] hover:bg-yellow-300 text-stone-950'
            }`}
          >
            {voiceStatus === 'listening' ? (
              <>
                <MicOff className="w-4 h-4 shrink-0" />
                <span>
                  {tText({
                    am: 'እያዳመጥኩ ነው... አቁም',
                    or: 'Dhaggeeffachaa jira... Dhaabi',
                    ti: 'እሰምዕ ኣለኹ... ደው ኣብል',
                    sid: 'Macciishshanni... Uurrisi',
                    en: 'Listening... Tap Stop',
                    fr: 'Écoute... Arrêter',
                    de: 'Hört zu... Stopp',
                    it: 'In ascolto... Stop',
                    zh: '聆听中... 点击停止',
                    ar: 'جاري الاستماع... إيقاف',
                  })}
                </span>
              </>
            ) : voiceStatus === 'thinking' || voiceStatus === 'transcribing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>
                  {tText({
                    am: 'ትዕዛዝ እያዘጋጀሁ...',
                    or: 'Qopheessaa jira...',
                    ti: 'ትእዛዝ የዳሉ ኣለኹ...',
                    sid: 'Qixxeessanni noommo...',
                    en: 'Processing...',
                    fr: 'Traitement...',
                    de: 'Verarbeitung...',
                    it: 'Elaborazione...',
                    zh: '处理中...',
                    ar: 'جاري المعالجة...',
                  })}
                </span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 shrink-0" />
                <span>
                  {tText({
                    am: 'በድምፅ እዘዝ',
                    or: 'Sagaleen Ajaji',
                    ti: 'ብድምጺ ኣዝዝ',
                    sid: 'Hasaawunni Hajaji',
                    en: 'Speak to Order',
                    fr: 'Commander à la Voix',
                    de: 'Per Sprache Bestellen',
                    it: 'Ordina con la Voce',
                    zh: '语音点餐',
                    ar: 'اطلب بالصوت',
                  })}
                </span>
              </>
            )}
          </button>

          <div className="hidden md:block min-w-0">
            <h3 className="text-xs font-black text-white leading-tight truncate">
              {tText({
                am: 'የድምፅ ማዘዣ እና ሜኑ መመሪያ',
                or: 'Ajaja Sagalee fi Qajeelfama Meenuu',
                ti: 'ናይ ድምጺ መኣዘዝን መምርሒ ሜኑን',
                sid: 'Hasaawu Ajajunna Menu Kaaʼlaancho',
                en: 'Voice Ordering & Audio Guide',
                fr: 'Commande Vocale & Guide Audio',
                de: 'Sprachbestellung & Audioguide',
                it: 'Ordine Vocale & Guida Audio',
                zh: '语音点餐与菜单导览',
                ar: 'الطلب الصوتي والدليل السمعي',
              })}
            </h3>
            <p className="text-[10px] text-[#FDE68A] leading-tight truncate">
              {tText({
                am: 'ምን ምን እንዳለ፣ ዲል እና በድምፅ ማዘዝ ይችላሉ',
                or: 'Gatii, hirʼina gaafadhaa ykn sagaleedhaan ajajaa',
                ti: 'ዝርከቡ ምግብታት፣ ቅናሻት ሕተቱ ወይ ብድምጺ ኣዝዙ',
                sid: 'Ma nooro xaʼmi, sagale macciishshi woy hasaawunni hajaji',
                en: 'Ask deals, hear dishes, or speak your order',
                fr: 'Demandez les offres, écoutez les plats ou commandez à la voix',
                de: 'Angebote erfragen, Gerichte anhören oder per Sprache bestellen',
                it: 'Chiedi offerte, ascolta i piatti o ordina a voce',
                zh: '询问特惠、收听菜品或直接语音下单',
                ar: 'اسأل عن العروض، استمع للأطباق أو اطلب بصوتك',
              })}
            </p>
          </div>
        </div>

        {/* Right: Compact Essential Playback, Cart & More Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tourMode === 'idle' ? (
            <button
              type="button"
              id="btn-audio-read-full-menu"
              onClick={() => startTour('full')}
              className="px-2.5 py-1.5 rounded-xl bg-[#7A1212] hover:bg-[#B21F1F] border border-[#f4c22b]/70 text-[#f4c22b] font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              title={getAccessibleString('read_full_menu', appLang)}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>
                {tText({
                  am: 'ሜኑ አንብብ',
                  or: 'Meenuu Dubbisi',
                  ti: 'ሜኑ ኣንብብ',
                  sid: 'Menu Nabbawi',
                  en: 'Read Menu',
                  fr: 'Lire le Menu',
                  de: 'Menü Vorlesen',
                  it: 'Leggi Menu',
                  zh: '朗读菜单',
                  ar: 'قراءة القائمة',
                })}
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                id="btn-audio-tour-pause-resume"
                onClick={handlePauseResume}
                className="px-2.5 py-1.5 rounded-xl bg-[#f4c22b] text-stone-950 font-black text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>
                  {isPaused
                    ? tText({
                        am: 'ቀጥል',
                        or: 'Itti Fufi',
                        ti: 'ቀጽል',
                        sid: 'Sufisi',
                        en: 'Resume',
                        fr: 'Reprendre',
                        de: 'Fortsetzen',
                        it: 'Riprendi',
                        zh: '继续',
                        ar: 'استئناف',
                      })
                    : tText({
                        am: 'ቆም',
                        or: 'Turi',
                        ti: 'ኣቋርጽ',
                        sid: 'Uurri',
                        en: 'Pause',
                        fr: 'Pause',
                        de: 'Pause',
                        it: 'Pausa',
                        zh: '暂停',
                        ar: 'مؤقت',
                      })}
                </span>
              </button>
              <button
                type="button"
                id="btn-audio-tour-stop"
                onClick={() => stopTour(false)}
                className="px-2.5 py-1.5 rounded-xl bg-white text-[#B21F1F] font-black text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Square className="w-3.5 h-3.5" />
                <span>
                  {tText({
                    am: 'አቁም',
                    or: 'Dhaabi',
                    ti: 'ደው ኣብል',
                    sid: 'Uurrisi',
                    en: 'Stop',
                    fr: 'Arrêter',
                    de: 'Stopp',
                    it: 'Ferma',
                    zh: '停止',
                    ar: 'إيقاف',
                  })}
                </span>
              </button>
            </>
          )}

          {/* Compact Step Arrows */}
          <div className="flex items-center bg-[#7A1212] border border-[#f4c22b]/45 rounded-xl overflow-hidden">
            <button
              type="button"
              id="btn-audio-prev-dish"
              onClick={() => stepDish(-1)}
              aria-label={getAccessibleString('prev_dish', appLang)}
              className="px-2 py-1.5 hover:bg-[#B21F1F] text-white cursor-pointer"
              title={getAccessibleString('prev_dish', appLang)}
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-audio-next-dish"
              onClick={() => stepDish(1)}
              aria-label={getAccessibleString('next_dish', appLang)}
              className="px-2 py-1.5 hover:bg-[#B21F1F] text-white border-l border-[#f4c22b]/35 cursor-pointer"
              title={getAccessibleString('next_dish', appLang)}
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Read Cart + Open Cart Compact Pill */}
          <button
            type="button"
            id="btn-audio-open-cart"
            onClick={onOpenCart}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>
              {tText({
                am: 'ቅርጫት',
                or: 'Kuusaa',
                ti: 'ቅርጫት',
                sid: 'Koode',
                en: 'Cart',
                fr: 'Panier',
                de: 'Warenkorb',
                it: 'Carrello',
                zh: '购物车',
                ar: 'السلة',
              })}
            </span>
            <span className="font-mono tabular-nums bg-white/60 px-1.5 py-0.5 rounded-md text-[10px] text-stone-950">
              {cartItemCount}
            </span>
          </button>

          {/* Audio Switch */}
          <button
            type="button"
            id="btn-menu-audio-master-toggle"
            onClick={() => {
              if (isVoiceOverEnabled && tourMode !== 'idle') {
                stopTour(true);
              }
              onToggleVoiceOver();
            }}
            aria-pressed={isVoiceOverEnabled}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
              isVoiceOverEnabled
                ? 'bg-emerald-700 text-emerald-100 border border-emerald-300/60'
                : 'bg-[#7A1212] text-white border border-[#f4c22b]/45 hover:bg-[#B21F1F]'
            }`}
            title={
              isVoiceOverEnabled
                ? tText({
                    am: 'ድምፅ በርቷል',
                    or: 'Sagaleen Banaa dha',
                    ti: 'ድምጺ በሪሁ',
                    sid: 'Hasaawu Fano',
                    en: 'Audio ON',
                    fr: 'Audio Activé',
                    de: 'Audio EIN',
                    it: 'Audio ON',
                    zh: '语音开启',
                    ar: 'الصوت مفعل',
                  })
                : tText({
                    am: 'ድምፅ ጠፍቷል',
                    or: 'Sagaleen Cufaa dha',
                    ti: 'ድምጺ ጠፊኡ',
                    sid: 'Hasaawu Cufano',
                    en: 'Audio OFF',
                    fr: 'Audio Désactivé',
                    de: 'Audio AUS',
                    it: 'Audio OFF',
                    zh: '语音关闭',
                    ar: 'الصوت متوقف',
                  })
            }
          >
            {isVoiceOverEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isVoiceOverEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Extra Accessibility Tools */}
          <button
            type="button"
            id="btn-toggle-more-audio-tools"
            onClick={() => setShowMoreAudioTools((v) => !v)}
            aria-expanded={showMoreAudioTools}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
              showMoreAudioTools
                ? 'bg-white text-stone-950 border-white'
                : 'bg-[#7A1212] hover:bg-[#B21F1F] text-white border-[#f4c22b]/45'
            }`}
            title={tText({
              am: 'ተጨማሪ የድምፅ መቆጣጠሪያዎች',
              or: 'Toʼannoo Sagalee Dabalataa',
              ti: 'ተወሳኺ መቆጻጸሪ ድምጺ',
              sid: 'Ledote Hasaawu Qorqorsha',
              en: 'More Audio & Accessibility Settings',
              fr: 'Plus de paramètres audio et d’accessibilité',
              de: 'Weitere Audio- & Bedienungshilfen',
              it: 'Altre impostazioni audio e accessibilità',
              zh: '更多语音与无障碍设置',
              ar: 'المزيد من إعدادات الصوت والوصول',
            })}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Second Compact Row: Quick Voice Prompts + Direct Voice/Text Command Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 py-0.5">
          {quickVoicePrompts.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={voiceStatus === 'thinking' || voiceStatus === 'transcribing'}
              onClick={() => void submitVoiceCommand(chip.query)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-[#7A1212] hover:bg-[#B21F1F] border border-[#f4c22b]/45 hover:border-[#f4c22b] text-[11px] font-bold text-white hover:text-[#f4c22b] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitVoiceCommand(spokenInputText);
          }}
          className="flex items-center gap-1.5 sm:w-[320px] shrink-0"
        >
          <input
            ref={commandInputRef}
            type="text"
            id="input-voice-order-command"
            value={spokenInputText}
            onChange={(e) => setSpokenInputText(e.target.value)}
            placeholder={tText({
              am: 'በድምፅ ወይም በጽሑፍ እዘዝ... (ምሳሌ፦ 2 ጥብስ ጨምር)',
              or: 'Sagaleen ykn barreeffamaan ajaji... (fkf: 2 Tibs)',
              ti: 'ብድምጺ ወይ ብጽሑፍ ኣዝዝ... (ንምሳሌ፦ 2 ጥብስ)',
              sid: 'Hasaawunni woy borronni hajaji... (lawishsha: 2 Tibs)',
              en: 'Speak or type order... (e.g. 2 Tibs & 1 Pepsi)',
              fr: 'Parlez ou tapez... (ex. 2 Tibs & 1 Pepsi)',
              de: 'Sprechen oder tippen... (z.B. 2 Tibs & 1 Pepsi)',
              it: 'Parla o scrivi... (es. 2 Tibs & 1 Pepsi)',
              zh: '语音或输入点餐... (例如: 2份烤肉和1瓶百事)',
              ar: 'تحدث أو اكتب طلبك... (مثل: 2 تبس و 1 بيبسي)',
            })}
            className="flex-1 min-w-0 bg-white border border-[#f4c22b] focus:border-yellow-300 rounded-xl px-3 py-1.5 text-[11px] font-bold text-stone-900 placeholder-stone-500 outline-none"
          />
          <button
            type="submit"
            disabled={!spokenInputText.trim() || voiceStatus === 'thinking' || voiceStatus === 'transcribing'}
            className="px-2.5 py-1.5 rounded-xl bg-[#f4c22b] hover:bg-white disabled:bg-[#7A1212] disabled:text-white/60 text-stone-950 text-[11px] font-black flex items-center gap-1 cursor-pointer shrink-0 transition-colors border border-[#cf9d12]"
            title={tText({
              am: 'ትዕዛዝ ላክ',
              or: 'Ajaja Ergi',
              ti: 'ትእዛዝ ልኣኽ',
              sid: 'Ajaja Soyi',
              en: 'Send Voice Command',
              fr: 'Envoyer la Commande',
              de: 'Sprachbefehl Senden',
              it: 'Invia Comando Vocale',
              zh: '发送语音指令',
              ar: 'إرسال الأمر الصوتي',
            })}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Expandable Compact Accessibility & Speed Drawer (only shown when toggled) */}
      {showMoreAudioTools && (
        <div className="pt-2 border-t border-[#f4c22b]/35 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              id="btn-audio-read-category"
              onClick={() => startTour('category')}
              className="px-2.5 py-1.5 rounded-lg bg-[#f4c22b] hover:bg-white text-stone-950 font-black flex items-center gap-1 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{getAccessibleString('read_category', appLang)}</span>
            </button>
            <button
              type="button"
              id="btn-audio-repeat-dish"
              onClick={handleRepeatDish}
              className="px-2.5 py-1.5 rounded-lg bg-[#7A1212] hover:bg-[#B21F1F] border border-[#f4c22b]/45 text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{getAccessibleString('repeat_dish', appLang)}</span>
            </button>
            {activeDish && (
              <button
                type="button"
                id="btn-audio-order-current"
                onClick={() => onOrderDish(activeDish)}
                disabled={!activeDish.available}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:bg-[#7A1212] disabled:text-white/50 text-stone-950 font-black flex items-center gap-1 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>
                  {activeDishName
                    ? `${tText({
                        am: 'እዘዝ፦',
                        or: 'Ajaji:',
                        ti: 'ኣዝዝ፦',
                        sid: 'Hajaji:',
                        en: 'Order:',
                        fr: 'Commander :',
                        de: 'Bestellen:',
                        it: 'Ordina:',
                        zh: '点单：',
                        ar: 'اطلب:',
                      })} ${activeDishName}`
                    : getAccessibleString('order_spoken_dish', appLang)}
                </span>
              </button>
            )}
            <button
              type="button"
              id="btn-audio-read-cart"
              onClick={handleReadCart}
              className="px-2.5 py-1.5 rounded-lg bg-[#7A1212] hover:bg-[#B21F1F] border border-[#f4c22b]/60 text-[#f4c22b] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{getAccessibleString('read_cart', appLang)}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#7A1212] border border-[#f4c22b]/45 rounded-lg p-0.5">
              {[
                { val: 0.85, label: '0.85x' },
                { val: 1.0, label: '1.0x' },
                { val: 1.2, label: '1.2x' },
              ].map((sp) => (
                <button
                  key={sp.val}
                  type="button"
                  onClick={() => onChangeVoiceSpeed(sp.val)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                    voiceSpeed === sp.val ? 'bg-[#f4c22b] text-stone-950 font-black' : 'text-white hover:text-[#f4c22b]'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-[#FDE68A] hidden lg:inline">
              Alt+V Mic · Alt+R Tour · Alt+←/→
            </span>
          </div>
        </div>
      )}

      {/* Voice AI Action Response Card + Highlighted Dishes (compact strip when active) */}
      {(lastUserSpeech || lastVoiceResponse || lastVoiceError || highlightedVoiceItems.length > 0) && (
        <div className="rounded-xl bg-[#7A1212] border border-[#f4c22b]/45 p-2.5 space-y-2 text-xs">
          {lastUserSpeech && (
            <div className="flex items-center gap-2 text-[11px] text-white">
              <span className="px-1.5 py-0.5 rounded bg-[#f4c22b] text-stone-950 font-mono font-black text-[10px] shrink-0">
                {tText({
                  am: 'እርስዎ',
                  or: 'Isin',
                  ti: 'ንስኹም',
                  sid: 'Ati',
                  en: 'You',
                  fr: 'Vous',
                  de: 'Sie',
                  it: 'Tu',
                  zh: '您',
                  ar: 'أنت',
                })}
              </span>
              <span className="italic truncate">&ldquo;{lastUserSpeech}&rdquo;</span>
            </div>
          )}

          {lastVoiceError && (
            <div className="bg-[#92400E] border border-[#f4c22b] rounded-lg px-3 py-2 space-y-2">
              <p className="text-[11px] font-bold text-[#FFFBEB] leading-snug">
                ⚠️ {lastVoiceError}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {micBlockedReason === 'iframe_policy' && typeof window !== 'undefined' && (
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#f4c22b] hover:bg-yellow-300 text-stone-950 font-black text-[10px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      {tText({
                        am: 'ሙሉ መስኮት ክፈት (ማይክሮፎን ለመክፈት)',
                        or: 'Tabii Guutuu Bani',
                        ti: 'ምሉእ መስኮት ክፈት',
                        sid: 'Woʼma Tabbe Fani',
                        en: 'Open Full Tab to Enable Mic',
                        fr: 'Ouvrir dans un Onglet Complet',
                        de: 'In Vollansicht Öffnen',
                        it: 'Apri Scheda Completa',
                        zh: '在新标签页打开以启用麦克风',
                        ar: 'افتح في تبويب كامل لتفعيل الميكروفون',
                      })}
                    </span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void handleToggleMic()}
                  className="px-2.5 py-1 rounded-lg bg-[#8C1414] hover:bg-[#B21F1F] border border-[#f4c22b]/60 text-white font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {tText({
                      am: 'ማይክሮፎን ደግመው ሞክር',
                      or: 'Maayikiroofoonii Yaali',
                      ti: 'ማይክሮፎን ዳግማይ ፈትን',
                      sid: 'Mayikiroofone Marro Woʼnaali',
                      en: 'Retry Mic',
                      fr: 'Réessayer le Micro',
                      de: 'Mikrofon Erneut Versuchen',
                      it: 'Riprova Microfono',
                      zh: '重试麦克风',
                      ar: 'إعادة محاولة الميكروفون',
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => commandInputRef.current?.focus({ preventScroll: true })}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 border border-emerald-300/60 text-white font-bold text-[10px] cursor-pointer"
                >
                  <span>
                    {tText({
                      am: '✍️ እዚህ ጽፈው ይዘዙ',
                      or: '✍️ Asitti Barreessii Ajaji',
                      ti: '✍️ ኣብዚ ጽሒፍኩም ኣዝዙ',
                      sid: '✍️ Kawiichchi Borreessite Hajaji',
                      en: '✍️ Type Order Here',
                      fr: '✍️ Saisir la Commande Ici',
                      de: '✍️ Bestellung Hier Eingeben',
                      it: '✍️ Scrivi Ordine Qui',
                      zh: '✍️ 在此输入下单',
                      ar: '✍️ اكتب طلبك هنا',
                    })}
                  </span>
                </button>
              </div>
            </div>
          )}

          {highlightedVoiceItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
              {highlightedVoiceItems.map((item) => {
                const displayName = getTranslatedItemFields(item).name;
                const addedNow = Boolean(justAddedChipMap[item.id]);
                return (
                  <div
                    key={item.id}
                    className="bg-[#8C1414] border border-[#f4c22b]/45 hover:border-[#f4c22b] rounded-xl p-2 flex items-center justify-between gap-2"
                  >
                    <div
                      onClick={() => {
                        onSelectCategory(item.cat);
                        onSelectDish(item);
                      }}
                      className="min-w-0 cursor-pointer"
                    >
                      <p className="text-[11px] font-black text-white truncate">{displayName}</p>
                      <p className="text-[10px] font-mono font-bold text-[#f4c22b] tabular-nums">
                        {item.price} {currency}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onOrderDish(item);
                        setJustAddedChipMap((prev) => ({ ...prev, [item.id]: true }));
                        setTimeout(() => {
                          setJustAddedChipMap((prev) => ({ ...prev, [item.id]: false }));
                        }, 1500);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer ${
                        addedNow
                          ? 'bg-emerald-400 text-stone-950'
                          : 'bg-[#f4c22b] hover:bg-yellow-300 text-stone-950'
                      }`}
                    >
                      {addedNow ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>
                        {addedNow
                          ? tText({
                              am: 'ታክሏል',
                              or: 'Dabalameera',
                              ti: 'ተወሲኹ',
                              sid: 'Ledino',
                              en: 'Added',
                              fr: 'Ajouté',
                              de: 'Hinzugefügt',
                              it: 'Aggiunto',
                              zh: '已添加',
                              ar: 'تمت الإضافة',
                            })
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
                              ar: 'أضف',
                            })}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contextual Action Follow-ups from Voice AI */}
          {lastVoiceResponse && (lastVoiceResponse.suggestedQuickReplies.length > 0 || cartItemCount > 0 || lastVoiceResponse.intent === 'open_menu') && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {lastVoiceResponse.intent === 'open_menu' && (
                <button
                  type="button"
                  onClick={() => startTour('full')}
                  className="px-2.5 py-1 rounded-lg bg-[#f4c22b] hover:bg-yellow-300 text-stone-950 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ListMusic className="w-3 h-3" />
                  <span>
                    {tText({
                      am: 'ሙሉ ሜኑ በድምፅ አንብብ',
                      or: 'Meenuu Guutuu Dubbisi',
                      ti: 'ምሉእ ሜኑ ብድምጺ ኣንብብ',
                      sid: 'Woʼma Menu Huurranni Nabbawi',
                      en: 'Read Full Menu Aloud',
                      fr: 'Lire tout le menu',
                      de: 'Gesamtes Menü vorlesen',
                      it: 'Leggi tutto il menu',
                      zh: '朗读全部菜单',
                      ar: 'قراءة القائمة كاملة',
                    })}
                  </span>
                </button>
              )}
              {lastVoiceResponse.suggestedQuickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void submitVoiceCommand(reply)}
                  className="px-2 py-1 rounded-lg bg-[#8C1414] hover:bg-[#B21F1F] border border-[#f4c22b]/45 text-[10px] font-bold text-white cursor-pointer transition-colors"
                >
                  <Sparkles className="w-2.5 h-2.5 inline mr-1 text-[#f4c22b]" />
                  {reply}
                </button>
              ))}
              {lastVoiceResponse.intent === 'deals' && promoBanners.length > 0 && (
                <span className="px-2 py-1 rounded-lg bg-[#f4c22b] border border-[#cf9d12] text-[10px] font-black text-stone-950 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  {promoBanners[0].title}
                </span>
              )}
              {lastVoiceResponse.intent === 'call_waiter' && (
                <button
                  type="button"
                  onClick={onCallWaiter}
                  className="px-2.5 py-1 rounded-lg bg-white text-[#b21f1f] text-[10px] font-black flex items-center gap-1 cursor-pointer"
                >
                  <Bell className="w-3 h-3" />
                  <span>
                    {tText({
                      am: 'አስተናጋጅ ጥራ',
                      or: 'Keessummeessaa Waami',
                      ti: 'ኣስተናጋጅ ጸውዕ',
                      sid: 'Owaataancho Woshshi',
                      en: 'Call Waiter',
                      fr: 'Appeler le Serveur',
                      de: 'Kellner Rufen',
                      it: 'Chiama Cameriere',
                      zh: '呼叫服务员',
                      ar: 'استدعاء النادل',
                    })}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compact Live Transcript Bar (aria-live="polite") */}
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl bg-[#7A1212] border border-[#f4c22b]/45 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]"
      >
        <p className="text-white font-medium leading-snug truncate flex-1">
          <span className="text-[#f4c22b] font-black mr-1.5">
            {tourMode !== 'idle' && tourQueue.length > 0
              ? `[${tourIndex + 1}/${tourQueue.length}]`
              : voiceStatus === 'listening'
                ? '🎙️'
                : '🔊'}
          </span>
          {liveTranscript ||
            tText({
              am: '🎤 "በድምፅ እዘዝ" ይጫኑ እና ምን እንዳለ ይጠይቁ ወይም "2 ሽከላ ጥብስ እዘዝ" ይበሉ።',
              or: '🎤 "Sagaleen Ajaji" cuqaasaa nyaata jiru gaafadhaa ykn sagaleedhaan ajajaa.',
              ti: '🎤 "ብድምጺ ኣዝዝ" ጠዊቕኩም ዘሎ ምግቢ ሕተቱ ወይ ብድምጺ ኣዝዙ።',
              sid: '🎤 "Hasaawunni Hajaji" ganne ma nooro xaʼmi woy hasaawunni hajaji.',
              en: '🎤 Tap "Speak to Order" to ask what is on the menu, deals, or add dishes hands-free.',
              fr: '🎤 Appuyez sur "Commander à la Voix" pour découvrir le menu ou commander sans les mains.',
              de: '🎤 Tippen Sie auf "Per Sprache Bestellen", um nach Speisen zu fragen oder freihändig zu bestellen.',
              it: '🎤 Tocca "Ordina con la Voce" per chiedere del menu, delle offerte o aggiungere piatti.',
              zh: '🎤 点击“语音点餐”询问菜品、优惠或免提点餐。',
              ar: '🎤 اضغط على "اطلب بالصوت" للسؤال عن القائمة أو العروض أو إضافة الأطباق بدون استخدام اليدين.',
            })}
        </p>
      </div>
    </section>
  );
}
