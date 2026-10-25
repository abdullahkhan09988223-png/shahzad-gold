import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { PaymentStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      include: {
        transaction: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: { select: { id: true, fullName: true } },
          },
        },
      },
      take: 200,
    })
    return NextResponse.json({ success: true, payments })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactionId, amount, currency, method, referenceNo, notes } = body

    if (!transactionId || !amount) {
      return NextResponse.json({ success: false, error: 'معامله و مبلغ الزامی است' }, { status: 400 })
    }

    const amt = Number(amount)
    const curr = currency || 'USD'

    const tx = await prisma.transaction.findUnique({
      where: { id: Number(transactionId) },
      include: { customer: true },
    })

    if (!tx) {
      return NextResponse.json({ success: false, error: 'معامله یافت نشد' }, { status: 404 })
    }

    // ۱. ثبت رکورد پرداخت
    const payment = await prisma.payment.create({
      data: {
        transactionId: Number(transactionId),
        amount: amt,
        currency: curr,
        method: method || 'CASH',
        referenceNo: referenceNo || null,
        notes: notes || null,
      },
    })

    // ۲. محاسبه مبالغ جدید
    let newPaidUsd = Number(tx.paidUsd)
    let newPaidAfn = Number(tx.paidAfn)

    if (curr === 'USD') {
      newPaidUsd += amt
      newPaidAfn += amt * Number(tx.usdRate)
    } else {
      newPaidAfn += amt
      newPaidUsd += amt / Number(tx.usdRate)
    }

    const newRemainingUsd = Number(tx.totalUsd) - newPaidUsd
    const newRemainingAfn = Number(tx.totalAfn) - newPaidAfn

    let newStatus: PaymentStatus = 'PARTIAL'
    if (newRemainingUsd <= 0.01) newStatus = 'PAID'
    if (newPaidUsd <= 0.01) newStatus = 'UNPAID'

    // ۳. آپدیت فاکتور
    await prisma.transaction.update({
      where: { id: Number(transactionId) },
      data: {
        paidUsd: newPaidUsd,
        paidAfn: newPaidAfn,
        remainingUsd: newRemainingUsd,
        remainingAfn: newRemainingAfn,
        paymentStatus: newStatus,
      },
    })

    // ۴. آپدیت مانده حساب مشتری (کاهش بدهی)
    const deltaUsd = newRemainingUsd - Number(tx.remainingUsd)
    const deltaAfn = newRemainingAfn - Number(tx.remainingAfn)
    
    await prisma.customer.update({
      where: { id: tx.customerId },
      data: {
        balanceUsd: Number(tx.customer.balanceUsd) + deltaUsd,
        balanceAfn: Number(tx.customer.balanceAfn) + deltaAfn,
      },
    })

    return NextResponse.json({ success: true, payment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}