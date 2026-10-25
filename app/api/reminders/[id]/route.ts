import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const reminder = await prisma.reminder.update({
      where: { id: Number(id) },
      data: {
        isDone: body.isDone,
        doneAt: body.isDone ? new Date() : null,
      },
    })
    return NextResponse.json({ success: true, reminder })
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
    await prisma.reminder.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}