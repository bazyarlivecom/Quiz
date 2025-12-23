# جریان کامل رابط کاربری بازی Quiz

این سند شامل طراحی کامل UI/UX برای تمام صفحات بازی است.

---

## 📋 فهرست صفحات

1. [صفحه ورود (Login)](#1-صفحه-ورود-login)
2. [صفحه ثبت‌نام (Register)](#2-صفحه-ثبت‌نام-register)
3. [صفحه اصلی (Home/Dashboard)](#3-صفحه-اصلی-homedashboard)
4. [انتخاب بازی (Game Selection)](#4-انتخاب-بازی-game-selection)
5. [صفحه سوال (Question)](#5-صفحه-سوال-question)
6. [نمایش نتیجه (Results)](#6-نمایش-نتیجه-results)
7. [پروفایل کاربر (Profile)](#7-پروفایل-کاربر-profile)
8. [جدول رده‌بندی (Leaderboard)](#8-جدول-رده‌بندی-leaderboard)

---

## 1. صفحه ورود (Login)

### وظیفه صفحه
- احراز هویت کاربر
- دسترسی به حساب کاربری
- هدایت به صفحه اصلی پس از ورود موفق

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│         [Logo/App Name]              │
│                                      │
│         ┌─────────────────┐          │
│         │   Login Form    │          │
│         │                 │          │
│         │  Email: [____]  │          │
│         │                 │          │
│         │  Password: [__] │          │
│         │                 │          │
│         │  [Login Button] │          │
│         │                 │          │
│         │  Forgot Password│          │
│         │                 │          │
│         │  Don't have     │          │
│         │  account?       │          │
│         │  [Register]     │          │
│         └─────────────────┘          │
│                                      │
└─────────────────────────────────────┘
```

**المان‌ها:**
- Logo یا نام اپلیکیشن (بالا)
- فرم ورود (مرکز)
  - فیلد Email
  - فیلد Password (مخفی)
  - دکمه "ورود" (Login)
  - لینک "فراموشی رمز عبور"
  - لینک "ثبت‌نام" برای کاربران جدید
- پیام‌های خطا (در صورت نیاز)
- Loading state برای دکمه

### تعامل کاربر

1. **ورود اطلاعات:**
   - کاربر email را وارد می‌کند
   - کاربر password را وارد می‌کند
   - Validation در زمان تایپ (اختیاری)

2. **ارسال فرم:**
   - کلیک روی دکمه "ورود"
   - نمایش loading state
   - در صورت موفقیت: redirect به صفحه اصلی
   - در صورت خطا: نمایش پیام خطا

3. **لینک‌ها:**
   - کلیک روی "فراموشی رمز عبور" → صفحه بازیابی رمز
   - کلیک روی "ثبت‌نام" → صفحه ثبت‌نام

### State Management

```typescript
interface LoginState {
    email: string;
    password: string;
    loading: boolean;
    errors: {
        email?: string;
        password?: string;
        general?: string;
    };
}
```

### Validation Rules

- Email: باید فرمت معتبر داشته باشد
- Password: حداقل 1 کاراکتر (validation دقیق در backend)

---

## 2. صفحه ثبت‌نام (Register)

### وظیفه صفحه
- ایجاد حساب کاربری جدید
- دریافت اطلاعات اولیه کاربر
- هدایت به صفحه اصلی پس از ثبت‌نام موفق

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│         [Logo/App Name]              │
│                                      │
│         ┌─────────────────┐          │
│         │  Register Form  │          │
│         │                 │          │
│         │  Username: [__] │          │
│         │  Email: [____]  │          │
│         │  Password: [__] │          │
│         │  Confirm: [___] │          │
│         │                 │          │
│         │  [Register]     │          │
│         │                 │          │
│         │  Already have   │          │
│         │  account?        │          │
│         │  [Login]        │          │
│         └─────────────────┘          │
│                                      │
└─────────────────────────────────────┘
```

**المان‌ها:**
- Logo یا نام اپلیکیشن
- فرم ثبت‌نام
  - فیلد Username
  - فیلد Email
  - فیلد Password
  - فیلد Confirm Password
  - دکمه "ثبت‌نام"
  - لینک "ورود" برای کاربران موجود
- Password strength indicator (اختیاری)
- Real-time validation messages

### تعامل کاربر

1. **ورود اطلاعات:**
   - Username: حداقل 3 کاراکتر، فقط حروف و اعداد
   - Email: فرمت معتبر
   - Password: حداقل 8 کاراکتر، شامل حروف بزرگ/کوچک و عدد
   - Confirm Password: باید با Password مطابقت داشته باشد

2. **Validation:**
   - Real-time validation در زمان تایپ
   - نمایش پیام‌های خطا زیر هر فیلد
   - نمایش Password strength indicator

3. **ارسال فرم:**
   - کلیک روی "ثبت‌نام"
   - نمایش loading state
   - در صورت موفقیت: auto-login و redirect
   - در صورت خطا: نمایش پیام خطا

---

## 3. صفحه اصلی (Home/Dashboard)

### وظیفه صفحه
- نمایش خلاصه وضعیت کاربر
- دسترسی سریع به بازی
- نمایش آمار کلی
- دسترسی به منوها

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│  [Header: Logo, User, Notifications]│
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Welcome, [Username]!        │   │
│  │  Level [X] | [XXX] XP        │   │
│  │  [Progress Bar]              │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │  [Play]  │  │ [Stats]  │         │
│  │  Button  │  │  Card    │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Quick Stats                 │   │
│  │  • Total Games: XX           │   │
│  │  • Best Score: XXX           │   │
│  │  • Accuracy: XX%             │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Recent Games                │   │
│  │  [Game 1] [Game 2] [Game 3]  │   │
│  └──────────────────────────────┘   │
│                                      │
│  [Footer: Menu Navigation]          │
└─────────────────────────────────────┘
```

**المان‌ها:**
- **Header:**
  - Logo
  - User avatar/name
  - Notifications icon (اختیاری)
  - Menu button

- **User Card:**
  - Welcome message با username
  - Level و XP فعلی
  - Progress bar برای level بعدی
  - Avatar (اختیاری)

- **Action Buttons:**
  - دکمه بزرگ "شروع بازی" (Play)
  - دکمه "آمار" (Stats)
  - دکمه "جدول رده‌بندی" (Leaderboard)

- **Quick Stats Card:**
  - تعداد کل بازی‌ها
  - بهترین امتیاز
  - درصد دقت
  - تعداد پاسخ صحیح

- **Recent Games:**
  - لیست 3-5 بازی اخیر
  - نمایش امتیاز و تاریخ

- **Navigation Menu:**
  - Home
  - Profile
  - Leaderboard
  - Settings
  - Logout

### تعامل کاربر

1. **دکمه "شروع بازی":**
   - کلیک → انتقال به صفحه انتخاب بازی

2. **دکمه "آمار":**
   - کلیک → انتقال به صفحه پروفایل/آمار

3. **دکمه "جدول رده‌بندی":**
   - کلیک → انتقال به صفحه Leaderboard

4. **Recent Games:**
   - کلیک روی هر بازی → نمایش جزئیات

5. **Navigation:**
   - کلیک روی هر منو → انتقال به صفحه مربوطه

### Data Loading

```typescript
interface HomePageData {
    user: {
        username: string;
        level: number;
        xp: number;
        xpForNextLevel: number;
        avatarUrl: string | null;
    };
    stats: {
        totalGames: number;
        bestScore: number;
        accuracy: number;
        totalCorrect: number;
    };
    recentGames: Array<{
        id: number;
        score: number;
        date: Date;
        category: string;
    }>;
}
```

---

## 4. انتخاب بازی (Game Selection)

### وظیفه صفحه
- انتخاب نوع بازی (یک نفره / دو نفره / تمرین)
- انتخاب دسته‌بندی سوالات
- انتخاب سطح دشواری
- شروع بازی

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│  [Back Button]  Select Game Mode     │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────┐ ┌──────────────┐ │
│  │  Single      │ │  Multiplayer │ │
│  │  Player      │ │              │ │
│  │  [Icon]      │ │  [Icon]      │ │
│  │              │ │              │ │
│  └──────────────┘ └──────────────┘ │
│  ┌──────────────┐                   │
│  │  Practice    │                   │
│  │  Mode        │                   │
│  │  [Icon]      │                   │
│  │  (Learning)  │                   │
│  └──────────────┘                   │
│                                      │
│  Select Category:                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │[All]│ │[H] │ │[G] │ │[S] │      │
│  └────┘ └────┘ └────┘ └────┘      │
│  [More categories...]                │
│                                      │
│  Difficulty Level:                  │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ Easy │ │Medium│ │ Hard │        │
│  └──────┘ └──────┘ └──────┘        │
│  ┌──────┐                           │
│  │Expert│                           │
│  └──────┘                           │
│                                      │
│  Number of Questions:               │
│  [10] [15] [20] [30]                │
│                                      │
│  ┌──────────────────────────────┐   │
│  │    [Start Game Button]       │   │
│  └──────────────────────────────┘   │
│                                      │
└─────────────────────────────────────┘
```

**المان‌ها:**
- **Game Mode Selection:**
  - Card "یک نفره" (Single Player)
  - Card "دو نفره" (Multiplayer)
  - Card "تمرین" (Practice Mode) - بدون رقیب، بدون تایمر، فقط برای یادگیری
  - نمایش آیکون و توضیح کوتاه برای هر حالت

- **Category Selection:**
  - دکمه "همه" (All Categories)
  - دکمه‌های دسته‌بندی‌ها (History, Geography, Science, ...)
  - Scrollable horizontal list
  - نمایش آیکون هر دسته

- **Difficulty Selection:**
  - دکمه‌های: Easy, Medium, Hard, Expert
  - امکان انتخاب "Mixed" (ترکیبی)
  - نمایش رنگ/آیکون برای هر سطح

- **Questions Count:**
  - دکمه‌های: 10, 15, 20, 30
  - پیش‌فرض: 10

- **Start Button:**
  - دکمه بزرگ "شروع بازی"
  - فعال فقط وقتی همه گزینه‌ها انتخاب شده

### تعامل کاربر

1. **انتخاب Game Mode:**
   - کلیک روی "یک نفره" یا "دو نفره"
   - تغییر ظاهر دکمه انتخاب شده
   - در صورت انتخاب "دو نفره": نمایش فیلد انتخاب حریف

2. **انتخاب Category:**
   - کلیک روی دسته مورد نظر
   - امکان انتخاب چند دسته (اختیاری)
   - یا انتخاب "همه"

3. **انتخاب Difficulty:**
   - کلیک روی سطح دشواری
   - یا انتخاب "Mixed" برای ترکیبی

4. **انتخاب تعداد سوالات:**
   - کلیک روی تعداد مورد نظر

5. **شروع بازی:**
   - کلیک روی "شروع بازی"
   - نمایش loading
   - انتقال به صفحه سوال

### State Management

```typescript
interface GameSelectionState {
    gameMode: 'SINGLE_PLAYER' | 'MULTI_PLAYER';
    selectedCategories: number[]; // Empty = all
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'MIXED';
    questionsCount: number;
    opponentUserId?: number; // For multiplayer
    loading: boolean;
}
```

---

## 5. صفحه سوال (Question)

### وظیفه صفحه
- نمایش سوال فعلی
- نمایش گزینه‌های پاسخ
- نمایش تایمر (غیرفعال در حالت تمرین)
- دریافت پاسخ کاربر
- نمایش نتیجه پاسخ (با توضیح برای حالت تمرین)

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│  Question 3 of 10    Score: 250    │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │  [Timer Circle: 25s] (if not  │   │
│  │   practice mode)              │   │
│  │  [Practice Mode Badge] (if    │   │
│  │   practice mode)              │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Category: History           │   │
│  │  Difficulty: Medium          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Question Text:              │   │
│  │  "What is the capital of      │   │
│  │   France?"                    │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  [A] Paris                    │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  [B] London                   │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  [C] Berlin                   │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  [D] Madrid                   │   │
│  └──────────────────────────────┘   │
│                                      │
│  [Progress: ████████░░ 80%]         │
│                                      │
└─────────────────────────────────────┘
```

**المان‌ها:**
- **Header:**
  - شماره سوال (X of Y)
  - امتیاز فعلی
  - دکمه "خروج" (اختیاری)

- **Timer:**
  - دایره تایمر با زمان باقیمانده (غیرفعال در حالت تمرین)
  - تغییر رنگ در 10 ثانیه آخر (قرمز)
  - Animation برای countdown
  - در حالت تمرین: نمایش Badge "حالت تمرین" به جای تایمر

- **Question Info:**
  - دسته‌بندی سوال
  - سطح دشواری
  - Badge یا رنگ برای difficulty

- **Question Text:**
  - متن سوال (بزرگ و خوانا)
  - امکان نمایش تصویر (اختیاری)

- **Answer Options:**
  - 4 دکمه برای گزینه‌ها
  - نمایش حروف A, B, C, D
  - Hover effect
  - Disabled state بعد از انتخاب

- **Progress Bar:**
  - نمایش پیشرفت (X/Y سوالات)
  - درصد کامل شده

### حالت‌های مختلف

#### 1. حالت عادی (انتظار پاسخ)
- تمام گزینه‌ها فعال
- تایمر در حال اجرا
- امکان انتخاب هر گزینه

#### 2. حالت انتخاب شده
- گزینه انتخاب شده highlight می‌شود
- نمایش loading state
- ارسال پاسخ به backend

#### 3. حالت نمایش نتیجه
```
┌──────────────────────────────┐
│  [A] Paris  ✓ Correct!      │
│  +50 points (if not practice)│
└──────────────────────────────┘
┌──────────────────────────────┐
│  [B] London                  │
└──────────────────────────────┘
┌──────────────────────────────┐
│  [C] Berlin                  │
└──────────────────────────────┘
┌──────────────────────────────┐
│  [D] Madrid                  │
└──────────────────────────────┘

[Explanation: Paris is the capital...]
[Next Question Button] (after 2s)
```

- نمایش پاسخ صحیح (سبز)
- نمایش پاسخ اشتباه کاربر (قرمز)
- نمایش امتیاز کسب شده (فقط در حالت غیر تمرین)
- نمایش توضیح (همیشه، به خصوص در حالت تمرین)
- دکمه "سوال بعدی" (یا auto بعد از 2-3 ثانیه)
- در حالت تمرین: تاکید بیشتر روی توضیح و یادگیری

#### 4. حالت Timeout
```
┌──────────────────────────────┐
│  ⏱️ Time's Up!                │
│  No answer submitted          │
└──────────────────────────────┘
[Show correct answer]
[Next Question Button]
```

### تعامل کاربر

1. **انتخاب پاسخ:**
   - کلیک روی یکی از 4 گزینه
   - Highlight شدن گزینه انتخاب شده
   - ارسال فوری به backend
   - نمایش loading

2. **Timeout:**
   - اگر زمان تمام شود
   - نمایش پیام "زمان تمام شد"
   - نمایش پاسخ صحیح
   - انتقال به سوال بعدی

3. **پس از نمایش نتیجه:**
   - نمایش 2-3 ثانیه نتیجه
   - سپس auto-load سوال بعدی
   - یا کلیک روی "سوال بعدی"

### Animations

- Timer countdown animation
- Option hover effect
- Correct/incorrect answer animation
- Progress bar animation
- Smooth transitions بین سوالات

---

## 6. نمایش نتیجه (Results)

### وظیفه صفحه
- نمایش نتایج نهایی بازی
- نمایش آمار تفصیلی
- نمایش دستاوردهای جدید
- گزینه‌های بعدی (بازی مجدد، مشاهده پاسخ‌ها، ...)

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│  Game Complete!                     │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Final Score                 │   │
│  │  [Large Number: 850]        │   │
│  │  +50 XP | Level Up!          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Statistics                  │   │
│  │  • Correct: 8/10 (80%)      │   │
│  │  • Wrong: 2/10 (20%)        │   │
│  │  • Time: 4m 32s             │   │
│  │  • Avg Time: 27s per Q      │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  🏆 New Achievement!         │   │
│  │  "Perfect Game"              │   │
│  │  +100 XP                     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Category Breakdown          │   │
│  │  History: 5/5 ✓              │   │
│  │  Geography: 3/5             │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────┐  ┌──────────┐        │
│  │ [Play    │  │ [Review  │        │
│  │  Again]  │  │ Answers] │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │ [Share]  │  │ [Home]   │        │
│  └──────────┘  └──────────┘        │
│                                      │
└─────────────────────────────────────┘
```

**المان‌ها:**
- **Final Score Display:**
  - عدد بزرگ امتیاز نهایی
  - XP کسب شده
  - پیام Level Up (در صورت ارتقا)

- **Statistics Card:**
  - تعداد پاسخ صحیح/اشتباه
  - درصد دقت
  - زمان کل بازی
  - میانگین زمان هر سوال
  - بهترین streak

- **Achievements:**
  - نمایش دستاوردهای جدید
  - Animation برای دستاوردها
  - XP reward

- **Category Breakdown:**
  - آمار بر اساس دسته
  - نمایش صحیح/اشتباه برای هر دسته

- **Action Buttons:**
  - "بازی مجدد" (Play Again)
  - "مشاهده پاسخ‌ها" (Review Answers)
  - "اشتراک‌گذاری" (Share)
  - "صفحه اصلی" (Home)

### حالت Multiplayer

```
┌─────────────────────────────────────┐
│  You Won! 🎉                        │
│                                      │
│  Your Score: 850                    │
│  Opponent Score: 720                 │
│                                      │
│  Difference: +130                    │
│                                      │
│  [View Opponent's Answers]          │
└─────────────────────────────────────┘
```

### تعامل کاربر

1. **نمایش نتایج:**
   - Animation برای نمایش امتیاز
   - نمایش تدریجی آمار
   - نمایش دستاوردها با animation

2. **دکمه "بازی مجدد":**
   - انتقال به صفحه انتخاب بازی
   - حفظ تنظیمات قبلی (اختیاری)

3. **دکمه "مشاهده پاسخ‌ها":**
   - نمایش لیست تمام سوالات
   - نمایش پاسخ کاربر و پاسخ صحیح
   - نمایش توضیحات

4. **دکمه "اشتراک‌گذاری":**
   - به‌اشتراک‌گذاری نتایج در شبکه‌های اجتماعی
   - یا کپی لینک

5. **دکمه "صفحه اصلی":**
   - بازگشت به صفحه اصلی

### Review Answers Modal

```
┌─────────────────────────────────────┐
│  Review Answers          [Close]    │
├─────────────────────────────────────┤
│                                      │
│  Q1: What is...?                    │
│  Your Answer: Paris ✓              │
│  +50 points                          │
│                                      │
│  Q2: Who invented...?               │
│  Your Answer: Edison ✗              │
│  Correct: Tesla                     │
│  Explanation: ...                   │
│                                      │
│  [Scroll for more...]               │
│                                      │
└─────────────────────────────────────┘
```

---

## 7. پروفایل کاربر (Profile)

### وظیفه صفحه
- نمایش اطلاعات کاربر
- نمایش آمار تفصیلی
- نمایش تاریخچه بازی‌ها
- مدیریت پروفایل

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│  [Back]  Profile                    │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │  [Avatar]                    │   │
│  │  Username                    │   │
│  │  Level X | XXX XP            │   │
│  │  [Progress Bar]              │   │
│  │  [Edit Profile Button]       │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Overall Statistics          │   │
│  │  • Total Games: 45            │   │
│  │  • Best Score: 950            │   │
│  │  • Accuracy: 78.5%           │   │
│  │  • Total Correct: 356        │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Category Performance        │   │
│  │  History:     85% [████]    │   │
│  │  Geography:   72% [███]     │   │
│  │  Science:      68% [███]     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Achievements                │   │
│  │  [Badge] [Badge] [Badge]     │   │
│  │  [View All]                  │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Game History                │   │
│  │  [Filter: All | Category]    │   │
│  │  • Game 1 - 850 pts - 2d ago │   │
│  │  • Game 2 - 720 pts - 5d ago │   │
│  │  [Load More]                 │   │
│  └──────────────────────────────┘   │
│                                      │
└─────────────────────────────────────┘
```

**المان‌ها:**
- **Profile Header:**
  - Avatar کاربر
  - Username
  - Level و XP
  - Progress bar
  - دکمه "ویرایش پروفایل"

- **Overall Statistics:**
  - تعداد کل بازی‌ها
  - بهترین امتیاز
  - درصد دقت کلی
  - تعداد پاسخ صحیح کل

- **Category Performance:**
  - لیست دسته‌بندی‌ها
  - درصد دقت برای هر دسته
  - Progress bar برای هر دسته
  - تعداد بازی در هر دسته

- **Achievements:**
  - Grid از دستاوردها
  - نمایش Badge برای هر دستاورد
  - نمایش دستاوردهای قفل شده (grayed out)
  - دکمه "مشاهده همه"

- **Game History:**
  - لیست بازی‌های گذشته
  - فیلتر بر اساس دسته
  - Pagination یا "Load More"
  - نمایش امتیاز و تاریخ

### تعامل کاربر

1. **ویرایش پروفایل:**
   - کلیک روی "ویرایش پروفایل"
   - Modal یا صفحه جدید
   - امکان تغییر username, email, avatar

2. **Category Performance:**
   - کلیک روی دسته → فیلتر Game History

3. **Achievements:**
   - کلیک روی دستاورد → نمایش جزئیات
   - کلیک روی "مشاهده همه" → صفحه کامل دستاوردها

4. **Game History:**
   - کلیک روی بازی → نمایش جزئیات
   - فیلتر بر اساس دسته
   - Scroll برای بازی‌های بیشتر

### Edit Profile Modal

```
┌─────────────────────────────────────┐
│  Edit Profile          [Save] [X]  │
├─────────────────────────────────────┤
│                                      │
│  Username: [___________]            │
│  Email: [_____________]             │
│  Avatar: [Upload Image]             │
│                                      │
│  Change Password:                   │
│  Current: [________]                │
│  New: [________]                    │
│  Confirm: [________]               │
│                                      │
│  [Save Changes]                     │
│                                      │
└─────────────────────────────────────┘
```

---

## 8. جدول رده‌بندی (Leaderboard)

### وظیفه صفحه
- نمایش رتبه‌بندی کاربران
- نمایش رتبه کاربر فعلی
- فیلتر بر اساس دوره (All-time, Weekly, Monthly)

### المان‌های اصلی

```
┌─────────────────────────────────────┐
│  Leaderboard                        │
├─────────────────────────────────────┤
│                                      │
│  [All-time] [Weekly] [Monthly]     │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Your Rank: #42              │   │
│  │  Score: 2,450 | Level 15     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  #1  [Avatar] User1           │   │
│  │      5,200 pts | Level 25     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  #2  [Avatar] User2           │   │
│  │      4,850 pts | Level 23     │   │
│  └──────────────────────────────┘   │
│  ...                                 │
│  ┌──────────────────────────────┐   │
│  │  #42 [Avatar] You            │   │
│  │      2,450 pts | Level 15    │   │
│  └──────────────────────────────┘   │
│  ...                                 │
│                                      │
│  [Load More]                         │
│                                      │
└─────────────────────────────────────┘
```

**المان‌ها:**
- **Period Filter:**
  - دکمه‌های: All-time, Weekly, Monthly
  - Highlight دوره انتخاب شده

- **Your Rank Card:**
  - رتبه کاربر فعلی
  - امتیاز و Level
  - Highlight متمایز

- **Leaderboard List:**
  - لیست کاربران با رتبه
  - Avatar هر کاربر
  - Username
  - امتیاز و Level
  - Highlight کاربر فعلی

- **Pagination:**
  - "Load More" برای بارگذاری بیشتر
  - یا صفحه‌بندی عددی

### تعامل کاربر

1. **تغییر دوره:**
   - کلیک روی All-time/Weekly/Monthly
   - Refresh لیست

2. **Scroll:**
   - Scroll برای دیدن رتبه‌های بیشتر
   - Auto-load بیشتر (infinite scroll)

3. **کلیک روی کاربر:**
   - نمایش پروفایل کاربر (اختیاری)

---

## 🔄 Navigation Flow

```
Login → Home → Game Selection → Question → Results
  ↓       ↓         ↓
Register Profile  Leaderboard
```

### Route Structure

```typescript
/                    → Home
/login              → Login
/register           → Register
/game/select        → Game Selection
/game/:sessionId    → Question (Active Game)
/game/:sessionId/result → Results
/profile            → Profile
/leaderboard        → Leaderboard
```

---

## 🎨 Design Principles

1. **Responsive Design:**
   - Mobile-first approach
   - Breakpoints: Mobile (320px+), Tablet (768px+), Desktop (1024px+)

2. **Color Scheme:**
   - Primary: برای دکمه‌های اصلی
   - Success: برای پاسخ صحیح (سبز)
   - Error: برای پاسخ اشتباه (قرمز)
   - Warning: برای تایمر (نارنجی/قرمز)

3. **Typography:**
   - Headings: Bold, بزرگ
   - Body: خوانا، اندازه مناسب
   - Numbers: Monospace برای امتیازها

4. **Animations:**
   - Smooth transitions
   - Loading states
   - Success/Error feedback
   - Timer animations

5. **Accessibility:**
   - Keyboard navigation
   - Screen reader support
   - High contrast mode
   - Focus indicators

---

این طراحی کامل UI/UX برای تمام صفحات بازی است و آماده تبدیل به کد است.

