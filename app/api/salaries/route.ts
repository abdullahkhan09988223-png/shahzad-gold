import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

// GET: لیست همه پرداخت‌های معاش
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    const where = employeeId ? { employeeId: Number(employeeId) } : {}

    const salaries = await prisma.salaryPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        employee: {
          select: { id: true, fullName: true, position: true },
        },
      },
      take: 200,
    })
    return NextResponse.json({ success: true, salaries })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

// POST: ثبت پرداخت معاش جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      employeeId,
      amount,
      currency,
      bonus,
      deduction,
      forMonth,
      notes,
    } = body

    if (!employeeId || !amount || !forMonth) {
      return NextResponse.json(
        { success: false, error: 'کارمند، مبلغ و ماه الزامی است' },
        { status: 400 }
      )
    }

    const salary = await prisma.salaryPayment.create({
      data: {
        employeeId: Number(employeeId),
        amount: Number(amount),
        currency: currency || 'AFN',
        bonus: Number(bonus) || 0,
        deduction: Number(deduction) || 0,
        forMonth,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, salary }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}