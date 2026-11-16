/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Order } from '../types';

export interface ReceiptPdfOptions {
  lodgeName?: string;
  cashierName?: string;
  serviceChargeRate?: number;
  vatRate?: number;
  hotline?: string;
  address?: string;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export function downloadOrderReceiptPdf(
  order: Order,
  options: ReceiptPdfOptions = {}
): string {
  const lodgeName = options.lodgeName || 'HAWASSA PAPYRUS LODGE';
  const cashierDisplay =
    order.cashierName || options.cashierName || 'Cashier Desk';
  const hotline = options.hotline || '+251 46 220 0000';
  const address = options.address || 'Hawassa Lakefront, Ethiopia';

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );
  const serviceCharge = Number(order.serviceCharge) || 0;
  const vat = Number(order.vat) || 0;
  const tip = Number(order.tip) || 0;
  const computedTotal = subtotal + serviceCharge + vat + tip;
  const grandTotal = Number(order.total) > 0 ? Number(order.total) : computedTotal;

  const receiptNo = `RCP-${String(order.id || '000')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toUpperCase()}`;
  const cleanFileId = String(order.id || 'order').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `Papyrus-Receipt-${cleanFileId}.pdf`;

  const logicalWidth = 420;
  const padX = 24;
  const contentWidth = logicalWidth - padX * 2;
  const scale = 2;

  // Measure wrapped item lines first using a scratch canvas
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d');
  if (!mCtx) {
    throw new Error('Could not initialize canvas context for PDF receipt.');
  }
  mCtx.font = '600 12px "Noto Sans Ethiopic", "Nyala", system-ui, -apple-system, sans-serif';

  const preparedItems = items.map((it) => {
    const qty = Number(it.qty) || 1;
    const unitPrice = Number(it.price) || 0;
    const lineTotal = qty * unitPrice;
    const label = it.name || (it as any).nameAm || (it as any).nameEn || 'Menu Item';
    const wrapped = wrapTextLines(mCtx, `${qty}x ${label}`, contentWidth - 95);
    return { wrapped, qty, unitPrice, lineTotal };
  });

  const itemBlockHeight = preparedItems.reduce(
    (h, item) => h + Math.max(24, item.wrapped.length * 16 + 10),
    0
  );

  // Header (~125) + Meta (~135) + Table header (28) + Items + Totals (~130) + Footer (~85)
  const logicalHeight = Math.max(480, 125 + 145 + 32 + itemBlockHeight + 135 + 90);

  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize PDF receipt canvas.');
  }

  ctx.scale(scale, scale);

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Top crimson & gold lodge accent stripes
  ctx.fillStyle = '#b21f1f';
  ctx.fillRect(0, 0, logicalWidth, 8);
  ctx.fillStyle = '#f4c22b';
  ctx.fillRect(0, 8, logicalWidth, 4);

  let y = 34;

  // Lodge Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b21f1f';
  ctx.font = '900 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(lodgeName, logicalWidth / 2, y);

  y += 18;
  ctx.fillStyle = '#1c1917';
  ctx.font = '700 12px "Noto Sans Ethiopic", "Nyala", system-ui, sans-serif';
  ctx.fillText('ሃዋሳ ፓፒረስ ሎጅ · OFFICIAL PAYMENT RECEIPT', logicalWidth / 2, y);

  y += 16;
  ctx.fillStyle = '#57534e';
  ctx.font = '500 10.5px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${address}  •  Tel: ${hotline}`, logicalWidth / 2, y);

  y += 16;
  // Dashed divider
  ctx.strokeStyle = '#d6d3d1';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(logicalWidth - padX, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Metadata rows
  y += 20;
  const drawMetaRow = (leftLabel: string, rightValue: string, boldRight = false) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#78716c';
    ctx.font = '600 11px "Noto Sans Ethiopic", "Nyala", system-ui, sans-serif';
    ctx.fillText(leftLabel, padX, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#1c1917';
    ctx.font = `${boldRight ? '800' : '600'} 11px "Noto Sans Ethiopic", "Nyala", ui-monospace, monospace`;
    ctx.fillText(rightValue, logicalWidth - padX, y);
    y += 18;
  };

  drawMetaRow('Receipt No / ደረሰኝ ቁጥር:', receiptNo, true);
  drawMetaRow('Order ID / ትዕዛዝ ቁጥር:', order.id || '-', true);
  drawMetaRow(
    'Date & Time / ቀን እና ሰዓት:',
    `${order.date || new Date().toISOString().split('T')[0]}  ${order.time || ''}`
  );
  drawMetaRow('Table / Room:', order.location || 'Walk-In', true);
  drawMetaRow(
    'Payment / ክፍያ:',
    `${String(order.payment || 'cash').toUpperCase()}${order.bankRef ? ` (${order.bankRef})` : ''} · ${
      order.status === 'Paid' ? 'PAID' : String(order.status || 'COMPLETED').toUpperCase()
    }`,
    true
  );
  drawMetaRow('Cashier / ካሸር:', cashierDisplay);
  if (order.waiter) {
    drawMetaRow('Waiter / አስተናጋጅ:', order.waiter);
  }

  y += 4;
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(logicalWidth - padX, y);
  ctx.stroke();

  // Table header
  y += 18;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1c1917';
  ctx.font = '800 10.5px system-ui, -apple-system, sans-serif';
  ctx.fillText('ITEM / የምግብ ዝርዝር', padX, y);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT (ETB)', logicalWidth - padX, y);

  y += 8;
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(logicalWidth - padX, y);
  ctx.stroke();

  // Items
  y += 18;
  for (const item of preparedItems) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1c1917';
    ctx.font = '700 11.5px ui-monospace, monospace';
    ctx.fillText(`${item.lineTotal.toFixed(2)}`, logicalWidth - padX, y);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1c1917';
    ctx.font = '600 11.5px "Noto Sans Ethiopic", "Nyala", system-ui, sans-serif';
    item.wrapped.forEach((line, idx) => {
      ctx.fillText(line, padX, y + idx * 15);
    });

    const lineStep = Math.max(18, item.wrapped.length * 15);
    ctx.fillStyle = '#78716c';
    ctx.font = '500 9.5px ui-monospace, monospace';
    ctx.fillText(`@ ${item.unitPrice.toFixed(2)} ETB each`, padX + 10, y + lineStep - 2);

    y += lineStep + 12;
  }

  // Totals Divider
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(logicalWidth - padX, y);
  ctx.stroke();

  y += 20;
  const drawTotalRow = (label: string, val: number) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#57534e';
    ctx.font = '600 11px "Noto Sans Ethiopic", "Nyala", system-ui, sans-serif';
    ctx.fillText(label, padX, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#1c1917';
    ctx.font = '700 11px ui-monospace, monospace';
    ctx.fillText(`${val.toFixed(2)} ETB`, logicalWidth - padX, y);
    y += 18;
  };

  drawTotalRow('Subtotal / ንዑስ ድምር', subtotal);
  if (serviceCharge > 0) {
    drawTotalRow(
      `Service Charge${options.serviceChargeRate ? ` (${options.serviceChargeRate}%)` : ''}`,
      serviceCharge
    );
  }
  if (vat > 0) {
    drawTotalRow(`VAT${options.vatRate ? ` (${options.vatRate}%)` : ''}`, vat);
  }
  if (tip > 0) {
    drawTotalRow('Staff Tip / ጉርሻ', tip);
  }

  // Grand Total Highlight Box
  y += 4;
  ctx.fillStyle = '#fcfbf7';
  ctx.strokeStyle = '#b21f1f';
  ctx.lineWidth = 1.5;
  ctx.fillRect(padX, y - 4, contentWidth, 34);
  ctx.strokeRect(padX, y - 4, contentWidth, 34);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#b21f1f';
  ctx.font = '900 13px "Noto Sans Ethiopic", "Nyala", system-ui, sans-serif';
  ctx.fillText('GRAND TOTAL / ጠቅላላ ሂሳብ', padX + 10, y + 17);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1c1917';
  ctx.font = '900 14px ui-monospace, monospace';
  ctx.fillText(`${grandTotal.toFixed(2)} ETB`, logicalWidth - padX - 10, y + 17);

  // Footer
  y += 54;
  ctx.strokeStyle = '#d6d3d1';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(logicalWidth - padX, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 20;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1c1917';
  ctx.font = '700 11px "Noto Sans Ethiopic", "Nyala", system-ui, sans-serif';
  ctx.fillText('እናመሰግናለን! Thank you for visiting Hawassa Papyrus Lodge.', logicalWidth / 2, y);

  y += 16;
  ctx.fillStyle = '#78716c';
  ctx.font = '600 9.5px system-ui, -apple-system, sans-serif';
  ctx.fillText('Powered by Guracha Tech · © 2026 Guracha Technology', logicalWidth / 2, y);

  // Convert canvas to PDF (110mm receipt width, proportional height)
  const pdfWidthMm = 110;
  const pdfHeightMm = Math.round((logicalHeight / logicalWidth) * pdfWidthMm * 10) / 10;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfWidthMm, pdfHeightMm],
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  doc.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm);
  doc.save(filename);

  return filename;
}
