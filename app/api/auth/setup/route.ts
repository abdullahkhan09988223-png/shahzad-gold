import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const existing = await prisma.user.findUnique({
      where: { username: 'admin' },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'کاربر admin قبلاً ساخته شده',
      })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: '✅ کاربر admin ساخته شد',
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}