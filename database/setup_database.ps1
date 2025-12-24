# PowerShell script for database setup
# تنظیمات دیتابیس
$env:PGPASSWORD = "4522"
$DB_HOST = "localhost"
$DB_PORT = "5433"
$DB_NAME = "quiz_game"
$DB_USER = "postgres"

Write-Host "Setting up database..." -ForegroundColor Green

# ایجاد دیتابیس
Write-Host "Creating database..." -ForegroundColor Yellow
$createDbQuery = "CREATE DATABASE $DB_NAME;"
try {
    & psql -U $DB_USER -p $DB_PORT -h $DB_HOST -c $createDbQuery 2>$null
    Write-Host "Database created successfully" -ForegroundColor Green
} catch {
    Write-Host "Database might already exist" -ForegroundColor Yellow
}

# اجرای schema
Write-Host "Running schema..." -ForegroundColor Yellow
& psql -U $DB_USER -p $DB_PORT -h $DB_HOST -d $DB_NAME -f schema_postgresql.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "Schema applied successfully" -ForegroundColor Green
} else {
    Write-Host "Error applying schema" -ForegroundColor Red
    exit 1
}

# اجرای seed data (اختیاری)
if (Test-Path "seeds/initial_data.sql") {
    Write-Host "Seeding initial data..." -ForegroundColor Yellow
    & psql -U $DB_USER -p $DB_PORT -h $DB_HOST -d $DB_NAME -f seeds/initial_data.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Seed data applied successfully" -ForegroundColor Green
    }
}

Write-Host "Database setup complete!" -ForegroundColor Green

