import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function checkAdmin() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return false
    const payload: any = jwt.verify(token, process.env.JWT_SECRET as string)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    return user?.role === 'ADMIN'
  } catch {
    return false
  }
}

export async function GET() {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, fullName: true, position: true } },
      },
    })
    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      permissions: u.permissions, // 👈 ارسال دسترسی‌ها به فرانت‌اند
      employee: u.employee,
    }))
    return NextResponse.json({ success: true, users: safeUsers })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, employeeId, role } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'نام کاربری و رمز الزامی است' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ success: false, error: 'رمز باید حداقل ۴ کاراکتر باشد' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'این نام کاربری قبلا ثبت شده است' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        employeeId: employeeId ? Number(employeeId) : null,
        role: role || 'EMPLOYEE',
        permissions: [], // 👈 آرایه خالی برای کاربر جدید
      },
    })

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role } })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}