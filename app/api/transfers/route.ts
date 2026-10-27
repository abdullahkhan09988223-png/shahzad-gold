import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fromCustomerId, toCustomerId, amount, assetType, notes } = body

    const numAmount = Number(amount)
    if (!fromCustomerId || !toCustomerId || !numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'اطلاعات وارد شده معتبر نیست' }, { status: 400 })
    }

    if (fromCustomerId === toCustomerId) {
      return NextResponse.json({ success: false, error: 'مشتری مبدأ و مقصد نمی‌توانند یکی باشند' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 👇 ۱. تنظیم دیتای مشتری فرستنده (کسی که بدهی خود را می‌پردازد) 👇
      let senderData: any = {}
      let senderLedger: any = { 
        customerId: Number(fromCustomerId), 
        type: 'TRANSFER_SENT', 
        description: notes || `انتقال/تهاتر با مشتری مقصد` 
      }

      // 👇 ۲. تنظیم دیتای مشتری گیرنده (کسی که طلب خود را می‌گیرد) 👇
      let receiverData: any = {}
      let receiverLedger: any = { 
        customerId: Number(toCustomerId), 
        type: 'TRANSFER_RECEIVED', 
        description: notes || `دریافت/تهاتر از مشتری مبدا` 
      }

      if (assetType === 'USD') {
        senderData.balanceUsd = { decrement: numAmount }
        receiverData.balanceUsd = { increment: numAmount }
        senderLedger.creditUsd = numAmount // بستانکار شدن (کاهش بدهی)
        receiverLedger.debitUsd = numAmount // بدهکار شدن (کاهش طلب)
      } else if (assetType === 'GOLD') {
        senderData.balanceGoldGram = { decrement: numAmount }
        receiverData.balanceGoldGram = { increment: numAmount }
        senderLedger.goldAmount = -numAmount
        receiverLedger.goldAmount = numAmount
      } else if (assetType === 'SILVER') {
        senderData.balanceSilverGram = { decrement: numAmount }
        receiverData.balanceSilverGram = { increment: numAmount }
        senderLedger.silverAmount = -numAmount
        receiverLedger.silverAmount = numAmount
      }

      // ۳. آپدیت موجودی مشتریان
      await tx.customer.update({ where: { id: Number(fromCustomerId) }, data: senderData })
      await tx.customer.update({ where: { id: Number(toCustomerId) }, data: receiverData })

      // ۴. ثبت در دفتر معین هر دو مشتری
      await tx.customerLedger.create({ data: senderLedger })
      await tx.customerLedger.create({ data: receiverLedger })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Transfer Error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}