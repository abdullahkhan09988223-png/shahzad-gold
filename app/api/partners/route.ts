import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// گرفتن لیست تمام شرکا
export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true } // تعداد معاملات هر شریک
        }
      }
    })
    return NextResponse.json({ success: true, partners })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا در دریافت لیست شرکا' }, { status: 500 })
  }
}

// ثبت شریک جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, phone, notes } = body

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'نام شریک الزامی است' }, { status: 400 })
    }

    const partner = await prisma.partner.create({
      data: {
        fullName,
        phone: phone || null,
        notes: notes || null,
      }
    })

    return NextResponse.json({ success: true, partner })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا در ثبت شریک جدید' }, { status: 500 })
  }
}