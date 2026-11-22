/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';

/**
 * Progressively compresses an image File via HTMLCanvas so uploaded menu, staff,
 * and receipt photos remain lightweight (<120KB) for both cloud DB sync and offline fallback.
 */
export function compressImageFile(
  file: File,
  maxDimension = 760,
  quality = 0.76,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Empty image data'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL('image/jpeg', quality);
        // Step down quality if payload is still large so DB media & local cache never hit quota errors
        if (compressed.length > 140_000) {
          compressed = canvas.toDataURL('image/jpeg', 0.56);
        }
        if (compressed.length > 160_000) {
          const smaller = document.createElement('canvas');
          const ratio = 520 / Math.max(width, height);
          smaller.width = Math.max(1, Math.round(width * ratio));
          smaller.height = Math.max(1, Math.round(height * ratio));
          const sCtx = smaller.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(img, 0, 0, smaller.width, smaller.height);
            compressed = smaller.toDataURL('image/jpeg', 0.58);
          }
        }
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function sanitizeFileName(name: string, defaultBase = 'media'): string {
  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
  const cleanBase = base
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${cleanBase || defaultBase}.jpg`;
}

/**
 * Compresses an image once on the client, uploads via server-side persistent pipeline
 * (`/api/upload-media`, which writes to Supabase Storage or permanent DB `/api/media/:id`),
 * then falls back to direct Supabase Storage, then to compact JPEG Data URL.
 */
export async function uploadCompressedImageSmart(
  file: File,
  folder: 'menu' | 'staff' | 'receipts' | 'gallery' | 'images' = 'images',
  maxDimension = 720,
): Promise<{ url: string; storageMode: 'cloud' | 'embedded' }> {
  const compressedDataUrl = await compressImageFile(file, maxDimension);
  const cleanName = sanitizeFileName(file.name || `${folder}.jpg`, folder);

  // 1) Express server persistent upload (Supabase Storage OR DB /api/media/:id)
  if (compressedDataUrl.startsWith('data:image/')) {
    try {
      const resp = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: cleanName,
          contentType: 'image/jpeg',
          base64Data: compressedDataUrl,
          folder,
        }),
      });
      if (resp.ok) {
        const json = (await resp.json()) as { ok?: boolean; publicUrl?: string };
        if (json.ok && json.publicUrl) {
          return { url: json.publicUrl, storageMode: 'cloud' };
        }
      }
    } catch {
      // Fall through to direct Supabase Storage / compact embedded Data URL
    }
  }

  // 2) Direct browser Supabase Storage upload
  const filePath = `${folder}/${Date.now()}_${cleanName}`;
  try {
    const uploadBlob = compressedDataUrl.startsWith('data:')
      ? dataUrlToBlob(compressedDataUrl)
      : file;

    const { error } = await supabase.storage
      .from('lodge-media')
      .upload(filePath, uploadBlob, {
        cacheControl: '31536000',
        contentType: file.type.startsWith('image/') ? 'image/jpeg' : file.type || 'application/octet-stream',
        upsert: true,
      });

    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('lodge-media').getPublicUrl(filePath);
      if (publicUrl) {
        return { url: publicUrl, storageMode: 'cloud' };
      }
    }
  } catch {
    // Fall through cleanly
  }

  // 3) Guaranteed persistent compact embedded JPEG Data URL fallback
  return { url: compressedDataUrl, storageMode: 'embedded' };
}

/**
 * Processes a camera capture or uploaded receipt image using canvas compression,
 * attempts persistent cloud upload, and falls back cleanly to the compact Data URL.
 */
export async function processAndUploadReceiptImage(file: File): Promise<string> {
  const res = await uploadCompressedImageSmart(file, 'receipts', 820);
  return res.url;
}

