import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const partnerId = Number(id)

    if (isNaN(partnerId)) {
      return NextResponse.json({ success: false, error: 'شناسه نامعتبر است' }, { status: 400 })
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        transactions: {
          include: {
            transaction: true
          },
          orderBy: {
            transaction: { transactionDate: 'desc' }
          }
        }
      }
    })

    if (!partner) {
      return NextResponse.json({ success: false, error: 'شریک یافت نشد' }, { status: 404 })
    }

    const formattedTransactions = partner.transactions.map(tp => ({
      id: tp.transaction.id,
      invoiceNumber: tp.transaction.invoiceNumber,
      date: tp.transaction.transactionDate,
      type: tp.transaction.type,
      metal: tp.transaction.metal,
      quantity: tp.transaction.quantity,
      unit: tp.transaction.unit,
      totalUsd: tp.transaction.totalUsd,
      sharePercentage: tp.sharePercentage,
      profitLossShare: tp.profitLossShare
    }))

    return NextResponse.json({
      success: true,
      partner: { 
        id: partner.id, 
        fullName: partner.fullName, 
        phone: partner.phone,
        notes: partner.notes
      },
      transactions: formattedTransactions
    })

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ success: false, error: 'خطا در سرور' }, { status: 500 })
  }
}