# اسکریپت PowerShell برای راه‌اندازی دیتابیس MySQL

Write-Host "🚀 راه‌اندازی دیتابیس Quiz Game..." -ForegroundColor Green

# اطلاعات اتصال
$DB_HOST = "192.168.1.200"
$DB_PORT = "3306"
$DB_USER = "userreactpanel"
$DB_PASSWORD = "Aa123456"
$DB_NAME = "quiz_game"

# مسیر فایل‌های SQL
$CREATE_DB_SQL = "database\create_database.sql"
$SCHEMA_SQL = "database\schema_mysql.sql"

Write-Host "`n📝 مرحله 1: ایجاد دیتابیس..." -ForegroundColor Yellow

# ایجاد دیتابیس
$createDbCmd = "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e `"CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`""
Invoke-Expression $createDbCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ دیتابیس ایجاد شد!" -ForegroundColor Green
} else {
    Write-Host "❌ خطا در ایجاد دیتابیس!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 مرحله 2: اجرای Schema..." -ForegroundColor Yellow

# اجرای schema
$schemaCmd = "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < $SCHEMA_SQL"
Invoke-Expression $schemaCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema با موفقیت اجرا شد!" -ForegroundColor Green
} else {
    Write-Host "❌ خطا در اجرای Schema!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 راه‌اندازی دیتابیس کامل شد!" -ForegroundColor Green
Write-Host "`n📋 اطلاعات اتصال:" -ForegroundColor Cyan
Write-Host "   Host: $DB_HOST" -ForegroundColor White
Write-Host "   Port: $DB_PORT" -ForegroundColor White
Write-Host "   Database: $DB_NAME" -ForegroundColor White
Write-Host "   User: $DB_USER" -ForegroundColor White

