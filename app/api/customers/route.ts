import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

// GET: لیست همه مشتریان
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, customers })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

// POST: افزودن مشتری جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, phone, email, address, nationalId, customerType, notes } = body

    if (!fullName || !phone) {
      return NextResponse.json(
        { success: false, error: 'نام و شماره تلفن الزامی است' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        email: email || null,
        address: address || null,
        nationalId: nationalId || null,
        customerType: customerType || 'BOTH',
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, customer }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'این شماره تلفن قبلاً ثبت شده است' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}