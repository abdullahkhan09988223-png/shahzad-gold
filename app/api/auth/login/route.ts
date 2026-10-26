import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // ۱. پیدا کردن کاربر در دیتابیس
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 })
    }

    // ۲. چک کردن پسورد (فقط از طریق هش امن دیتابیس)
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 })
    }

    // ۳. چک کردن فعال بودن کاربر
    if (user.isActive === false) {
      return NextResponse.json({ success: false, error: 'حساب شما غیرفعال شده است' }, { status: 403 })
    }

    // ۴. ساخت توکن امنیتی
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me')
    const jwt = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // اعتبار ۷ روزه
      .sign(secret)

    // ۵. ست کردن کوکی برای مرورگر
    const cookieStore = await cookies()
    cookieStore.set('auth_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // ۷ روز
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions }
    })

  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}