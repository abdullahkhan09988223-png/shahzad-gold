import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const cashBoxes = await prisma.cashBox.findMany({
      orderBy: { date: 'desc' }
    })
    return NextResponse.json({ success: true, cashBoxes })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // فقط دالر، طلا و نقره را دریافت می‌کنیم
    const openingUsd = Number(body.openingUsd) || 0
    const totalInUsd = Number(body.totalInUsd) || 0
    const totalOutUsd = Number(body.totalOutUsd) || 0
    const closingUsd = openingUsd + totalInUsd - totalOutUsd

    const openingGold = Number(body.openingGold) || 0
    const totalInGold = Number(body.totalInGold) || 0
    const totalOutGold = Number(body.totalOutGold) || 0
    const closingGold = openingGold + totalInGold - totalOutGold

    const openingSilver = Number(body.openingSilver) || 0
    const totalInSilver = Number(body.totalInSilver) || 0
    const totalOutSilver = Number(body.totalOutSilver) || 0
    const closingSilver = openingSilver + totalInSilver - totalOutSilver

    const date = new Date(body.date)

    // چک کردن اینکه برای این تاریخ قبلا صندوق ثبت شده یا نه
    const existing = await prisma.cashBox.findUnique({ where: { date } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'برای این تاریخ قبلا صندوق ثبت شده است' }, { status: 400 })
    }

    const cashBox = await prisma.cashBox.create({
      data: {
        date,
        openingUsd, totalInUsd, totalOutUsd, closingUsd,
        openingGold, totalInGold, totalOutGold, closingGold,
        openingSilver, totalInSilver, totalOutSilver, closingSilver,
        notes: body.notes || null
      }
    })

    return NextResponse.json({ success: true, cashBox })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}