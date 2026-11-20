/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, OrderItem, PromoBanner } from '../types';
import { LANG_LOCALE_MAP } from './menuVoiceReader';

export interface VoiceAddItemAction {
  itemId: string;
  quantity: number;
  pepper?: 'yes' | 'no';
  injera?: 'full' | 'half' | 'none';
  breadCount?: number;
  extraKocho?: boolean;
  extraMayo?: boolean;
  customInstructions?: string;
}

export type VoiceOrderIntent =
  | 'open_menu'
  | 'read_menu'
  | 'info'
  | 'deals'
  | 'add_items'
  | 'remove_items'
  | 'read_cart'
  | 'open_cart'
  | 'confirm_order'
  | 'call_waiter';

export interface VoiceOrderResponse {
  spokenReply: string;
  englishSummary: string;
  intent: VoiceOrderIntent;
  itemsToAdd: VoiceAddItemAction[];
  itemIdsToRemove: string[];
  focusCategoryId?: string;
  recommendedItemIds: string[];
  suggestedQuickReplies: string[];
}

export interface VoiceHistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: { transcript: string };
    };
  };
}

interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((e: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((e: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function supportsMediaRecording(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

export function getRecognitionLocale(appLang: string): string {
  return LANG_LOCALE_MAP[appLang] || 'en-US';
}

export async function transcribeRecordedAudio(blob: Blob, appLang: string): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
    reader.readAsDataURL(blob);
  });

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch('/api/voice-transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        audioBase64: dataUrl,
        mimeType: blob.type || 'audio/webm',
        appLang,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Could not transcribe voice audio.');
    }
    return String(data?.transcript || '').trim();
  } finally {
    window.clearTimeout(timer);
  }
}

export async function processVoiceOrderCommand(params: {
  transcript: string;
  history: VoiceHistoryTurn[];
  menuItems: MenuItem[];
  categories: Array<{ id: string; label: string }>;
  cart: OrderItem[];
  promoBanners: PromoBanner[];
  appLang: string;
  guestLocation: string;
  serviceChargeRate: number;
  vatRate: number;
  modifierOptions?: Record<string, unknown>;
}): Promise<VoiceOrderResponse> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 22_000);

  try {
    const res = await fetch('/api/voice-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        transcript: params.transcript,
        history: params.history.slice(-6),
        menuItems: params.menuItems.map((m) => ({
          id: m.id,
          cat: m.cat,
          nameAm: m.nameAm,
          nameEn: m.nameEn,
          price: m.price,
          desc: m.desc,
          available: m.available,
          customizable: m.customizable,
        })),
        categories: params.categories.map((c) => ({ id: c.id, label: c.label })),
        cart: params.cart.map((c) => ({
          id: c.id,
          baseId: c.baseId,
          name: c.name,
          qty: c.qty,
          price: c.price,
        })),
        promoBanners: params.promoBanners.map((p, idx) => ({
          id: `promo-${idx + 1}`,
          tag: p.tag,
          title: p.title,
          desc: p.desc,
        })),
        appLang: params.appLang,
        guestLocation: params.guestLocation,
        serviceChargeRate: params.serviceChargeRate,
        vatRate: params.vatRate,
        modifierOptions: params.modifierOptions || {},
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const voiceFallbackErrors: Record<string, string> = {
        am: 'የድምፅ ማዘዣውን ማስተናገድ አልተቻለም። እባክዎ ደግመው ይሞክሩ።',
        or: 'Ajaja sagalee amma keessummeessuun hin dandaʼamne. Maaloo irra deebiʼii yaali.',
        ti: 'ናይ ድምጺ ትእዛዝ ክስተናገድ ኣይከኣለን። በጃኹም ደጊምኩም ፈትኑ።',
        sid: 'Hasaawu ajaja xaʼmuwa di-dandiinoonni. Eewa marro woʼnaali.',
        en: 'Unable to process voice request right now. Please try again.',
        fr: 'Impossible de traiter la commande vocale pour le moment. Veuillez réessayer.',
        de: 'Sprachanfrage kann derzeit nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
        it: 'Impossibile elaborare la richiesta vocale ora. Riprova.',
        zh: '暂时无法处理语音请求，请重试。',
        ar: 'تعذر معالجة الطلب الصوتي الآن. يرجى المحاولة مرة أخرى.',
      };
      throw new Error(data?.error || voiceFallbackErrors[params.appLang] || voiceFallbackErrors.en);
    }

    return {
      spokenReply: String(data?.spokenReply || ''),
      englishSummary: String(data?.englishSummary || ''),
      intent: (data?.intent || 'info') as VoiceOrderIntent,
      itemsToAdd: Array.isArray(data?.itemsToAdd) ? data.itemsToAdd : [],
      itemIdsToRemove: Array.isArray(data?.itemIdsToRemove) ? data.itemIdsToRemove : [],
      focusCategoryId: typeof data?.focusCategoryId === 'string' ? data.focusCategoryId : '',
      recommendedItemIds: Array.isArray(data?.recommendedItemIds) ? data.recommendedItemIds : [],
      suggestedQuickReplies: Array.isArray(data?.suggestedQuickReplies)
        ? data.suggestedQuickReplies
        : [],
    };
  } finally {
    window.clearTimeout(timer);
  }
}
