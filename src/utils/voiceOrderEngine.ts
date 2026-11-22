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
  | 'search_menu'
  | 'info'
  | 'deals'
  | 'add_items'
  | 'remove_items'
  | 'read_cart'
  | 'open_cart'
  | 'confirm_order'
  | 'call_waiter';

export interface VoiceOrderResponse {
  detectedTranscript?: string;
  spokenReply: string;
  englishSummary: string;
  intent: VoiceOrderIntent;
  searchQuery?: string;
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

/**
 * Ethiopian Native Languages (`am`, `or`, `ti`, `sid`) must capture real microphone audio
 * with MediaRecorder and send it to multimodal Gemini instead of relying on browser SpeechRecognition.
 */
export function isNativeEthiopianLang(appLang: string): boolean {
  return appLang === 'am' || appLang === 'or' || appLang === 'ti' || appLang === 'sid';
}

export function getRecognitionLocale(appLang: string): string {
  return LANG_LOCALE_MAP[appLang] || 'en-US';
}

export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/wav',
  ];
  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // ignore unsupported check errors
    }
  }
  return '';
}

export function normalizeAudioMimeType(mimeType?: string): string {
  const base = String(mimeType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (base.startsWith('audio/')) {
    return base;
  }
  return 'audio/webm';
}

export async function blobToBase64Audio(blob: Blob): Promise<string> {
  if (!blob || blob.size <= 0) {
    throw new Error('Recorded audio blob is empty (0 bytes).');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read recorded audio blob.'));
    reader.readAsDataURL(blob);
  });
  const commaIdx = dataUrl.indexOf(',');
  const base64Payload = (commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl).replace(/\s+/g, '');
  if (!base64Payload || base64Payload.length < 32) {
    throw new Error('Recorded audio base64 payload is empty or too short.');
  }
  return base64Payload;
}

export function describeMicrophoneError(
  err: unknown,
  appLang: string,
): { reason: 'iframe_policy' | 'browser_denied' | 'unsupported'; message: string; detail: string } {
  const inIframe = typeof window !== 'undefined' && window.self !== window.top;
  const errName = err instanceof Error ? err.name : '';
  const rawMessage = err instanceof Error ? err.message : String(err || 'Unknown microphone error');
  const detail = errName && !rawMessage.includes(errName) ? `${errName}: ${rawMessage}` : rawMessage;
  const lower = detail.toLowerCase();

  const isPolicyOrPermission =
    errName === 'NotAllowedError' ||
    errName === 'PermissionDeniedError' ||
    errName === 'SecurityError' ||
    lower.includes('permission') ||
    lower.includes('policy') ||
    lower.includes('denied') ||
    lower.includes('not allowed');

  const isMissingMic =
    errName === 'NotFoundError' ||
    errName === 'DevicesNotFoundError' ||
    lower.includes('requested device not found');

  const isReadableOrBusy =
    errName === 'NotReadableError' ||
    errName === 'TrackStartError' ||
    errName === 'AbortError';

  const pick = (dict: Record<string, string>) => dict[appLang] || dict.en;

  if (inIframe && isPolicyOrPermission) {
    const base = pick({
      am: 'ይህ የPreview መስኮት (Iframe) ማይክሮፎን ከልክሏል። "ሙሉ መስኮት ክፈት" ይጫኑ ወይም ከታች ይጻፉ።',
      or: 'Foddaan preview kun maayikiroofoonii waan daangessuuf "Tabii Guutuu Bani" cuqaasi ykn gadiitti barreessi.',
      ti: 'እዚ Preview መስኮት ማይክሮፎን ስለዝዓገተ "Open Full Tab" ጠውቑ ወይ ኣብ ታሕቲ ጽሓፉ።',
      sid: 'Kuni masikoti mayikiroofone hoolino daafira haaro tabbe fani woy woroonni borreessi.',
      en: 'This embedded preview blocks microphone access. Open in a full tab or type your order below.',
      fr: 'Cette fenêtre d’aperçu bloque le microphone. Ouvrez un nouvel onglet ou saisissez ci-dessous.',
      de: 'Dieses Vorschaufenster blockiert das Mikrofon. In neuem Tab öffnen oder unten eingeben.',
      it: 'Questa anteprima limita il microfono. Apri in una nuova scheda o scrivi sotto.',
      zh: '当前嵌入预览限制了麦克风权限，请在新标签页打开或在下方输入。',
      ar: 'نافذة المعاينة تمنع استخدام الميكروفون. افتح في تبويب كامل أو اكتب أدناه.',
    });
    return { reason: 'iframe_policy', message: `${base} (${detail})`, detail };
  }

  if (isPolicyOrPermission || isMissingMic || isReadableOrBusy) {
    const base = isMissingMic
      ? pick({
          am: 'በዚህ መሳሪያ ላይ የሚሰራ ማይክሮፎን አልተገኘም። ማይክሮፎን ያገናኙ ወይም ከታች ይጻፉ።',
          or: 'Meeshaa kana irratti maayikiroofooniin hin argamne. Maayikiroofoonii qabsiisi ykn gadiitti barreessi.',
          ti: 'ኣብዚ መሳርሒ ማይክሮፎን ኣይተረኽበን። ማይክሮፎን የራኽቡ ወይ ኣብ ታሕቲ ጽሓፉ።',
          sid: 'Konne uduunnichira mayikiroofone di-afantino. Woroonni borreessite hajaji.',
          en: 'No working microphone device was found. Connect a mic or type your order below.',
          fr: 'Aucun microphone fonctionnel détecté. Branchez un micro ou tapez votre commande.',
          de: 'Kein funktionierendes Mikrofon gefunden. Mikrofon anschließen oder unten eingeben.',
          it: 'Nessun microfono rilevato. Collega un microfono o scrivi sotto.',
          zh: '未检测到可用麦克风，请连接麦克风或在下方输入。',
          ar: 'لم يتم العثور على ميكروفون يعمل. وصّل ميكروفوناً أو اكتب طلبك أدناه.',
        })
      : pick({
          am: 'የማይክሮፎን ፈቃድ አልተሰጠም ወይም ተይዟል። ከአድራሻ አሞሌው (🔒) ይፍቀዱ ወይም ከታች ይጻፉ።',
          or: 'Eeyyamni maayikiroofoonii hin kennamne. Mallattoo (🔒) cuqaasii eeyyami ykn gadiitti barreessi.',
          ti: 'ፍቓድ ማይክሮፎን ኣይተዋህበን። ካብ ምልክት (🔒) ፍቐዱ ወይ ኣብ ታሕቲ ጽሓፉ።',
          sid: 'Mayikiroofonera hayyo uyinoonni. (🔒) ganni woy woroonni borreessi.',
          en: 'Microphone permission was denied or unavailable. Allow Mic in browser settings (🔒) or type below.',
          fr: 'Permission microphone refusée ou indisponible. Autorisez via (🔒) ou tapez ci-dessous.',
          de: 'Mikrofonberechtigung verweigert. Über (🔒) erlauben oder unten eingeben.',
          it: 'Permesso microfono negato. Consenti da (🔒) o scrivi sotto.',
          zh: '麦克风权限被拒绝或正被占用，请在地址栏 (🔒) 允许或在下方输入。',
          ar: 'تم رفض إذن الميكروفون أو أنه غير متاح. اسمح من (🔒) أو اكتب أدناه.',
        });
    return { reason: 'browser_denied', message: `${base} (${detail})`, detail };
  }

  const base = pick({
    am: 'ቀጥታ ማይክሮፎን መቅዳት አልተቻለም። ከታች ባለው ሳጥን ይጻፉ።',
    or: 'Maayikiroofooniin waraabuun hin dandaʼamne. Saanduqa gadiitti barreessi.',
    ti: 'ቀጥታ ማይክሮፎን ምቕዳሕ ኣይተኻእለን። ኣብ ታሕቲ ጽሓፉ።',
    sid: 'Mayikiroofonenni qada di-dandiinoonni. Woroonni borreessi.',
    en: 'Could not start live audio recording. Please type your request below.',
    fr: 'Impossible de démarrer l’enregistrement audio. Veuillez saisir ci-dessous.',
    de: 'Audioaufnahme konnte nicht gestartet werden. Bitte unten eingeben.',
    it: 'Impossibile avviare la registrazione audio. Scrivi qui sotto.',
    zh: '无法启动录音，请在下方输入您的点餐需求。',
    ar: 'تعذر بدء التسجيل الصوتي. يرجى كتابة طلبك أدناه.',
  });
  return { reason: 'unsupported', message: `${base} (${detail})`, detail };
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const raw = await res.text();
  if (!raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { error: `HTTP ${res.status}: ${raw.slice(0, 180)}` };
  }
}

export async function transcribeRecordedAudio(
  blob: Blob,
  appLang: string,
  mimeOverride?: string,
): Promise<string> {
  const base64Audio = await blobToBase64Audio(blob);
  const cleanMime = normalizeAudioMimeType(mimeOverride || blob.type);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 28_000);
  try {
    const res = await fetch('/api/voice-transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType: cleanMime,
        appLang,
      }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      const serverErr = typeof data.error === 'string' && data.error.trim()
        ? data.error.trim()
        : `HTTP ${res.status} (${res.statusText || 'Transcription error'})`;
      throw new Error(serverErr);
    }
    return String(data.transcript || '').trim();
  } finally {
    window.clearTimeout(timer);
  }
}

function buildCompactCatalogPayload(params: {
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
}) {
  return {
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
  };
}

function getVoiceOrderFallbackError(appLang: string): string {
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
  return voiceFallbackErrors[appLang] || voiceFallbackErrors.en;
}

function normalizeVoiceOrderResponse(data: Record<string, unknown>): VoiceOrderResponse {
  return {
    detectedTranscript:
      typeof data.detectedTranscript === 'string' ? data.detectedTranscript.trim() : '',
    spokenReply: String(data.spokenReply || ''),
    englishSummary: String(data.englishSummary || ''),
    intent: (data.intent || 'info') as VoiceOrderIntent,
    searchQuery: typeof data.searchQuery === 'string' ? data.searchQuery.trim() : '',
    itemsToAdd: Array.isArray(data.itemsToAdd) ? (data.itemsToAdd as VoiceAddItemAction[]) : [],
    itemIdsToRemove: Array.isArray(data.itemIdsToRemove)
      ? (data.itemIdsToRemove as string[])
      : [],
    focusCategoryId: typeof data.focusCategoryId === 'string' ? data.focusCategoryId : '',
    recommendedItemIds: Array.isArray(data.recommendedItemIds)
      ? (data.recommendedItemIds as string[])
      : [],
    suggestedQuickReplies: Array.isArray(data.suggestedQuickReplies)
      ? (data.suggestedQuickReplies as string[])
      : [],
  };
}

/**
 * Direct Multimodal Audio -> Gemini Voice Ordering.
 * Sends recorded MediaRecorder audio blob directly to /api/voice-order along with the active appLang.
 */
export async function processVoiceOrderAudio(params: {
  audioBlob: Blob;
  mimeOverride?: string;
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
  const base64Audio = await blobToBase64Audio(params.audioBlob);
  const cleanMime = normalizeAudioMimeType(params.mimeOverride || params.audioBlob.type);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch('/api/voice-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType: cleanMime,
        ...buildCompactCatalogPayload(params),
      }),
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      const detail =
        typeof data.error === 'string' && data.error.trim()
          ? data.error.trim()
          : `HTTP ${res.status} (${res.statusText || 'Voice order error'})`;
      throw new Error(`${getVoiceOrderFallbackError(params.appLang)} [${detail}]`);
    }

    return normalizeVoiceOrderResponse(data);
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
  const timer = window.setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch('/api/voice-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        transcript: params.transcript,
        ...buildCompactCatalogPayload(params),
      }),
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      const detail =
        typeof data.error === 'string' && data.error.trim()
          ? data.error.trim()
          : `HTTP ${res.status} (${res.statusText || 'Voice order error'})`;
      throw new Error(`${getVoiceOrderFallbackError(params.appLang)} [${detail}]`);
    }

    return normalizeVoiceOrderResponse(data);
  } finally {
    window.clearTimeout(timer);
  }
}
