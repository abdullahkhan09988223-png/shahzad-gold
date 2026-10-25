import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id: Number(id) },
    })
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'کارمند یافت نشد' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, employee })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { fullName, phone, position, hireDate, salaryAmount, salaryCurrency } = body

    const employee = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        fullName,
        phone,
        position,
        hireDate: new Date(hireDate),
        salaryAmount: Number(salaryAmount),
        salaryCurrency,
      },
    })

    return NextResponse.json({ success: true, employee })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.employee.delete({
      where: { id: Number(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}