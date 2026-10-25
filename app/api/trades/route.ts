import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        linkedTransactions: {
          include: { customer: true }
        }
      }
    })
    return NextResponse.json({ success: true, trades })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, metal, lotSize, entryOuncePrice, physicalData } = body

    // محاسبه نرخ کابل (توله) بر اساس اونس
    // برای طلا: 1 اونس = 2.56 توله
    // برای نقره: 1 اونس ≈ 0.031 کیلو (اگر لازم شد)
    const ouncePrice = Number(entryOuncePrice)
    const kabulTolaPrice = metal === 'GOLD' ? (ouncePrice / 2.56) : ouncePrice

    const trade = await prisma.trade.create({
      data: {
        type,
        metal,
        lotSize: Number(lotSize),
        entryOuncePrice: ouncePrice,
        entryPriceUsd: kabulTolaPrice, // نرخ کابل برای پوشش فیزیکی
      }
    })

    // اگر پوشش فیزیکی همزمان داشت
    if (physicalData) {
      const count = await prisma.transaction.count()
      const invoiceNumber = `PHY-${String(count + 1).padStart(4, '0')}`
      
      await prisma.transaction.create({
        data: {
          invoiceNumber,
          customerId: Number(physicalData.customerId),
          employeeId: Number(physicalData.employeeId),
          type: physicalData.type,
          metal: physicalData.metal,
          unit: physicalData.unit,
          quantity: Number(physicalData.quantity),
          pricePerUnitUsd: kabulTolaPrice, // استفاده از نرخ کابل محاسبه شده
          pricePerUnitAfn: kabulTolaPrice * Number(physicalData.usdRate),
          usdRate: Number(physicalData.usdRate),
          totalUsd: Number(physicalData.quantity) * kabulTolaPrice,
          totalAfn: Number(physicalData.quantity) * kabulTolaPrice * Number(physicalData.usdRate),
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          paidUsd: Number(physicalData.quantity) * kabulTolaPrice,
          linkedTradeId: trade.id
        }
      })
    }

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}