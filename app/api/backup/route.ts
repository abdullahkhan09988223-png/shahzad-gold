import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) throw new Error('آدرس دیتابیس یافت نشد')

    // جدا کردن اطلاعات دیتابیس از URL
    const url = new URL(dbUrl)
    const dbUser = url.username
    const dbPass = url.password
    const dbHost = url.hostname
    const dbPort = url.port || '5432'
    const dbName = url.pathname.replace('/', '')

    // ساخت پوشه موقت
    const tempDir = path.join(process.cwd(), 'public', 'temp_backups')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `shahzad_gold_backup_${dateStr}.sql`
    const filePath = path.join(tempDir, fileName)

    // مسیر pg_dump در ویندوز
    const pgDumpPath = process.platform === 'win32' 
      ? 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe' 
      : 'pg_dump'

    // دستور را به صورت آرایه‌ای می‌دهیم تا ویندوز دچار اشتباه نشود
    const args = [
      '-h', dbHost,
      '-p', dbPort,
      '-U', dbUser,
      '-d', dbName,
      '-F', 'p',
      '-b',
      '-f', filePath
    ]

    // اجرای دستور با پسورد
    await new Promise((resolve, reject) => {
      execFile(pgDumpPath, args, { env: { ...process.env, PGPASSWORD: dbPass } }, (error, stdout, stderr) => {
        if (error) {
          console.error('Backup error:', stderr)
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })

    // خواندن فایل و پاک کردن آن از سرور
    const fileBuffer = fs.readFileSync(filePath)
    fs.unlinkSync(filePath)

    // ارسال برای دانلود
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'خطا در تهیه بکاپ: ' + String(error) }, { status: 500 })
  }
}