-- ============================================
-- Initial Seed Data for Quiz Game
-- ============================================

-- ============================================
-- 1. CATEGORIES
-- ============================================
INSERT INTO categories (name, description, icon, color, sort_order) VALUES
('تاریخ', 'سوالات مربوط به تاریخ ایران و جهان', 'history', '#FF6B6B', 1),
('جغرافیا', 'سوالات جغرافیایی و مکان‌ها', 'globe', '#4ECDC4', 2),
('علوم', 'سوالات علمی و فیزیک و شیمی', 'science', '#45B7D1', 3),
('ورزش', 'سوالات ورزشی و مسابقات', 'sports', '#FFA07A', 4),
('هنر و ادبیات', 'سوالات ادبی و هنری', 'art', '#98D8C8', 5),
('تکنولوژی', 'سوالات فناوری و کامپیوتر', 'tech', '#6C5CE7', 6),
('عمومی', 'سوالات عمومی و متنوع', 'general', '#A29BFE', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. ACHIEVEMENTS
-- ============================================

-- Level Achievements
INSERT INTO achievements (name, description, icon, achievement_type, requirement_value, xp_reward) VALUES
('تازه‌وارد', 'رسیدن به سطح 5', 'rookie', 'LEVEL', 5, 50),
('جوانه', 'رسیدن به سطح 10', 'sprout', 'LEVEL', 10, 100),
('درخت', 'رسیدن به سطح 20', 'tree', 'LEVEL', 20, 250),
('کوه', 'رسیدن به سطح 30', 'mountain', 'LEVEL', 30, 500),
('ستاره', 'رسیدن به سطح 50', 'star', 'LEVEL', 50, 1000)
ON CONFLICT (name) DO NOTHING;

-- Score Achievements
INSERT INTO achievements (name, description, icon, achievement_type, requirement_value, xp_reward) VALUES
('شروع خوب', 'کسب 1000 امتیاز', 'good-start', 'SCORE', 1000, 50),
('امتیازآور', 'کسب 5000 امتیاز', 'scorer', 'SCORE', 5000, 150),
('قهرمان', 'کسب 10000 امتیاز', 'champion', 'SCORE', 10000, 300),
('افسانه', 'کسب 50000 امتیاز', 'legend', 'SCORE', 50000, 1000)
ON CONFLICT (name) DO NOTHING;

-- Games Achievements
INSERT INTO achievements (name, description, icon, achievement_type, requirement_value, xp_reward) VALUES
('بازیکن', 'انجام 10 بازی', 'player', 'GAMES', 10, 30),
('تجربه‌دار', 'انجام 50 بازی', 'experienced', 'GAMES', 50, 100),
('حرفه‌ای', 'انجام 100 بازی', 'professional', 'GAMES', 100, 250),
('استاد', 'انجام 500 بازی', 'master', 'GAMES', 500, 750)
ON CONFLICT (name) DO NOTHING;

-- Correct Answers Achievements
INSERT INTO achievements (name, description, icon, achievement_type, requirement_value, xp_reward) VALUES
('دقیق', '100 پاسخ صحیح', 'accurate', 'CORRECT_ANSWERS', 100, 50),
('متخصص', '500 پاسخ صحیح', 'expert', 'CORRECT_ANSWERS', 500, 200),
('نابغه', '1000 پاسخ صحیح', 'genius', 'CORRECT_ANSWERS', 1000, 500)
ON CONFLICT (name) DO NOTHING;

-- Streak Achievements
INSERT INTO achievements (name, description, icon, achievement_type, requirement_value, xp_reward) VALUES
('سریع', '5 پاسخ صحیح متوالی', 'fast', 'STREAK', 5, 25),
('آتشین', '10 پاسخ صحیح متوالی', 'fire', 'STREAK', 10, 75),
('غیرقابل توقف', '20 پاسخ صحیح متوالی', 'unstoppable', 'STREAK', 20, 200)
ON CONFLICT (name) DO NOTHING;

-- Special Achievements
INSERT INTO achievements (name, description, icon, achievement_type, requirement_value, xp_reward) VALUES
('کامل', 'پاسخ صحیح به تمام سوالات یک بازی', 'perfect', 'SPECIAL', 1, 100),
('سرعت نور', 'پاسخ دادن به تمام سوالات در کمتر از 5 ثانیه', 'lightning', 'SPECIAL', 1, 150)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. SAMPLE QUESTIONS (Example - History Category)
-- ============================================

-- Get History category ID
DO $$
DECLARE
    history_category_id INTEGER;
BEGIN
    SELECT id INTO history_category_id FROM categories WHERE name = 'تاریخ' LIMIT 1;
    
    IF history_category_id IS NOT NULL THEN
        -- Question 1
        INSERT INTO questions (category_id, difficulty, question_text, explanation, points, is_active)
        VALUES (history_category_id, 'EASY', 'پایتخت ایران کدام شهر است؟', 'تهران از سال 1786 میلادی پایتخت ایران بوده است.', 10, true)
        RETURNING id INTO history_category_id;
        
        -- Options for Question 1 (will be added via application logic)
        -- This is just an example structure
    END IF;
END $$;

-- ============================================
-- 4. ADMIN USER (Optional)
-- ============================================
-- Note: Password should be hashed using bcrypt in application
-- Default password: admin123 (should be changed in production)
INSERT INTO users (username, email, password_hash, level, xp, is_admin, is_active)
VALUES (
    'admin',
    'admin@quizgame.com',
    '$2b$10$rQ8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Placeholder - replace with actual hash
    1,
    0,
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- END OF SEED DATA
-- ============================================

