-- PostgreSQL schema (Render Postgres). Run once against the database
-- Render provisions for this Blueprint.

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100),
  district VARCHAR(100),
  block VARCHAR(100),
  gp VARCHAR(100),
  role VARCHAR(20) DEFAULT 'learner' CHECK (role IN ('learner', 'admin', 'trainer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail VARCHAR(500),
  total_duration VARCHAR(50),
  category_id VARCHAR(36) REFERENCES categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chapters (
  id VARCHAR(36) PRIMARY KEY,
  section_id VARCHAR(36) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) DEFAULT 'resource' CHECK (type IN ('pdf', 'video', 'image', 'resource')),
  content_url VARCHAR(1000),
  duration VARCHAR(50),
  order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assessments (
  id VARCHAR(36) PRIMARY KEY,
  section_id VARCHAR(36) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('pre', 'post')),
  title VARCHAR(200),
  pass_score INT DEFAULT 60,
  max_attempts INT DEFAULT 3
);

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(36) PRIMARY KEY,
  assessment_id VARCHAR(36) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INT NOT NULL,
  order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS progress (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id VARCHAR(36) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS assessment_submissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id VARCHAR(36) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score INT NOT NULL,
  answers JSONB,
  attempt_number INT DEFAULT 1,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reassessment_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id VARCHAR(36) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  admin_note TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS self_certifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  declaration TEXT,
  certified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) PRIMARY KEY,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, course_id)
);

-- Default categories
INSERT INTO categories (id, name, description) VALUES
  ('cat-001', 'Gender & Social Development', 'GSLP and gender-related training modules'),
  ('cat-002', 'Livelihood & SHG', 'Self Help Group and livelihood programs'),
  ('cat-003', 'Health & Nutrition', 'Health awareness and nutrition programs'),
  ('cat-004', 'Financial Literacy', 'Banking, savings and financial management')
ON CONFLICT (id) DO NOTHING;

-- Default admin user (mobile: 9999999999, no password — login is mobile-only)
INSERT INTO users (id, mobile, name, designation, role)
VALUES ('admin-001', '9999999999', 'Admin', 'System Administrator', 'admin')
ON CONFLICT (id) DO NOTHING;
