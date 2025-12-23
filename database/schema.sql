-- ============================================
-- Quiz Game Database Schema
-- Version: 1.0
-- ============================================

-- Enable UUID extension (if needed)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    total_score INTEGER DEFAULT 0 NOT NULL,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_level_positive CHECK (level >= 1),
    CONSTRAINT check_xp_non_negative CHECK (xp >= 0),
    CONSTRAINT check_score_non_negative CHECK (total_score >= 0)
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp);
CREATE INDEX IF NOT EXISTS idx_users_total_score ON users(total_score);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- ============================================
-- 3. QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')),
    question_text TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 10 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_points_positive CHECK (points > 0)
);

-- Indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_category_difficulty ON questions(category_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- ============================================
-- 4. QUESTION_OPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT false NOT NULL,
    option_order INTEGER NOT NULL CHECK (option_order BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_question_option_order UNIQUE (question_id, option_order)
);

-- Indexes for question_options
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_options_correct ON question_options(question_id, is_correct);

-- Function to ensure only one correct answer per question
CREATE OR REPLACE FUNCTION check_single_correct_answer()
RETURNS TRIGGER AS $$
DECLARE
    correct_count INTEGER;
BEGIN
    IF NEW.is_correct = true THEN
        SELECT COUNT(*) INTO correct_count
        FROM question_options
        WHERE question_id = NEW.question_id AND is_correct = true AND id != NEW.id;
        
        IF correct_count > 0 THEN
            RAISE EXCEPTION 'Question can have only one correct answer';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_single_correct_answer
    BEFORE INSERT OR UPDATE ON question_options
    FOR EACH ROW
    EXECUTE FUNCTION check_single_correct_answer();

-- ============================================
-- 5. MATCHES TABLE (Game Sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED')),
    questions_count INTEGER DEFAULT 10 NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    total_score INTEGER DEFAULT 0 NOT NULL,
    correct_answers INTEGER DEFAULT 0 NOT NULL,
    wrong_answers INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED', 'TIMED_OUT')),
    time_spent INTEGER, -- Total time in seconds
    is_practice BOOLEAN DEFAULT false NOT NULL, -- Practice mode: no timer, no scoring, just learning
    game_mode VARCHAR(20) DEFAULT 'SINGLE_PLAYER' CHECK (game_mode IN ('SINGLE_PLAYER', 'MULTI_PLAYER', 'PRACTICE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_questions_count_positive CHECK (questions_count > 0),
    CONSTRAINT check_score_non_negative CHECK (total_score >= 0),
    CONSTRAINT check_correct_non_negative CHECK (correct_answers >= 0),
    CONSTRAINT check_wrong_non_negative CHECK (wrong_answers >= 0),
    CONSTRAINT check_answers_sum CHECK (correct_answers + wrong_answers <= questions_count)
);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_user ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_category ON matches(category_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_started_at ON matches(started_at);
CREATE INDEX IF NOT EXISTS idx_matches_user_status ON matches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_user_created ON matches(user_id, created_at DESC);

-- ============================================
-- 6. MATCH_QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_questions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    question_order INTEGER NOT NULL CHECK (question_order >= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_match_question_order UNIQUE (match_id, question_order)
);

-- Indexes for match_questions
CREATE INDEX IF NOT EXISTS idx_match_questions_match ON match_questions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_questions_question ON match_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_match_questions_order ON match_questions(match_id, question_order);

-- ============================================
-- 7. USER_ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_answers (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option_id INTEGER REFERENCES question_options(id) ON DELETE SET NULL,
    user_answer_text VARCHAR(255), -- For backup if option deleted
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER NOT NULL CHECK (time_taken >= 0), -- Time in seconds
    points_earned INTEGER DEFAULT 0 NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_match_question_answer UNIQUE (match_id, question_id),
    CONSTRAINT check_points_non_negative CHECK (points_earned >= 0)
);

-- Indexes for user_answers
CREATE INDEX IF NOT EXISTS idx_user_answers_match ON user_answers(match_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_correct ON user_answers(is_correct);
CREATE INDEX IF NOT EXISTS idx_user_answers_match_question ON user_answers(match_id, question_id);

-- ============================================
-- 8. ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN (
        'LEVEL', 'SCORE', 'GAMES', 'CORRECT_ANSWERS', 
        'STREAK', 'CATEGORY', 'SPECIAL'
    )),
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_requirement_positive CHECK (requirement_value > 0),
    CONSTRAINT check_xp_reward_non_negative CHECK (xp_reward >= 0)
);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

-- ============================================
-- 9. USER_ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    PRIMARY KEY (user_id, achievement_id)
);

-- Indexes for user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);

-- ============================================
-- 10. USER_STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0 NOT NULL,
    total_questions INTEGER DEFAULT 0 NOT NULL,
    correct_answers INTEGER DEFAULT 0 NOT NULL,
    wrong_answers INTEGER DEFAULT 0 NOT NULL,
    best_score INTEGER DEFAULT 0 NOT NULL,
    average_score DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    average_time DECIMAL(10, 2) DEFAULT 0 NOT NULL, -- Average time per question
    accuracy_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL, -- Percentage
    last_played_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_user_category_stats UNIQUE (user_id, category_id),
    CONSTRAINT check_games_non_negative CHECK (games_played >= 0),
    CONSTRAINT check_correct_non_negative CHECK (correct_answers >= 0),
    CONSTRAINT check_wrong_non_negative CHECK (wrong_answers >= 0),
    CONSTRAINT check_best_score_non_negative CHECK (best_score >= 0),
    CONSTRAINT check_accuracy_range CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100)
);

-- Indexes for user_stats
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_category ON user_stats(category_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_best_score ON user_stats(user_id, best_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_accuracy ON user_stats(user_id, accuracy_rate DESC);

-- ============================================
-- 11. LEADERBOARD TABLE (Optional Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank_position INTEGER NOT NULL,
    total_score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('ALL_TIME', 'WEEKLY', 'MONTHLY')),
    period_start DATE NOT NULL,
    period_end DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_user_period_rank UNIQUE (user_id, period_type, period_start)
);

-- Indexes for leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(period_type, period_start, rank_position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- View: User Leaderboard
CREATE OR REPLACE VIEW user_leaderboard_view AS
SELECT 
    u.id,
    u.username,
    u.level,
    u.xp,
    u.total_score,
    ROW_NUMBER() OVER (ORDER BY u.total_score DESC, u.xp DESC) as rank
FROM users u
WHERE u.is_active = true
ORDER BY u.total_score DESC, u.xp DESC;

-- View: Category Statistics
CREATE OR REPLACE VIEW category_statistics_view AS
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT q.id) as total_questions,
    COUNT(DISTINCT m.id) as total_matches,
    COALESCE(AVG(m.total_score), 0) as average_score
FROM categories c
LEFT JOIN questions q ON q.category_id = c.id AND q.is_active = true
LEFT JOIN matches m ON m.category_id = c.id AND m.status = 'COMPLETED'
WHERE c.is_active = true
GROUP BY c.id, c.name;

-- View: User Progress Summary
CREATE OR REPLACE VIEW user_progress_summary_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.level,
    u.xp,
    u.total_score,
    COUNT(DISTINCT m.id) as total_games,
    COUNT(DISTINCT CASE WHEN m.status = 'COMPLETED' THEN m.id END) as completed_games,
    COALESCE(SUM(m.correct_answers), 0) as total_correct,
    COALESCE(SUM(m.wrong_answers), 0) as total_wrong,
    COALESCE(MAX(m.total_score), 0) as best_score
FROM users u
LEFT JOIN matches m ON m.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.level, u.xp, u.total_score;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE categories IS 'Question categories';
COMMENT ON TABLE questions IS 'Quiz questions';
COMMENT ON TABLE question_options IS 'Answer options for questions (4 options per question)';
COMMENT ON TABLE matches IS 'Game sessions/matches';
COMMENT ON TABLE match_questions IS 'Questions selected for each match';
COMMENT ON TABLE user_answers IS 'User answers to questions in matches';
COMMENT ON TABLE achievements IS 'Achievement definitions';
COMMENT ON TABLE user_achievements IS 'User unlocked achievements';
COMMENT ON TABLE user_stats IS 'User statistics per category';
COMMENT ON TABLE leaderboard IS 'Cached leaderboard data';

-- ============================================
-- END OF SCHEMA
-- ============================================

