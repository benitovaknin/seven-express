import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateOrderPdf } from '@/lib/orderPdf'

export const runtime = 'nodejs'

const OWNER_EMAIL = 'shaharmualem6@gmail.com'
const FROM_ADDRESS = 'Seven Express <orders@seven-express-business-market.com>'

interface NotifyItem {
  name: string
  quantity: number
  unitPrice: number
}

interface NotifyPayload {
  orderId: string
  customerEmail: string
  deliveryName: string
  deliveryPhone: string
  deliveryCity: string
  deliveryAddress: string
  notes?: string
  totalAmount: number
  items: NotifyItem[]
}

function itemsTable(items: NotifyItem[]) {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:4px 8px">${item.name}</td><td style="padding:4px 8px">${item.quantity}</td><td style="padding:4px 8px">₪${item.unitPrice.toFixed(2)}</td></tr>`
    )
    .join('')
  return `<table style="border-collapse:collapse;width:100%"><thead><tr><th style="text-align:right;padding:4px 8px">מוצר</th><th style="text-align:right;padding:4px 8px">כמות</th><th style="text-align:right;padding:4px 8px">מחיר</th></tr></thead><tbody>${rows}</tbody></table>`
}

export async function POST(request: Request) {
  const payload: NotifyPayload = await request.json()
  const resend = new Resend(process.env.RESEND_API_KEY)

  const orderSummaryHtml = `
    <div dir="rtl" style="font-family:sans-serif">
      <p>מספר הזמנה: <b>${payload.orderId}</b></p>
      <p>שם: ${payload.deliveryName}<br/>טלפון: ${payload.deliveryPhone}<br/>כתובת: ${payload.deliveryAddress}, ${payload.deliveryCity}</p>
      ${payload.notes ? `<p>הערות: ${payload.notes}</p>` : ''}
      ${itemsTable(payload.items)}
      <p style="font-weight:bold">סה״כ: ₪${payload.totalAmount.toFixed(2)}</p>
    </div>
  `

  const pdfBytes = await generateOrderPdf(payload)
  const attachments = [
    {
      filename: `order-${payload.orderId}.pdf`,
      content: Buffer.from(pdfBytes).toString('base64'),
    },
  ]

  const results = await Promise.all([
    resend.emails.send({
      from: FROM_ADDRESS,
      to: OWNER_EMAIL,
      subject: `הזמנה חדשה #${payload.orderId}`,
      html: orderSummaryHtml,
      attachments,
    }),
    resend.emails.send({
      from: FROM_ADDRESS,
      to: payload.customerEmail,
      subject: `ההזמנה שלך ב-Seven Express נתקבלה #${payload.orderId}`,
      html: orderSummaryHtml,
      attachments,
    }),
  ])

  const failed = results.filter((r) => r.error)
  if (failed.length > 0) {
    console.error('notify-order: resend errors', failed.map((r) => r.error))
    return NextResponse.json({ ok: false, errors: failed.map((r) => r.error) }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
