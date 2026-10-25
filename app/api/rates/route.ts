import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const rates = await prisma.metalRate.findMany({
      orderBy: { dateTime: 'desc' },
      take: 30,
    })
    return NextResponse.json({ success: true, rates, latest: rates[0] || null })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      dateTime, usdToAfn, goldBuyPerTolaUsd, goldSellPerTolaUsd, silverBuyPerKgUsd, silverSellPerKgUsd,
    } = body

    if (!dateTime || !usdToAfn) {
      return NextResponse.json({ success: false, error: 'تاریخ/ساعت و نرخ دالر الزامی است' }, { status: 400 })
    }

    const dtObj = new Date(dateTime)

    const data = {
      dateTime: dtObj,
      usdToAfn: Number(usdToAfn),
      goldBuyPerTolaUsd: Number(goldBuyPerTolaUsd) || 0,
      goldSellPerTolaUsd: Number(goldSellPerTolaUsd) || 0,
      silverBuyPerKgUsd: Number(silverBuyPerKgUsd) || 0,
      silverSellPerKgUsd: Number(silverSellPerKgUsd) || 0,
      source: 'manual',
    }

    const existing = await prisma.metalRate.findUnique({ where: { dateTime: dtObj } })
    const rate = existing
      ? await prisma.metalRate.update({ where: { dateTime: dtObj }, data })
      : await prisma.metalRate.create({ data })

    return NextResponse.json({ success: true, rate }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}