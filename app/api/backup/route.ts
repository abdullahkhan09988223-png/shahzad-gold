import { NextResponse } from 'next/server'

export async function GET() {
  // 👇 این بخش موقتاً غیرفعال شد تا بیلد روی Vercel بدون خطا انجام شود
  return NextResponse.json({ 
    success: false, 
    message: 'سیستم بکاپ‌گیری خودکار در محیط آنلاین (Vercel) پشتیبانی نمی‌شود. لطفاً از پنل Neon برای بکاپ استفاده کنید.' 
  }, { status: 501 })

  /* 
  // کدهای قبلی شما که در ویندوز کار می‌کرد:
  try {
    // اجرای pg_dump با مسیر ویندوز
  } catch (error) {
    // ...
  }
  */
}