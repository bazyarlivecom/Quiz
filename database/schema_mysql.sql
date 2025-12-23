-- ============================================
-- Quiz Game Database Schema - MySQL
-- Version: 1.0
-- MySQL Version: 8.0+
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    xp INT DEFAULT 0 NOT NULL,
    total_score INT DEFAULT 0 NOT NULL,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    last_login_at DATETIME,
    metadata JSON DEFAULT ('{}'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    CHECK (level >= 1),
    CHECK (xp >= 0),
    CHECK (total_score >= 0),
    
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_level (level),
    INDEX idx_users_xp (xp),
    INDEX idx_users_total_score (total_score DESC),
    INDEX idx_users_created_at (created_at DESC),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INT DEFAULT 0,
    metadata JSON DEFAULT ('{}'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    INDEX idx_categories_name (name),
    INDEX idx_categories_active (is_active),
    INDEX idx_categories_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')),
    question_text TEXT NOT NULL,
    explanation TEXT,
    points INT DEFAULT 10 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by INT,
    tags JSON,
    metadata JSON DEFAULT ('{}'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CHECK (points > 0),
    
    INDEX idx_questions_category (category_id),
    INDEX idx_questions_difficulty (difficulty),
    INDEX idx_questions_active (is_active),
    INDEX idx_questions_category_difficulty (category_id, difficulty),
    INDEX idx_questions_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. QUESTION_OPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT false NOT NULL,
    option_order INT NOT NULL CHECK (option_order BETWEEN 1 AND 4),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_question_option_order (question_id, option_order),
    INDEX idx_question_options_question (question_id),
    INDEX idx_question_options_correct (question_id, is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. MATCHES TABLE (Game Sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED')),
    questions_count INT DEFAULT 10 NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at DATETIME,
    total_score INT DEFAULT 0 NOT NULL,
    correct_answers INT DEFAULT 0 NOT NULL,
    wrong_answers INT DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED', 'TIMED_OUT')),
    time_spent INT,
    is_practice BOOLEAN DEFAULT false NOT NULL,
    game_mode VARCHAR(20) DEFAULT 'SINGLE_PLAYER' CHECK (game_mode IN ('SINGLE_PLAYER', 'MULTI_PLAYER', 'PRACTICE')),
    metadata JSON DEFAULT ('{}'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    CHECK (questions_count > 0),
    CHECK (total_score >= 0),
    CHECK (correct_answers >= 0),
    CHECK (wrong_answers >= 0),
    CHECK (correct_answers + wrong_answers <= questions_count),
    
    INDEX idx_matches_user (user_id),
    INDEX idx_matches_category (category_id),
    INDEX idx_matches_status (status),
    INDEX idx_matches_started_at (started_at DESC),
    INDEX idx_matches_user_status (user_id, status),
    INDEX idx_matches_user_created (user_id, created_at DESC),
    INDEX idx_matches_completed (user_id, total_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. MATCH_QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    question_id INT NOT NULL,
    question_order INT NOT NULL CHECK (question_order >= 1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT,
    
    UNIQUE KEY unique_match_question_order (match_id, question_order),
    INDEX idx_match_questions_match (match_id),
    INDEX idx_match_questions_question (question_id),
    INDEX idx_match_questions_order (match_id, question_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. USER_ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT,
    user_answer_text VARCHAR(255),
    is_correct BOOLEAN NOT NULL,
    time_taken INT NOT NULL CHECK (time_taken >= 0),
    points_earned INT DEFAULT 0 NOT NULL,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_match_question_answer (match_id, question_id),
    CHECK (points_earned >= 0),
    
    INDEX idx_user_answers_match (match_id),
    INDEX idx_user_answers_question (question_id),
    INDEX idx_user_answers_correct (is_correct),
    INDEX idx_user_answers_match_question (match_id, question_id),
    INDEX idx_user_answers_time (time_taken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN ('LEVEL', 'SCORE', 'GAMES', 'CORRECT_ANSWERS', 'STREAK', 'CATEGORY', 'SPECIAL')),
    requirement_value INT NOT NULL,
    xp_reward INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    metadata JSON DEFAULT ('{}'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CHECK (requirement_value > 0),
    CHECK (xp_reward >= 0),
    
    INDEX idx_achievements_type (achievement_type),
    INDEX idx_achievements_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. USER_ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    
    INDEX idx_user_achievements_user (user_id),
    INDEX idx_user_achievements_achievement (achievement_id),
    INDEX idx_user_achievements_unlocked (unlocked_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. USER_STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    games_played INT DEFAULT 0 NOT NULL,
    total_questions INT DEFAULT 0 NOT NULL,
    correct_answers INT DEFAULT 0 NOT NULL,
    wrong_answers INT DEFAULT 0 NOT NULL,
    best_score INT DEFAULT 0 NOT NULL,
    average_score DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    average_time DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    accuracy_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL,
    last_played_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_category_stats (user_id, category_id),
    CHECK (games_played >= 0),
    CHECK (correct_answers >= 0),
    CHECK (wrong_answers >= 0),
    CHECK (best_score >= 0),
    CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
    
    INDEX idx_user_stats_user (user_id),
    INDEX idx_user_stats_category (category_id),
    INDEX idx_user_stats_best_score (user_id, best_score DESC),
    INDEX idx_user_stats_accuracy (user_id, accuracy_rate DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- END OF SCHEMA
-- ============================================



