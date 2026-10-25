import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    // ۱. گرفتن تمام معاملات (به جز باطل شده‌ها)
    const transactions = await prisma.transaction.findMany({
      where: { status: { not: 'CANCELLED' } }
    })

    // ۲. گرفتن آخرین وضعیت صندوق برای موجودی نقدی دالر
    const lastCashBox = await prisma.cashBox.findFirst({
      orderBy: { date: 'desc' }
    })

    let goldTola = 0
    let silverKg = 0

    // محاسبه موجودی طلا و نقره از معاملات خرید و فروش
    transactions.forEach((t) => {
      const qty = Number(t.quantity)
      const isBuy = t.type === 'BUY' || t.type === 'PRE_BUY'
      const isSell = t.type === 'SELL' || t.type === 'PRE_SELL'
      
      if (!isBuy && !isSell) return

      const sign = isBuy ? 1 : -1

      if (t.metal === 'GOLD') {
        let qtyInTola = qty
        if (t.unit === 'GRAM') qtyInTola = qty / 12.15
        if (t.unit === 'MASHA') qtyInTola = (qty * 4.6083) / 12.15
        if (t.unit === 'KG') qtyInTola = (qty * 1000) / 12.15
        goldTola += qtyInTola * sign
      } else if (t.metal === 'SILVER') {
        let qtyInKg = qty
        if (t.unit === 'GRAM') qtyInKg = qty / 1000
        if (t.unit === 'TOLA') qtyInKg = (qty * 12.15) / 1000
        silverKg += qtyInKg * sign
      }
    })

    let cashUsd = lastCashBox ? Number(lastCashBox.closingUsd) : 0

    // 👇 ۳. اعمال قرض‌های حسنه روی خزانه 👇
    const hasanas = await prisma.hasana.findMany()
    
    hasanas.forEach(h => {
      const amt = Number(h.amount)
      // اگر ما دادیم (GIVEN) از خزانه کم می‌شود، اگر گرفتیم (TAKEN) به خزانه اضافه می‌شود
      const sign = h.direction === 'GIVEN' ? -1 : 1 

      if (h.type === 'USD') {
        cashUsd += (amt * sign)
      } else if (h.type === 'GOLD') {
        goldTola += (amt * sign) // در فرم حسنه، طلا به توله ثبت می‌شود
      } else if (h.type === 'SILVER') {
        silverKg += ((amt / 1000) * sign) // در فرم حسنه، نقره به گرم ثبت می‌شود، پس تقسیم بر ۱۰۰۰ می‌شود
      }
    })

    // (اختیاری) اگر خواستید امانت‌ها هم روی خزانه اثر بگذارند، کد آن را اینجا اضافه می‌کنیم.
    // ولی چون گفتید امانت‌ها جدا باشند، فعلاً روی خزانه اعمال نمی‌شوند.

    return NextResponse.json({
      success: true,
      inventory: {
        goldTola: goldTola,
        goldGrams: goldTola * 12.15,
        silverKg: silverKg,
        silverGrams: silverKg * 1000,
        cashUsd: cashUsd,
        cashAfn: 0 
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}