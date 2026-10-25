import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          include: {
            employee: { select: { fullName: true } },
            linkedTrade: { select: { id: true } },
          }
        },
        guarantors: true,
        reminders: { orderBy: { remindAt: 'desc' } },
      },
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: 'مشتری یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true, customer })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}