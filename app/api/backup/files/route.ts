import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ success: true, files: [] })
    }

    const files = fs.readdirSync(backupDir)
      .filter((f) => f.endsWith('.sql'))
      .map((file) => {
        const stats = fs.statSync(path.join(backupDir, file))
        return {
          name: file,
          size: stats.size,
          date: stats.mtime,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ success: true, files })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}