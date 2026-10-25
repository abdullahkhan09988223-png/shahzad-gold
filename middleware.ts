import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose' // 👈 ایمپورت برای چک کردن اصالت توکن

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  // ۱. مسیرهای عمومی (صفحه لاگین و APIهای لاگین/ثبت‌نام)
  if (pathname === '/login' || pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    // اگر توکن معتبر دارد و می‌خواهد وارد لاگین شود، بفرستش داشبورد
    if (token && pathname === '/login') {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        await jwtVerify(token, secret)
        return NextResponse.redirect(new URL('/', request.url))
      } catch (e) {
        // اگر توکن خراب بود، بگذار در لاگین بماند
        return NextResponse.next()
      }
    }
    return NextResponse.next()
  }

  // ۲. اگر اصلا توکن ندارد (کاربر لاگین نکرده است)
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ۳. اگر توکن دارد، اصالت آن را چک می‌کنیم (جلوگیری از هک و توکن‌های جعلی)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token, secret)
  } catch (error) {
    // اگر توکن منقضی شده یا جعلی بود:
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'توکن نامعتبر است' }, { status: 401 })
    }
    // پاک کردن کوکی و انتقال به لاگین
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    return response
  }

  // اگر همه چیز درست بود، اجازه عبور بده
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * تمام مسیرها را چک کن به جز فایل‌های استاتیک و عکس‌ها
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}