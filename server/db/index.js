import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'teacher_platform',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };

const pool = new Pool(poolConfig);

export const query = (text, params) => pool.query(text, params);

export const initDb = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create classes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        grade VARCHAR(50),
        subject VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create students table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        student_no VARCHAR(50),
        gender VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attendance_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id),
        student_id INTEGER REFERENCES students(id),
        status VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create score_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS score_records (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id),
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        change INTEGER NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      )
    `);

    // Create score_presets table (quick score templates)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS score_presets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL DEFAULT 'classroom',
        deadline TIMESTAMP,
        submit_code VARCHAR(20) UNIQUE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        images TEXT[],
        score INTEGER,
        grade VARCHAR(10),
        comment TEXT,
        graded_at TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create quick_comments table for grading
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quick_comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create redemption_rewards table (rewards that can be redeemed with points)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS redemption_rewards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        points_required INTEGER NOT NULL,
        icon VARCHAR(50),
        stock INTEGER DEFAULT -1,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create redemption_records table (history of point redemptions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS redemption_records (
        id SERIAL PRIMARY KEY,
        reward_id INTEGER REFERENCES redemption_rewards(id),
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        class_id INTEGER REFERENCES classes(id),
        points_spent INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add membership columns to users table if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'membership_type') THEN
          ALTER TABLE users ADD COLUMN membership_type VARCHAR(20) DEFAULT 'free';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'membership_expires_at') THEN
          ALTER TABLE users ADD COLUMN membership_expires_at TIMESTAMP;
        END IF;
      END $$;
    `);

    // ============ V2.0 新增表 ============

    // Create semester settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS semesters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create dashboard cache table for performance
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboard_cache (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL,
        metric_value FLOAT,
        period_type VARCHAR(20) NOT NULL,
        period_date DATE NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, student_id, metric_type, period_type, period_date)
      )
    `);

    // Create seating charts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seating_charts (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        name VARCHAR(100),
        rows INTEGER NOT NULL DEFAULT 6,
        cols INTEGER NOT NULL DEFAULT 8,
        aisle_after INTEGER DEFAULT 4,
        podium_position VARCHAR(20) DEFAULT 'top',
        is_current BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create seating assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seating_assignments (
        id SERIAL PRIMARY KEY,
        seating_id INTEGER REFERENCES seating_charts(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        row_num INTEGER NOT NULL,
        col_num INTEGER NOT NULL,
        is_locked BOOLEAN DEFAULT false,
        lock_reason VARCHAR(100),
        UNIQUE(seating_id, row_num, col_num)
      )
    `);

    // Create exams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        subject VARCHAR(50),
        exam_date DATE,
        full_score INTEGER DEFAULT 100,
        pass_score INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create exam scores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_scores (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        score FLOAT,
        rank INTEGER,
        comment TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exam_id, student_id)
      )
    `);

    // Create parent reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_reports (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        report_type VARCHAR(20) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        modules JSONB,
        teacher_comment TEXT,
        template VARCHAR(50) DEFAULT 'simple',
        share_url VARCHAR(255),
        share_password VARCHAR(50),
        expire_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to redemption_rewards if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemption_rewards' AND column_name = 'image_url') THEN
          ALTER TABLE redemption_rewards ADD COLUMN image_url VARCHAR(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemption_rewards' AND column_name = 'limit_per_student') THEN
          ALTER TABLE redemption_rewards ADD COLUMN limit_per_student INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);

    // Add new columns to redemption_records if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemption_records' AND column_name = 'reject_reason') THEN
          ALTER TABLE redemption_records ADD COLUMN reject_reason VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemption_records' AND column_name = 'processed_at') THEN
          ALTER TABLE redemption_records ADD COLUMN processed_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemption_records' AND column_name = 'delivered_at') THEN
          ALTER TABLE redemption_records ADD COLUMN delivered_at TIMESTAMP;
        END IF;
      END $$;
    `);

    // Add height column to students for seating by height
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'height') THEN
          ALTER TABLE students ADD COLUMN height INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'vision_issue') THEN
          ALTER TABLE students ADD COLUMN vision_issue BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);

    // ============ V3.0 课程动画模块 ============

    // Create courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        grade VARCHAR(50),
        subject VARCHAR(50),
        cover_image VARCHAR(500),
        status VARCHAR(20) DEFAULT 'draft',
        share_code VARCHAR(20) UNIQUE,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add grade column to courses if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'grade') THEN
          ALTER TABLE courses ADD COLUMN grade VARCHAR(50);
        END IF;
      END $$;
    `);

    // Create course_sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_sections (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create animations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS animations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL,
        source_url VARCHAR(500),
        thumbnail VARCHAR(500),
        duration_seconds INTEGER,
        config JSONB,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create builtin_animations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS builtin_animations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        subcategory VARCHAR(50),
        description TEXT,
        source_path VARCHAR(255) NOT NULL,
        thumbnail VARCHAR(255),
        tags TEXT[],
        is_interactive BOOLEAN DEFAULT FALSE,
        type VARCHAR(20) DEFAULT 'lottie',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add type column to builtin_animations if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'builtin_animations' AND column_name = 'type') THEN
          ALTER TABLE builtin_animations ADD COLUMN type VARCHAR(20) DEFAULT 'lottie';
        END IF;
      END $$;
    `);

    // Create course_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_comments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES course_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for course comments
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_course_comments_course ON course_comments(course_id, created_at);
    `);

    // Create teacher_videos table for video library
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_videos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT DEFAULT 0,
        duration_seconds INTEGER,
        thumbnail VARCHAR(500),
        grade VARCHAR(50),
        subject VARCHAR(50),
        share_code VARCHAR(20) UNIQUE,
        status VARCHAR(20) DEFAULT 'private',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for teacher_videos
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_videos_user ON teacher_videos(user_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_videos_share ON teacher_videos(share_code);
    `);

    // Create video_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_comments (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES teacher_videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(100),
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for video_comments
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_video_comments_video ON video_comments(video_id, created_at);
    `);

    // Create video_danmaku table (弹幕)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_danmaku (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES teacher_videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content VARCHAR(100) NOT NULL,
        time_seconds FLOAT NOT NULL,
        color VARCHAR(20) DEFAULT '#FFFFFF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for video_danmaku
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_video_danmaku_video ON video_danmaku(video_id, time_seconds);
    `);

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_dashboard_cache_class_period ON dashboard_cache(class_id, period_date);
      CREATE INDEX IF NOT EXISTS idx_exam_scores_exam ON exam_scores(exam_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_seating_assignments_seating ON seating_assignments(seating_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_redemption_records_student ON redemption_records(student_id, status);
      CREATE INDEX IF NOT EXISTS idx_parent_reports_student ON parent_reports(student_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
      CREATE INDEX IF NOT EXISTS idx_courses_share ON courses(share_code);
      CREATE INDEX IF NOT EXISTS idx_animations_section ON animations(section_id);
      CREATE INDEX IF NOT EXISTS idx_builtin_category ON builtin_animations(category);
    `);

    console.log('Database tables initialized successfully (V2.0)');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;
