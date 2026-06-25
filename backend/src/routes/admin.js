const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const auth = [authMiddleware, adminOnly];

// ══════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════
router.get('/categories', ...auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
});
router.post('/categories', ...auth, async (req, res) => {
  const { name, description } = req.body;
  const id = uuidv4();
  await pool.query('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [id, name, description]);
  res.status(201).json({ id, name, description });
});
router.put('/categories/:id', ...auth, async (req, res) => {
  const { name, description } = req.body;
  await pool.query('UPDATE categories SET name=?, description=? WHERE id=?', [name, description, req.params.id]);
  res.json({ message: 'Updated' });
});
router.delete('/categories/:id', ...auth, async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ══════════════════════════════════════════════
//  COURSES
// ══════════════════════════════════════════════
router.get('/courses', ...auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.*, cat.name AS category_name,
      (SELECT COUNT(*) FROM sections s WHERE s.course_id = c.id) AS section_count,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_count
     FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
     ORDER BY c.created_at DESC`
  );
  res.json(rows);
});
router.post('/courses', ...auth, async (req, res) => {
  const { title, description, thumbnail, total_duration, category_id } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO courses (id, title, description, thumbnail, total_duration, category_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, description, thumbnail, total_duration, category_id || null]
  );
  res.status(201).json({ id });
});
router.put('/courses/:id', ...auth, async (req, res) => {
  const { title, description, thumbnail, total_duration, category_id, is_active } = req.body;
  await pool.query(
    'UPDATE courses SET title=?, description=?, thumbnail=?, total_duration=?, category_id=?, is_active=? WHERE id=?',
    [title, description, thumbnail, total_duration, category_id || null, is_active !== false, req.params.id]
  );
  res.json({ message: 'Updated' });
});
router.delete('/courses/:id', ...auth, async (req, res) => {
  await pool.query('DELETE FROM courses WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ══════════════════════════════════════════════
//  SECTIONS
// ══════════════════════════════════════════════
router.get('/sections', ...auth, async (req, res) => {
  const { course_id } = req.query;
  let q = `SELECT s.*, c.title AS course_title,
    (SELECT COUNT(*) FROM chapters ch WHERE ch.section_id = s.id) AS chapter_count
    FROM sections s JOIN courses c ON s.course_id = c.id`;
  const params = [];
  if (course_id) { q += ' WHERE s.course_id = ?'; params.push(course_id); }
  q += ' ORDER BY c.title, s.order_index';
  const [rows] = await pool.query(q, params);
  res.json(rows);
});
router.post('/sections', ...auth, async (req, res) => {
  const { course_id, title, order_index } = req.body;
  const id = uuidv4();
  await pool.query('INSERT INTO sections (id, course_id, title, order_index) VALUES (?, ?, ?, ?)',
    [id, course_id, title, order_index || 0]);
  res.status(201).json({ id });
});
router.put('/sections/:id', ...auth, async (req, res) => {
  const { title, order_index } = req.body;
  await pool.query('UPDATE sections SET title=?, order_index=? WHERE id=?', [title, order_index || 0, req.params.id]);
  res.json({ message: 'Updated' });
});
router.delete('/sections/:id', ...auth, async (req, res) => {
  await pool.query('DELETE FROM sections WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ══════════════════════════════════════════════
//  CHAPTERS (Course Materials)
// ══════════════════════════════════════════════
router.get('/chapters', ...auth, async (req, res) => {
  const { section_id, course_id } = req.query;
  let q = `SELECT ch.*, s.title AS section_title, c.title AS course_title
    FROM chapters ch
    JOIN sections s ON ch.section_id = s.id
    JOIN courses c ON s.course_id = c.id`;
  const params = [];
  if (section_id) { q += ' WHERE ch.section_id = ?'; params.push(section_id); }
  else if (course_id) { q += ' WHERE s.course_id = ?'; params.push(course_id); }
  q += ' ORDER BY c.title, s.order_index, ch.order_index';
  const [rows] = await pool.query(q, params);
  res.json(rows);
});
router.post('/chapters', ...auth, async (req, res) => {
  const { section_id, title, type, content_url, duration, order_index } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO chapters (id, section_id, title, type, content_url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, section_id, title, type || 'resource', content_url || '', duration || '', order_index || 0]
  );
  res.status(201).json({ id });
});
router.put('/chapters/:id', ...auth, async (req, res) => {
  const { title, type, content_url, duration, order_index } = req.body;
  await pool.query(
    'UPDATE chapters SET title=?, type=?, content_url=?, duration=?, order_index=? WHERE id=?',
    [title, type, content_url, duration, order_index || 0, req.params.id]
  );
  res.json({ message: 'Updated' });
});
router.delete('/chapters/:id', ...auth, async (req, res) => {
  await pool.query('DELETE FROM chapters WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ══════════════════════════════════════════════
//  ASSESSMENTS & QUESTIONS (Admin view)
// ══════════════════════════════════════════════
router.get('/assessments', ...auth, async (req, res) => {
  const { course_id } = req.query;
  let q = `SELECT a.*, s.title AS section_title, c.title AS course_title,
    (SELECT COUNT(*) FROM questions q WHERE q.assessment_id = a.id) AS question_count
    FROM assessments a JOIN sections s ON a.section_id = s.id JOIN courses c ON s.course_id = c.id`;
  const params = [];
  if (course_id) { q += ' WHERE c.id = ?'; params.push(course_id); }
  q += ' ORDER BY c.title, s.order_index, a.type';
  const [rows] = await pool.query(q, params);
  res.json(rows);
});
router.post('/assessments', ...auth, async (req, res) => {
  const { section_id, type, title, pass_score, max_attempts } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO assessments (id, section_id, type, title, pass_score, max_attempts) VALUES (?, ?, ?, ?, ?, ?)',
    [id, section_id, type, title, pass_score || 60, max_attempts || 3]
  );
  res.status(201).json({ id });
});
router.put('/assessments/:id', ...auth, async (req, res) => {
  const { title, pass_score, max_attempts } = req.body;
  await pool.query('UPDATE assessments SET title=?, pass_score=?, max_attempts=? WHERE id=?',
    [title, pass_score, max_attempts, req.params.id]);
  res.json({ message: 'Updated' });
});
router.delete('/assessments/:id', ...auth, async (req, res) => {
  await pool.query('DELETE FROM assessments WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// Questions
router.get('/questions', ...auth, async (req, res) => {
  const { assessment_id } = req.query;
  const [rows] = await pool.query(
    'SELECT * FROM questions WHERE assessment_id = ? ORDER BY order_index', [assessment_id]
  );
  res.json(rows);
});
router.post('/questions', ...auth, async (req, res) => {
  const { assessment_id, question_text, options, correct_answer, order_index } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO questions (id, assessment_id, question_text, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [id, assessment_id, question_text, JSON.stringify(options), correct_answer, order_index || 0]
  );
  res.status(201).json({ id });
});
router.put('/questions/:id', ...auth, async (req, res) => {
  const { question_text, options, correct_answer, order_index } = req.body;
  await pool.query(
    'UPDATE questions SET question_text=?, options=?, correct_answer=?, order_index=? WHERE id=?',
    [question_text, JSON.stringify(options), correct_answer, order_index || 0, req.params.id]
  );
  res.json({ message: 'Updated' });
});
router.delete('/questions/:id', ...auth, async (req, res) => {
  await pool.query('DELETE FROM questions WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ══════════════════════════════════════════════
//  ASSIGN COURSE TO LEARNER
// ══════════════════════════════════════════════
router.post('/assign-course', ...auth, async (req, res) => {
  const { user_id, course_id } = req.body;
  const id = uuidv4();
  try {
    await pool.query('INSERT IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)', [id, user_id, course_id]);
    res.json({ message: 'Course assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/assign-course-bulk', ...auth, async (req, res) => {
  const { user_ids, course_id } = req.body;
  let count = 0;
  for (const uid of user_ids) {
    try {
      await pool.query('INSERT IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)', [uuidv4(), uid, course_id]);
      count++;
    } catch {}
  }
  res.json({ message: `Assigned to ${count} learners` });
});

// ══════════════════════════════════════════════
//  DASHBOARD STATS
// ══════════════════════════════════════════════
router.get('/stats', ...auth, async (req, res) => {
  const [[{ users }]] = await pool.query("SELECT COUNT(*) AS users FROM users WHERE role='learner'");
  const [[{ courses }]] = await pool.query('SELECT COUNT(*) AS courses FROM courses WHERE is_active=1');
  const [[{ enrollments }]] = await pool.query('SELECT COUNT(*) AS enrollments FROM enrollments');
  const [[{ completions }]] = await pool.query("SELECT COUNT(*) AS completions FROM enrollments WHERE completed_at IS NOT NULL");
  const [[{ pending_reassess }]] = await pool.query("SELECT COUNT(*) AS pending_reassess FROM reassessment_requests WHERE status='pending'");
  res.json({ users, courses, enrollments, completions, pending_reassess });
});

module.exports = router;
