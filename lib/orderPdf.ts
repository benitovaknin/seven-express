import fs from 'fs'
import path from 'path'
import { PDFDocument, PDFFont, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

interface PdfItem {
  name: string
  quantity: number
  unitPrice: number
}

interface PdfOrder {
  orderId: string
  deliveryName: string
  deliveryPhone: string
  deliveryCity: string
  deliveryAddress: string
  notes?: string
  totalAmount: number
  items: PdfItem[]
}

const HEBREW_RE = /[֐-׿]/

/** Splits text into same-script runs (Hebrew vs. everything else), dropping
 *  the whitespace between runs (fixed gaps are used instead when drawing).
 *  pdf-lib's font shaping (via fontkit) renders single-script runs correctly
 *  on its own, but reorders digits incorrectly when a run mixes Hebrew with
 *  numbers/Latin — so runs must never be mixed in one drawText call. */
function splitRuns(text: string): string[] {
  const runs: string[] = []
  let current = ''
  let currentIsHebrew: boolean | null = null

  for (const char of text) {
    if (char === ' ') {
      current += char
      continue
    }
    const isHebrew = HEBREW_RE.test(char)
    if (currentIsHebrew === null || isHebrew === currentIsHebrew) {
      current += char
    } else if (char === ':' && currentIsHebrew === true) {
      // keep a colon glued to the Hebrew label it terminates (e.g. "טלפון:")
      // instead of starting the next (non-Hebrew) run with it
      current += char
      continue
    } else {
      runs.push(current)
      current = char
    }
    currentIsHebrew = isHebrew
  }
  if (current) runs.push(current)

  return runs.map((r) => r.trim()).filter((r) => r.length > 0)
}

/** Draws logical-order text right-aligned to rightX, laying same-script runs
 *  out right-to-left with a fixed gap between them (see splitRuns). */
function drawRightAligned(
  page: import('pdf-lib').PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number
) {
  const runs = splitRuns(text)
  const gap = size * 0.28
  let cursorRight = rightX
  for (const run of runs) {
    const width = font.widthOfTextAtSize(run, size)
    page.drawText(run, { x: cursorRight - width, y, size, font, color: rgb(0.1, 0.1, 0.1) })
    cursorRight -= width + gap
  }
}

export async function generateOrderPdf(order: PdfOrder): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const regularBytes = fs.readFileSync(path.join(process.cwd(), 'lib/fonts/Heebo-Regular.ttf'))
  const boldBytes = fs.readFileSync(path.join(process.cwd(), 'lib/fonts/Heebo-Bold.ttf'))
  const font = await pdfDoc.embedFont(regularBytes)
  const boldFont = await pdfDoc.embedFont(boldBytes)

  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const rightX = 545
  const leftX = 50
  let y = 780

  drawRightAligned(page, 'הזמנה - Seven Express', rightX, y, boldFont, 20)
  y -= 35

  drawRightAligned(page, `מספר הזמנה: ${order.orderId}`, rightX, y, font, 12)
  y -= 40

  drawRightAligned(page, 'פרטי משלוח', rightX, y, boldFont, 13)
  y -= 22
  drawRightAligned(page, `שם: ${order.deliveryName}`, rightX, y, font, 11)
  y -= 18
  drawRightAligned(page, `טלפון: ${order.deliveryPhone}`, rightX, y, font, 11)
  y -= 18
  drawRightAligned(page, `כתובת: ${order.deliveryAddress}, ${order.deliveryCity}`, rightX, y, font, 11)
  y -= 18
  if (order.notes) {
    drawRightAligned(page, `הערות: ${order.notes}`, rightX, y, font, 11)
    y -= 18
  }
  y -= 20

  drawRightAligned(page, 'מוצרים', rightX, y, boldFont, 13)
  y -= 10
  page.drawLine({ start: { x: leftX, y }, end: { x: rightX, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  y -= 20

  for (const item of order.items) {
    drawRightAligned(page, item.name, rightX, y, font, 11)
    page.drawText(`x${item.quantity}`, { x: leftX + 90, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) })
    page.drawText(`₪${item.unitPrice.toFixed(2)}`, { x: leftX, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) })
    y -= 20
  }

  y -= 10
  page.drawLine({ start: { x: leftX, y }, end: { x: rightX, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  y -= 25

  drawRightAligned(page, `סה״כ: ₪${order.totalAmount.toFixed(2)}`, rightX, y, boldFont, 14)

  return pdfDoc.save()
}
