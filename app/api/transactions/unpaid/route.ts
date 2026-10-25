import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    // واکشی فاکتورهایی که هنوز مقداری از بدهی آن‌ها باقی مانده است
    const transactions = await prisma.transaction.findMany({
      where: {
        remainingUsd: { gt: 0 }, // فقط فاکتورهای دارای باقی‌مانده
      },
      include: {
        customer: { select: { id: true, fullName: true } },
      },
      orderBy: { transactionDate: 'desc' },
    })
    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}