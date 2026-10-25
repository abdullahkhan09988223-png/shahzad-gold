import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        status: { not: 'CANCELLED' },
        partners: { some: {} } // فقط معاملاتی که شریک دارند
      },
      include: {
        customer: { select: { fullName: true } },
        partners: { include: { partner: true } }
      },
      orderBy: { transactionDate: 'desc' }
    })
    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}