import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import bcrypt from 'bcryptjs'

// POST: ساخت کاربر جدید (فقط برای بار اول / ادمین)
export async function POST(request: Request) {
  try {
    const { username, password, employeeId, role } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'نام کاربری و رمز الزامی است' },
        { status: 400 }
      )
    }

    // چک کردن تکراری نبودن
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این نام کاربری قبلاً ثبت شده' },
        { status: 400 }
      )
    }

    // هش کردن رمز
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        employeeId: employeeId ? Number(employeeId) : null,
        role: role || 'EMPLOYEE',
      },
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}