import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, employees })
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
    const { fullName, phone, position, hireDate, salaryAmount, salaryCurrency } = body

    if (!fullName || !phone || !position || !salaryAmount) {
      return NextResponse.json(
        { success: false, error: 'نام، تلفن، سمت و معاش الزامی است' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        fullName,
        phone,
        position,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        salaryAmount: Number(salaryAmount),
        salaryCurrency: salaryCurrency || 'AFN',
      },
    })

    return NextResponse.json({ success: true, employee }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}