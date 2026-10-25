import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'نام فایل الزامی است' },
        { status: 400 }
      )
    }

    // جلوگیری از دسترسی به فایل‌های خارج از پوشه بکاپ (امنیت)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'نام فایل نامعتبر است' },
        { status: 400 }
      )
    }

    const filePath = path.join(process.cwd(), 'backups', fileName)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد' },
        { status: 404 }
      )
    }

    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}