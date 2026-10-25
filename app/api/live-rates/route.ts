import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    // دریافت نرخ از API
    const response = await fetch('https://xaus.com/api/v1/spot', { cache: 'no-store' })
    const data = await response.json()

    if (!data || !data.spot_usd_oz) {
      throw new Error('خطا در دریافت اطلاعات از سرور')
    }

    const goldPrice = Number(data.spot_usd_oz)
    let silverPrice = Number(data.spot_silver_usd_oz || data.silver_usd_oz || 0)
    
    // اگر نرخ نقره نبود، به صورت پشتیبان محاسبه میکنیم
    if (silverPrice === 0) {
      silverPrice = goldPrice / 85; 
    }

    // 👇 به جای ثبت در دیتابیس (که باعث کندی میشد)، فقط تاریخچه قبلی را میخوانیم
    const goldHistory = await prisma.liveRate.findMany({
      where: { metal: 'GOLD' }, orderBy: { timestamp: 'desc' }, take: 50
    })
    const silverHistory = await prisma.liveRate.findMany({
      where: { metal: 'SILVER' }, orderBy: { timestamp: 'desc' }, take: 50
    })

    return NextResponse.json({
      success: true,
      gold: { current: goldPrice, history: goldHistory.reverse() },
      silver: { current: silverPrice, history: silverHistory.reverse() }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}