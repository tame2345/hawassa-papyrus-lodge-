/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let sharedAudioCtx: AudioContext | null = null;
let audioUnlockInitialized = false;

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function initAudioUnlock(): void {
  if (typeof window === 'undefined' || audioUnlockInitialized) return;
  audioUnlockInitialized = true;

  const unlock = () => {
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
}

function playToneSequence(
  notes: Array<{ freq: number; delayMs: number; durationMs: number; type?: OscillatorType; gain?: number }>,
): void {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const baseTime = ctx.currentTime;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type || 'triangle';
      osc.frequency.setValueAtTime(note.freq, baseTime + note.delayMs / 1000);

      const startAt = baseTime + note.delayMs / 1000;
      const endAt = startAt + note.durationMs / 1000;
      const peakGain = note.gain ?? 0.25;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(endAt + 0.02);
    }
  } catch (err) {
    console.warn('Web Audio playback failed:', err);
  }
}

function speakAnnouncement(text: string): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis skipped:', err);
  }
}

export function playStockOutAlertSound(itemName: string, changedBy?: string): void {
  // Urgent two-pulse Kitchen -> Manager stock alert chime
  playToneSequence([
    { freq: 880, delayMs: 0, durationMs: 180, type: 'triangle', gain: 0.28 },
    { freq: 660, delayMs: 200, durationMs: 180, type: 'triangle', gain: 0.28 },
    { freq: 988, delayMs: 420, durationMs: 260, type: 'triangle', gain: 0.3 },
  ]);

  const byPhrase = changedBy ? ` reported by ${changedBy}` : '';
  speakAnnouncement(`Manager Stock Alert! ${itemName} is now out of stock${byPhrase}.`);
}

export function playWaiterCallAlertSound(
  location: string,
  assignedWaiter?: string,
  reason?: string,
): void {
  // Crisp 3-note hospitality service bell chime
  playToneSequence([
    { freq: 784, delayMs: 0, durationMs: 170, type: 'sine', gain: 0.28 },
    { freq: 988, delayMs: 170, durationMs: 170, type: 'sine', gain: 0.28 },
    { freq: 1175, delayMs: 340, durationMs: 320, type: 'sine', gain: 0.32 },
  ]);

  const waiterPhrase = assignedWaiter ? ` for ${assignedWaiter}` : '';
  const reasonPhrase = reason ? ` ${reason}` : '';
  speakAnnouncement(`Waiter Call! Assistance needed at ${location}${waiterPhrase}.${reasonPhrase}`);
}

export function playChefNewOrderAlertSound(orderId: string, location: string): void {
  playToneSequence([
    { freq: 587, delayMs: 0, durationMs: 140, type: 'triangle', gain: 0.25 },
    { freq: 880, delayMs: 150, durationMs: 220, type: 'triangle', gain: 0.3 },
  ]);
  speakAnnouncement(`New kitchen order ${orderId.replace('#', '')} from ${location}.`);
}

export function playKitchenReadyForWaiterAlertSound(
  orderId: string,
  location: string,
  assignedWaiter?: string,
): void {
  playToneSequence([
    { freq: 659, delayMs: 0, durationMs: 150, type: 'sine', gain: 0.28 },
    { freq: 880, delayMs: 150, durationMs: 150, type: 'sine', gain: 0.28 },
    { freq: 1047, delayMs: 300, durationMs: 280, type: 'sine', gain: 0.32 },
  ]);
  const waiterPhrase = assignedWaiter ? ` for ${assignedWaiter}` : '';
  speakAnnouncement(`Order ${orderId.replace('#', '')} for ${location} is cooked and ready${waiterPhrase}. Please verify and serve.`);
}

export type BrowserPushStatus = 'unsupported' | 'default' | 'granted' | 'denied';

export function getBrowserPushStatus(): BrowserPushStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as BrowserPushStatus;
}

export async function requestBrowserPushPermission(): Promise<BrowserPushStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const result = await Notification.requestPermission();
    return result as BrowserPushStatus;
  } catch {
    return getBrowserPushStatus();
  }
}

export function sendBrowserPushNotification(title: string, body: string, tag?: string): boolean {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([180, 80, 180]);
    }
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }
    const notif = new Notification(title, {
      body,
      tag: tag || `papyrus-alert-${Date.now()}`,
      requireInteraction: false,
    });
    notif.onclick = () => {
      try {
        window.focus();
        notif.close();
      } catch {}
    };
    return true;
  } catch {
    return false;
  }
}

export function buildSmsHref(phone: string, body: string): string {
  const cleanPhone = (phone || '').replace(/[^\d+]/g, '');
  const encodedBody = encodeURIComponent(body);
  return cleanPhone ? `sms:${cleanPhone}?body=${encodedBody}` : `sms:?body=${encodedBody}`;
}
