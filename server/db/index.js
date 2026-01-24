import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'teacher_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

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

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;
