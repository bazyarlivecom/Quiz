# راهنمای Database

## تنظیمات

- **Host**: localhost
- **Port**: 5433
- **Database**: quiz_game
- **User**: postgres
- **Password**: 4522

## نصب و راه‌اندازی

### Windows (PowerShell)

```powershell
cd database
.\setup_database.ps1
```

### Linux/Mac (Bash)

```bash
cd database
chmod +x setup_database.sh
./setup_database.sh
```

### دستی

#### 1. ایجاد Database

```bash
psql -U postgres -p 5433 -h localhost
```

در psql:
```sql
CREATE DATABASE quiz_game;
\q
```

#### 2. اجرای Schema

```bash
psql -U postgres -p 5433 -h localhost -d quiz_game -f schema_postgresql.sql
```

یا با PGPASSWORD:
```bash
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game -f schema_postgresql.sql
```

#### 3. Seed Data (اختیاری)

```bash
psql -U postgres -p 5433 -h localhost -d quiz_game -f seeds/initial_data.sql
```

## فایل‌ها

- `schema_postgresql.sql` - Schema کامل دیتابیس
- `seeds/initial_data.sql` - داده‌های اولیه
- `DATABASE_SCHEMA.md` - مستندات schema
- `setup_database.ps1` - Script نصب برای Windows
- `setup_database.sh` - Script نصب برای Linux/Mac

## اتصال به دیتابیس

```bash
psql -U postgres -p 5433 -h localhost -d quiz_game
```

یا با PGPASSWORD:
```bash
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game
```

## Backup

```bash
PGPASSWORD=4522 pg_dump -U postgres -p 5433 -h localhost quiz_game > backup.sql
```

## Restore

```bash
PGPASSWORD=4522 psql -U postgres -p 5433 -h localhost -d quiz_game < backup.sql
```
