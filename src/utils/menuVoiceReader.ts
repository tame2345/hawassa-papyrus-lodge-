/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, OrderItem } from '../types';

export const LANG_LOCALE_MAP: Record<string, string> = {
  am: 'am-ET',
  en: 'en-US',
  or: 'om-ET',
  ti: 'ti-ET',
  sid: 'sid-ET',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  zh: 'zh-CN',
  ar: 'ar-SA',
};

export type AccessibleChimeKind =
  | 'focus'
  | 'select'
  | 'added'
  | 'step'
  | 'alert'
  | 'tour_start'
  | 'tour_end';

let sharedAccessibilityAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAccessibilityAudioCtx || sharedAccessibilityAudioCtx.state === 'closed') {
    sharedAccessibilityAudioCtx = new AudioCtx();
  }
  if (sharedAccessibilityAudioCtx.state === 'suspended') {
    sharedAccessibilityAudioCtx.resume().catch(() => {});
  }
  return sharedAccessibilityAudioCtx;
}

export function playAccessibleChime(kind: AccessibleChimeKind): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notePatterns: Record<
      AccessibleChimeKind,
      Array<{ freq: number; delayMs: number; durationMs: number; type?: OscillatorType; gain?: number }>
    > = {
      focus: [{ freq: 520, delayMs: 0, durationMs: 65, type: 'sine', gain: 0.1 }],
      select: [
        { freq: 587, delayMs: 0, durationMs: 75, type: 'sine', gain: 0.13 },
        { freq: 784, delayMs: 65, durationMs: 95, type: 'sine', gain: 0.15 },
      ],
      step: [{ freq: 660, delayMs: 0, durationMs: 70, type: 'triangle', gain: 0.12 }],
      added: [
        { freq: 523, delayMs: 0, durationMs: 85, type: 'sine', gain: 0.16 },
        { freq: 659, delayMs: 80, durationMs: 85, type: 'sine', gain: 0.18 },
        { freq: 784, delayMs: 160, durationMs: 150, type: 'sine', gain: 0.2 },
      ],
      alert: [
        { freq: 330, delayMs: 0, durationMs: 140, type: 'sawtooth', gain: 0.12 },
        { freq: 262, delayMs: 150, durationMs: 180, type: 'sawtooth', gain: 0.12 },
      ],
      tour_start: [
        { freq: 440, delayMs: 0, durationMs: 90, type: 'triangle', gain: 0.14 },
        { freq: 554, delayMs: 90, durationMs: 90, type: 'triangle', gain: 0.14 },
        { freq: 659, delayMs: 180, durationMs: 130, type: 'triangle', gain: 0.16 },
      ],
      tour_end: [
        { freq: 659, delayMs: 0, durationMs: 100, type: 'sine', gain: 0.14 },
        { freq: 523, delayMs: 110, durationMs: 160, type: 'sine', gain: 0.14 },
      ],
    };

    const notes = notePatterns[kind] || notePatterns.focus;
    const baseTime = ctx.currentTime;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type || 'sine';
      osc.frequency.setValueAtTime(note.freq, baseTime + note.delayMs / 1000);

      const startAt = baseTime + note.delayMs / 1000;
      const endAt = startAt + note.durationMs / 1000;
      const peakGain = note.gain ?? 0.14;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(endAt + 0.02);
    }
  } catch {
    // Ignore audio context errors when autoplay blocked
  }
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  fallbackEnText?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

let activeSpeechToken = 0;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopAccessibleSpeech(): void {
  activeSpeechToken += 1;
  try {
    if (isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

export function pauseAccessibleSpeech(): void {
  try {
    if (isSpeechSupported()) {
      window.speechSynthesis.pause();
    }
  } catch {
    // ignore
  }
}

export function resumeAccessibleSpeech(): void {
  try {
    if (isSpeechSupported()) {
      window.speechSynthesis.resume();
    }
  } catch {
    // ignore
  }
}

function findBestVoice(voices: SpeechSynthesisVoice[], locale: string): SpeechSynthesisVoice | undefined {
  const lower = locale.toLowerCase();
  const short = lower.split('-')[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === lower) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(short + '-')) ||
    voices.find((v) => v.lang.toLowerCase() === short)
  );
}

export function speakAccessibleText(
  text: string,
  appLang: string,
  options: SpeakOptions = {},
): number {
  const token = ++activeSpeechToken;
  const trimmed = (text || '').trim();
  if (!trimmed) {
    options.onEnd?.();
    return token;
  }

  try {
    if (!isSpeechSupported()) {
      options.onEnd?.();
      return token;
    }

    window.speechSynthesis.cancel();

    const targetLocale = LANG_LOCALE_MAP[appLang] || 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = findBestVoice(voices, targetLocale);

    // For Ethiopian local languages (am, or, ti, sid), if the browser OS does NOT have
    // a native TTS voice installed, fall back cleanly to English speech when provided so
    // visually impaired users always receive clear spoken feedback rather than silence.
    const isEthiopianLocalLang = ['am', 'or', 'ti', 'sid'].includes(appLang);
    const shouldUseEnglishFallback =
      isEthiopianLocalLang &&
      voices.length > 0 &&
      !matchedVoice &&
      Boolean(options.fallbackEnText && options.fallbackEnText.trim());

    const finalText = shouldUseEnglishFallback ? options.fallbackEnText!.trim() : trimmed;
    const finalLocale = shouldUseEnglishFallback ? 'en-US' : targetLocale;
    const finalVoice = shouldUseEnglishFallback
      ? findBestVoice(voices, 'en-US') || findBestVoice(voices, 'en')
      : matchedVoice;

    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.lang = finalLocale;
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    if (finalVoice) {
      utterance.voice = finalVoice;
    }

    utterance.onstart = () => {
      if (token === activeSpeechToken) {
        options.onStart?.();
      }
    };
    utterance.onend = () => {
      if (token === activeSpeechToken) {
        options.onEnd?.();
      }
    };
    utterance.onerror = () => {
      if (token === activeSpeechToken) {
        options.onError?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis failed:', err);
    options.onError?.();
  }

  return token;
}

export const ACCESSIBLE_STRINGS: Record<string, Record<string, string>> = {
  bar_title: {
    am: 'የድምፅ ሜኑ መመሪያ (ማየት ለተሳናቸው)',
    en: 'Full-Menu Audio Guide (Accessibility)',
    or: 'Qajeelfama Sagalee Meenuu Guutuu',
    ti: 'ናይ ድምጺ መምርሒ ምሉእ ሜኑ',
    fr: 'Guide Audio du Menu Complet',
    de: 'Vollständiger Audio-Menüführer',
    it: 'Guida Audio Menu Completo',
    sid: 'Woʼma Menu Hasaawu Kaaʼlaancho',
    zh: '无障碍全菜单语音导览',
    ar: 'الدليل الصوتي للقائمة الكاملة (لذوي الإعاقة البصرية)',
  },
  bar_subtitle: {
    am: 'ሙሉ ሜኑውን፣ ዋጋውንና ምርጫዎችን በድምፅ ያዳምጡ እና በቀላሉ ይዘዙ',
    en: 'Listen to every category, dish, price & option, and order hands-free',
    or: 'Ramaddii, nyaata, gatii fi filannoo hunda sagaleedhaan dhaggeeffadhaa',
    ti: 'ምሉእ ሜኑ፣ ዋጋን መማረጺታትን ብድምጺ ስምዑን ብቐሊሉ ኣዝዙን',
    fr: 'Écoutez chaque plat, prix et option, et commandez facilement',
    de: 'Alle Kategorien, Gerichte, Preise & Optionen anhören und bestellen',
    it: 'Ascolta ogni categoria, piatto, prezzo e opzione e ordina facilmente',
    sid: 'Menu baalanta, waaganna doorsha macciishshite hajaji',
    zh: '收听所有分类、菜品、价格与定制选项，轻松语音辅助点餐',
    ar: 'استمع إلى كل فئة وطبق وسعر وخيارات التخصيص واطلب بسهولة',
  },
  read_full_menu: {
    am: '▶ ሙሉ ሜኑ አንብብ',
    en: '▶ Read Full Menu',
    or: '▶ Meenuu Guutuu Dubbisi',
    ti: '▶ ምሉእ ሜኑ ኣንብብ',
    fr: '▶ Lire Tout le Menu',
    de: '▶ Ganzes Menü vorlesen',
    it: '▶ Leggi Tutto il Menu',
    sid: '▶ Woʼma Menu Nabbawi',
    zh: '▶ 朗读全部菜单',
    ar: '▶ قراءة القائمة كاملة',
  },
  read_category: {
    am: '📂 ይህን ምድብ አንብብ',
    en: '📂 Read Category',
    or: '📂 Ramaddii Kana Dubbisi',
    ti: '📂 ነዚ ምድብ ኣንብብ',
    fr: '📂 Lire la Catégorie',
    de: '📂 Kategorie vorlesen',
    it: '▶ Leggi Categoria',
    sid: '📂 Kuni Kifila Nabbawi',
    zh: '📂 朗读当前分类',
    ar: '📂 قراءة الفئة الحالية',
  },
  pause: {
    am: '⏸ ለጊዜው አቁም',
    en: '⏸ Pause',
    or: '⏸ Turi',
    ti: '⏸ ንግዚኡ ኣቋርጽ',
    fr: '⏸ Pause',
    de: '⏸ Pause',
    it: '⏸ Pausa',
    sid: '⏸ Uurri',
    zh: '⏸ 暂停',
    ar: '⏸ إيقاف مؤقت',
  },
  resume: {
    am: '▶ ቀጥል',
    en: '▶ Resume',
    or: '▶ Itti Fufi',
    ti: '▶ ቀጽል',
    fr: '▶ Reprendre',
    de: '▶ Fortsetzen',
    it: '▶ Riprendi',
    sid: '▶ Sufisi',
    zh: '▶ 继续',
    ar: '▶ استئناف',
  },
  stop: {
    am: '⏹ አቁም',
    en: '⏹ Stop',
    or: '⏹ Dhaabi',
    ti: '⏹ ደው ኣብል',
    fr: '⏹ Arrêter',
    de: '⏹ Stopp',
    it: '⏹ Ferma',
    sid: '⏹ Uurrisi',
    zh: '⏹ 停止',
    ar: '⏹ إيقاف',
  },
  prev_dish: {
    am: '⏮ ቀዳሚ ምግብ',
    en: '⏮ Prev Dish',
    or: '⏮ Kan Duraa',
    ti: '⏮ ቀዳማይ',
    fr: '⏮ Précédent',
    de: '⏮ Vorheriges',
    it: '⏮ Precedente',
    sid: '⏮ Albaani',
    zh: '⏮ 上一道菜',
    ar: '⏮ الطبق السابق',
  },
  repeat_dish: {
    am: '🔁 ደግመህ አንብብ',
    en: '🔁 Repeat',
    or: '🔁 Irra Deebiʼi',
    ti: '🔁 ድገም',
    fr: '🔁 Répéter',
    de: '🔁 Wiederholen',
    it: '🔁 Ripeti',
    sid: '🔁 Marro Nabbawi',
    zh: '🔁 重读当前菜品',
    ar: '🔁 إعادة قراءة الطبق',
  },
  next_dish: {
    am: '⏭ ቀጣይ ምግብ',
    en: '⏭ Next Dish',
    or: '⏭ Kan Itti Aanu',
    ti: '⏭ ቀጻሊ',
    fr: '⏭ Suivant',
    de: '⏭ Nächstes',
    it: '⏭ Successivo',
    sid: '⏭ Aananno',
    zh: '⏭ 下一道菜',
    ar: '⏭ الطبق التالي',
  },
  order_spoken_dish: {
    am: '🛒 ይህን ምግብ እዘዝ',
    en: '🛒 Order Spoken Dish',
    or: '🛒 Nyaata Kana Ajaji',
    ti: '🛒 ነዚ ምግቢ ኣዝዝ',
    fr: '🛒 Commander ce Plat',
    de: '🛒 Dieses Gericht bestellen',
    it: '🛒 Ordina Piatto',
    sid: '🛒 Konne Sagale Hajaji',
    zh: '🛒 点当前菜品',
    ar: '🛒 اطلب هذا الطبق',
  },
  read_cart: {
    am: '🛍️ ቅርጫት አንብብ',
    en: '🛍️ Read Cart',
    or: '🛍️ Koodii Dubbisi',
    ti: '🛍️ ቅርጫት ኣንብብ',
    fr: '🛍️ Lire le Panier',
    de: '🛍️ Warenkorb vorlesen',
    it: '🛍️ Leggi Carrello',
    sid: '🛍️ Koode Nabbawi',
    zh: '🛍️ 朗读购物车',
    ar: '🛍️ قراءة السلة',
  },
  speed_slow: {
    am: 'ቀስ (0.85x)',
    en: 'Slow (0.85x)',
    or: 'Suuta (0.85x)',
    ti: 'ቀስ (0.85x)',
    fr: 'Lent (0.85x)',
    de: 'Langsam (0.85x)',
    it: 'Lento (0.85x)',
    sid: 'Suuta (0.85x)',
    zh: '慢速 (0.85x)',
    ar: 'بطيء (0.85x)',
  },
  speed_normal: {
    am: 'መደበኛ (1.0x)',
    en: 'Normal (1.0x)',
    or: 'Idilee (1.0x)',
    ti: 'መደበኛ (1.0x)',
    fr: 'Normal (1.0x)',
    de: 'Normal (1.0x)',
    it: 'Normale (1.0x)',
    sid: 'Idilee (1.0x)',
    zh: '常速 (1.0x)',
    ar: 'عادي (1.0x)',
  },
  speed_fast: {
    am: 'ፈጣን (1.2x)',
    en: 'Fast (1.2x)',
    or: 'Saffisa (1.2x)',
    ti: 'ቅልጡፍ (1.2x)',
    fr: 'Rapide (1.2x)',
    de: 'Schnell (1.2x)',
    it: 'Veloce (1.2x)',
    sid: 'Ranke (1.2x)',
    zh: '快速 (1.2x)',
    ar: 'سريع (1.2x)',
  },
  listen_card: {
    am: '🔊 አድምጥ',
    en: '🔊 Listen',
    or: '🔊 Dhaggeeffadhu',
    ti: '🔊 ስማዕ',
    fr: '🔊 Écouter',
    de: '🔊 Anhören',
    it: '🔊 Ascolta',
    sid: '🔊 Macciishshi',
    zh: '🔊 语音朗读',
    ar: '🔊 استمع',
  },
};

export function getAccessibleString(key: string, appLang: string): string {
  const dict = ACCESSIBLE_STRINGS[key];
  if (!dict) return '';
  return dict[appLang] || dict.en || '';
}

export function buildDishSpeechPayload(params: {
  item: MenuItem;
  appLang: string;
  translatedName: string;
  translatedDesc: string;
  categoryLabel: string;
  indexInList?: number;
  totalInList?: number;
  isDrink?: boolean;
  isCustomizable?: boolean;
  currentQty?: number;
  hasInjera?: boolean;
  qariaLabel?: string;
  injeraLabel?: string;
  daboCount?: number;
}): { nativeText: string; fallbackEnText: string } {
  const {
    item,
    appLang,
    translatedName,
    translatedDesc,
    categoryLabel,
    indexInList,
    totalInList,
    isDrink,
    isCustomizable,
    currentQty = 1,
    qariaLabel,
    injeraLabel,
    daboCount = 0,
  } = params;

  const isSoldOut = !item.available;
  const posAm =
    indexInList !== undefined && totalInList !== undefined
      ? `ምግብ ${indexInList + 1} ከ ${totalInList}። `
      : '';
  const posEn =
    indexInList !== undefined && totalInList !== undefined
      ? `Item ${indexInList + 1} of ${totalInList}. `
      : '';

  const availabilityAm = isSoldOut ? 'ይህ ምግብ በአሁኑ ሰዓት አልቋል። ' : 'ይህ ምግብ አሁን ይገኛል። ';
  const availabilityEn = isSoldOut ? 'Currently sold out. ' : 'Available now. ';

  const modSummaryEn =
    !isDrink && isCustomizable
      ? `Customizations: pepper ${qariaLabel || 'yes'}, injera ${injeraLabel || 'full'}, extra bread ${daboCount}. `
      : '';

  const fallbackEnText = `${posEn}${categoryLabel ? `${categoryLabel}. ` : ''}${item.nameEn || translatedName}. Price: ${item.price} Birr. ${availabilityEn}${item.desc || translatedDesc || ''}. ${modSummaryEn}Quantity selected: ${currentQty}.`;

  if (appLang === 'am') {
    const modAm =
      !isDrink && isCustomizable
        ? `ተጨማሪ ምርጫዎች፦ ቃሪያ ${qariaLabel || 'አለ'}፣ እንጀራ ${injeraLabel || 'ሙሉ'}፣ ተጨማሪ ዳቦ ${daboCount}። `
        : '';
    const nativeText = `${posAm}${categoryLabel ? `ምድብ ${categoryLabel}። ` : ''}${translatedName}። ዋጋ ${item.price} ብር። ${availabilityAm}${translatedDesc || ''}። ${modAm}ብዛት ${currentQty}።`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'zh') {
    const statusZh = isSoldOut ? '当前已售罄。' : '当前有货。';
    const posZh =
      indexInList !== undefined && totalInList !== undefined
        ? `第 ${indexInList + 1} 项，共 ${totalInList} 项。`
        : '';
    const nativeText = `${posZh}${categoryLabel ? `分类：${categoryLabel}。` : ''}${translatedName}。价格：${item.price} 比尔。${statusZh}${translatedDesc || ''}。已选数量：${currentQty}。`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'ar') {
    const statusAr = isSoldOut ? 'غير متوفر حالياً، نفد من المخزون.' : 'متوفر للطلب الآن.';
    const posAr =
      indexInList !== undefined && totalInList !== undefined
        ? `الصنف رقم ${indexInList + 1} من ${totalInList}. `
        : '';
    const nativeText = `${posAr}${categoryLabel ? `القسم: ${categoryLabel}. ` : ''}${translatedName}. السعر: ${item.price} بير. ${statusAr} ${translatedDesc || ''}. الكمية المحددة: ${currentQty}.`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'fr') {
    const statusFr = isSoldOut ? 'Actuellement épuisé.' : 'Disponible maintenant.';
    const posFr =
      indexInList !== undefined && totalInList !== undefined
        ? `Plat ${indexInList + 1} sur ${totalInList}. `
        : '';
    const nativeText = `${posFr}${categoryLabel ? `Catégorie ${categoryLabel}. ` : ''}${translatedName}. Prix : ${item.price} Birr. ${statusFr} ${translatedDesc || ''}. Quantité : ${currentQty}.`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'de') {
    const statusDe = isSoldOut ? 'Derzeit ausverkauft.' : 'Jetzt verfügbar.';
    const posDe =
      indexInList !== undefined && totalInList !== undefined
        ? `Gericht ${indexInList + 1} von ${totalInList}. `
        : '';
    const nativeText = `${posDe}${categoryLabel ? `Kategorie ${categoryLabel}. ` : ''}${translatedName}. Preis: ${item.price} Birr. ${statusDe} ${translatedDesc || ''}. Menge: ${currentQty}.`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'it') {
    const statusIt = isSoldOut ? 'Attualmente esaurito.' : 'Disponibile ora.';
    const posIt =
      indexInList !== undefined && totalInList !== undefined
        ? `Piatto ${indexInList + 1} di ${totalInList}. `
        : '';
    const nativeText = `${posIt}${categoryLabel ? `Categoria ${categoryLabel}. ` : ''}${translatedName}. Prezzo: ${item.price} Birr. ${statusIt} ${translatedDesc || ''}. Quantità: ${currentQty}.`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'or') {
    const statusOr = isSoldOut ? 'Amma dhumera.' : 'Amma ni argama.';
    const nativeText = `${categoryLabel ? `Ramaddii ${categoryLabel}. ` : ''}${translatedName}. Gatii: Birr ${item.price}. ${statusOr} ${translatedDesc || ''}. Baayʼina: ${currentQty}.`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'ti') {
    const statusTi = isSoldOut ? 'ኣብዚ እዋን ተወዲኡ እዩ።' : 'ሕጂ ይርከብ እዩ።';
    const posTi =
      indexInList !== undefined && totalInList !== undefined
        ? `ምግቢ ${indexInList + 1} ካብ ${totalInList}። `
        : '';
    const modTi =
      !isDrink && isCustomizable
        ? `ተወሳኺ መማረጺታት፦ ቃሪያ ${qariaLabel || 'ኣሎ'}፣ እንጀራ ${injeraLabel || 'ምሉእ'}፣ ተወሳኺ ዳቦ ${daboCount}። `
        : '';
    const nativeText = `${posTi}${categoryLabel ? `ምድብ ${categoryLabel}። ` : ''}${translatedName}። ዋጋ ${item.price} ብር። ${statusTi} ${translatedDesc || ''}። ${modTi}ብዝሒ ${currentQty}።`;
    return { nativeText, fallbackEnText };
  }

  if (appLang === 'sid') {
    const statusSid = isSoldOut ? 'Xaa yannara gooffino.' : 'Xaa yannara afantanno.';
    const nativeText = `${categoryLabel ? `Kifila ${categoryLabel}. ` : ''}${translatedName}. Waagu ${item.price} Birr. ${statusSid} ${translatedDesc || ''}. Kiiro: ${currentQty}.`;
    return { nativeText, fallbackEnText };
  }

  return { nativeText: fallbackEnText, fallbackEnText };
}

export function buildCartSpeechPayload(params: {
  cart: OrderItem[];
  appLang: string;
  serviceChargeRate: number;
  vatRate: number;
}): { nativeText: string; fallbackEnText: string } {
  const { cart, appLang, serviceChargeRate, vatRate } = params;
  if (cart.length === 0) {
    const enEmpty = 'Your order cart is currently empty. Browse categories or use Next Dish to pick food and drinks.';
    const amEmpty = 'የእርስዎ የትዕዛዝ ቅርጫት አሁን ባዶ ነው። ከሜኑው ምግብ ወይም መጠጥ ይምረጡ።';
    const map: Record<string, string> = {
      am: amEmpty,
      or: 'Kuusaan ajaja keessanii amma duwwaa dha. Meenuu irraa nyaata ykn dhugaatii filadhaa.',
      ti: 'ናይ ትእዛዝ ቅርጫትኩም ሕጂ ባዶ እዩ። ካብ ሜኑ ምግቢ ወይ መስተ ምረጹ።',
      sid: 'Ajaju koodekki xaa yannara mullaaho. Menunni sagale woy ago doori.',
      en: enEmpty,
      zh: '您的购物车目前是空的，请浏览菜单添加菜品。',
      ar: 'سلة طلباتك فارغة حالياً. تصفح القائمة لاختيار الطعام أو المشروبات.',
      fr: 'Votre panier est actuellement vide.',
      de: 'Ihr Warenkorb ist derzeit leer.',
      it: 'Il tuo carrello è attualmente vuoto.',
    };
    return { nativeText: map[appLang] || enEmpty, fallbackEnText: enEmpty };
  }

  const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const serviceCharge = Math.round((subtotal * serviceChargeRate) / 100);
  const vat = Math.round(((subtotal + serviceCharge) * vatRate) / 100);
  const grandTotal = subtotal + serviceCharge + vat;

  const itemsTextEn = cart.map((i) => `${i.qty} times ${i.name}, ${i.qty * i.price} Birr`).join('; ');
  const fallbackEnText = `Your order cart has ${totalCount} items: ${itemsTextEn}. Subtotal ${subtotal} Birr, Grand Total including service charge and VAT is ${grandTotal} Birr.`;

  if (appLang === 'am') {
    const itemsAm = cart.map((i) => `${i.qty} ${i.name}፣ ${i.qty * i.price} ብር`).join('፤ ');
    return {
      nativeText: `በቅርጫትዎ ውስጥ ${totalCount} ትዕዛዞች አሉ፦ ${itemsAm}። ንዑስ ድምር ${subtotal} ብር፣ ከአገልግሎት ክፍያና ታክስ ጋር ጠቅላላ ሂሳብ ${grandTotal} ብር ነው።`,
      fallbackEnText,
    };
  }
  if (appLang === 'or') {
    const itemsOr = cart.map((i) => `${i.qty} ${i.name}, ${i.qty * i.price} Birr`).join('; ');
    return {
      nativeText: `Kuusaa keessan keessa miʼoonni ${totalCount} jiru: ${itemsOr}. Idaʼamni xiqqaan ${subtotal} Birr, idaʼamni waliigalaa tajaajilaa fi gibira dabalatee ${grandTotal} Birr dha.`,
      fallbackEnText,
    };
  }
  if (appLang === 'ti') {
    const itemsTi = cart.map((i) => `${i.qty} ${i.name}፣ ${i.qty * i.price} ብር`).join('፤ ');
    return {
      nativeText: `ኣብ ቅርጫትኩም ${totalCount} ትእዛዛት ኣለዉ፦ ${itemsTi}። ንኡስ ድምር ${subtotal} ብር፣ ምስ ክፍሊት ኣገልግሎትን ቫትን ጠቕላላ ድምር ${grandTotal} ብር እዩ።`,
      fallbackEnText,
    };
  }
  if (appLang === 'sid') {
    const itemsSid = cart.map((i) => `${i.qty} ${i.name}, ${i.qty * i.price} Birr`).join('; ');
    return {
      nativeText: `Koodekki giddo ${totalCount} ajaja no: ${itemsSid}. Qaaqqu ledote ${subtotal} Birr, xaphooma waagu ${grandTotal} Birr.`,
      fallbackEnText,
    };
  }
  if (appLang === 'zh') {
    const itemsZh = cart.map((i) => `${i.qty}份 ${i.name}，${i.qty * i.price}比尔`).join('；');
    return {
      nativeText: `您的购物车共有 ${totalCount} 件商品：${itemsZh}。小计 ${subtotal} 比尔，含服务费和税费总计 ${grandTotal} 比尔。`,
      fallbackEnText,
    };
  }
  if (appLang === 'ar') {
    const itemsAr = cart.map((i) => `${i.qty} من ${i.name} بسعر ${i.qty * i.price} بير`).join('، ');
    return {
      nativeText: `تحتوي سلة طلباتك على ${totalCount} عناصر: ${itemsAr}. المجموع الفرعي ${subtotal} بير، والإجمالي الكلي شامل رسوم الخدمة والضريبة هو ${grandTotal} بير.`,
      fallbackEnText,
    };
  }
  if (appLang === 'fr') {
    return {
      nativeText: `Votre panier contient ${totalCount} articles. Sous-total ${subtotal} Birr, total général ${grandTotal} Birr.`,
      fallbackEnText,
    };
  }
  if (appLang === 'de') {
    return {
      nativeText: `Ihr Warenkorb enthält ${totalCount} Artikel. Zwischensumme ${subtotal} Birr, Gesamtsumme ${grandTotal} Birr.`,
      fallbackEnText,
    };
  }
  if (appLang === 'it') {
    return {
      nativeText: `Il tuo carrello contiene ${totalCount} articoli. Subtotale ${subtotal} Birr, totale ${grandTotal} Birr.`,
      fallbackEnText,
    };
  }

  return { nativeText: fallbackEnText, fallbackEnText };
}

export function buildCategorySpeechPayload(params: {
  categoryLabel: string;
  itemsCount: number;
  availableCount: number;
  appLang: string;
}): { nativeText: string; fallbackEnText: string } {
  const { categoryLabel, itemsCount, availableCount, appLang } = params;
  const fallbackEnText = `${categoryLabel} category selected. ${availableCount} of ${itemsCount} items available.`;

  if (appLang === 'am') {
    return {
      nativeText: `${categoryLabel} ምድብ ተመርጧል። ${itemsCount} ዝርዝሮች አሉ፤ ${availableCount}ቱ አሁን ይገኛሉ።`,
      fallbackEnText,
    };
  }
  if (appLang === 'or') {
    return {
      nativeText: `Ramaddiin ${categoryLabel} filatameera. Gosoota ${itemsCount} keessaa ${availableCount} amma ni argamu.`,
      fallbackEnText,
    };
  }
  if (appLang === 'ti') {
    return {
      nativeText: `ምድብ ${categoryLabel} ተመሪጹ። ካብ ${itemsCount} ዝርዝራት ${availableCount} ሕጂ ይርከቡ።`,
      fallbackEnText,
    };
  }
  if (appLang === 'sid') {
    return {
      nativeText: `${categoryLabel} kifila doorantino. ${itemsCount} giddonni ${availableCount} xaa yannara afantanno.`,
      fallbackEnText,
    };
  }
  if (appLang === 'zh') {
    return {
      nativeText: `已选择 ${categoryLabel} 分类，共有 ${itemsCount} 个项目，其中 ${availableCount} 个可点。`,
      fallbackEnText,
    };
  }
  if (appLang === 'ar') {
    return {
      nativeText: `تم اختيار قسم ${categoryLabel}. يتوفر ${availableCount} من أصل ${itemsCount} أصناف.`,
      fallbackEnText,
    };
  }
  if (appLang === 'fr') {
    return {
      nativeText: `Catégorie ${categoryLabel} sélectionnée. ${availableCount} plats disponibles sur ${itemsCount}.`,
      fallbackEnText,
    };
  }
  if (appLang === 'de') {
    return {
      nativeText: `Kategorie ${categoryLabel} ausgewählt. ${availableCount} von ${itemsCount} Gerichten verfügbar.`,
      fallbackEnText,
    };
  }
  if (appLang === 'it') {
    return {
      nativeText: `Categoria ${categoryLabel} selezionata. ${availableCount} piatti disponibili su ${itemsCount}.`,
      fallbackEnText,
    };
  }

  return { nativeText: fallbackEnText, fallbackEnText };
}
