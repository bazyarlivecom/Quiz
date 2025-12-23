# راهنمای راه‌اندازی MySQL در Windows PowerShell

## روش 1: استفاده از MySQL Command Line Client

### مرحله 1: اتصال به MySQL Server

```powershell
mysql -h 192.168.1.200 -P 3306 -u userreactpanel -p
```

بعد از اجرای این دستور، از شما رمز عبور خواسته می‌شود:
```
Enter password: Aa123456
```

### مرحله 2: ایجاد دیتابیس

بعد از اتصال، دستورات زیر را در MySQL client اجرا کنید:

```sql
CREATE DATABASE IF NOT EXISTS quiz_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quiz_game;
```

### مرحله 3: اجرای Schema

از MySQL client خارج شوید (`exit`) و سپس در PowerShell:

```powershell
mysql -h 192.168.1.200 -P 3306 -u userreactpanel -pAa123456 quiz_game < database\schema_mysql.sql
```

---

## روش 2: استفاده از اسکریپت PowerShell (پیشنهادی)

فایل `database\setup_mysql.ps1` را اجرا کنید:

```powershell
.\database\setup_mysql.ps1
```

این اسکریپت به صورت خودکار:
1. دیتابیس را ایجاد می‌کند
2. Schema را اجرا می‌کند
3. وضعیت را نمایش می‌دهد

---

## روش 3: استفاده از MySQL Workbench یا phpMyAdmin

### MySQL Workbench:
1. اتصال به سرور: `192.168.1.200:3306`
2. User: `userreactpanel`
3. Password: `Aa123456`
4. ایجاد دیتابیس جدید: `quiz_game`
5. Import فایل: `database/schema_mysql.sql`

### phpMyAdmin:
1. وارد phpMyAdmin شوید
2. Import → انتخاب فایل `schema_mysql.sql`
3. اجرای Import

---

## روش 4: اجرای دستورات SQL به صورت مستقیم

اگر MySQL در PATH شما باشد:

```powershell
# ایجاد دیتابیس
mysql -h 192.168.1.200 -P 3306 -u userreactpanel -pAa123456 -e "CREATE DATABASE IF NOT EXISTS quiz_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# اجرای schema
mysql -h 192.168.1.200 -P 3306 -u userreactpanel -pAa123456 quiz_game < database\schema_mysql.sql
```

---

## بررسی اتصال

برای تست اتصال:

```powershell
mysql -h 192.168.1.200 -P 3306 -u userreactpanel -pAa123456 -e "SHOW DATABASES;"
```

باید دیتابیس `quiz_game` در لیست نمایش داده شود.

---

## نکات مهم

1. **رمز عبور در دستور**: اگر از `-p` بدون رمز استفاده کنید، از شما رمز خواسته می‌شود. اگر می‌خواهید رمز را در دستور بگذارید، باید بدون فاصله باشد: `-pAa123456`

2. **مسیر فایل**: در PowerShell از `\` یا `/` می‌توانید استفاده کنید:
   - `database\schema_mysql.sql`
   - `database/schema_mysql.sql`

3. **خطاهای رایج**:
   - اگر `mysql` پیدا نشد، باید MySQL را به PATH اضافه کنید
   - یا از مسیر کامل استفاده کنید: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`

4. **اجرای Policy**: اگر خطای execution policy گرفتید:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

---

## بعد از راه‌اندازی

بعد از ایجاد دیتابیس و اجرای schema:

1. Backend را اجرا کنید:
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

2. بررسی کنید که اتصال موفق باشد:
   ```
   ✅ Database connected successfully
   🚀 Server running on port 3001
   ```

---

**نکته**: اگر MySQL در سیستم شما نصب نیست، می‌توانید از MySQL Workbench یا هر MySQL client دیگری استفاده کنید.



