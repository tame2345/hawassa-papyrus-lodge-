/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import cluster from 'node:cluster';
import crypto from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import express, { type NextFunction, type Request, type Response } from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const brotliCompressAsync = promisify(zlib.brotliCompress);
const gzipCompressAsync = promisify(zlib.gzip);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const CLUSTER_ENABLED =
  isProduction && process.env.CLUSTER_MODE !== 'false';

const CPU_COUNT =
  typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
const WORKER_COUNT = Math.max(
  1,
  Math.min(
    Number(process.env.WEB_CONCURRENCY) || CPU_COUNT || 2,
    16,
  ),
);

const MAX_CONCURRENT_AI = Math.max(4, Number(process.env.MAX_CONCURRENT_AI) || 60);
const MAX_AI_QUEUE = Math.max(10, Number(process.env.MAX_AI_QUEUE) || 200);
const AI_REQUEST_TIMEOUT_MS = 18_000;
const AI_QUEUE_TIMEOUT_MS = 3_500;

interface MenuItemPayload {
  id: string;
  cat: string;
  nameAm: string;
  nameEn: string;
  price: number;
  desc?: string;
  available?: boolean;
  customizable?: boolean;
}

interface CategoryPayload {
  id: string;
  label: string;
}

interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

interface CacheEntry<T> {
  value: T;
  etag: string;
  createdAt: number;
  expiresAt: number;
  staleUntil: number;
}

/**
 * Bounded O(1) LRU Cache with TTL and Stale-While-Revalidate support.
 * Prevents unbounded memory growth under 100k+ unique visitors or prompts.
 */
class BoundedLRUCache<T> {
  private readonly maxEntries: number;
  private readonly store: Map<string, CacheEntry<T>>;
  public hits = 0;
  public staleHits = 0;
  public misses = 0;

  constructor(maxEntries: number) {
    this.maxEntries = Math.max(10, maxEntries);
    this.store = new Map<string, CacheEntry<T>>();
  }

  public getEntry(key: string): { entry: CacheEntry<T>; state: 'fresh' | 'stale' } | null {
    const existing = this.store.get(key);
    if (!existing) {
      this.misses += 1;
      return null;
    }

    const now = Date.now();
    if (now >= existing.staleUntil) {
      this.store.delete(key);
      this.misses += 1;
      return null;
    }

    // Refresh recency in O(1)
    this.store.delete(key);
    this.store.set(key, existing);

    if (now < existing.expiresAt) {
      this.hits += 1;
      return { entry: existing, state: 'fresh' };
    }

    this.staleHits += 1;
    return { entry: existing, state: 'stale' };
  }

  public set(key: string, value: T, ttlMs: number, swrMs = 0): CacheEntry<T> {
    const now = Date.now();
    const serialized = JSON.stringify(value);
    const etag = `"${crypto.createHash('sha1').update(serialized).digest('base64url')}"`;
    const entry: CacheEntry<T> = {
      value,
      etag,
      createdAt: now,
      expiresAt: now + ttlMs,
      staleUntil: now + ttlMs + Math.max(0, swrMs),
    };

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, entry);
    return entry;
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public stats() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      staleHits: this.staleHits,
      misses: this.misses,
    };
  }
}

/**
 * Single-flight coalescing registry.
 * If 50,000 clients request an uncached resource simultaneously, only 1 DB/upstream call runs.
 */
class SingleFlight {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  public run<T>(key: string, fn: () => Promise<T>): { promise: Promise<T>; coalesced: boolean } {
    const active = this.inFlight.get(key) as Promise<T> | undefined;
    if (active) {
      return { promise: active, coalesced: true };
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return { promise, coalesced: false };
  }
}

/**
 * Bounded Sliding-Window Per-IP Rate Limiter.
 * Capped at maxKeys entries so high IP cardinality cannot exhaust heap memory.
 */
class BoundedRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly maxKeys: number;
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(windowMs: number, maxRequests: number, maxKeys = 100_000) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.maxKeys = maxKeys;
  }

  public consume(key: string): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetEpochSec: number;
    retryAfterSec: number;
  } {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      if (!existing && this.buckets.size >= this.maxKeys) {
        const oldestKey = this.buckets.keys().next().value;
        if (oldestKey !== undefined) {
          this.buckets.delete(oldestKey);
        }
      } else if (existing) {
        this.buckets.delete(key);
      }

      const resetAt = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        limit: this.maxRequests,
        remaining: Math.max(0, this.maxRequests - 1),
        resetEpochSec: Math.ceil(resetAt / 1000),
        retryAfterSec: 0,
      };
    }

    // Touch LRU position
    this.buckets.delete(key);
    this.buckets.set(key, existing);

    existing.count += 1;
    const allowed = existing.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - existing.count);
    const retryAfterSec = allowed ? 0 : Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

    return {
      allowed,
      limit: this.maxRequests,
      remaining,
      resetEpochSec: Math.ceil(existing.resetAt / 1000),
      retryAfterSec,
    };
  }

  public size(): number {
    return this.buckets.size;
  }
}

/**
 * Concurrency Semaphore with bounded queue and timeout for expensive AI requests.
 */
class ConcurrencySemaphore {
  private readonly maxActive: number;
  private readonly maxQueued: number;
  private active = 0;
  private readonly queue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  constructor(maxActive: number, maxQueued: number) {
    this.maxActive = maxActive;
    this.maxQueued = maxQueued;
  }

  public acquire(timeoutMs: number): Promise<() => void> {
    if (this.active < this.maxActive) {
      this.active += 1;
      return Promise.resolve(() => this.release());
    }

    if (this.queue.length >= this.maxQueued) {
      return Promise.reject(new Error('AI_QUEUE_FULL'));
    }

    return new Promise<() => void>((resolve, reject) => {
      const entry = {
        resolve: () => {
          clearTimeout(entry.timer);
          this.active += 1;
          resolve(() => this.release());
        },
        reject,
        timer: setTimeout(() => {
          const idx = this.queue.indexOf(entry);
          if (idx !== -1) {
            this.queue.splice(idx, 1);
          }
          reject(new Error('AI_QUEUE_TIMEOUT'));
        }, timeoutMs),
      };
      this.queue.push(entry);
    });
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) {
      next.resolve();
    }
  }

  public stats() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxActive: this.maxActive,
      maxQueued: this.maxQueued,
    };
  }
}

function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return xff[0].split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function createRateLimitMiddleware(limiter: BoundedRateLimiter, errorMessage: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const verdict = limiter.consume(getClientIp(req));
    res.setHeader('X-RateLimit-Limit', String(verdict.limit));
    res.setHeader('X-RateLimit-Remaining', String(verdict.remaining));
    res.setHeader('X-RateLimit-Reset', String(verdict.resetEpochSec));

    if (!verdict.allowed) {
      res.setHeader('Retry-After', String(verdict.retryAfterSec));
      res.status(429).json({
        error: errorMessage,
        code: 'RATE_LIMITED',
        retryAfterSec: verdict.retryAfterSec,
      });
      return;
    }

    next();
  };
}

/**
 * Built-in Brotli / Gzip response compression middleware for JSON & text payloads >= 1KB.
 */
function createCompressionMiddleware() {
  return (_req: Request, res: Response, next: NextFunction) => {
    const req = _req;
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    const supportsBr = acceptEncoding.includes('br');
    const supportsGzip = acceptEncoding.includes('gzip');

    if (!supportsBr && !supportsGzip) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.headersSent || res.writableEnded || res.destroyed || res.statusCode === 204 || res.statusCode === 304) {
        return originalJson(body);
      }

      const jsonStr = JSON.stringify(body);
      const rawBuffer = Buffer.from(jsonStr, 'utf8');
      if (rawBuffer.length < 1024) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.send(rawBuffer);
      }

      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      if (supportsBr) {
        void brotliCompressAsync(rawBuffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
          },
        })
          .then((compressed) => {
            if (!res.headersSent && !res.writableEnded && !res.destroyed) {
              res.setHeader('Content-Encoding', 'br');
              res.setHeader('Content-Length', String(compressed.length));
              res.end(compressed);
            }
          })
          .catch(() => {
            if (!res.headersSent && !res.writableEnded && !res.destroyed) {
              res.end(rawBuffer);
            }
          });
      } else {
        void gzipCompressAsync(rawBuffer, { level: 6 })
          .then((compressed) => {
            if (!res.headersSent && !res.writableEnded && !res.destroyed) {
              res.setHeader('Content-Encoding', 'gzip');
              res.setHeader('Content-Length', String(compressed.length));
              res.end(compressed);
            }
          })
          .catch(() => {
            if (!res.headersSent && !res.writableEnded && !res.destroyed) {
              res.end(rawBuffer);
            }
          });
      }

      return res;
    }) as typeof res.json;

    next();
  };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

interface BootstrapPayload {
  configured: boolean;
  fetchedAt: number;
  settings: Record<string, unknown>;
  gallery: unknown[];
}

interface LiveQueueOrderRow {
  id: string;
  table: string;
  cookingStatus?: string;
  status?: string;
  createdAt?: number;
  time?: string;
  date?: string;
}

interface LiveQueuePayload {
  configured: boolean;
  fetchedAt: number;
  totalActive: number;
  pendingCount: number;
  preparingCount: number;
  orders: LiveQueueOrderRow[];
}

async function fetchBootstrapFromSupabase(supabase: SupabaseClient | null): Promise<BootstrapPayload> {
  if (!supabase) {
    return {
      configured: false,
      fetchedAt: Date.now(),
      settings: {},
      gallery: [],
    };
  }

  const [settingsRes, galleryRes] = await Promise.all([
    supabase.from('system_settings').select('key, value'),
    supabase.from('gallery').select('*').order('created_at', { ascending: false }).limit(100),
  ]);

  if (settingsRes.error && galleryRes.error) {
    throw new Error(settingsRes.error.message || galleryRes.error.message);
  }

  const settingsMap: Record<string, unknown> = {};
  if (Array.isArray(settingsRes.data)) {
    for (const row of settingsRes.data as Array<{ key?: string; value?: unknown }>) {
      if (row && typeof row.key === 'string' && !row.key.startsWith('media_')) {
        settingsMap[row.key] = row.value;
      }
    }
  }

  return {
    configured: true,
    fetchedAt: Date.now(),
    settings: settingsMap,
    gallery: Array.isArray(galleryRes.data) ? galleryRes.data : [],
  };
}

async function fetchLiveQueueFromSupabase(
  supabase: SupabaseClient | null,
  bootstrapCache: BoundedLRUCache<BootstrapPayload>,
): Promise<LiveQueuePayload> {
  if (!supabase) {
    return {
      configured: false,
      fetchedAt: Date.now(),
      totalActive: 0,
      pendingCount: 0,
      preparingCount: 0,
      orders: [],
    };
  }

  // Reuse fresh bootstrap orders if already cached within the last 2s to avoid redundant queries
  const cachedBootstrap = bootstrapCache.getEntry('bootstrap');
  let rawOrdersList: unknown[] | null = null;
  if (
    cachedBootstrap &&
    cachedBootstrap.state === 'fresh' &&
    Date.now() - cachedBootstrap.entry.createdAt < 2_000
  ) {
    const ordersSetting = cachedBootstrap.entry.value.settings['orders'] as
      | { list?: unknown[] }
      | undefined;
    if (ordersSetting && Array.isArray(ordersSetting.list)) {
      rawOrdersList = ordersSetting.list;
    }
  }

  if (rawOrdersList === null) {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'orders')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    const val = (data as { value?: { list?: unknown[] } } | null)?.value;
    rawOrdersList = Array.isArray(val?.list) ? val.list : [];
  }

  const activeOrders: LiveQueueOrderRow[] = [];
  let pendingCount = 0;
  let preparingCount = 0;

  for (const item of rawOrdersList) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const cookingStatus = typeof o.cookingStatus === 'string' ? o.cookingStatus : 'Pending';
    const status = typeof o.status === 'string' ? o.status : 'Unpaid';
    if (status === 'Cancelled' || status === 'Refunded') continue;

    if (cookingStatus === 'Pending') pendingCount += 1;
    if (cookingStatus === 'Preparing') preparingCount += 1;

    if (cookingStatus === 'Pending' || cookingStatus === 'Preparing') {
      activeOrders.push({
        id: String(o.id ?? ''),
        table: String(o.table ?? ''),
        cookingStatus,
        status,
        createdAt: typeof o.createdAt === 'number' ? o.createdAt : undefined,
        time: typeof o.time === 'string' ? o.time : undefined,
        date: typeof o.date === 'string' ? o.date : undefined,
      });
    }
  }

  return {
    configured: true,
    fetchedAt: Date.now(),
    totalActive: activeOrders.length,
    pendingCount,
    preparingCount,
    orders: activeOrders,
  };
}

function sendWithEtag<T>(
  req: Request,
  res: Response,
  entry: CacheEntry<T>,
  cacheState: 'HIT' | 'STALE' | 'MISS' | 'COALESCED',
  cacheControl: string,
): void {
  res.setHeader('ETag', entry.etag);
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-Cache', cacheState);

  const ifNoneMatch = req.headers['if-none-match'];
  if (typeof ifNoneMatch === 'string' && ifNoneMatch === entry.etag) {
    res.status(304).end();
    return;
  }

  res.json(entry.value);
}

async function startWorker(workerId: number) {
  const app = express();
  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.set('etag', 'strong');

  const supabase = getServerSupabaseClient();
  const bootstrapCache = new BoundedLRUCache<BootstrapPayload>(8);
  const liveQueueCache = new BoundedLRUCache<LiveQueuePayload>(8);
  const aiResponseCache = new BoundedLRUCache<{
    reply: string;
    recommendedItemIds: string[];
    suggestedFollowUps: string[];
  }>(2_000);

  const singleFlight = new SingleFlight();
  const aiSemaphore = new ConcurrencySemaphore(MAX_CONCURRENT_AI, MAX_AI_QUEUE);

  const apiRateLimiter = new BoundedRateLimiter(60_000, 360, 100_000);
  const aiRateLimiter = new BoundedRateLimiter(60_000, 30, 100_000);
  const invalidateRateLimiter = new BoundedRateLimiter(60_000, 180, 50_000);

  let activeRequests = 0;
  let totalRequests = 0;
  let isShuttingDown = false;

  app.use((req, res, next) => {
    if (isShuttingDown) {
      res.setHeader('Connection', 'close');
      res.status(503).json({ error: 'Server is restarting, please retry.' });
      return;
    }

    activeRequests += 1;
    totalRequests += 1;

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'microphone=*');
    res.setHeader('X-Worker-Id', String(workerId));

    res.on('finish', () => {
      activeRequests = Math.max(0, activeRequests - 1);
    });
    res.on('close', () => {
      if (!res.writableEnded) {
        activeRequests = Math.max(0, activeRequests - 1);
      }
    });

    next();
  });

  app.use(createCompressionMiddleware());
  app.use(express.json({ limit: '6mb' }));

  app.get('/api/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      status: isShuttingDown ? 'draining' : 'healthy',
      pid: process.pid,
      workerId,
      clusterWorkers: CLUSTER_ENABLED ? WORKER_COUNT : 1,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: {
        rss: Math.round(mem.rss / 1048576),
        heapUsed: Math.round(mem.heapUsed / 1048576),
        heapTotal: Math.round(mem.heapTotal / 1048576),
      },
      traffic: {
        activeRequests,
        totalRequests,
        trackedRateLimitIps: apiRateLimiter.size(),
      },
      aiConcurrency: aiSemaphore.stats(),
      cache: {
        bootstrap: bootstrapCache.stats(),
        liveQueue: liveQueueCache.stats(),
        aiResponses: aiResponseCache.stats(),
      },
    });
  });

  app.get('/api/ready', (_req, res) => {
    if (isShuttingDown) {
      res.status(503).json({ ready: false });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ready: true, workerId, pid: process.pid });
  });

  app.use('/api', createRateLimitMiddleware(apiRateLimiter, 'Too many requests. Please slow down briefly.'));

  app.get('/api/bootstrap', async (req, res) => {
    const cacheKey = 'bootstrap';
    const hit = bootstrapCache.getEntry(cacheKey);

    if (hit) {
      if (hit.state === 'stale') {
        void singleFlight
          .run(cacheKey, async () => {
            const fresh = await fetchBootstrapFromSupabase(supabase);
            return bootstrapCache.set(cacheKey, fresh, 10_000, 50_000);
          })
          .promise.catch((err) => {
            console.warn('Background bootstrap SWR refresh error:', err);
          });
      }

      sendWithEtag(
        req,
        res,
        hit.entry,
        hit.state === 'fresh' ? 'HIT' : 'STALE',
        'public, max-age=5, stale-while-revalidate=30',
      );
      return;
    }

    try {
      const { promise, coalesced } = singleFlight.run(cacheKey, async () => {
        const fresh = await fetchBootstrapFromSupabase(supabase);
        return bootstrapCache.set(cacheKey, fresh, 10_000, 50_000);
      });

      const entry = await promise;
      sendWithEtag(
        req,
        res,
        entry,
        coalesced ? 'COALESCED' : 'MISS',
        'public, max-age=5, stale-while-revalidate=30',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load bootstrap state';
      console.warn('Bootstrap error:', msg);
      res.status(503).json({
        configured: false,
        error: msg,
        settings: {},
        gallery: [],
      });
    }
  });

  app.get('/api/orders/live-queue', async (req, res) => {
    const cacheKey = 'live-queue';
    const hit = liveQueueCache.getEntry(cacheKey);

    if (hit) {
      if (hit.state === 'stale') {
        void singleFlight
          .run(cacheKey, async () => {
            const fresh = await fetchLiveQueueFromSupabase(supabase, bootstrapCache);
            return liveQueueCache.set(cacheKey, fresh, 2_000, 8_000);
          })
          .promise.catch((err) => {
            console.warn('Background live-queue SWR refresh error:', err);
          });
      }

      sendWithEtag(
        req,
        res,
        hit.entry,
        hit.state === 'fresh' ? 'HIT' : 'STALE',
        'public, max-age=2, stale-while-revalidate=8',
      );
      return;
    }

    try {
      const { promise, coalesced } = singleFlight.run(cacheKey, async () => {
        const fresh = await fetchLiveQueueFromSupabase(supabase, bootstrapCache);
        return liveQueueCache.set(cacheKey, fresh, 2_000, 8_000);
      });

      const entry = await promise;
      sendWithEtag(
        req,
        res,
        entry,
        coalesced ? 'COALESCED' : 'MISS',
        'public, max-age=2, stale-while-revalidate=8',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load live queue';
      console.warn('Live queue error:', msg);
      res.status(503).json({
        configured: false,
        error: msg,
        totalActive: 0,
        pendingCount: 0,
        preparingCount: 0,
        orders: [],
      });
    }
  });

  app.post(
    '/api/cache/invalidate',
    createRateLimitMiddleware(invalidateRateLimiter, 'Cache invalidation rate limit reached.'),
    (req, res) => {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as { key?: string };
      const key = typeof body.key === 'string' ? body.key : 'all';

      if (key === 'orders') {
        liveQueueCache.delete('live-queue');
        bootstrapCache.delete('bootstrap');
      } else {
        bootstrapCache.delete('bootstrap');
        if (key === 'all') {
          liveQueueCache.delete('live-queue');
        }
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json({ ok: true, invalidated: key });
    },
  );

  app.post(
    '/api/menu-assistant',
    createRateLimitMiddleware(
      aiRateLimiter,
      'በጣም ብዙ የAI ጥያቄዎች ተልከዋል። እባክዎ ከጥቂት ሴኮንዶች በኋላ እንደገና ይሞክሩ።',
    ),
    async (req, res) => {
      let releaseSemaphore: (() => void) | null = null;
      try {
        const {
          message,
          history = [],
          menuItems = [],
          categories = [],
          appLang = 'am',
          guestLocation = 'Room 101',
          activeQueueCount = 0,
          serviceChargeRate = 10,
          vatRate = 15,
        } = req.body as {
          message?: string;
          history?: ChatHistoryTurn[];
          menuItems?: MenuItemPayload[];
          categories?: CategoryPayload[];
          appLang?: string;
          guestLocation?: string;
          activeQueueCount?: number;
          serviceChargeRate?: number;
          vatRate?: number;
        };

        if (!message || typeof message !== 'string' || !message.trim()) {
          res.status(400).json({ error: 'Please enter a message for the menu assistant.' });
          return;
        }

        const trimmedMessage = message.trim().slice(0, 600);
        const cleanHistory = Array.isArray(history) ? history.slice(-8) : [];

        const availableItems = (Array.isArray(menuItems) ? menuItems : [])
          .filter((item) => item && item.available !== false)
          .map((item) => ({
            id: item.id,
            category: item.cat,
            nameAm: item.nameAm,
            nameEn: item.nameEn,
            priceBirr: item.price,
            description: item.desc || '',
            customizable: Boolean(item.customizable),
          }));

        // Cache first-turn / general menu questions so repeated FAQ spikes across 100k+ guests cost 0 Gemini tokens
        let aiCacheKey: string | null = null;
        if (cleanHistory.length === 0) {
          const menuSig = crypto
            .createHash('sha1')
            .update(
              availableItems.map((i) => `${i.id}:${i.priceBirr}:${i.nameAm}`).join('|'),
            )
            .digest('base64url');
          aiCacheKey = crypto
            .createHash('sha256')
            .update(
              `${appLang}::${serviceChargeRate}::${vatRate}::${menuSig}::${trimmedMessage.toLowerCase()}`,
            )
            .digest('base64url');

          const cachedAi = aiResponseCache.getEntry(aiCacheKey);
          if (cachedAi && cachedAi.state === 'fresh') {
            res.setHeader('X-Cache', 'HIT');
            res.json(cachedAi.entry.value);
            return;
          }
        }

        const ai = getGeminiClient();
        if (!ai) {
          res.status(503).json({
            error:
              appLang === 'am'
                ? 'የAI አገልግሎት ቁልፍ (GEMINI_API_KEY) አልተዋቀረም። እባክዎ በ Settings > Secrets ውስጥ ያረጋግጡ።'
                : 'AI service key is not configured yet. Please check GEMINI_API_KEY in Settings > Secrets.',
            code: 'MISSING_API_KEY',
          });
          return;
        }

        try {
          releaseSemaphore = await aiSemaphore.acquire(AI_QUEUE_TIMEOUT_MS);
        } catch (queueErr: unknown) {
          const code = queueErr instanceof Error ? queueErr.message : 'AI_BUSY';
          res.setHeader('Retry-After', '3');
          res.status(503).json({
            error:
              appLang === 'am'
                ? 'ብዙ እንግዶች በአንድ ጊዜ የAI ረዳቱን እየተጠቀሙ ነው። እባክዎ ከ3 ሴኮንድ በኋላ ይሞክሩ።'
                : 'Menu AI concierge is experiencing high demand. Please retry in a few seconds.',
            code,
          });
          return;
        }

        const categoryList = (Array.isArray(categories) ? categories : []).map((c) => ({
          id: c.id,
          label: c.label,
        }));

        const langLabelMap: Record<string, string> = {
          am: 'Amharic (አማርኛ)',
          en: 'English',
          or: 'Afaan Oromoo',
          ti: 'Tigrigna (ትግርኛ)',
          sid: 'Sidaamu Afoo',
          fr: 'French',
          de: 'German',
          it: 'Italian',
          zh: 'Chinese (中文)',
          ar: 'Arabic (العربية)',
        };
        const preferredLang = langLabelMap[appLang] || 'Amharic (አማርኛ) or English';

        const systemInstruction = [
          'You are the warm, knowledgeable AI Menu Concierge for Hawassa Papyrus Lodge (ሃዋሳ ፓፒረስ ሎጅ) in Hawassa, Ethiopia.',
          'Your job is to help guests understand the digital menu, explain traditional Ethiopian dishes and drinks clearly, suggest dishes based on budget, dietary preferences (fasting/vegan, spicy, mild, kids, groups, drinks, snacks), and guide them to order smoothly.',
          `Preferred UI language: ${preferredLang}. Always respond in the same language the guest wrote their message in; if unclear, respond in ${preferredLang}.`,
          `Guest context: Current table/room is "${guestLocation}". Active orders ahead in the kitchen queue right now: ${activeQueueCount}. Standard billing notes: Service Charge ${serviceChargeRate}% and VAT ${vatRate}%.`,
          'Customizations available on food items: Qaria (green chili pepper: አለ/የለም), Injera (ሙሉ/ግማሽ/የለም), Bread/Dabo (+extra Birr), Extra Kocho (for traditional dishes), Extra Mayo (for burgers), and custom kitchen instructions.',
          'Rules:',
          '1. ONLY recommend items that actually exist in the LIVE MENU DATA below. Never invent dishes or prices.',
          '2. Keep `reply` concise, warm, well-formatted, and genuinely helpful (2-5 short sentences or clean bullet points). Mention exact prices in Birr (ብር).',
          '3. Include up to 4 exact matching `id` strings from LIVE MENU DATA in `recommendedItemIds` whenever specific menu items fit the guest request.',
          '4. Provide 2-3 short `suggestedFollowUps` in the same language so the guest can tap them next.',
          '',
          'CATEGORIES:',
          JSON.stringify(categoryList),
          '',
          'LIVE MENU DATA:',
          JSON.stringify(availableItems),
        ].join('\n');

        const recentHistory = cleanHistory
          .map((turn) => `${turn.role === 'user' ? 'Guest' : 'Assistant'}: ${turn.text}`)
          .join('\n');

        const contents = recentHistory
          ? `Conversation so far:\n${recentHistory}\n\nGuest's latest message: ${trimmedMessage}`
          : `Guest's message: ${trimmedMessage}`;

        const aiPromise = ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description:
                    'Helpful, friendly answer explaining menu items, prices, ingredients, or recommendations.',
                },
                recommendedItemIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    'Up to 4 exact menu item IDs from LIVE MENU DATA that match the recommendation.',
                },
                suggestedFollowUps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2 to 3 short follow-up questions the guest might ask next.',
                },
              },
              required: ['reply', 'recommendedItemIds', 'suggestedFollowUps'],
            },
          },
        });

        let timeoutHandle: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error('AI_UPSTREAM_TIMEOUT'));
          }, AI_REQUEST_TIMEOUT_MS);
        });

        const response = await Promise.race([aiPromise, timeoutPromise]).finally(() => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
        });

        const rawText = (response.text ?? '{}').trim();
        let parsed: {
          reply?: string;
          recommendedItemIds?: string[];
          suggestedFollowUps?: string[];
        } = {};
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = {
            reply:
              rawText ||
              (appLang === 'am'
                ? 'ይቅርታ፣ ምላሹን ማዘጋጀት አልቻልኩም።'
                : 'Sorry, I could not format the response.'),
            recommendedItemIds: [],
            suggestedFollowUps: [],
          };
        }

        const validIdSet = new Set(availableItems.map((i) => i.id));
        const cleanIds = Array.isArray(parsed.recommendedItemIds)
          ? parsed.recommendedItemIds.filter((id) => validIdSet.has(id)).slice(0, 4)
          : [];
        const cleanFollowUps = Array.isArray(parsed.suggestedFollowUps)
          ? parsed.suggestedFollowUps.filter((q) => typeof q === 'string' && q.trim()).slice(0, 3)
          : [];

        const payload = {
          reply: parsed.reply || '',
          recommendedItemIds: cleanIds,
          suggestedFollowUps: cleanFollowUps,
        };

        if (aiCacheKey && payload.reply) {
          aiResponseCache.set(aiCacheKey, payload, 5 * 60_000);
        }

        res.setHeader('X-Cache', 'MISS');
        res.json(payload);
      } catch (err: unknown) {
        const errorObj = err as { status?: number; message?: string };
        console.error('Menu AI assistant error:', errorObj?.message || err);
        if (errorObj?.message === 'AI_UPSTREAM_TIMEOUT') {
          res.status(504).json({
            error: 'AI response timed out under load. Please try again.',
            code: 'AI_TIMEOUT',
          });
          return;
        }
        const status = typeof errorObj?.status === 'number' ? errorObj.status : 500;
        const msg = errorObj?.message || 'Unexpected error calling AI menu assistant.';
        res.status(status >= 400 && status < 600 ? status : 500).json({
          error: msg,
        });
      } finally {
        if (releaseSemaphore) {
          releaseSemaphore();
        }
      }
    },
  );

  // Server-side Audio Transcription Fallback (when browser Web SpeechRecognition is unavailable)
  app.post(
    '/api/voice-transcribe',
    createRateLimitMiddleware(
      aiRateLimiter,
      'በጣም ብዙ የድምፅ ጥያቄዎች ተልከዋል። እባክዎ ከጥቂት ሴኮንዶች በኋላ ይሞክሩ።',
    ),
    async (req, res) => {
      let releaseSemaphore: (() => void) | null = null;
      try {
        const { audioBase64, mimeType = 'audio/webm', appLang = 'am' } = (req.body || {}) as {
          audioBase64?: string;
          mimeType?: string;
          appLang?: string;
        };

        if (!audioBase64 || typeof audioBase64 !== 'string') {
          res.status(400).json({ error: 'Missing recorded audio data.' });
          return;
        }

        const ai = getGeminiClient();
        if (!ai) {
          res.status(503).json({
            error:
              appLang === 'am'
                ? 'የAI አገልግሎት ቁልፍ (GEMINI_API_KEY) አልተዋቀረም። እባክዎ በ Settings > Secrets ውስጥ ያረጋግጡ።'
                : 'AI service key is not configured yet. Please check GEMINI_API_KEY in Settings > Secrets.',
            code: 'MISSING_API_KEY',
          });
          return;
        }

        try {
          releaseSemaphore = await aiSemaphore.acquire(AI_QUEUE_TIMEOUT_MS);
        } catch (queueErr: unknown) {
          const code = queueErr instanceof Error ? queueErr.message : 'AI_BUSY';
          res.setHeader('Retry-After', '3');
          res.status(503).json({
            error:
              appLang === 'am'
                ? 'ብዙ እንግዶች በአንድ ጊዜ የድምፅ ረዳቱን እየተጠቀሙ ነው። እባክዎ ከ3 ሴኮንድ በኋላ ይሞክሩ።'
                : 'Voice service is busy. Please retry in a few seconds.',
            code,
          });
          return;
        }

        const cleanBase64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '').slice(0, 6_000_000);
        const cleanMime = typeof mimeType === 'string' && mimeType.startsWith('audio/') ? mimeType : 'audio/webm';

        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            },
            {
              text: 'Transcribe the restaurant guest speech accurately (could be Amharic, English, Afaan Oromoo, Tigrigna, Arabic, Chinese, or mixed Ethiopian dish names like tibs, dorowot, kitfo, firfir, injera, shiro, pepsi, spris). Return ONLY the transcribed text.',
            },
          ],
        });

        let timeoutHandle: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error('AI_UPSTREAM_TIMEOUT'));
          }, AI_REQUEST_TIMEOUT_MS);
        });

        const response = await Promise.race([aiPromise, timeoutPromise]).finally(() => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
        });

        res.json({ transcript: (response.text ?? '').trim() });
      } catch (err: unknown) {
        const errorObj = err as { status?: number; message?: string };
        console.error('Voice transcribe error:', errorObj?.message || err);
        if (errorObj?.message === 'AI_UPSTREAM_TIMEOUT') {
          res.status(504).json({ error: 'Audio transcription timed out. Please try again.', code: 'AI_TIMEOUT' });
          return;
        }
        const status = typeof errorObj?.status === 'number' ? errorObj.status : 500;
        res.status(status >= 400 && status < 600 ? status : 500).json({
          error: errorObj?.message || 'Failed to transcribe audio.',
        });
      } finally {
        if (releaseSemaphore) releaseSemaphore();
      }
    },
  );

  // Hands-Free Interactive Voice Ordering & Menu Concierge Endpoint
  app.post(
    '/api/voice-order',
    createRateLimitMiddleware(
      aiRateLimiter,
      'በጣም ብዙ የድምፅ ትዕዛዝ ጥያቄዎች ተልከዋል። እባክዎ ከጥቂት ሴኮንዶች በኋላ ይሞክሩ።',
    ),
    async (req, res) => {
      let releaseSemaphore: (() => void) | null = null;
      try {
        const {
          transcript,
          history = [],
          menuItems = [],
          categories = [],
          cart = [],
          promoBanners = [],
          appLang = 'am',
          guestLocation = 'Room 101',
          serviceChargeRate = 10,
          vatRate = 15,
          modifierOptions = {},
        } = (req.body || {}) as {
          transcript?: string;
          history?: ChatHistoryTurn[];
          menuItems?: MenuItemPayload[];
          categories?: CategoryPayload[];
          cart?: Array<{ id: string; baseId: string; name: string; qty: number; price: number }>;
          promoBanners?: Array<{ id: string; tag?: string; title?: string; desc?: string }>;
          appLang?: string;
          guestLocation?: string;
          serviceChargeRate?: number;
          vatRate?: number;
          modifierOptions?: Record<string, unknown>;
        };

        if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
          res.status(400).json({ error: 'Please speak or enter a voice command.' });
          return;
        }

        const ai = getGeminiClient();
        if (!ai) {
          res.status(503).json({
            error:
              appLang === 'am'
                ? 'የAI አገልግሎት ቁልፍ (GEMINI_API_KEY) አልተዋቀረም። እባክዎ በ Settings > Secrets ውስጥ ያረጋግጡ።'
                : 'AI service key is not configured yet. Please check GEMINI_API_KEY in Settings > Secrets.',
            code: 'MISSING_API_KEY',
          });
          return;
        }

        try {
          releaseSemaphore = await aiSemaphore.acquire(AI_QUEUE_TIMEOUT_MS);
        } catch (queueErr: unknown) {
          const code = queueErr instanceof Error ? queueErr.message : 'AI_BUSY';
          res.setHeader('Retry-After', '3');
          res.status(503).json({
            error:
              appLang === 'am'
                ? 'የድምፅ ማዘዣ ሲስተሙ ተጨናንቋል። እባክዎ ከ3 ሴኮንድ በኋላ ይሞክሩ።'
                : 'Voice ordering service is experiencing high demand. Please retry in a few seconds.',
            code,
          });
          return;
        }

        const trimmedTranscript = transcript.trim().slice(0, 600);
        const cleanHistory = Array.isArray(history) ? history.slice(-6) : [];
        const liveCatalog = (Array.isArray(menuItems) ? menuItems : []).map((item) => ({
          id: item.id,
          cat: item.cat,
          nameAm: item.nameAm,
          nameEn: item.nameEn,
          priceBirr: item.price,
          available: item.available !== false,
          customizable: Boolean(item.customizable),
          desc: item.desc || '',
        }));
        const availableCatalog = liveCatalog.filter((i) => i.available);
        const soldOutCatalog = liveCatalog.filter((i) => !i.available);

        const langLabelMap: Record<string, string> = {
          am: 'Amharic (አማርኛ)',
          en: 'English',
          or: 'Afaan Oromoo',
          ti: 'Tigrigna (ትግርኛ)',
          sid: 'Sidaamu Afoo',
          fr: 'French',
          de: 'German',
          it: 'Italian',
          zh: 'Chinese (中文)',
          ar: 'Arabic (العربية)',
        };
        const preferredLang = langLabelMap[appLang] || 'Amharic (አማርኛ) or English';

        const systemInstruction = [
          'You are the intelligent Hands-Free Voice Ordering & Menu Concierge for Hawassa Papyrus Lodge (ሃዋሳ ፓፒረስ ሎጅ).',
          'Guests—including blind and visually impaired guests—speak to you to: (A) open the menu and start ordering by voice, (B) have the menu read aloud, (C) hear what dishes, drinks, categories, prices, and deals/specials are available, (D) directly order dishes/drinks by voice into their basket with quantities and customizations, (E) check or remove items from their cart, (F) open checkout / confirm their order, or (G) call their waiter.',
          `Preferred UI language: ${preferredLang}. Respond in the language the guest used (or ${preferredLang} if ambiguous).`,
          `Guest location: "${guestLocation}". Billing: Service Charge ${serviceChargeRate}% + VAT ${vatRate}%.`,
          `Modifier pricing context: ${JSON.stringify(modifierOptions)}.`,
          '',
          'RULES:',
          '1. Strictly match items ONLY from LIVE AVAILABLE MENU ITEMS below. Never add sold-out items or invent dishes/prices.',
          '2. If a guest asks for a sold-out item, set `intent` to "info", omit it from `itemsToAdd`, apologize politely in `spokenReply`, and suggest 1-2 available alternatives.',
          '3. When the guest asks to open the menu or says they want to open the menu and order food (e.g., "ሜኑውን ከፍተው ምግብ ማዘዝ ፈልጌ ነበር", "ሜኑ ክፈት", "ምግብ ማዘዝ እፈልጋለሁ", "open the menu to order food", "open menu"), set `intent` to "open_menu", warmly confirm the menu is open, list the main categories clearly in `spokenReply` + `englishSummary`, highlight 3-4 popular available dishes in `recommendedItemIds`, and ask what they would like to hear or order.',
          '4. When the guest asks to read the entire menu or all dishes aloud (e.g., "ሜኑውን አንብብልኝ", "read the menu", "read all dishes"), set `intent` to "read_menu", and give a brief 1-sentence intro before reading begins.',
          '5. When the guest clearly asks to order/add food or drinks (e.g., "አንድ ሽከላ ጥብስ እና ሁለት ፔፕሲ እዘዝልኝ", "Add 2 Dorowot and 1 mango juice", "1 special burger with extra mayo"), set `intent` to "add_items" and populate `itemsToAdd` with exact `itemId`, `quantity`, and optional customizations (`pepper`: "yes"|"no", `injera`: "full"|"half"|"none", `breadCount`: integer, `extraKocho`: boolean, `extraMayo`: boolean, `customInstructions`: string).',
          '6. When the guest asks "ምን ምን አለ?", "What do you have?", "What deals/discounts do you have?", set `intent` to "deals" or "info", list the best highlights/deals clearly with prices, and put up to 4 highlighted item IDs in `recommendedItemIds`.',
          '7. When the guest wants to review their cart ("ቅርጫቴን አንብብ", "what is in my cart"), set `intent` to "read_cart". If they say "open cart", "checkout", "ይላክ", "ትዕዛዜን ጨርስ / confirm order", set `intent` to "confirm_order" or "open_cart".',
          '8. When the guest says remove/cancel item ("ፔፕሲ አውጣ", "remove fries", "clear cart"), set `intent` to "remove_items" and put matching `itemId` values (or "ALL" to clear everything) in `itemIdsToRemove`.',
          '9. When the guest says "አስተናጋጅ ጥራ / call waiter", set `intent` to "call_waiter".',
          '10. IMPORTANT FOR SPEECH SYNTHESIS: Keep `spokenReply` clean, natural, warm, and ready to be read aloud (NO markdown stars **, NO bullet symbols, NO emojis, concise 1-4 sentences). ALWAYS also write `englishSummary` as a clean 1-3 sentence English equivalent so browsers without Amharic OS voices can still speak clearly to the guest.',
          '',
          'CATEGORIES:',
          JSON.stringify(categories),
          '',
          'PROMO DEALS / SPECIALS:',
          JSON.stringify(promoBanners),
          '',
          'CURRENT GUEST CART:',
          JSON.stringify(cart),
          '',
          'LIVE AVAILABLE MENU ITEMS:',
          JSON.stringify(availableCatalog),
          '',
          'CURRENTLY SOLD OUT ITEMS:',
          JSON.stringify(soldOutCatalog.map((i) => ({ id: i.id, nameAm: i.nameAm, nameEn: i.nameEn }))),
        ].join('\n');

        const historyBlock = cleanHistory
          .map((t) => `${t.role === 'user' ? 'Guest' : 'VoiceConcierge'}: ${t.text}`)
          .join('\n');
        const contents = historyBlock
          ? `Recent voice conversation:\n${historyBlock}\n\nGuest just said: "${trimmedTranscript}"`
          : `Guest just said: "${trimmedTranscript}"`;

        const aiPromise = ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                spokenReply: {
                  type: Type.STRING,
                  description: 'Natural conversational response in the guest language with zero markdown or emojis.',
                },
                englishSummary: {
                  type: Type.STRING,
                  description: 'Clear natural English equivalent for TTS fallback when local OS voice is missing.',
                },
                intent: {
                  type: Type.STRING,
                  enum: [
                    'open_menu',
                    'read_menu',
                    'info',
                    'deals',
                    'add_items',
                    'remove_items',
                    'read_cart',
                    'open_cart',
                    'confirm_order',
                    'call_waiter',
                  ],
                },
                itemsToAdd: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      itemId: { type: Type.STRING },
                      quantity: { type: Type.INTEGER },
                      pepper: { type: Type.STRING, enum: ['yes', 'no'] },
                      injera: { type: Type.STRING, enum: ['full', 'half', 'none'] },
                      breadCount: { type: Type.INTEGER },
                      extraKocho: { type: Type.BOOLEAN },
                      extraMayo: { type: Type.BOOLEAN },
                      customInstructions: { type: Type.STRING },
                    },
                    required: ['itemId', 'quantity'],
                  },
                },
                itemIdsToRemove: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                focusCategoryId: { type: Type.STRING },
                recommendedItemIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                suggestedQuickReplies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['spokenReply', 'englishSummary', 'intent'],
            },
          },
        });

        let timeoutHandle: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error('AI_UPSTREAM_TIMEOUT'));
          }, AI_REQUEST_TIMEOUT_MS);
        });

        const response = await Promise.race([aiPromise, timeoutPromise]).finally(() => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
        });

        const rawText = (response.text ?? '{}').trim();
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(rawText);
        } catch {
          res.status(502).json({ error: 'Voice concierge returned an unexpected format. Please try again.' });
          return;
        }

        const availMap = new Map(availableCatalog.map((i) => [i.id, i]));
        const rawAdds = Array.isArray(parsed.itemsToAdd) ? parsed.itemsToAdd : [];
        const cleanAdds = rawAdds
          .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
          .filter((entry) => typeof entry.itemId === 'string' && availMap.has(entry.itemId))
          .map((entry) => ({
            itemId: entry.itemId as string,
            quantity: Math.max(1, Math.min(20, Number(entry.quantity) || 1)),
            pepper: entry.pepper === 'no' ? 'no' : entry.pepper === 'yes' ? 'yes' : undefined,
            injera:
              entry.injera === 'full' || entry.injera === 'half' || entry.injera === 'none'
                ? entry.injera
                : undefined,
            breadCount:
              typeof entry.breadCount === 'number'
                ? Math.max(0, Math.min(10, Math.round(entry.breadCount)))
                : undefined,
            extraKocho: Boolean(entry.extraKocho),
            extraMayo: Boolean(entry.extraMayo),
            customInstructions:
              typeof entry.customInstructions === 'string' ? entry.customInstructions.trim().slice(0, 120) : '',
          }));

        const cleanRemovals = Array.isArray(parsed.itemIdsToRemove)
          ? parsed.itemIdsToRemove.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          : [];

        const cleanRecs = Array.isArray(parsed.recommendedItemIds)
          ? parsed.recommendedItemIds.filter((id): id is string => typeof id === 'string' && availMap.has(id)).slice(0, 4)
          : [];

        const cleanFollowUps = Array.isArray(parsed.suggestedQuickReplies)
          ? parsed.suggestedQuickReplies.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 3)
          : [];

        const validCatIds = new Set((Array.isArray(categories) ? categories : []).map((c) => c.id));
        const focusCategoryId =
          typeof parsed.focusCategoryId === 'string' && validCatIds.has(parsed.focusCategoryId)
            ? parsed.focusCategoryId
            : '';

        res.json({
          spokenReply: typeof parsed.spokenReply === 'string' ? parsed.spokenReply : '',
          englishSummary: typeof parsed.englishSummary === 'string' ? parsed.englishSummary : '',
          intent: typeof parsed.intent === 'string' ? parsed.intent : 'info',
          itemsToAdd: cleanAdds,
          itemIdsToRemove: cleanRemovals,
          focusCategoryId,
          recommendedItemIds: cleanRecs,
          suggestedQuickReplies: cleanFollowUps,
        });
      } catch (err: unknown) {
        const errorObj = err as { status?: number; message?: string };
        console.error('Voice order error:', errorObj?.message || err);
        if (errorObj?.message === 'AI_UPSTREAM_TIMEOUT') {
          res.status(504).json({ error: 'Voice ordering timed out. Please try again.', code: 'AI_TIMEOUT' });
          return;
        }
        const status = typeof errorObj?.status === 'number' ? errorObj.status : 500;
        res.status(status >= 400 && status < 600 ? status : 500).json({
          error: errorObj?.message || 'Unexpected error processing voice order.',
        });
      } finally {
        if (releaseSemaphore) releaseSemaphore();
      }
    },
  );

  // Real server-side SMS notification dispatch for Kitchen -> Manager Out-of-Stock Alerts
  app.post('/api/alerts/stock-notify', async (req: Request, res: Response) => {
    try {
      const {
        itemNameAm = '',
        itemNameEn = '',
        changedByName = 'Kitchen Staff',
        changedByRole = 'chef',
        time = '',
        managerPhone = '',
      } = (req.body || {}) as {
        itemNameAm?: string;
        itemNameEn?: string;
        changedByName?: string;
        changedByRole?: string;
        time?: string;
        managerPhone?: string;
      };

      const cleanTitle = String(itemNameAm || itemNameEn || 'Menu Item').trim().slice(0, 140);
      const cleanEn = String(itemNameEn || '').trim().slice(0, 140);
      const cleanBy = String(changedByName || 'Staff').trim().slice(0, 80);
      const cleanRole = String(changedByRole || 'staff').trim().slice(0, 40);
      const cleanTime = String(time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })).slice(0, 20);
      const cleanPhone = String(managerPhone || process.env.MANAGER_ALERT_PHONE || '').trim().slice(0, 32);

      const messageBody = `[Papyrus Stock Alert] "${cleanTitle}"${cleanEn && cleanEn !== cleanTitle ? ` (${cleanEn})` : ''} marked OUT OF STOCK by ${cleanBy} (${cleanRole}) at ${cleanTime}.`;

      const webhookUrl = (process.env.SMS_WEBHOOK_URL || '').trim();
      if (webhookUrl) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (process.env.SMS_WEBHOOK_TOKEN) {
          headers.Authorization = `Bearer ${process.env.SMS_WEBHOOK_TOKEN}`;
        }
        const hookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            to: cleanPhone,
            message: messageBody,
            itemNameAm: cleanTitle,
            itemNameEn: cleanEn,
            changedByName: cleanBy,
            changedByRole: cleanRole,
            time: cleanTime,
          }),
        });
        if (!hookRes.ok) {
          const text = await hookRes.text().catch(() => '');
          res.status(502).json({
            ok: false,
            deliveredViaSms: false,
            provider: 'webhook',
            error: `SMS webhook returned HTTP ${hookRes.status}${text ? `: ${text.slice(0, 120)}` : ''}`,
          });
          return;
        }
        res.json({ ok: true, deliveredViaSms: true, provider: 'webhook' });
        return;
      }

      const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
      const twilioToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
      const twilioFrom = (process.env.TWILIO_FROM_NUMBER || '').trim();

      if (twilioSid && twilioToken && twilioFrom && cleanPhone) {
        const params = new URLSearchParams({
          To: cleanPhone,
          From: twilioFrom,
          Body: messageBody,
        });
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const twRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );
        if (!twRes.ok) {
          const text = await twRes.text().catch(() => '');
          res.status(502).json({
            ok: false,
            deliveredViaSms: false,
            provider: 'twilio',
            error: `Twilio SMS failed (${twRes.status})${text ? `: ${text.slice(0, 120)}` : ''}`,
          });
          return;
        }
        res.json({ ok: true, deliveredViaSms: true, provider: 'twilio' });
        return;
      }

      res.json({
        ok: true,
        deliveredViaSms: false,
        provider: 'none',
      });
    } catch (err) {
      console.error('Stock SMS alert dispatch error:', err);
      res.status(500).json({
        ok: false,
        deliveredViaSms: false,
        provider: 'error',
        error: 'Failed to dispatch stock SMS notification.',
      });
    }
  });

  const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);
  const mediaMemoryCache = new Map<string, { mimeType: string; buffer: Buffer }>();
  const setMediaMemoryCache = (id: string, entry: { mimeType: string; buffer: Buffer }) => {
    if (mediaMemoryCache.size >= 150) {
      const oldestKey = mediaMemoryCache.keys().next().value;
      if (oldestKey) mediaMemoryCache.delete(oldestKey);
    }
    mediaMemoryCache.set(id, entry);
  };

  app.get('/api/media/:id', async (req, res) => {
    try {
      const rawId = String(req.params.id || '').trim();
      if (!/^[a-zA-Z0-9_-]{8,64}$/.test(rawId)) {
        res.status(400).json({ ok: false, error: 'Invalid media identifier' });
        return;
      }

      const memHit = mediaMemoryCache.get(rawId);
      if (memHit) {
        res.setHeader('Content-Type', memHit.mimeType);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(memHit.buffer);
        return;
      }

      if (!supabase) {
        res.status(404).json({ ok: false, error: 'Media store unavailable' });
        return;
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', `media_${rawId}`)
        .maybeSingle();

      if (error || !data?.value || typeof data.value !== 'object') {
        res.status(404).json({ ok: false, error: 'Media not found' });
        return;
      }

      const payload = data.value as { mimeType?: unknown; base64?: unknown };
      const mimeType =
        typeof payload.mimeType === 'string' && ALLOWED_IMAGE_MIME_TYPES.has(payload.mimeType)
          ? payload.mimeType
          : 'image/jpeg';
      if (typeof payload.base64 !== 'string' || !payload.base64) {
        res.status(404).json({ ok: false, error: 'Invalid media payload' });
        return;
      }

      const buffer = Buffer.from(payload.base64, 'base64');
      if (!buffer.length) {
        res.status(404).json({ ok: false, error: 'Empty media buffer' });
        return;
      }

      setMediaMemoryCache(rawId, { mimeType, buffer });
      res.setHeader('Content-Type', mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (err) {
      console.warn('Media serve error:', err);
      res.status(500).json({ ok: false, error: 'Failed to load media asset' });
    }
  });

  app.post('/api/upload-media', async (req, res) => {
    try {
      const { fileName, contentType, base64Data, folder } = (req.body || {}) as {
        fileName?: string;
        contentType?: string;
        base64Data?: string;
        folder?: string;
      };

      if (!base64Data || typeof base64Data !== 'string') {
        res.status(400).json({ ok: false, error: 'Missing image payload' });
        return;
      }

      const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(rawBase64, 'base64');
      if (!buffer.length || buffer.length > 4 * 1024 * 1024) {
        res.status(400).json({ ok: false, error: 'Invalid or oversized media buffer' });
        return;
      }

      if (!supabase) {
        res.json({ ok: false, reason: 'supabase_unconfigured' });
        return;
      }

      const safeFolder = String(folder || 'images')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 24) || 'images';
      const cleanName = String(fileName || 'upload.jpg')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 64) || 'upload.jpg';
      const storagePath = `${safeFolder}/${Date.now()}_${cleanName}`;
      const normalizedMime = typeof contentType === 'string' ? contentType.toLowerCase().trim() : 'image/jpeg';
      if (!ALLOWED_IMAGE_MIME_TYPES.has(normalizedMime)) {
        res.status(400).json({ ok: false, error: 'Unsupported image MIME type' });
        return;
      }
      const mimeType = normalizedMime;

      // 1) Try Supabase Storage public bucket first
      try {
        await supabase.storage.createBucket('lodge-media', { public: true });
      } catch {
        // Bucket likely already exists or anon permissions limit bucket creation
      }

      const { error: uploadError } = await supabase.storage
        .from('lodge-media')
        .upload(storagePath, buffer, {
          contentType: mimeType,
          cacheControl: '31536000',
          upsert: true,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('lodge-media').getPublicUrl(storagePath);
        if (publicUrl) {
          res.json({ ok: true, publicUrl, storageMode: 'storage' });
          return;
        }
      }

      // 2) Permanent DB fallback in system_settings served via /api/media/:id
      const mediaId = `${safeFolder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { error: dbError } = await supabase.from('system_settings').upsert({
        key: `media_${mediaId}`,
        value: {
          mimeType,
          base64: buffer.toString('base64'),
          folder: safeFolder,
          fileName: cleanName,
          createdAt: Date.now(),
        },
      });

      if (dbError) {
        res.json({ ok: false, reason: dbError.message || uploadError?.message || 'media_store_failed' });
        return;
      }

      setMediaMemoryCache(mediaId, { mimeType, buffer });
      res.json({ ok: true, publicUrl: `/api/media/${mediaId}`, storageMode: 'db_media' });
    } catch (err) {
      console.warn('Media upload endpoint fallback:', err);
      res.json({ ok: false, reason: 'upload_exception' });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    // In AI Studio preview behind HTTPS reverse proxy, HMR is disabled and standalone Vite WS ports (24678)
    // are unreachable; serve a clean Vite client runtime with real style injection and zero WebSocket errors.
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(`
const sheetsMap = new Map();
let lastInsertedStyle;
const cspNonce = typeof document !== 'undefined' ? document.querySelector('meta[property=csp-nonce]')?.nonce : undefined;
export function updateStyle(id, content) {
  if (typeof document === 'undefined') return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (cspNonce) style.setAttribute('nonce', cspNonce);
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (typeof document === 'undefined') return;
  const style = sheetsMap.get(id);
  if (style) {
    style.parentNode?.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay {}
`);
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        maxAge: '365d',
        immutable: true,
        etag: true,
        lastModified: true,
      }),
    );
    app.use(
      express.static(distDir, {
        maxAge: '1h',
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          }
        },
      }),
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  httpServer.keepAliveTimeout = 65_000;
  httpServer.headersTimeout = 66_000;
  httpServer.requestTimeout = 30_000;
  httpServer.maxRequestsPerSocket = 1000;

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Papyrus Server] Worker #${workerId} (PID ${process.pid}) listening on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'dev'}]`,
    );
  });

  const gracefulShutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[Papyrus Server] Worker #${workerId} received ${signal}, draining connections...`);

    const forceTimer = setTimeout(() => {
      console.warn(`[Papyrus Server] Worker #${workerId} force exiting after drain timeout.`);
      process.exit(0);
    }, 10_000);
    forceTimer.unref();

    httpServer.close(() => {
      clearTimeout(forceTimer);
      console.log(`[Papyrus Server] Worker #${workerId} closed cleanly.`);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

async function bootstrapServer() {
  if (CLUSTER_ENABLED && cluster.isPrimary) {
    console.log(
      `[Papyrus Cluster] Primary PID ${process.pid} spawning ${WORKER_COUNT} worker processes for high-concurrency traffic...`,
    );

    let shuttingDownCluster = false;

    for (let i = 0; i < WORKER_COUNT; i += 1) {
      cluster.fork({ PAPYRUS_WORKER_ID: String(i + 1) });
    }

    cluster.on('exit', (worker, code, signal) => {
      if (shuttingDownCluster) return;
      console.warn(
        `[Papyrus Cluster] Worker PID ${worker.process.pid} exited (code=${code}, signal=${signal}). Respawning...`,
      );
      setTimeout(() => {
        if (!shuttingDownCluster) {
          cluster.fork();
        }
      }, 250);
    });

    const shutdownPrimary = (signal: string) => {
      shuttingDownCluster = true;
      console.log(`[Papyrus Cluster] Primary received ${signal}, stopping workers...`);
      for (const id of Object.keys(cluster.workers || {})) {
        cluster.workers?.[id]?.kill(signal);
      }
      setTimeout(() => process.exit(0), 12_000).unref();
    };

    process.on('SIGTERM', () => shutdownPrimary('SIGTERM'));
    process.on('SIGINT', () => shutdownPrimary('SIGINT'));
    return;
  }

  const workerId = Number(process.env.PAPYRUS_WORKER_ID) || cluster.worker?.id || 1;
  await startWorker(workerId);
}

void bootstrapServer();
