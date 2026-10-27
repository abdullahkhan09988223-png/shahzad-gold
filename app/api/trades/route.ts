import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

const OUNCE_TO_GRAMS = 31.1035;
const TOLA_TO_GRAMS = 12.15;

export async function GET() {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      include: { linkedTransactions: { include: { customer: true } } }
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

    const ouncePrice = Number(entryOuncePrice)
    // 👇 فرمول دقیق: (اونس / 31.1035) * 12.15 = توله کابل 👇
    const kabulTolaPrice = metal === 'GOLD' ? (ouncePrice / OUNCE_TO_GRAMS) * TOLA_TO_GRAMS : ouncePrice

    const trade = await prisma.trade.create({
      data: {
        type, metal, lotSize: Number(lotSize),
        entryOuncePrice: ouncePrice,
        entryPriceUsd: kabulTolaPrice, 
      }
    })

    if (physicalData) {
      const count = await prisma.transaction.count()
      const invoiceNumber = `PHY-${String(count + 1).padStart(4, '0')}`
      
      await prisma.transaction.create({
        data: {
          invoiceNumber, customerId: Number(physicalData.customerId), employeeId: Number(physicalData.employeeId),
          type: physicalData.type, metal: physicalData.metal, unit: physicalData.unit, quantity: Number(physicalData.quantity),
          pricePerUnitUsd: kabulTolaPrice, 
          pricePerUnitAfn: kabulTolaPrice * Number(physicalData.usdRate),
          usdRate: Number(physicalData.usdRate),
          totalUsd: Number(physicalData.quantity) * kabulTolaPrice,
          totalAfn: Number(physicalData.quantity) * kabulTolaPrice * Number(physicalData.usdRate),
          paymentMethod: 'CASH', paymentStatus: 'PAID', paidUsd: Number(physicalData.quantity) * kabulTolaPrice,
          linkedTradeId: trade.id
        }
      })
    }

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}