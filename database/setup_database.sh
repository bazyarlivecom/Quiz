#!/bin/bash

# تنظیمات دیتابیس
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="quiz_game"
DB_USER="postgres"
DB_PASSWORD="4522"

echo "Setting up database..."

# ایجاد دیتابیس
echo "Creating database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -p $DB_PORT -h $DB_HOST -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database might already exist"

# اجرای schema
echo "Running schema..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -p $DB_PORT -h $DB_HOST -d $DB_NAME -f schema_postgresql.sql

# اجرای seed data (اختیاری)
if [ -f "seeds/initial_data.sql" ]; then
    echo "Seeding initial data..."
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -p $DB_PORT -h $DB_HOST -d $DB_NAME -f seeds/initial_data.sql
fi

echo "Database setup complete!"

