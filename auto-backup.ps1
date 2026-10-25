# تنظیم پسورد دیتابیس
$env:PGPASSWORD = "abdullah"

# مسیر پوشه بکاپ
$backupDir = Join-Path $PSScriptRoot "backups"
if (!(Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
}

# ساخت نام فایل با تاریخ و ساعت
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$filename = Join-Path $backupDir "auto_backup_$timestamp.sql"

# اجرای دستور pg_dump
pg_dump -U postgres -h localhost -d bahram_db -f $filename

# پیام موفقیت یا خطا
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ بکاپ با موفقیت ساخته شد: $filename"
} else {
    Write-Host "❌ خطا در ساخت بکاپ"
}