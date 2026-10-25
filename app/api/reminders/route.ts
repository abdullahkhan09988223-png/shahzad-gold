import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const where = customerId ? { customerId: Number(customerId) } : {}

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { remindAt: 'asc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
      },
    })
    return NextResponse.json({ success: true, reminders })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, message, method, remindAt, notes } = body

    if (!customerId || !message || !remindAt) {
      return NextResponse.json(
        { success: false, error: 'مشتری، پیام و تاریخ الزامی است' },
        { status: 400 }
      )
    }

    const reminder = await prisma.reminder.create({
      data: {
        customerId: Number(customerId),
        message,
        method: method || 'MANUAL',
        remindAt: new Date(remindAt),
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, reminder }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}